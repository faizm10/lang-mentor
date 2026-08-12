"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertCircle,
  Check,
  Download,
  FileSpreadsheet,
  Info,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  buildCsvTemplate,
  mapMentorCsv,
  parseCsv,
  type ParsedMentorCsv,
} from "@/lib/csv";
import {
  createMentorProfilesBulk,
  fetchMentorProfiles,
} from "@/lib/db/actions";

const PREVIEW_LIMIT = 8;
const ISSUE_LIMIT = 10;

function SummaryTile({
  count,
  label,
  tone,
}: {
  count: number;
  label: string;
  tone: "ready" | "skipped" | "error";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        tone === "ready" && "border-primary/30 bg-brand-subtle",
        tone === "skipped" && "border-border bg-muted/60",
        tone === "error" && count > 0 && "border-destructive/30 bg-destructive/5",
        tone === "error" && count === 0 && "border-border bg-muted/60",
      )}
    >
      <p
        className={cn(
          "text-2xl font-bold tabular-nums",
          tone === "ready" && "text-brand-subtle-foreground",
          tone === "error" && count > 0 && "text-destructive",
        )}
      >
        {count}
      </p>
      <p className="mt-0.5 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

function IssueList({
  title,
  issues,
  tone,
}: {
  title: string;
  issues: { row: number; name: string; reason: string }[];
  tone: "error" | "skipped";
}) {
  if (issues.length === 0) return null;

  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {issues.slice(0, ISSUE_LIMIT).map((issue) => (
          <li
            key={`${issue.row}-${issue.reason}`}
            className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm"
          >
            <span className="font-mono text-xs text-muted-foreground">
              Row {issue.row}
            </span>
            <span className="font-medium break-words">{issue.name}</span>
            <span
              className={cn(
                "text-sm",
                tone === "error" ? "text-destructive" : "text-muted-foreground",
              )}
            >
              — {issue.reason}
            </span>
          </li>
        ))}
      </ul>
      {issues.length > ISSUE_LIMIT ? (
        <p className="mt-2 text-sm text-muted-foreground">
          …and {issues.length - ISSUE_LIMIT} more
        </p>
      ) : null}
    </div>
  );
}

