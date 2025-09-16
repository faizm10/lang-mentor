import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let supabase: SupabaseClient | null = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
} else {
  // Preview-friendly: if env is missing, we gracefully fall back to mock data
  console.warn(
    "[supabase] NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing. Using mock data for preview.",
  )
}

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

export async function fetchMentorProfiles(): Promise<MentorProfileRow[] | null> {
  // If Supabase env is missing, return mock data for preview
  if (!supabase) {
    return mockMentors
  }

  // Try full select first
  const full = await supabase
    .from("mentor_profiles")
    .select(
      `id, created_at, pronouns, year_of_study, program_of_study, mentor_description, linkedin_url, full_name, email`,
    )

  if (!full.error && full.data) {
    console.debug("[supabase] fetchMentorProfiles: using full select", {
      count: full.data.length,
    })
    return (full.data as unknown as MentorProfileRow[]).map((row: any) => ({
      id: row.id,
      created_at: row.created_at ?? null,
      pronouns: row.pronouns ?? null,
      year_of_study: row.year_of_study ?? null,
      program_of_study: row.program_of_study ?? null,
      mentor_description: row.mentor_description ?? null,
      linkedin_url: row.linkedin_url ?? null,
      full_name: row.full_name,
      email: row.email,
      user_id: null,
    }))
  }

  // If RLS restricts some columns, retry with minimal fields to allow ID-name mapping
  const minimal = await supabase
    .from("mentor_profiles")
    .select(`id, full_name`)

  if (minimal.error) {
    console.error("Error fetching mentor profiles:", minimal.error)
    return []
  }
  console.debug("[supabase] fetchMentorProfiles: using minimal select", {
    count: minimal.data?.length ?? 0,
  })

  return (minimal.data as any[]).map((row) => ({
    id: row.id as string,
    created_at: null,
    pronouns: null,
    year_of_study: null,
    program_of_study: null,
    mentor_description: null,
    linkedin_url: null,
    full_name: row.full_name as string,
    email: "",
    user_id: null,
  })) as MentorProfileRow[]
}

export async function fetchMentorNamesByIds(ids: string[]): Promise<{ id: string; full_name: string }[]> {
  if (!supabase) return []
  if (ids.length === 0) return []
  console.debug("[supabase] fetchMentorNamesByIds: request", { idsCount: ids.length, ids })
  const { data, error } = await supabase
    .from("mentor_profiles")
    .select("id, full_name")
    .in("id", ids)
  if (error) {
    console.error("Error fetching mentor names by ids:", error)
    return []
  }
  console.debug("[supabase] fetchMentorNamesByIds: response", { count: data?.length ?? 0, data })
  return (data as any[]).map((row) => ({ id: row.id as string, full_name: row.full_name as string }))
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
  if (!supabase) {
    console.warn("[supabase] Missing env. Simulating mentee_preferences insert.")
    return { data: null, error: null, preview: true as const }
  }

  const { data, error } = await supabase
    .from("mentee_preferences")
    .insert(payload)
    .select("id")
    .single()

  return { data, error, preview: false as const }
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
  if (!supabase) {
    // No preview mock to avoid confusion; return empty list
    return []
  }

  const { data, error } = await supabase
    .from("mentee_preferences")
    .select(
      `id, submitted_at, first_name, last_name, student_id, email, program, major, year, first_choice, second_choice, third_choice`,
    )
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error("Error fetching mentee preferences:", error)
    return []
  }

  return (data as unknown as MenteePreferencesRow[]) ?? []
}

export type MentorAssignmentInsert = {
  mentor_id: string
  mentee_id: string
  assigned_by?: string | null
}

export async function saveMentorAssignments(assignments: MentorAssignmentInsert[]) {
  if (!supabase) {
    console.warn("[supabase] Missing env. Simulating mentor_assignments upsert.")
    return { data: null, error: null, preview: true as const }
  }

  const { data, error } = await supabase
    .from("mentor_assignments")
    .upsert(assignments, { onConflict: "mentee_id" })
    .select("id")

  return { data, error, preview: false as const }
}
