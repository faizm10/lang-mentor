"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  fetchMentorProfiles,
  submitMenteePreferences,
} from "@/lib/supabase/client";
import { MenteeData } from "./mentee-registration";

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

export default function MentorSelection({ menteeData, onReset, onSubmissionComplete }: MentorSelectionProps) {
  // State management for UI and selection (client state is appropriate here) [^1]
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

  useEffect(() => {
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

        setMentors(transformed);
      } catch (e) {
        console.error(e);
        setError("Failed to load mentor profiles.");
      } finally {
        setLoading(false);
      }
    }

    loadMentors();
  }, []);

  const toggleSelection = (
    id: string,
    nextValue?: boolean | "indeterminate"
  ) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(id);
      const shouldSelect =
        typeof nextValue === "boolean" ? nextValue : !isSelected;

      if (shouldSelect) {
        if (prev.length >= 3) {
          toast("Please select exactly 3 students to continue");
          return prev;
        }
        return [...prev, id];
      } else {
        return prev.filter((x) => x !== id);
      }
    });
  };

  const clearSelections = () => setSelectedIds([]);

  const handleSubmit = () => {
    if (selectedIds.length === 3) {
      setIsFormOpen(true);
    } else {
      toast("Please select exactly 3 students to continue");
    }
  };

  // Keep preferences in sync with current selection when it reaches 3
  useEffect(() => {
    if (selectedIds.length === 3) {
      setPreferences(selectedIds);
    } else if (preferences.length !== 0) {
      setPreferences([]);
    }
  }, [selectedIds]);

  const movePreferenceUp = (index: number) => {
    if (index <= 0) return;
    setPreferences((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const movePreferenceDown = (index: number) => {
    if (index >= preferences.length - 1) return;
    setPreferences((prev) => {
      const next = [...prev];
      [next[index + 1], next[index]] = [next[index], next[index + 1]];
      return next;
    });
  };

  const handleFinalSubmit = async () => {
    if (preferences.length !== 3) {
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
        toast("Submission failed. Please try again.");
        return;
      }
      setIsFormOpen(false);
      setIsSubmitted(true);
      if (onSubmissionComplete) {
        onSubmissionComplete();
      }
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Card className="max-w-md w-full p-8 text-center shadow-lg">
          <CardContent className="flex flex-col items-center justify-center p-0">
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Selection Complete!
            </h2>
            <p className="text-gray-600 mb-4 leading-relaxed">
              Your student selections have been submitted successfully.
            </p>
            {/* <p className="text-sm text-gray-500">
              You’ll receive a confirmation email within 24 hours to connect
              with your peers.
            </p> */}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
        <p className="mt-4 text-lg text-gray-600">Loading mentors…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-lg text-red-600">{error}</p>
        <Button onClick={() => location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  const selectedNames = selectedIds
    .map((id) => mentors.find((m) => m.id === id)?.full_name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col">
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <div className="flex justify-end mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={onReset}
                className="text-gray-600 hover:text-gray-800"
              >
                Change Registration Info
              </Button>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              LSA Mentorship Program - Mentor Bank
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Browse our Mentor Bank and select your top 3 choices. Read through the mentor bios and choose mentors who best
              align with your passions, interests, goals, and personality. We’ll
              do our best to match you with one of your top choices
            </p>
          </div>

          {/* Filters */}
          <Card className="mb-8 max-w-4xl mx-auto border-gray-200">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                </div>
                <h2 className="text-base font-semibold text-gray-900">
                  Search and filters
                </h2>
              </div>

              <div className="flex flex-col gap-4">
                <div className="relative">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
                    aria-hidden="true"
                  />
                  <Input
                    placeholder="Search by name, bio, or hobbies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    aria-label="Search mentors"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                  <Select
                    value={selectedMajor}
                    onValueChange={setSelectedMajor}
                  >
                    <SelectTrigger
                      className="w-full sm:w-[220px]"
                      aria-label="Filter by major"
                    >
                      <SelectValue placeholder="Filter by Major" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all-majors">All Majors</SelectItem>
                      {uniqueMajors.map((major) => (
                        <SelectItem key={major} value={major}>
                          {major}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger
                      className="w-full sm:w-[220px]"
                      aria-label="Sort by"
                    >
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="year">Year</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
                      }
                      aria-label={`Sort order: ${
                        sortOrder === "asc" ? "Ascending" : "Descending"
                      }`}
                    >
                      {sortOrder === "asc" ? (
                        <ArrowUp className="h-4 w-4" />
                      ) : (
                        <ArrowDown className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleClearFilters}
                      aria-label="Clear all filters"
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50 bg-transparent"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-sm text-gray-500">
                  {"Showing "}
                  <span className="font-medium text-gray-700">
                    {displayedStudents.length}
                  </span>
                  {" of "}
                  <span className="font-medium text-gray-700">
                    {mentors.length}
                  </span>
                  {" students"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
            {displayedStudents.length > 0 ? (
              displayedStudents.map((student) => {
                const isSelected = selectedIds.includes(student.id);
                const isDisabled = !isSelected && selectedIds.length >= 3;

                return (
                  <Card
                    key={student.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    className={cn(
                      "relative transition-all duration-200 cursor-pointer h-full flex flex-col focus:outline-none",
                      "hover:shadow-lg",
                      isSelected
                        ? "border-emerald-500 shadow-md ring-2 ring-emerald-200"
                        : "border-gray-200",
                      isDisabled && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={() => !isDisabled && toggleSelection(student.id)}
                    onKeyDown={(e) => {
                      if ((e.key === "Enter" || e.key === " ") && !isDisabled) {
                        e.preventDefault();
                        toggleSelection(student.id);
                      }
                    }}
                  >
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold text-gray-700 shrink-0">
                          {student.avatar}
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {student.full_name}
                          </h3>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {student.year} – {student.major}
                            {student.minor ? ` / Minor: ${student.minor}` : ""}
                          </p>
                        </div>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        className="border-2 w-5 h-5"
                        onCheckedChange={(v) => toggleSelection(student.id, v)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={isSelected ? "Deselect" : "Select"}
                      />
                    </CardHeader>

                    <CardContent className="pt-2 pb-4 flex-1">
                      {Array.isArray(student.hobbies) &&
                        student.hobbies.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {student.hobbies.map((hobby, idx) => (
                              <Badge
                                key={`${student.id}-${hobby}-${idx}`}
                                variant="secondary"
                                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full"
                              >
                                {hobby}
                              </Badge>
                            ))}
                          </div>
                        )}
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {student.bio}
                      </p>
                    </CardContent>

                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center text-gray-500 text-lg py-10">
                No students found matching your criteria.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      {selectedIds.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4 md:p-6">
            <Card className="max-w-2xl mx-auto shadow-none border-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {selectedIds.length} of 3 students selected
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {selectedNames}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelections}
                      className="text-gray-700 hover:text-red-600 hover:bg-red-50"
                    >
                      Clear all
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={selectedIds.length !== 3}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md"
                    >
                      {selectedIds.length === 3
                        ? "Submit Selection"
                        : "Continue"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Preferences + Info Form */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Confirm your selection</DialogTitle>
            <DialogDescription>
              Review your information and order your top 3 mentor preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm font-medium">Full Name</Label>
                <div className="p-2 bg-gray-50 rounded-md border text-sm">
                  {menteeData.firstName} {menteeData.lastName}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Student ID</Label>
                <div className="p-2 bg-gray-50 rounded-md border text-sm">
                  {menteeData.studentId}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Email</Label>
                <div className="p-2 bg-gray-50 rounded-md border text-sm">
                  {menteeData.email}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-sm font-medium">Year</Label>
                <div className="p-2 bg-gray-50 rounded-md border text-sm">
                  {menteeData.year}
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-sm font-medium">Program & Major</Label>
                <div className="p-2 bg-gray-50 rounded-md border text-sm">
                  {menteeData.program} - {menteeData.major}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Top 3 order</Label>
              <div className="space-y-2">
                {preferences.map((id, index) => {
                  const mentorName =
                    mentors.find((m) => m.id === id)?.full_name || "Unknown";
                  return (
                    <div
                      key={id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium w-6 text-gray-600">
                          {index + 1}.
                        </span>
                        <span className="text-sm text-gray-900">
                          {mentorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => movePreferenceUp(index)}
                          disabled={index === 0}
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => movePreferenceDown(index)}
                          disabled={index === preferences.length - 1}
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsFormOpen(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFinalSubmit}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isSaving ? "Submitting..." : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