export default function MentorCsvImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedMentorCsv | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const reset = () => {
    setFileName(null);
    setParsed(null);
    setParseError(null);
    setImportedCount(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleFile = async (file: File) => {
    setIsReading(true);
    setParseError(null);
    setParsed(null);
    setImportedCount(null);
    setFileName(file.name);

    try {
      const text = await file.text();
      const rows = parseCsv(text);

      if (rows.length < 2) {
        setParseError(
          "That file has no data rows — expected a header row plus at least one mentor.",
        );
        return;
      }

      // Existing addresses let us skip anyone already imported.
      const existing = await fetchMentorProfiles();
      const existingEmails = new Set(
        (existing ?? [])
          .map((m) => m.email?.trim().toLowerCase())
          .filter(Boolean) as string[],
      );

      const mapped = mapMentorCsv(rows, existingEmails);

      if (!mapped.matchedColumns.includes("full_name") ||
          !mapped.matchedColumns.includes("email")) {
        setParseError(
          "Could not find a name and email column. The file needs headers like full_name and email.",
        );
        return;
      }

      setParsed(mapped);
    } catch (e) {
      console.error(e);
      setParseError("Could not read that file. Is it a valid .csv?");
    } finally {
      setIsReading(false);
    }
  };

  const handleImport = async () => {
    if (!parsed || parsed.valid.length === 0) return;

    setIsImporting(true);
    try {
      const { count, error, preview } = await createMentorProfilesBulk(
        parsed.valid.map((row) => ({
          full_name: row.full_name,
          email: row.email,
          pronouns: row.pronouns,
          year_of_study: row.year_of_study,
          program_of_study: row.program_of_study,
          mentor_description: row.mentor_description,
          linkedin_url: row.linkedin_url,
          capacity: row.capacity,
        })),
      );

      if (error) {
        toast.error(`Import failed: ${error.message}`);
        return;
      }

      if (preview) {
        toast.error("No database connection — nothing was imported.");
        return;
      }

      setImportedCount(count);
      toast.success(`Imported ${count} mentors.`);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([buildCsvTemplate()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "mentor-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  // Success state
  if (importedCount !== null) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-primary">
          <Check
            className="size-7 text-primary-foreground"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-xl font-semibold">
          Imported {importedCount}{" "}
          {importedCount === 1 ? "mentor" : "mentors"}
        </h3>
        <p className="prose-readable mt-2 max-w-sm">
          They are now visible in the Mentor Bank for mentees to choose from.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button onClick={() => router.push("/dashboard/mentors")}>
            View mentors
          </Button>
          <Button variant="outline" onClick={reset}>
            Import another file
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={cn(
          "rounded-lg border-2 border-dashed p-6 text-center transition-colors sm:p-8",
          isDragging ? "border-primary bg-brand-subtle" : "border-border",
        )}
      >
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
          <FileSpreadsheet
            className="size-6 text-muted-foreground"
            aria-hidden="true"
          />
        </div>

        <p className="text-sm font-medium">
          Drop a CSV here, or choose a file
        </p>
        <p className="prose-readable mt-1 text-sm">
          One row per mentor. Extra columns are ignored.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />

        <div className="mt-5 flex flex-col items-center justify-center gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isReading}
            className="w-full sm:w-auto"
          >
            {isReading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Reading…
              </>
            ) : (
              <>
                <Upload aria-hidden="true" />
                Choose CSV file
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={downloadTemplate}
            className="w-full sm:w-auto"
          >
            <Download aria-hidden="true" />
            Download template
          </Button>
        </div>
      </div>

      {fileName && !parseError ? (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <FileSpreadsheet
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="truncate text-sm font-medium">{fileName}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={reset}
            aria-label="Remove file"
          >
            <X aria-hidden="true" />
          </Button>
        </div>
      ) : null}

      {parseError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{parseError}</AlertDescription>
        </Alert>
      ) : null}

      {parsed ? (
        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <SummaryTile
              count={parsed.valid.length}
              label="Ready to import"
              tone="ready"
            />
            <SummaryTile
              count={parsed.skipped.length}
              label="Skipped"
              tone="skipped"
            />
            <SummaryTile
              count={parsed.errors.length}
              label="Errors"
              tone="error"
            />
          </div>

          {parsed.ignoredColumns.length > 0 ? (
            <Alert className="bg-muted/60">
              <Info aria-hidden="true" />
              <AlertDescription>
                Ignored {parsed.ignoredColumns.length} unrecognised{" "}
                {parsed.ignoredColumns.length === 1 ? "column" : "columns"}:{" "}
                {parsed.ignoredColumns.slice(0, 3).join(", ")}
                {parsed.ignoredColumns.length > 3
                  ? `, +${parsed.ignoredColumns.length - 3} more`
                  : ""}
                .
              </AlertDescription>
            </Alert>
          ) : null}

          <IssueList
            title="Rows with errors"
            issues={parsed.errors}
            tone="error"
          />
          <IssueList
            title="Skipped rows"
            issues={parsed.skipped}
            tone="skipped"
          />

          {parsed.valid.length > 0 ? (
            <div>
              <p className="text-sm font-medium">
                Preview
                <span className="ml-2 font-normal text-muted-foreground">
                  first {Math.min(PREVIEW_LIMIT, parsed.valid.length)} of{" "}
                  {parsed.valid.length}
                </span>
              </p>

              {/* Mobile: stacked cards */}
              <ul className="mt-3 space-y-2 md:hidden">
                {parsed.valid.slice(0, PREVIEW_LIMIT).map((row) => (
                  <li
                    key={row.email}
                    className="rounded-lg border border-border p-3"
                  >
                    <p className="text-sm font-semibold break-words">
                      {row.full_name}
                    </p>
                    <p className="text-sm break-all text-muted-foreground">
                      {row.email}
                    </p>
                    {/* Program names run long, so they wrap as text rather
                        than sitting in a no-wrap badge that would overflow. */}
                    {row.program_of_study ? (
                      <p className="mt-1 text-sm break-words text-muted-foreground">
                        {row.program_of_study}
                      </p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {row.year_of_study ? (
                        <Badge variant="secondary" className="font-normal">
                          {row.year_of_study}
                        </Badge>
                      ) : null}
                      {!row.mentor_description ? (
                        <Badge
                          variant="secondary"
                          className="bg-muted font-normal text-muted-foreground"
                        >
                          No bio
                        </Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <Card className="mt-3 hidden gap-0 overflow-hidden py-0 md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-4">Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Year</TableHead>
                      <TableHead className="px-4">Program</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsed.valid.slice(0, PREVIEW_LIMIT).map((row) => (
                      <TableRow key={row.email}>
                        <TableCell className="px-4 font-medium">
                          {row.full_name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {row.email}
                        </TableCell>
                        <TableCell>{row.year_of_study || "—"}</TableCell>
                        <TableCell className="px-4">
                          {row.program_of_study || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          ) : null}

          {parsed.valid.length === 0 ? (
            <Alert>
              <AlertCircle aria-hidden="true" />
              <AlertDescription>
                Nothing in this file can be imported. Fix the rows above and try
                again.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={reset} disabled={isImporting}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={isImporting}>
                {isImporting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    Importing…
                  </>
                ) : (
                  `Import ${parsed.valid.length} ${
                    parsed.valid.length === 1 ? "mentor" : "mentors"
                  }`
                )}
              </Button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
