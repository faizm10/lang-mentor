"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMentorProfiles, type MentorProfileRow } from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, ExternalLink, Search, Users } from "lucide-react";

function initialsOf(name: string) {
  return (
    (name || "?")
      .split(" ")
      .map((p) => p.trim()[0])
      .filter(Boolean)
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function MentorCardSkeleton() {
  return (
    <Card className="py-5">
      <CardContent className="space-y-3 px-5">
        <div className="flex items-center gap-3">
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </CardContent>
    </Card>
  );
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<MentorProfileRow | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchMentorProfiles();
        if (!cancelled) setMentors(data ?? []);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load mentors.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter((m) =>
      [m.full_name, m.email, m.program_of_study, m.mentor_description]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q)),
    );
  }, [mentors, query]);

  return (
    <div className="page-container space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Mentors
        </h2>
        <p className="prose-readable mt-1">
          Everyone currently available in the Mentor Bank.
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-sm sm:flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="Search mentors…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search mentors"
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading
            ? "Loading…"
            : `${filtered.length} of ${mentors.length} mentors`}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <MentorCardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center text-center">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
              <Users
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-base font-semibold">
              {mentors.length === 0 ? "No mentors yet" : "No matches"}
            </h3>
            <p className="prose-readable mt-1 max-w-sm">
              {mentors.length === 0
                ? "Add a mentor to get started."
                : "Try a different search term."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m) => (
            <Card key={m.id} className="h-full gap-3 py-5">
              <CardHeader className="gap-0 px-5">
                <div className="flex items-start gap-3">
                  <span
                    className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground"
                    aria-hidden="true"
                  >
                    {initialsOf(m.full_name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <CardTitle className="text-base font-semibold break-words">
                        {m.full_name}
                      </CardTitle>
                      {m.pronouns ? (
                        <Badge variant="secondary" className="font-normal">
                          {m.pronouns}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {m.email}
                    </p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 space-y-3 px-5">
                <dl className="space-y-1 text-sm">
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Program</dt>
                    <dd className="break-words">
                      {m.program_of_study || "—"}
                    </dd>
                  </div>
                  <div className="flex gap-2">
                    <dt className="shrink-0 text-muted-foreground">Year</dt>
                    <dd className="break-words">{m.year_of_study || "—"}</dd>
                  </div>
                </dl>

                {m.mentor_description ? (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                    {m.mentor_description}
                  </p>
                ) : null}

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelected(m)}
                >
                  View details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Readable detail view — replaces the raw JSON dump */}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => !open && setSelected(null)}
      >
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="break-words">
              {selected?.full_name}
            </DialogTitle>
            <DialogDescription className="break-all">
              {selected?.email}
            </DialogDescription>
          </DialogHeader>

          {selected ? (
            <div className="space-y-5">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Pronouns</dt>
                  <dd className="mt-0.5 font-medium">
                    {selected.pronouns || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Year of study</dt>
                  <dd className="mt-0.5 font-medium break-words">
                    {selected.year_of_study || "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Program of study</dt>
                  <dd className="mt-0.5 font-medium break-words">
                    {selected.program_of_study || "—"}
                  </dd>
                </div>
              </dl>

              <div>
                <p className="text-sm text-muted-foreground">Mentor bio</p>
                <p className="mt-1 text-sm leading-relaxed">
                  {selected.mentor_description || "No description provided."}
                </p>
              </div>

              {selected.linkedin_url ? (
                <Button variant="outline" size="sm" asChild>
                  <a
                    href={selected.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink aria-hidden="true" />
                    LinkedIn profile
                  </a>
                </Button>
              ) : null}

              {selected.created_at ? (
                <p className="text-sm text-muted-foreground">
                  Added {new Date(selected.created_at).toLocaleString()}
                </p>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
