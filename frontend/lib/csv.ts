/**
 * Minimal RFC 4180 CSV handling for the mentor bulk importer.
 *
 * Written by hand rather than pulled from a dependency because the only thing
 * we need beyond a naive split is correct quote handling — and that part is
 * non-negotiable: real exports contain bios with embedded commas, newlines and
 * escaped quotes, all of which a line-splitting parser mangles silently.
 */

/** Splits raw CSV text into rows of raw string cells. */
export function parseCsv(text: string): string[][] {
  // Strip a UTF-8 BOM so the first header does not become "﻿full_name".
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          // Escaped quote inside a quoted field.
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }

    if (char === "\r") {
      i += 1;
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }

    field += char;
    i += 1;
  }

  // Flush whatever is left when the file does not end in a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Drop rows that are entirely empty (trailing blank lines, stray commas).
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

/** Normalises a header cell so "Full Name" and "full_name" both match. */
export function normaliseHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

/** Canonical field -> accepted header spellings. */
const HEADER_ALIASES: Record<string, string[]> = {
  full_name: ["full_name", "fullname", "name", "mentor_name"],
  email: ["email", "email_address", "e_mail"],
  pronouns: ["pronouns", "pronoun"],
  year_of_study: ["year_of_study", "year", "study_year"],
  program_of_study: ["program_of_study", "program", "programme", "major"],
  mentor_description: [
    "mentor_description",
    "description",
    "bio",
    "about",
    "blurb",
  ],
  linkedin_url: ["linkedin_url", "linkedin", "linked_in", "linkedin_profile"],
  capacity: ["capacity", "max_mentees"],
};

export const CSV_TEMPLATE_HEADERS = [
  "full_name",
  "email",
  "pronouns",
  "year_of_study",
  "program_of_study",
  "mentor_description",
  "linkedin_url",
  "capacity",
] as const;

export type MentorCsvRow = {
  /** 1-based row number as a spreadsheet shows it (a quoted multi-line cell
   *  still counts as one row). */
  row: number;
  full_name: string;
  email: string;
  pronouns: string | null;
  year_of_study: string;
  program_of_study: string;
  mentor_description: string;
  linkedin_url: string | null;
  capacity: number;
};

export type RowIssue = {
  row: number;
  name: string;
  reason: string;
};

