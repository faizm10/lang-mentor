import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type MentorProfileRow = {
  created_at: string
  pronouns: string | null
  year_of_study: string | null
  program_of_study: string | null
  mentor_description: string | null
  linkedin_url: string | null
  full_name: string
  email: string
}

async function fetchMentorProfiles(): Promise<MentorProfileRow[] | null> {
  const { data, error } = await supabase
    .from("mentor_profiles")
    .select(`
      created_at,
      pronouns,
      id,
      year_of_study,
      program_of_study,
      mentor_description,
      linkedin_url,
      user:users (
        full_name,
        email
      )
    `)

  if (error) {
    console.error("Error fetching mentor profiles:", error)
    return null
  }

  // Flatten the nested user object
  return data.map((row: any) => ({
    created_at: row.created_at,
    pronouns: row.pronouns,
    year_of_study: row.year_of_study,
    program_of_study: row.program_of_study,
    mentor_description: row.mentor_description,
    linkedin_url: row.linkedin_url,
    full_name: row.user?.full_name,
    email: row.user?.email,
  }))
}
