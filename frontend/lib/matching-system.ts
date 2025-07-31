// lib/matching-system.ts
import type { Mentee } from "./mentee";
import { langStudentsData } from "./mentor"; // This is your mentors data

export interface MatchedPair {
  menteeId: string;
  mentorId: string | null;
}

export function runMatching(mentees: Mentee[]): MatchedPair[] {
  const matches: MatchedPair[] = [];
  const assignedMentors = new Set<string>(); // Keep track of mentors already assigned

  // Create a map for quick mentor lookup
  const mentorMap = new Map(
    langStudentsData.map((mentor) => [mentor.id, mentor])
  );

  // Sort mentees to prioritize those with more specific choices or by some other criteria if needed
  // For simplicity, we'll process them in their given order for now.

  for (const mentee of mentees) {
    let matched = false;
    for (const choiceId of mentee.topChoices) {
      // Check if the chosen mentor exists and is not already assigned
      if (mentorMap.has(choiceId) && !assignedMentors.has(choiceId)) {
        matches.push({ menteeId: mentee.id, mentorId: choiceId });
        assignedMentors.add(choiceId);
        matched = true;
        break; // Move to the next mentee
      }
    }
    if (!matched) {
      // If no top choice could be matched, mark as unmatched
      matches.push({ menteeId: mentee.id, mentorId: null });
    }
  }

  return matches;
}
