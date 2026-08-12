"use server"

import { asc, desc, eq, inArray, sql } from "drizzle-orm"

import { db, isDbConfigured } from "./index"
import {
  menteePreferences,
  mentorAssignments,
  mentorProfiles,
} from "./schema"

export type MentorProfileRow = {
  id: string
  created_at?: string | null
  pronouns: string | null
  year_of_study: string | null
  program_of_study: string | null
  mentor_description: string | null
  linkedin_url: string | null
  full_name: string
  email: string
  capacity?: number | null
  user_id?: string | null
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return value
}

export async function fetchMentorProfiles(): Promise<MentorProfileRow[] | null> {
  if (!isDbConfigured() || !db) {
    return []
  }

  try {
    const rows = await db
      .select({
        id: mentorProfiles.id,
        createdAt: mentorProfiles.createdAt,
        pronouns: mentorProfiles.pronouns,
        yearOfStudy: mentorProfiles.yearOfStudy,
        programOfStudy: mentorProfiles.programOfStudy,
        mentorDescription: mentorProfiles.mentorDescription,
        linkedinUrl: mentorProfiles.linkedinUrl,
        fullName: mentorProfiles.fullName,
        email: mentorProfiles.email,
        capacity: mentorProfiles.capacity,
      })
      .from(mentorProfiles)
      .orderBy(asc(mentorProfiles.fullName))

    return rows.map((row) => ({
      id: row.id,
      created_at: toIso(row.createdAt),
      pronouns: row.pronouns,
      year_of_study: row.yearOfStudy,
      program_of_study: row.programOfStudy,
      mentor_description: row.mentorDescription,
      linkedin_url: row.linkedinUrl,
      full_name: row.fullName,
      email: row.email,
      capacity: row.capacity,
      user_id: null,
    }))
  } catch (error) {
    console.error("Error fetching mentor profiles:", error)
    return []
  }
}

export async function fetchMentorNamesByIds(
  ids: string[],
): Promise<{ id: string; full_name: string }[]> {
  if (!isDbConfigured() || !db || ids.length === 0) return []

  try {
    const rows = await db
      .select({
        id: mentorProfiles.id,
        fullName: mentorProfiles.fullName,
      })
      .from(mentorProfiles)
      .where(inArray(mentorProfiles.id, ids))

    return rows.map((row) => ({ id: row.id, full_name: row.fullName }))
  } catch (error) {
    console.error("Error fetching mentor names by ids:", error)
    return []
  }
}

export type MenteePreferencesInsert = {
  first_name: string
  last_name: string
  student_id: number
  email: string
  program: string
  major: string
  year: string
  first_choice: string | null
  second_choice: string | null
  third_choice: string | null
}

