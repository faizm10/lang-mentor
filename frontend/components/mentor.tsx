"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { createClient } from "@supabase/supabase-js"
import { useEffect, useState } from "react"

interface MenteeData {
  id: string
  name: string
  topChoices: string[]
  matchedMentor: string | null
  status: string
}

export function MenteeTable() {
  const [mentees, setMentees] = useState<MenteeData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenteeData() {
      try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        const supabase = createClient(url, key)

        const { data: menteesData, error: menteesError } = await supabase
          .from("mentee_preferences")
          .select(`
            id,
            first_name,
            last_name,
            first_choice,
            second_choice,
            third_choice
          `)
          .order("submitted_at", { ascending: false })

        if (menteesError) {
          console.error("Error fetching mentees:", menteesError)
          setError(`Failed to fetch mentee data: ${menteesError.message || 'Unknown error'}`)
          return
        }

        if (!menteesData) {
          setMentees([])
          return
        }

        // Fetch mentor names for all choice IDs
        const choiceIds = new Set<string>()
        menteesData?.forEach((mentee: { first_choice?: string; second_choice?: string; third_choice?: string }) => {
          if (mentee.first_choice) choiceIds.add(mentee.first_choice)
          if (mentee.second_choice) choiceIds.add(mentee.second_choice)
          if (mentee.third_choice) choiceIds.add(mentee.third_choice)
        })

        console.log("Choice IDs to fetch:", Array.from(choiceIds).slice(0, 5)) // Show first 5

        const { data: mentorsData, error: mentorsError } = await supabase
          .from("mentor_profiles")
          .select("id, full_name")
          .in("id", Array.from(choiceIds))

        console.log("Mentors fetched:", mentorsData?.length || 0)
        console.log("Sample mentor data:", mentorsData?.slice(0, 3))

        if (mentorsError) {
          console.error("Error fetching mentors:", mentorsError)
        }

        const mentorMap = new Map(
          mentorsData?.map((m: { id: string; full_name: string }) => [m.id, m.full_name]) || []
        )

        console.log("Mentor map size:", mentorMap.size)
        console.log("Sample mentor map entries:", Array.from(mentorMap.entries()).slice(0, 3))

        const transformedData: MenteeData[] =
          menteesData?.map((mentee: { id: string; first_name: string; last_name: string; first_choice?: string; second_choice?: string; third_choice?: string; mentor_assignments?: Array<{ mentor_profiles?: { full_name: string } }> }) => {
            // Get top 3 mentor choices
            const firstChoice = mentee.first_choice ? mentorMap.get(mentee.first_choice) || "Unknown" : "Unknown"
            const secondChoice = mentee.second_choice ? mentorMap.get(mentee.second_choice) || "Unknown" : "Unknown"
            const thirdChoice = mentee.third_choice ? mentorMap.get(mentee.third_choice) || "Unknown" : "Unknown"
            
            const preferences = [firstChoice, secondChoice, thirdChoice]

            // Debug first mentee
            if (mentee.id === menteesData[0]?.id) {
              console.log("First mentee debug:", {
                menteeId: mentee.id,
                firstChoiceId: mentee.first_choice,
                firstChoiceName: firstChoice,
                secondChoiceId: mentee.second_choice,
                secondChoiceName: secondChoice,
                thirdChoiceId: mentee.third_choice,
                thirdChoiceName: thirdChoice
              })
            }

            // Get matched mentor if any
            const matchedMentor = mentee.mentor_assignments?.[0]?.mentor_profiles?.full_name || null

            return {
              id: mentee.id,
              name: `${mentee.first_name} ${mentee.last_name}`,
              topChoices: preferences,
              matchedMentor,
              status: matchedMentor ? "matched" : "unmatched",
            }
          }) || []

        setMentees(transformedData)
      } catch (err) {
        console.error("Error:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchMenteeData()
  }, [])

  if (loading) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-muted-foreground">Loading mentee data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-md border p-8 text-center">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Mentee Name</TableHead>
            <TableHead className="font-semibold">Top 3 Choices</TableHead>
            <TableHead className="font-semibold">Matched Mentor</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mentees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No mentee data found
              </TableCell>
            </TableRow>
          ) : (
            mentees.map((mentee) => (
              <TableRow key={mentee.id}>
                <TableCell>
                  <button className="text-blue-600 hover:text-blue-800 hover:underline font-medium text-left">
                    {mentee.name}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex gap-4 text-sm">
                    {mentee.topChoices.map((choice, index) => (
                      <span key={index} className={choice === "Unknown" ? "text-muted-foreground" : "text-foreground"}>
                        {choice}
                      </span>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-muted-foreground">{mentee.matchedMentor || "N/A"}</span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={
                      mentee.status === "matched"
                        ? "bg-green-100 text-green-800 hover:bg-green-100 border-green-200"
                        : "bg-orange-100 text-orange-800 hover:bg-orange-100 border-orange-200"
                    }
                  >
                    {mentee.status === "unmatched" ? "Unmatched" : "Matched"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
