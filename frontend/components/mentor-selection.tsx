"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  XCircle,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { fetchMentorProfiles, submitMenteePreferences } from "@/lib/db/actions";
import { MenteeData } from "./mentee-registration";

const MAX_SELECTIONS = 3;

// Transformed mentor data for the UI
interface MentorData {
  id: string;
  full_name: string;
  year: string;
  major: string;
  minor?: string;
  avatar: string;
  hobbies: string[];
  bio: string;
}

interface MentorSelectionProps {
  menteeData: MenteeData;
  onReset: () => void;
  onSubmissionComplete?: () => void;
}

/** Three dots showing how many of the required picks are filled. */
function SlotIndicator({ filled }: { filled: number }) {
  return (
    <span className="flex items-center gap-1.5" aria-hidden="true">
      {Array.from({ length: MAX_SELECTIONS }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "size-2.5 rounded-full transition-colors",
            i < filled ? "bg-primary" : "bg-border",
          )}
        />
      ))}
    </span>
  );
}

function MentorCardSkeleton() {
  return (
    <Card className="h-full gap-4">
      <CardHeader className="gap-0">
        <div className="flex items-center gap-3">
          <Skeleton className="size-12 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-10 w-full" />
      </CardFooter>
    </Card>
  );
}

export default function MentorSelection({
  menteeData,
  onReset,
  onSubmissionComplete,
}: MentorSelectionProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedMajor, setSelectedMajor] = useState<string>("");
  const [mentors, setMentors] = useState<MentorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedBios, setExpandedBios] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadMentors() {
      try {
        setLoading(true);
        setError(null);
        const profiles = await fetchMentorProfiles();
        const transformed: MentorData[] =
          profiles?.map((row, index) => {
            const fullName = row.full_name ?? `Student ${index + 1}`;
            const initials =
              fullName
                .split(" ")
                .map((n) => n.trim()[0])
                .filter(Boolean)
                .join("")
                .slice(0, 2)
                .toUpperCase() || `S${index + 1}`;

            return {
              id: row.id,
              full_name: fullName,
              year: row.year_of_study ?? "N/A",
              major: row.program_of_study ?? "Undeclared",
              minor: undefined,
              avatar: initials,
              hobbies: [], // Could be enriched later
              bio: row.mentor_description ?? "No description provided.",
            };
          }) ?? [];

        if (!cancelled) setMentors(transformed);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Failed to load mentor profiles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMentors();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= MAX_SELECTIONS) {
        toast(`You can only choose ${MAX_SELECTIONS} mentors`, {
          description: "Deselect one before picking another.",
        });
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleBio = (id: string) => {
    setExpandedBios((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelections = () => setSelectedIds([]);

  const handleSubmit = () => {
    if (selectedIds.length !== MAX_SELECTIONS) {
      toast(`Please select exactly ${MAX_SELECTIONS} mentors to continue`);
      return;
    }
    // Seed the ranking from the current selection each time the dialog opens.
    setPreferences(selectedIds);
    setIsFormOpen(true);
  };

  const movePreferenceUp = (index: number) => {
    if (index <= 0) return;
    setPreferences((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const movePreferenceDown = (index: number) => {
    setPreferences((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (preferences.length !== MAX_SELECTIONS) {
      toast("Please confirm your top 3 order.");
      return;
    }
    setIsSaving(true);
    try {
      const [first, second, third] = preferences;
      const { error } = await submitMenteePreferences({
        first_name: menteeData.firstName,
        last_name: menteeData.lastName,
        student_id: parseInt(menteeData.studentId),
        email: menteeData.email,
        program: menteeData.program,
        major: menteeData.major,
        year: menteeData.year,
        first_choice: first,
        second_choice: second,
        third_choice: third,
      });
      if (error) {
        console.error(error);
        toast.error("Submission failed. Please try again.");
        return;
      }
      setIsFormOpen(false);
      setIsSubmitted(true);
      onSubmissionComplete?.();
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedMajor("");
    setSortBy("name");
    setSortOrder("asc");
  };

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    (selectedMajor !== "" && selectedMajor !== "all-majors");

  const uniqueMajors = useMemo(() => {
    const majors = new Set<string>();
    mentors.forEach((m) => majors.add(m.major));
    return Array.from(majors).sort();
  }, [mentors]);

  const displayedStudents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const filtered = mentors.filter((student) => {
      const name = (student.full_name || "").toLowerCase();
      const major = (student.major || "").toLowerCase();
      const bio = (student.bio || "").toLowerCase();
      const hobbiesMatch =
        Array.isArray(student.hobbies) &&
        student.hobbies.some((h) => (h || "").toLowerCase().includes(query));

      const matchesSearch =
        !query ||
        name.includes(query) ||
        major.includes(query) ||
        bio.includes(query) ||
        hobbiesMatch;

      const matchesMajor =
        selectedMajor === "" ||
        selectedMajor === "all-majors" ||
        student.major === selectedMajor;

      return matchesSearch && matchesMajor;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === "name") {
        compareValue = (a.full_name || "").localeCompare(b.full_name || "");
      } else if (sortBy === "year") {
        const yearOrder: Record<string, number> = {
          Senior: 4,
          Junior: 3,
          Sophomore: 2,
          Freshman: 1,
          "1st Year": 1,
          "2nd Year": 2,
          "3rd Year": 3,
          "4th Year": 4,
          "N/A": 0,
          Undeclared: 0,
        };
        compareValue = (yearOrder[a.year] ?? 0) - (yearOrder[b.year] ?? 0);
      }
      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [searchQuery, sortBy, sortOrder, selectedMajor, mentors]);

  if (isSubmitted) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary">
              <Check
                className="size-8 text-primary-foreground"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Selection complete
            </h2>
            <p className="prose-readable mt-3">
              Your mentor selections have been submitted successfully.
              We&apos;ll do our best to match you with one of your top choices.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md text-center">
          <CardContent className="flex flex-col items-center">
            <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="size-8 text-destructive" aria-hidden="true" />
            </div>
            <h2 className="text-xl font-semibold">Something went wrong</h2>
            <p className="prose-readable mt-2">{error}</p>
            <Button onClick={() => location.reload()} className="mt-6">
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedNames = selectedIds
    .map((id) => mentors.find((m) => m.id === id)?.full_name)
    .filter(Boolean)
    .join(", ");

  const isComplete = selectedIds.length === MAX_SELECTIONS;

  return (
    <div className="flex flex-1 flex-col">
      <div className="page-container flex-1 pb-32">
        {/* Page heading */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Registered as{" "}
              <span className="font-medium text-foreground">
                {menteeData.firstName} {menteeData.lastName}
              </span>
            </p>
            <Button variant="outline" size="sm" onClick={onReset}>
              Edit my details
            </Button>
          </div>

          <div className="max-w-3xl">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
              LSA Mentorship Program — Mentor Bank
            </h1>
            <p className="prose-readable mt-3">
              Read through the mentor bios and choose the{" "}
              <span className="font-medium text-foreground">
                {MAX_SELECTIONS} mentors
              </span>{" "}
              who best align with your passions, interests, goals, and
              personality. You&apos;ll rank them in order on the next step.
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6 gap-4 py-4 sm:mb-8 sm:py-5">
          <CardHeader className="gap-0 px-4 sm:px-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal
                className="size-4 text-muted-foreground"
                aria-hidden="true"
              />
              <h2 className="text-sm font-semibold">Search and filter</h2>
            </div>
          </CardHeader>

          <CardContent className="px-4 sm:px-5">
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  placeholder="Search by name, program, or bio…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  aria-label="Search mentors"
                  type="search"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                  <SelectTrigger
                    className="w-full"
                    aria-label="Filter by program"
                  >
                    <SelectValue placeholder="All programs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-majors">All programs</SelectItem>
                    {uniqueMajors.map((major) => (
                      <SelectItem key={major} value={major}>
                        {major}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full" aria-label="Sort by">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Sort by name</SelectItem>
                    <SelectItem value="year">Sort by year</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() =>
                      setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                    }
                    aria-label={`Sort order: ${
                      sortOrder === "asc" ? "ascending" : "descending"
                    }`}
                  >
                    {sortOrder === "asc" ? (
                      <ArrowUp className="size-4" />
                    ) : (
                      <ArrowDown className="size-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    disabled={!hasActiveFilters}
                    className="shrink-0"
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground" aria-live="polite">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {displayedStudents.length}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {mentors.length}
                </span>{" "}
                mentors
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MentorCardSkeleton key={i} />
            ))}
          </div>
        ) : displayedStudents.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {displayedStudents.map((student) => {
              const isSelected = selectedIds.includes(student.id);
              const isDisabled = !isSelected && isComplete;
              const isExpanded = expandedBios.has(student.id);
              const isLongBio = student.bio.length > 220;

              return (
                <Card
                  key={student.id}
                  onClick={() => !isDisabled && toggleSelection(student.id)}
                  className={cn(
                    "h-full gap-4 py-5 transition-shadow",
                    isSelected
                      ? "border-primary ring-2 ring-primary/25"
                      : "hover:shadow-md",
                    isDisabled ? "opacity-55" : "cursor-pointer",
                  )}
                >
                  <CardHeader className="gap-0 px-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                        aria-hidden="true"
                      >
                        {isSelected ? (
                          <Check className="size-5" />
                        ) : (
                          student.avatar
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          id={`mentor-${student.id}-name`}
                          className="text-base font-semibold break-words sm:text-lg"
                        >
                          {student.full_name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {student.year} · {student.major}
                          {student.minor ? ` · Minor: ${student.minor}` : ""}
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 px-5">
                    {student.hobbies.length > 0 ? (
                      <div className="mb-3 flex flex-wrap gap-1.5">
                        {student.hobbies.map((hobby, idx) => (
                          <Badge
                            key={`${student.id}-${hobby}-${idx}`}
                            variant="secondary"
                            className="rounded-full font-normal"
                          >
                            {hobby}
                          </Badge>
                        ))}
                      </div>
                    ) : null}

                    <p
                      className={cn(
                        "text-sm leading-relaxed text-muted-foreground",
                        !isExpanded && "line-clamp-5",
                      )}
                    >
                      {student.bio}
                    </p>

                    {isLongBio ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBio(student.id);
                        }}
                        className="mt-2 rounded text-sm font-medium text-primary hover:underline"
                        aria-expanded={isExpanded}
                      >
                        {isExpanded ? "Show less" : "Read full bio"}
                      </button>
                    ) : null}
                  </CardContent>

                  <CardFooter className="px-5">
                    <Button
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      className="w-full"
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                      aria-labelledby={`mentor-${student.id}-name`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleSelection(student.id);
                      }}
                    >
                      {isSelected ? (
                        <>
                          <Check aria-hidden="true" />
                          Selected
                        </>
                      ) : isDisabled ? (
                        "3 already chosen"
                      ) : (
                        "Select mentor"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-12">
            <CardContent className="flex flex-col items-center text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <Users
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-base font-semibold">No mentors found</h3>
              <p className="prose-readable mt-1 max-w-sm">
                Try a different search term or clear your filters.
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="mt-5"
                >
                  Clear filters
                </Button>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky selection bar */}
      {selectedIds.length > 0 ? (
        <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
          <div className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 sm:py-4 lg:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <SlotIndicator filled={selectedIds.length} />
                  <p className="text-sm font-semibold">
                    {selectedIds.length} of {MAX_SELECTIONS} selected
                  </p>
                </div>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {selectedNames}
                </p>
              </div>

              <div className="flex items-center gap-2 sm:shrink-0">
                <Button
                  variant="ghost"
                  onClick={clearSelections}
                  className="flex-1 sm:flex-none"
                >
                  Clear all
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!isComplete}
                  className="flex-1 sm:flex-none sm:px-6"
                >
                  {isComplete
                    ? "Review and submit"
                    : `Pick ${MAX_SELECTIONS - selectedIds.length} more`}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Ranking + confirmation dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rank your choices</DialogTitle>
            <DialogDescription>
              Put your favourite mentor first. We&apos;ll try to match you with
              your highest-ranked available choice.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="space-y-2">
              {preferences.map((id, index) => {
                const mentorName =
                  mentors.find((m) => m.id === id)?.full_name || "Unknown";
                return (
                  <div
                    key={id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                        {index + 1}
                      </span>
                      <span className="truncate text-sm font-medium">
                        {mentorName}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => movePreferenceUp(index)}
                        disabled={index === 0}
                        aria-label={`Move ${mentorName} up`}
                      >
                        <ArrowUp className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => movePreferenceDown(index)}
                        disabled={index === preferences.length - 1}
                        aria-label={`Move ${mentorName} down`}
                      >
                        <ArrowDown className="size-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3 rounded-lg bg-muted/50 p-4">
              <Label className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Submitting as
              </Label>
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="font-medium break-words">
                    {menteeData.firstName} {menteeData.lastName}
                  </dd>
                </div>
                <div className="flex justify-between gap-2 sm:block">
                  <dt className="text-muted-foreground">Student ID</dt>
                  <dd className="font-medium">{menteeData.studentId}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:col-span-2 sm:block">
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="font-medium break-all">{menteeData.email}</dd>
                </div>
                <div className="flex justify-between gap-2 sm:col-span-2 sm:block">
                  <dt className="text-muted-foreground">Program</dt>
                  <dd className="font-medium break-words">
                    {menteeData.program} · {menteeData.major} · {menteeData.year}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsFormOpen(false)}
              disabled={isSaving}
            >
              Back
            </Button>
            <Button onClick={handleFinalSubmit} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Submitting…
                </>
              ) : (
                "Submit my choices"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
