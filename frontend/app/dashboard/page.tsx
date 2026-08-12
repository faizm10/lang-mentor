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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Handshake,
  Loader2,
  UserRound,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchMenteePreferences,
  fetchMentorProfiles,
  fetchMentorNamesByIds,
  type MenteePreferencesRow,
  type MentorProfileRow,
  saveMentorAssignments,
} from "@/lib/db/actions";

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  loading?: boolean;
}) {
  return (
    <Card className="py-4 sm:py-5">
      <CardContent className="px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand-subtle-foreground">
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{label}</p>
            {loading ? (
              <Skeleton className="mt-1 h-7 w-10" />
            ) : (
              <p className="text-2xl leading-tight font-bold tabular-nums">
                {value}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Bulleted name list used by the post-matching summary cards. */
function NameList({
  items,
  emptyLabel,
}: {
  items: { id: string; label: string; onClick?: () => void }[];
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-border text-sm">
      {items.map((item) => (
        <li key={item.id} className="py-2 first:pt-0 last:pb-0">
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              className="rounded text-left font-medium text-primary hover:underline"
            >
              {item.label}
            </button>
          ) : (
            <span className="break-words">{item.label}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

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
  const [selectedMentee, setSelectedMentee] =
    useState<MenteePreferencesRow | null>(null);
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
        // Ensure we have names for all mentor IDs referenced by mentee choices
        const choiceIds = new Set<string>();
        (p ?? []).forEach((row) => {
          if (row.first_choice) choiceIds.add(row.first_choice);
          if (row.second_choice) choiceIds.add(row.second_choice);
          if (row.third_choice) choiceIds.add(row.third_choice);
        });
        const knownIds = new Set((m ?? []).map((mm) => mm.id));
        const missingIds = Array.from(choiceIds).filter(
          (id) => !knownIds.has(id),
        );
        let backfill: { id: string; full_name: string }[] = [];
        if (missingIds.length > 0) {
          backfill = await fetchMentorNamesByIds(missingIds);
        }
        const mergedMentors: MentorProfileRow[] = [
          ...(m ?? []),
          ...backfill.map(
            (b) =>
              ({
                id: b.id,
                created_at: null,
                pronouns: null,
                year_of_study: null,
                program_of_study: null,
                mentor_description: null,
                linkedin_url: null,
                full_name: b.full_name,
                email: "",
              }) as MentorProfileRow,
          ),
        ];
        if (!cancelled) {
          setPrefs(p ?? []);
          setMentors(mergedMentors);
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
    const entries: [string, string][] = [];
    for (const m of mentors) {
      if (m.id) entries.push([m.id, m.full_name]);
      // Some historical mentee choices might reference the linked users.id
      // Include that mapping when available to resolve names.
      if (m.user_id) entries.push([m.user_id, m.full_name]);
    }
    return new Map(entries);
  }, [mentors]);

  const baseData = useMemo(() => {
    return prefs.map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      topChoices: [
        row.first_choice,
        row.second_choice,
        row.third_choice,
      ].filter(Boolean) as string[],
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
        toast.error("Failed to save pairings. Please try again.");
        return;
      }
      toast.success(`Saved ${valid.length} pairings.`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMenteeClick = (mentee: (typeof baseData)[0]) => {
    setSelectedMentee(mentee.menteeData);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedMentee(null);
  };

  const matchedCount = matchingRun
    ? matchingResults.filter((r) => r.mentorId).length
    : 0;

  return (
    <div className="page-container space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Mentee matching
        </h2>
        <p className="prose-readable mt-1">
          Review mentee submissions, run the matching system, and save the
          resulting pairings.
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

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Total mentees"
          value={baseData.length}
          icon={UserRound}
          loading={loading}
        />
        <StatCard
          label="Total mentors"
          value={mentors.length}
          icon={Users}
          loading={loading}
        />
        <StatCard
          label="Matched pairs"
          value={matchedCount}
          icon={Handshake}
          loading={loading}
        />
      </div>

      {/* Actions */}
      <Card className="py-4 sm:py-5">
        <CardContent className="px-4 sm:px-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold">Matching system</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {matchingRun
                  ? "Matching complete — review the results below."
                  : "Assigns each mentee their highest available choice."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
              <Button
                onClick={handleRunMatching}
                disabled={
                  matchingRun || loading || !!error || baseData.length === 0
                }
              >
                {matchingRun ? "Matching run" : "Run matching system"}
              </Button>
              {matchingRun ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handlePairRemaining}
                    disabled={
                      unmatchedMentees.length === 0 ||
                      unassignedMentors.length === 0
                    }
                  >
                    Pair remaining
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={handleSavePairings}
                    disabled={
                      isSaving || matchingResults.every((r) => !r.mentorId)
                    }
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="animate-spin" aria-hidden="true" />
                        Saving…
                      </>
                    ) : (
                      "Save pairings"
                    )}
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submissions */}
      <Card className="gap-0 overflow-hidden py-0">
        <CardHeader className="border-b px-4 py-4 sm:px-5">
          <CardTitle className="text-base font-semibold">
            Mentee submissions
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {loading
              ? "Loading submissions…"
              : `${displayData.length} submitted`}
          </p>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4 sm:p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : displayData.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted-foreground">
              No mentee submissions yet.
            </p>
          ) : (
            <>
              {/* Mobile: stacked cards — tables are unreadable at this width */}
              <ul className="divide-y divide-border md:hidden">
                {displayData.map((mentee) => (
                  <li key={mentee.id} className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => handleMenteeClick(mentee)}
                        className="rounded text-left text-sm font-semibold text-primary hover:underline"
                      >
                        {mentee.name}
                      </button>
                      <Badge
                        variant="secondary"
                        className={cn(
                          "shrink-0",
                          mentee.status === "Matched"
                            ? "bg-brand-subtle text-brand-subtle-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {mentee.status}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <p className="text-muted-foreground">Top 3 choices</p>
                      <div className="flex flex-wrap gap-1.5">
                        {mentee.topChoices.map((choiceId) => (
                          <Badge
                            key={choiceId}
                            variant="secondary"
                            className="font-normal"
                          >
                            {mentorNameMap.get(choiceId) || "Unknown"}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="text-muted-foreground">Matched with</span>
                      <span
                        className={cn(
                          "text-right font-medium",
                          mentee.matchedMentorName
                            ? "text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {mentee.matchedMentorName ?? "—"}
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
                      <TableHead className="px-5">Mentee name</TableHead>
                      <TableHead>Top 3 choices</TableHead>
                      <TableHead>Matched mentor</TableHead>
                      <TableHead className="px-5">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayData.map((mentee) => (
                      <TableRow key={mentee.id}>
                        <TableCell className="px-5 font-medium">
                          <button
                            type="button"
                            onClick={() => handleMenteeClick(mentee)}
                            className="rounded text-primary hover:underline"
                          >
                            {mentee.name}
                          </button>
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <div className="flex flex-wrap gap-1.5">
                            {mentee.topChoices.map((choiceId) => (
                              <Badge
                                key={choiceId}
                                variant="secondary"
                                className="font-normal"
                              >
                                {mentorNameMap.get(choiceId) || "Unknown"}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {mentee.matchedMentorName ? (
                            <span className="font-medium">
                              {mentee.matchedMentorName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="px-5">
                          <Badge
                            variant="secondary"
                            className={cn(
                              mentee.status === "Matched"
                                ? "bg-brand-subtle text-brand-subtle-foreground"
                                : "bg-muted text-muted-foreground",
                            )}
                          >
                            {mentee.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Post-matching summary */}
      {matchingRun ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="py-4 sm:py-5">
            <CardHeader className="px-4 sm:px-5">
              <CardTitle className="text-base font-semibold">
                Unmatched mentees
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-5">
              <NameList
                items={unmatchedMentees.map((m) => ({
                  id: m.id,
                  label: m.name,
                  onClick: () => handleMenteeClick(m),
                }))}
                emptyLabel="All mentees have been matched."
              />
            </CardContent>
          </Card>

          <Card className="py-4 sm:py-5">
            <CardHeader className="px-4 sm:px-5">
              <CardTitle className="text-base font-semibold">
                Unassigned mentors
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-5">
              <NameList
                items={unassignedMentors.map((m) => ({
                  id: m.id,
                  label: m.full_name,
                }))}
                emptyLabel="All mentors have been assigned."
              />
            </CardContent>
          </Card>

          <Card className="py-4 md:col-span-2 sm:py-5">
            <CardHeader className="px-4 sm:px-5">
              <CardTitle className="text-base font-semibold">
                Mentors not chosen by any mentee
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-5">
              <NameList
                items={unchosenMentors.map((m) => ({
                  id: m.id,
                  label: m.full_name,
                }))}
                emptyLabel="All mentors were chosen by at least one mentee."
              />
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Mentee details dialog */}
      <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mentee details</DialogTitle>
            <DialogDescription>
              Full information submitted by {selectedMentee?.first_name}{" "}
              {selectedMentee?.last_name}
            </DialogDescription>
          </DialogHeader>

          {selectedMentee ? (
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">First name</dt>
                  <dd className="mt-0.5 font-medium break-words">
                    {selectedMentee.first_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last name</dt>
                  <dd className="mt-0.5 font-medium break-words">
                    {selectedMentee.last_name}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Student ID</dt>
                  <dd className="mt-0.5 font-medium">
                    {selectedMentee.student_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Year</dt>
                  <dd className="mt-0.5 font-medium">{selectedMentee.year}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="mt-0.5 font-medium break-all">
                    {selectedMentee.email}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Program</dt>
                  <dd className="mt-0.5 font-medium break-words">
                    {selectedMentee.program}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Major</dt>
                  <dd className="mt-0.5 font-medium break-words">
                    {selectedMentee.major}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="text-sm font-medium">Mentor preferences</p>
                <ol className="mt-2 space-y-2">
                  {[
                    selectedMentee.first_choice,
                    selectedMentee.second_choice,
                    selectedMentee.third_choice,
                  ].map((choiceId, index) => (
                    <li
                      key={`${choiceId}-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-border p-2.5"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="text-sm break-words">
                        {mentorNameMap.get(choiceId) || "Unknown"}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>

              {selectedMentee.submitted_at ? (
                <p className="text-sm text-muted-foreground">
                  Submitted{" "}
                  {new Date(selectedMentee.submitted_at).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
