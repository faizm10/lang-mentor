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

  const { data, error } = await supabase.from("mentor_profiles").select(
    `
      id,
      created_at,
      pronouns,
      year_of_study,
      program_of_study,
      mentor_description,
      linkedin_url,
      full_name,
      email
    `,
  )

  if (error) {
    console.error("Error fetching mentor profiles:", error)
    // Fallback to mock in case of errors (preview-friendly)
    return mockMentors
  }

  // Data is already flat from mentor_profiles table
  return (data as unknown as MentorProfileRow[]) ?? []
}

export type MenteePreferencesInsert = {
  full_name: string
  student_id: number
  email: string
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
  full_name: string
  student_id: number
  email: string
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
      `id, submitted_at, full_name, student_id, email, first_choice, second_choice, third_choice`,
    )
    .order("submitted_at", { ascending: false })

  if (error) {
    console.error("Error fetching mentee preferences:", error)
    return []
  }

  return (data as unknown as MenteePreferencesRow[]) ?? []
}
