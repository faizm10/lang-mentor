"use server"

import { asc, desc, inArray, sql } from "drizzle-orm"

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
  user_id?: string | null
}

const mockMentors: MentorProfileRow[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    created_at: null,
    pronouns: "she/her",
    year_of_study: "Senior",
    program_of_study: "Computer Science",
    mentor_description: "I love frontend, design systems, and mentorship.",
    linkedin_url: null,
    full_name: "Alicia Koch",
    email: "alicia@example.com",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    created_at: null,
    pronouns: "he/him",
    year_of_study: "Junior",
    program_of_study: "Data Science",
    mentor_description: "Into ML ops and data visualization.",
    linkedin_url: null,
    full_name: "James Watson",
    email: "james@example.com",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    created_at: null,
    pronouns: "they/them",
    year_of_study: "Sophomore",
    program_of_study: "Information Systems",
    mentor_description: "Backend APIs and community building.",
    linkedin_url: null,
    full_name: "Taylor Brooks",
    email: "taylor@example.com",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    created_at: null,
    pronouns: null,
    year_of_study: "Freshman",
    program_of_study: "Business",
    mentor_description: "Exploring product management and startups.",
    linkedin_url: null,
    full_name: "Jordan Lee",
    email: "jordan@example.com",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    created_at: null,
    pronouns: "he/him",
    year_of_study: "Senior",
    program_of_study: "Mathematics",
    mentor_description: "Competitive programming and proofs.",
    linkedin_url: null,
    full_name: "Marco Diaz",
    email: "marco@example.com",
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    created_at: null,
    pronouns: "she/her",
    year_of_study: "Junior",
    program_of_study: "Computer Science",
    mentor_description: "Web performance and accessibility.",
    linkedin_url: null,
    full_name: "Priya Sharma",
    email: "priya@example.com",
  },
]

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null
  if (value instanceof Date) return value.toISOString()
  return value
}

export async function fetchMentorProfiles(): Promise<MentorProfileRow[] | null> {
  if (!isDbConfigured() || !db) {
    return mockMentors
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
  first_choice: string
  second_choice: string
  third_choice: string
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
        firstChoice: payload.first_choice,
        secondChoice: payload.second_choice,
        thirdChoice: payload.third_choice,
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