export async function submitMenteePreferences(payload: MenteePreferencesInsert) {
  if (!isDbConfigured() || !db) {
    console.warn("[db] Missing DATABASE_URL. Simulating mentee_preferences insert.")
    return { data: null, error: null, preview: true as const }
  }

  try {
    const [row] = await db
      .insert(menteePreferences)
      .values({
        firstName: payload.first_name,
        lastName: payload.last_name,
        studentId: payload.student_id,
        email: payload.email,
        program: payload.program,
        major: payload.major,
        year: payload.year,
        firstChoice: payload.first_choice || null,
        secondChoice: payload.second_choice || null,
        thirdChoice: payload.third_choice || null,
      })
      .returning({ id: menteePreferences.id })

    return { data: row, error: null, preview: false as const }
  } catch (error) {
    console.error("Error submitting mentee preferences:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export type MenteePreferencesRow = {
  id: string
  submitted_at: string | null
  first_name: string
  last_name: string
  student_id: number
  email: string
  program: string
  major: string
  year: string
  first_choice: string
  second_choice: string
  third_choice: string
}

export async function fetchMenteePreferences(): Promise<MenteePreferencesRow[]> {
  if (!isDbConfigured() || !db) {
    return []
  }

  try {
    const rows = await db
      .select({
        id: menteePreferences.id,
        submittedAt: menteePreferences.submittedAt,
        firstName: menteePreferences.firstName,
        lastName: menteePreferences.lastName,
        studentId: menteePreferences.studentId,
        email: menteePreferences.email,
        program: menteePreferences.program,
        major: menteePreferences.major,
        year: menteePreferences.year,
        firstChoice: menteePreferences.firstChoice,
        secondChoice: menteePreferences.secondChoice,
        thirdChoice: menteePreferences.thirdChoice,
      })
      .from(menteePreferences)
      .orderBy(desc(menteePreferences.submittedAt))

    return rows.map((row) => ({
      id: row.id,
      submitted_at: toIso(row.submittedAt),
      first_name: row.firstName,
      last_name: row.lastName,
      student_id: row.studentId,
      email: row.email,
      program: row.program,
      major: row.major,
      year: row.year,
      first_choice: row.firstChoice ?? "",
      second_choice: row.secondChoice ?? "",
      third_choice: row.thirdChoice ?? "",
    }))
  } catch (error) {
    console.error("Error fetching mentee preferences:", error)
    return []
  }
}

export type MentorAssignmentInsert = {
  mentor_id: string
  mentee_id: string
  assigned_by?: string | null
}

export async function saveMentorAssignments(assignments: MentorAssignmentInsert[]) {
  if (!isDbConfigured() || !db) {
    console.warn("[db] Missing DATABASE_URL. Simulating mentor_assignments upsert.")
    return { data: null, error: null, preview: true as const }
  }

  try {
    const rows = await db
      .insert(mentorAssignments)
      .values(
        assignments.map((a) => ({
          mentorId: a.mentor_id,
          menteeId: a.mentee_id,
          assignedBy: a.assigned_by ?? null,
        })),
      )
      .onConflictDoUpdate({
        target: mentorAssignments.menteeId,
        set: {
          mentorId: sql`excluded.mentor_id`,
          assignedBy: sql`excluded.assigned_by`,
          assignedAt: sql`now()`,
        },
      })
      .returning({ id: mentorAssignments.id })

    return { data: rows, error: null, preview: false as const }
  } catch (error) {
    console.error("Error saving mentor assignments:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export type MentorAssignmentRow = {
  id: string
  mentor_id: string | null
  mentee_id: string
  assigned_at: string | null
}

export async function fetchMentorAssignments(): Promise<MentorAssignmentRow[]> {
  if (!isDbConfigured() || !db) {
    return []
  }

  try {
    const rows = await db
      .select({
        id: mentorAssignments.id,
        mentorId: mentorAssignments.mentorId,
        menteeId: mentorAssignments.menteeId,
        assignedAt: mentorAssignments.assignedAt,
      })
      .from(mentorAssignments)
      .orderBy(desc(mentorAssignments.assignedAt))

    return rows
      .filter((row): row is typeof row & { menteeId: string } => Boolean(row.menteeId))
      .map((row) => ({
        id: row.id,
        mentor_id: row.mentorId,
        mentee_id: row.menteeId,
        assigned_at: toIso(row.assignedAt),
      }))
  } catch (error) {
    console.error("Error fetching mentor assignments:", error)
    return []
  }
}

export type CreateMentorProfileInput = {
  full_name: string
  email: string
  pronouns: string | null
  year_of_study: string
  program_of_study: string
  mentor_description: string
  linkedin_url: string | null
  capacity: number
}

export async function createMentorProfile(payload: CreateMentorProfileInput) {
  if (!isDbConfigured() || !db) {
    console.warn("[db] Missing DATABASE_URL. Simulating mentor_profiles insert.")
    return { data: null, error: null, preview: true as const }
  }

  try {
    const [row] = await db
      .insert(mentorProfiles)
      .values({
        fullName: payload.full_name,
        email: payload.email,
        pronouns: payload.pronouns,
        yearOfStudy: payload.year_of_study,
        programOfStudy: payload.program_of_study,
        mentorDescription: payload.mentor_description,
        linkedinUrl: payload.linkedin_url,
        capacity: payload.capacity,
      })
      .returning({ id: mentorProfiles.id })

    return { data: row, error: null, preview: false as const }
  } catch (error) {
    console.error("Error creating mentor profile:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export async function updateMentorProfile(
  id: string,
  payload: CreateMentorProfileInput,
) {
  if (!isDbConfigured() || !db) {
    console.warn("[db] Missing DATABASE_URL. Simulating mentor_profiles update.")
    return { data: null, error: null, preview: true as const }
  }

  try {
    const [row] = await db
      .update(mentorProfiles)
      .set({
        fullName: payload.full_name,
        email: payload.email,
        pronouns: payload.pronouns,
        yearOfStudy: payload.year_of_study,
        programOfStudy: payload.program_of_study,
        mentorDescription: payload.mentor_description,
        linkedinUrl: payload.linkedin_url,
        capacity: payload.capacity,
      })
      .where(eq(mentorProfiles.id, id))
      .returning({ id: mentorProfiles.id })

    if (!row) {
      return {
        data: null,
        error: new Error("Mentor not found"),
        preview: false as const,
      }
    }

    return { data: row, error: null, preview: false as const }
  } catch (error) {
    console.error("Error updating mentor profile:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export async function deleteMentorProfile(id: string) {
  if (!isDbConfigured() || !db) {
    console.warn("[db] Missing DATABASE_URL. Simulating mentor_profiles delete.")
    return { data: null, error: null, preview: true as const }
  }

  try {
    await db
      .update(mentorAssignments)
      .set({ mentorId: null })
      .where(eq(mentorAssignments.mentorId, id))

    const [row] = await db
      .delete(mentorProfiles)
      .where(eq(mentorProfiles.id, id))
      .returning({ id: mentorProfiles.id })

    if (!row) {
      return {
        data: null,
        error: new Error("Mentor not found"),
        preview: false as const,
      }
    }

    return { data: row, error: null, preview: false as const }
  } catch (error) {
    console.error("Error deleting mentor profile:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export type UpdateMenteePreferencesInput = {
  first_name: string
  last_name: string
  student_id: number
  email: string
  program: string
  major: string
  year: string
  first_choice: string | null
  second_choice: string | null
  third_choice: string | null
}

export async function updateMenteePreferences(
  id: string,
  payload: UpdateMenteePreferencesInput,
) {
  if (!isDbConfigured() || !db) {
    console.warn(
      "[db] Missing DATABASE_URL. Simulating mentee_preferences update.",
    )
    return { data: null, error: null, preview: true as const }
  }

  try {
    const [row] = await db
      .update(menteePreferences)
      .set({
        firstName: payload.first_name,
        lastName: payload.last_name,
        studentId: payload.student_id,
        email: payload.email,
        program: payload.program,
        major: payload.major,
        year: payload.year,
        firstChoice: payload.first_choice,
        secondChoice: payload.second_choice,
        thirdChoice: payload.third_choice,
      })
      .where(eq(menteePreferences.id, id))
      .returning({ id: menteePreferences.id })

    if (!row) {
      return {
        data: null,
        error: new Error("Mentee not found"),
        preview: false as const,
      }
    }

    return { data: row, error: null, preview: false as const }
  } catch (error) {
    console.error("Error updating mentee preferences:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export async function deleteMenteePreferences(id: string) {
  if (!isDbConfigured() || !db) {
    console.warn(
      "[db] Missing DATABASE_URL. Simulating mentee_preferences delete.",
    )
    return { data: null, error: null, preview: true as const }
  }

  try {
    await db
      .delete(mentorAssignments)
      .where(eq(mentorAssignments.menteeId, id))

    const [row] = await db
      .delete(menteePreferences)
      .where(eq(menteePreferences.id, id))
      .returning({ id: menteePreferences.id })

    if (!row) {
      return {
        data: null,
        error: new Error("Mentee not found"),
        preview: false as const,
      }
    }

    return { data: row, error: null, preview: false as const }
  } catch (error) {
    console.error("Error deleting mentee preferences:", error)
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export async function createMentorProfilesBulk(
  payloads: CreateMentorProfileInput[],
) {
  if (payloads.length === 0) {
    return { count: 0, error: null, preview: false as const }
  }

  if (!isDbConfigured() || !db) {
    console.warn(
      "[db] Missing DATABASE_URL. Simulating bulk mentor_profiles insert.",
    )
    return { count: 0, error: null, preview: true as const }
  }

  try {
    const rows = await db
      .insert(mentorProfiles)
      .values(
        payloads.map((payload) => ({
          fullName: payload.full_name,
          email: payload.email,
          pronouns: payload.pronouns,
          yearOfStudy: payload.year_of_study,
          programOfStudy: payload.program_of_study,
          mentorDescription: payload.mentor_description,
          linkedinUrl: payload.linkedin_url,
          capacity: payload.capacity,
        })),
      )
      .returning({ id: mentorProfiles.id })

    return { count: rows.length, error: null, preview: false as const }
  } catch (error) {
    console.error("Error creating mentor profiles in bulk:", error)
    return {
      count: 0,
      error: error instanceof Error ? error : new Error(String(error)),
      preview: false as const,
    }
  }
}

export type DatabaseTableSnapshot = {
  name: string
  exists: boolean
  rowCount: number
  columns: string[]
  rows: Record<string, string | number | boolean | null>[]
}

export type DatabaseStatus = {
  configured: boolean
  connected: boolean
  error: string | null
  host: string | null
  database: string | null
  postgresVersion: string | null
  checkedAt: string
  tables: DatabaseTableSnapshot[]
}

function serializeCell(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value
  }
  return JSON.stringify(value)
}

function serializeRows(
  rows: Record<string, unknown>[],
): Record<string, string | number | boolean | null>[] {
  return rows.map((row) => {
    const out: Record<string, string | number | boolean | null> = {}
    for (const [key, value] of Object.entries(row)) {
      out[key] = serializeCell(value)
    }
    return out
  })
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const checkedAt = new Date().toISOString()
  const connectionString = process.env.DATABASE_URL

  let host: string | null = null
  let database: string | null = null
  if (connectionString) {
    try {
      const parsed = new URL(connectionString)
      host = parsed.hostname
      database = parsed.pathname.replace(/^\//, "") || null
    } catch {
      host = "(invalid DATABASE_URL)"
    }
  }

  if (!isDbConfigured() || !db) {
    return {
      configured: false,
      connected: false,
      error: "DATABASE_URL is not set",
      host,
      database,
      postgresVersion: null,
      checkedAt,
      tables: [],
    }
  }

  try {
    const versionResult = await db.execute(sql`select version() as version`)
    const versionRow = versionResult.rows[0] as { version?: string } | undefined
    const postgresVersion = versionRow?.version ?? null

    const existing = await db.execute(sql`
      select table_name
      from information_schema.tables
      where table_schema = 'public'
        and table_name in ('mentor_profiles', 'mentee_preferences', 'mentor_assignments')
    `)
    const existingNames = new Set(
      existing.rows.map((row) => String((row as { table_name: string }).table_name)),
    )

    const emptyColumns: Record<string, string[]> = {
      mentor_profiles: [
        "id",
        "capacity",
        "createdAt",
        "pronouns",
        "yearOfStudy",
        "programOfStudy",
        "mentorDescription",
        "linkedinUrl",
        "fullName",
        "email",
      ],
      mentee_preferences: [
        "id",
        "firstChoice",
        "secondChoice",
        "thirdChoice",
        "submittedAt",
        "email",
        "studentId",
        "firstName",
        "lastName",
        "program",
        "major",
        "year",
      ],
      mentor_assignments: [
        "id",
        "mentorId",
        "menteeId",
        "assignedBy",
        "assignedAt",
      ],
    }

    const tableDefs = [
      { name: "mentor_profiles", query: db.select().from(mentorProfiles) },
      { name: "mentee_preferences", query: db.select().from(menteePreferences) },
      { name: "mentor_assignments", query: db.select().from(mentorAssignments) },
    ] as const

    const tables: DatabaseTableSnapshot[] = []
    for (const table of tableDefs) {
      const exists = existingNames.has(table.name)
      if (!exists) {
        tables.push({
          name: table.name,
          exists: false,
          rowCount: 0,
          columns: [],
          rows: [],
        })
        continue
      }

      const rawRows = (await table.query) as Record<string, unknown>[]
      const columns =
        rawRows.length > 0 ? Object.keys(rawRows[0]) : emptyColumns[table.name] ?? []
      tables.push({
        name: table.name,
        exists: true,
        rowCount: rawRows.length,
        columns,
        rows: serializeRows(rawRows),
      })
    }

    return {
      configured: true,
      connected: true,
      error: null,
      host,
      database,
      postgresVersion,
      checkedAt,
      tables,
    }
  } catch (error) {
    console.error("Error checking database status:", error)
    return {
      configured: true,
      connected: false,
      error: error instanceof Error ? error.message : String(error),
      host,
      database,
      postgresVersion: null,
      checkedAt,
      tables: [],
    }
  }
}
