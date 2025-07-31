"use client";

import { cn } from "@/lib/utils";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { menteesData } from "@/lib/mentee";
import { langStudentsData } from "@/lib/mentor"; // Your existing mentor data
import { runMatching, type MatchedPair } from "@/lib/matching-system";

export default function Dashboard() {
  const [matchingResults, setMatchingResults] = useState<MatchedPair[]>([]);
  const [matchingRun, setMatchingRun] = useState(false);

  const handleRunMatching = () => {
    const results = runMatching(menteesData);
    setMatchingResults(results);
    setMatchingRun(true);
  };

  // Create a map for quick lookup of mentor names by ID
  const mentorNameMap = useMemo(() => {
    return new Map(langStudentsData.map((mentor) => [mentor.id, mentor.name]));
  }, []);

  // Combine mentee data with matching results for display
  const displayData = useMemo(() => {
    return menteesData.map((mentee) => {
      const match = matchingResults.find((res) => res.menteeId === mentee.id);
      const matchedMentorName = match?.mentorId
        ? mentorNameMap.get(match.mentorId)
        : null;
      const status = matchedMentorName ? "Matched" : "Unmatched";

      return {
        ...mentee,
        matchedMentorName,
        status,
      };
    });
  }, [menteesData, matchingResults, mentorNameMap]);

  // Calculate unmatched mentees
  const unmatchedMentees = useMemo(() => {
    return displayData.filter((mentee) => mentee.status === "Unmatched");
  }, [displayData]);

  // Calculate unassigned mentors (not assigned in the current matching run)
  const unassignedMentors = useMemo(() => {
    if (!matchingRun) return [];
    const assignedMentorIds = new Set(
      matchingResults.map((match) => match.mentorId).filter(Boolean) as string[]
    );
    return langStudentsData.filter(
      (mentor) => !assignedMentorIds.has(mentor.id)
    );
  }, [matchingResults, langStudentsData, matchingRun]);

  // Calculate unchosen mentors (not in any mentee's top 3 choices)
  const unchosenMentors = useMemo(() => {
    const chosenMentorIds = new Set<string>();
    menteesData.forEach((mentee) => {
      mentee.topChoices.forEach((choiceId) => chosenMentorIds.add(choiceId));
    });
    return langStudentsData.filter((mentor) => !chosenMentorIds.has(mentor.id));
  }, [langStudentsData, menteesData]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Mentee Matching Dashboard
            </CardTitle>
            <p className="text-gray-600">
              View mentee choices and run the matching system.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <Button
                onClick={handleRunMatching}
                disabled={matchingRun}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {matchingRun ? "Matching Run" : "Run Matching System"}
              </Button>
              {matchingRun && (
                <p className="text-sm text-gray-500 mt-2">
                  Matching process completed. Review the results below.
                </p>
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mentee Name</TableHead>
                  <TableHead>Top 3 Choices</TableHead>
                  <TableHead>Matched Mentor</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.map((mentee) => (
                  <TableRow key={mentee.id}>
                    <TableCell className="font-medium">{mentee.name}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mentee.topChoices.map((choiceId) => (
                          <Badge
                            key={choiceId}
                            variant="secondary"
                            className="bg-gray-100 text-gray-700"
                          >
                            {mentorNameMap.get(choiceId) || "Unknown"}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      {mentee.matchedMentorName ? (
                        <span className="font-semibold text-emerald-600">
                          {mentee.matchedMentorName}
                        </span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          mentee.status === "Matched"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        )}
                      >
                        {mentee.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {matchingRun && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Unmatched Mentees
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unmatchedMentees.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {unmatchedMentees.map((mentee) => (
                          <li key={mentee.id}>{mentee.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        All mentees have been matched!
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Unassigned Mentors
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unassignedMentors.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {unassignedMentors.map((mentor) => (
                          <li key={mentor.id}>{mentor.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        All mentors have been assigned!
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900">
                      Mentors Not Chosen by Any Mentee
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {unchosenMentors.length > 0 ? (
                      <ul className="list-disc pl-5 space-y-1 text-gray-700">
                        {unchosenMentors.map((mentor) => (
                          <li key={mentor.id}>{mentor.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">
                        All mentors were chosen by at least one mentee.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