export type ParsedMentorCsv = {
  /** Rows that are ready to insert. */
  valid: MentorCsvRow[];
  /** Rows that cannot be imported at all. */
  errors: RowIssue[];
  /** Rows deliberately left out (duplicates, consent withheld). */
  skipped: RowIssue[];
  /** Canonical fields that were found in the header. */
  matchedColumns: string[];
  /** Headers present in the file that we ignored. */
  ignoredColumns: string[];
  totalRows: number;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Values people type into a form when they mean "nothing". */
const PLACEHOLDER_VALUES = new Set([
  "n/a",
  "na",
  "none",
  "no",
  "nil",
  "-",
  "--",
  "tbd",
]);

/**
 * Turns whatever landed in the LinkedIn column into something that actually
 * navigates, or null.
 *
 * Real exports contain bare domains ("www.linkedin.com/in/x"), bare vanity
 * names ("jordanlee"), placeholders ("N/A") and even whole sentences. Blindly
 * prefixing https:// would turn every one of those into a broken link, so
 * anything that is not plausibly an address becomes null instead.
 */
function normaliseLinkedIn(value: string): string | null {
  const trimmed = value.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmed) return null;
  if (PLACEHOLDER_VALUES.has(trimmed.toLowerCase())) return null;

  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // Looks like a domain: linkedin.com/in/x, www.linkedin.com/in/x
  if (/^[\w-]+(\.[\w-]+)+(\/|$)/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  // Looks like a bare vanity name: assume it is a LinkedIn profile slug.
  if (/^[\w.-]{3,100}$/.test(trimmed)) {
    return `https://www.linkedin.com/in/${trimmed}`;
  }

  // Free text ("Doing this from my phone…") — not a link.
  return null;
}

/**
 * Maps parsed CSV rows onto mentor records, validating as it goes.
 *
 * `existingEmails` are addresses already in the database — matching rows are
 * reported as skipped rather than inserted, so re-uploading a file is safe.
 */
export function mapMentorCsv(
  rows: string[][],
  existingEmails: Set<string> = new Set(),
): ParsedMentorCsv {
  const result: ParsedMentorCsv = {
    valid: [],
    errors: [],
    skipped: [],
    matchedColumns: [],
    ignoredColumns: [],
    totalRows: 0,
  };

  if (rows.length === 0) return result;

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map(normaliseHeader);

  // Resolve each canonical field to a column index.
  const columnIndex: Record<string, number> = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = headers.findIndex((h) => aliases.includes(h));
    if (index !== -1) {
      columnIndex[field] = index;
      result.matchedColumns.push(field);
    }
  }

  // A consent question means someone explicitly opted out of being published.
  const consentIndex = headers.findIndex((h) => h.includes("consent"));

  const usedIndexes = new Set(Object.values(columnIndex));
  result.ignoredColumns = headerRow
    .filter((_, i) => !usedIndexes.has(i) && i !== consentIndex)
    .map((h) => h.trim())
    .filter(Boolean);

  const cell = (row: string[], field: string): string => {
    const index = columnIndex[field];
    if (index === undefined) return "";
    return (row[index] ?? "").trim();
  };

  const seenEmails = new Set<string>();
  result.totalRows = dataRows.length;

  dataRows.forEach((row, i) => {
    // +2: one for the header row, one because humans count from 1.
    const rowNumber = i + 2;
    const fullName = cell(row, "full_name");
    const email = cell(row, "email");
    const label = fullName || email || `Row ${rowNumber}`;

    if (!fullName) {
      result.errors.push({ row: rowNumber, name: label, reason: "Missing full name" });
      return;
    }

    if (!email) {
      result.errors.push({ row: rowNumber, name: label, reason: "Missing email" });
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      result.errors.push({
        row: rowNumber,
        name: label,
        reason: `Invalid email (${email})`,
      });
      return;
    }

    const emailKey = email.toLowerCase();

    if (seenEmails.has(emailKey)) {
      result.skipped.push({
        row: rowNumber,
        name: label,
        reason: "Duplicate email in this file",
      });
      return;
    }

    if (existingEmails.has(emailKey)) {
      result.skipped.push({
        row: rowNumber,
        name: label,
        reason: "Already in the database",
      });
      return;
    }

    if (consentIndex !== -1) {
      const consent = (row[consentIndex] ?? "").trim().toLowerCase();
      // Only an explicit refusal blocks import; blank and "N/A" pass through.
      if (["no", "n", "false"].includes(consent)) {
        result.skipped.push({
          row: rowNumber,
          name: label,
          reason: "Consent not given",
        });
        return;
      }
    }

    seenEmails.add(emailKey);

    const capacityRaw = cell(row, "capacity");
    const capacityParsed = Number.parseInt(capacityRaw, 10);

    result.valid.push({
      row: rowNumber,
      full_name: fullName,
      email,
      pronouns: cell(row, "pronouns") || null,
      year_of_study: cell(row, "year_of_study"),
      program_of_study: cell(row, "program_of_study"),
      mentor_description: cell(row, "mentor_description"),
      linkedin_url: normaliseLinkedIn(cell(row, "linkedin_url")),
      capacity: Number.isFinite(capacityParsed) && capacityParsed > 0
        ? capacityParsed
        : 3,
    });
  });

  return result;
}

/** Builds a starter file so people can see the expected shape. */
export function buildCsvTemplate(): string {
  const example = [
    "Jordan Lee",
    "jordan.lee@uoguelph.ca",
    "they/them",
    "Fourth Year",
    "Accounting Co-op",
    'Fourth-year accounting student. Happy to talk co-op, interviews, and "finding your people" on campus.',
    "https://linkedin.com/in/jordanlee",
    "3",
  ];

  const escape = (value: string) => `"${value.replace(/"/g, '""')}"`;

  return [
    CSV_TEMPLATE_HEADERS.join(","),
    example.map(escape).join(","),
  ].join("\n");
}
