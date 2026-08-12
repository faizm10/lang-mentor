"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { AlertCircle, Link2 } from "lucide-react";

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
          const mentorNameMap = new Map(
            (mentors ?? []).map((m) => [m.id, m.full_name] as const),
          );
          setMentorMap(mentorNameMap);
          const menteeNameMap = new Map(
            (mentees ?? []).map((m) => [m.id, m.first_name] as const),
          );
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

  const rows = assignments.map((row) => ({
    id: row.id,
    when: row.assigned_at
      ? new Date(row.assigned_at).toLocaleString()
      : "—",
    mentee: menteeMap.get(row.mentee_id) || row.mentee_id,
    mentor: row.mentor_id
      ? mentorMap.get(row.mentor_id) || row.mentor_id
      : "Unassigned",
  }));

  return (
    <div className="page-container space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Saved assignments
        </h2>
        <p className="prose-readable mt-1">
          Mentor–mentee pairings stored in the database.
        </p>
      </div>

      {error ? (
        <Card className="border-destructive/40 bg-destructive/5 py-4">
          <CardContent className="flex items-start gap-3 px-4">
            <AlertCircle
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle className="text-base font-semibold">Pairings</CardTitle>
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${rows.length} saved`}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4 sm:p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Link2
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-base font-semibold">No assignments yet</h3>
              <p className="prose-readable mt-1 max-w-sm">
                Run the matching system and save the pairings to see them here.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: stacked cards */}
              <ul className="divide-y divide-border md:hidden">
                {rows.map((row) => (
                  <li key={row.id} className="space-y-2 p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        Mentee
                      </span>
                      <span className="text-right text-sm font-semibold break-words">
                        {row.mentee}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        Mentor
                      </span>
                      <span className="text-right text-sm font-medium break-words">
                        {row.mentor}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-muted-foreground">
                        Assigned
                      </span>
                      <span className="text-right text-sm text-muted-foreground">
                        {row.when}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="px-5">Assigned at</TableHead>
                      <TableHead>Mentee name</TableHead>
                      <TableHead className="px-5">Mentor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="px-5 text-muted-foreground">
                          {row.when}
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.mentee}
                        </TableCell>
                        <TableCell className="px-5">{row.mentor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
