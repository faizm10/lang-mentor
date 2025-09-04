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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const [selectedMentee, setSelectedMentee] = useState<MenteePreferencesRow | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
      name: `${row.first_name} ${row.last_name}`,
      topChoices: [row.first_choice, row.second_choice, row.third_choice].filter(
        Boolean,
      ) as string[],
      menteeData: row, // Store the full mentee data for the dialog
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

  const handleMenteeClick = (mentee: typeof baseData[0]) => {
    setSelectedMentee(mentee.menteeData);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedMentee(null);
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

            {/* Mentee Registration Count */}
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Mentees</p>
                        <p className="text-2xl font-bold text-blue-900">{baseData.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Total Mentors</p>
                        <p className="text-2xl font-bold text-green-900">{mentors.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-purple-600">Matched Pairs</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {matchingRun ? matchingResults.filter(r => r.mentorId).length : 0}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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
                    <TableCell className="font-medium">
                      <button
                        onClick={() => handleMenteeClick(mentee)}
                        className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                      >
                        {mentee.name}
                      </button>
                    </TableCell>
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
                          <li key={mentee.id}>
                            <button
                              onClick={() => handleMenteeClick(mentee)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                            >
                              {mentee.name}
                            </button>
                          </li>
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

      {/* Mentee Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mentee Details</DialogTitle>
            <DialogDescription>
              Complete information submitted by {selectedMentee?.first_name} {selectedMentee?.last_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedMentee && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">First Name</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMentee.first_name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Last Name</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMentee.last_name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Student ID</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMentee.student_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMentee.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Program</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMentee.program}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Major</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedMentee.major}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Year</label>
                <p className="text-sm text-gray-900 mt-1">{selectedMentee.year}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Mentor Preferences</label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      1st Choice
                    </Badge>
                    <span className="text-sm text-gray-900">
                      {mentorNameMap.get(selectedMentee.first_choice) || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      2nd Choice
                    </Badge>
                    <span className="text-sm text-gray-900">
                      {mentorNameMap.get(selectedMentee.second_choice) || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      3rd Choice
                    </Badge>
                    <span className="text-sm text-gray-900">
                      {mentorNameMap.get(selectedMentee.third_choice) || "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedMentee.submitted_at && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted At</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedMentee.submitted_at).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
