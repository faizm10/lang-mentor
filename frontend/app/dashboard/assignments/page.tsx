"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchMentorProfiles,
  fetchMenteePreferences,
  fetchMentorAssignments,
  type MentorAssignmentRow,
} from "@/lib/db/actions";

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<MentorAssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentorMap, setMentorMap] = useState<Map<string, string>>(new Map());
  const [menteeMap, setMenteeMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);

        const [assignData, mentors, mentees] = await Promise.all([
          fetchMentorAssignments(),
          fetchMentorProfiles(),
          fetchMenteePreferences(),
        ]);

        if (!cancelled) {
          setAssignments(assignData);
          const mentorNameMap = new Map((mentors ?? []).map((m) => [m.id, m.full_name] as const));
          setMentorMap(mentorNameMap);
          const menteeNameMap = new Map((mentees ?? []).map((m) => [m.id, m.first_name] as const));
          setMenteeMap(menteeNameMap);
        }
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load assignments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Saved Assignments
            </CardTitle>
            <p className="text-gray-600">Pairings stored in the database.</p>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-gray-500 text-sm mb-4">Loading…</p>
            )}
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assigned At</TableHead>
                  <TableHead>Mentee Name</TableHead>
                  <TableHead>Mentor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">
                      {row.assigned_at ? new Date(row.assigned_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>{menteeMap.get(row.mentee_id) || row.mentee_id}</TableCell>
                    <TableCell>
                      {row.mentor_id ? mentorMap.get(row.mentor_id) || row.mentor_id : "Unassigned"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {assignments.length === 0 && !loading && !error && (
              <p className="text-gray-500 text-sm mt-4">No assignments found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


