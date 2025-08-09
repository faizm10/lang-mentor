"use client";

import { cn } from "@/lib/utils";

import { useEffect, useMemo, useState } from "react";
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
import {
  fetchMenteePreferences,
  fetchMentorProfiles,
  type MenteePreferencesRow,
  type MentorProfileRow,
    saveMentorAssignments,
} from "@/lib/supabase/client";

export default function Dashboard() {
  const [prefs, setPrefs] = useState<MenteePreferencesRow[]>([]);
  const [mentors, setMentors] = useState<MentorProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [matchingRun, setMatchingRun] = useState(false);
  const [matchingResults, setMatchingResults] = useState<
    { menteeId: string; mentorId: string | null }[]
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const [p, m] = await Promise.all([
          fetchMenteePreferences(),
          fetchMentorProfiles(),
        ]);
        if (!cancelled) {
          setPrefs(p ?? []);
          setMentors(m ?? []);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load submissions.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const mentorNameMap = useMemo(() => {
    return new Map(mentors.map((m) => [m.id, m.full_name] as const));
  }, [mentors]);

  const baseData = useMemo(() => {
    return prefs.map((row) => ({
      id: row.id,
      name: row.full_name,
      topChoices: [row.first_choice, row.second_choice, row.third_choice].filter(
        Boolean,
      ) as string[],
    }));
  }, [prefs]);

  const handleRunMatching = () => {
    const mentorIds = new Set(mentors.map((m) => m.id));
    const assigned = new Set<string>();
    const results: { menteeId: string; mentorId: string | null }[] = [];
    for (const mentee of baseData) {
      let matched: string | null = null;
      for (const choiceId of mentee.topChoices) {
        if (mentorIds.has(choiceId) && !assigned.has(choiceId)) {
          matched = choiceId;
          assigned.add(choiceId);
          break;
        }
      }
      results.push({ menteeId: mentee.id, mentorId: matched });
    }
    setMatchingResults(results);
    setMatchingRun(true);
  };

  const displayData = useMemo(() => {
    return baseData.map((mentee) => {
      const match = matchingResults.find((r) => r.menteeId === mentee.id);
      const matchedMentorId = match?.mentorId ?? null;
      const matchedMentorName = matchedMentorId
        ? mentorNameMap.get(matchedMentorId) || null
        : null;
      const status = matchedMentorName ? "Matched" : "Unmatched";
      return { ...mentee, matchedMentorName, status } as const;
    });
  }, [baseData, matchingResults, mentorNameMap]);

  const unmatchedMentees = useMemo(() => {
    return displayData.filter((r) => r.status === "Unmatched");
  }, [displayData]);

  const unassignedMentors = useMemo(() => {
    if (!matchingRun) return [] as MentorProfileRow[];
    const assignedIds = new Set(
      matchingResults.map((r) => r.mentorId).filter(Boolean) as string[],
    );
    return mentors.filter((m) => !assignedIds.has(m.id));
  }, [matchingResults, mentors, matchingRun]);

  const unchosenMentors = useMemo(() => {
    const chosen = new Set<string>();
    baseData.forEach((m) => m.topChoices.forEach((c) => chosen.add(c)));
    return mentors.filter((m) => !chosen.has(m.id));
  }, [baseData, mentors]);

  const handlePairRemaining = () => {
    if (!matchingRun) return;
    if (unmatchedMentees.length === 0 || unassignedMentors.length === 0) return;

    const mentorQueue = [...unassignedMentors].map((m) => m.id);
    if (mentorQueue.length === 0) return;

    const updated = matchingResults.map((mr) => ({ ...mr }));
    for (const mentee of unmatchedMentees) {
      const nextMentorId = mentorQueue.shift();
      if (!nextMentorId) break;
      const idx = updated.findIndex((r) => r.menteeId === mentee.id);
      if (idx >= 0) {
        updated[idx].mentorId = nextMentorId;
      } else {
        updated.push({ menteeId: mentee.id, mentorId: nextMentorId });
      }
    }
    setMatchingResults(updated);
  };

  const handleSavePairings = async () => {
    if (!matchingRun) return;
    const valid = matchingResults.filter((r) => r.mentorId);
    if (valid.length === 0) return;
    setIsSaving(true);
    try {
      const payload = valid.map((r) => ({
        mentor_id: r.mentorId as string,
        mentee_id: r.menteeId,
        assigned_by: null,
      }));
      const { error } = await saveMentorAssignments(payload);
      if (error) {
        console.error(error);
        alert("Failed to save pairings. Please try again.");
        return;
      }
      alert("Pairings saved successfully.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Mentee Matching Dashboard
            </CardTitle>
            <p className="text-gray-600">View mentee choices from Supabase.</p>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-gray-500 text-sm mb-4">Loading submissions…</p>
            )}
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}
            <div className="mb-6">
              <Button
                onClick={handleRunMatching}
                disabled={matchingRun || loading || !!error || baseData.length === 0}
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
                            : "bg-red-100 text-red-700",
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
              <div className="mt-8">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <Button
                    onClick={handlePairRemaining}
                    disabled={unmatchedMentees.length === 0 || unassignedMentors.length === 0}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Pair Remaining Unmatched
                  </Button>
                  <Button
                    onClick={handleSavePairings}
                    disabled={isSaving || !matchingRun || matchingResults.every((r) => !r.mentorId)}
                    className="bg-gray-900 hover:bg-black text-white"
                  >
                    {isSaving ? "Saving…" : "Save Pairings"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-gray-500">All mentees have been matched!</p>
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
                          <li key={mentor.id}>{mentor.full_name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500">All mentors have been assigned!</p>
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
                          <li key={mentor.id}>{mentor.full_name}</li>
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
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
