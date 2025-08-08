"use client";

import { useState, useMemo, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ArrowUp, ArrowDown, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchMentorProfiles } from "@/lib/supabase/client"; // Import from Supabase client

// Define a type for the transformed mentor data
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

export default function MentorSelection() {
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedMajor, setSelectedMajor] = useState<string>("");

  const [mentors, setMentors] = useState<MentorData[]>([]); // State to store fetched mentors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMentors() {
      setLoading(true);
      setError(null);
      const profiles = await fetchMentorProfiles();
      if (profiles) {
        const transformedMentors: MentorData[] = profiles.map((profile, index) => {
          // Use email as unique ID since it's NOT NULL in the schema
          const uniqueId = profile.email;
          // Use full_name since it's NOT NULL in the schema
          const fullName = profile.full_name;
          
          return {
            id: uniqueId,
            full_name: fullName,
            year: profile.year_of_study || "N/A",
            major: profile.program_of_study || "Undeclared",
            minor: undefined,
            avatar: fullName
              ? fullName
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()
              : `S${index + 1}`,
            hobbies: [],
            bio: profile.mentor_description || "No description provided.",
          };
        });
        console.log("Transformed mentors:", transformedMentors);
        setMentors(transformedMentors);
      } else {
        setError("Failed to load mentor profiles.");
      }
      setLoading(false);
    }
    loadMentors();
  }, []);

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter((id) => id !== studentId);
      }
      if (prev.length < 3) {
        return [...prev, studentId];
      }
      return prev;
    });
  };

  const clearSelections = () => {
    setSelectedStudents([]);
  };

  const handleSubmit = () => {
    if (selectedStudents.length === 3) {
      setIsSubmitted(true);
      console.log("Submitting selections:", selectedStudents);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedMajor("");
    setSortBy("name");
    setSortOrder("asc");
  };

  // Extract unique majors for the filter dropdown from fetched mentors
  const uniqueMajors = useMemo(() => {
    const majors = new Set<string>();
    mentors.forEach((mentor) => majors.add(mentor.major));
    return Array.from(majors).sort();
  }, [mentors]);

  // Filter and sort students based on state and fetched mentors
  const displayedStudents = useMemo(() => {
    const query = searchQuery.toLowerCase();

    const filtered = mentors.filter((student) => {
      const name = (student.full_name || "").toLowerCase();
      const major = (student.major || "").toLowerCase();
      const bio = (student.bio || "").toLowerCase();
      const hobbiesMatch =
        Array.isArray(student.hobbies) &&
        student.hobbies.some((hobby) =>
          (hobby || "").toLowerCase().includes(query)
        );

      const matchesSearch =
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
        const yearOrder: { [key: string]: number } = {
          Senior: 3,
          Junior: 2,
          Sophomore: 1,
          Freshman: 0,
          "N/A": -1,
        };
        compareValue = (yearOrder[a.year] ?? -1) - (yearOrder[b.year] ?? -1);
      }

      return sortOrder === "asc" ? compareValue : -compareValue;
    });

    return filtered;
  }, [searchQuery, sortBy, sortOrder, selectedMajor, mentors]);

  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
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
            <p className="text-sm text-gray-500">
              You’ll receive a confirmation email within 24 hours to connect
              with your peers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="mt-4 text-lg text-gray-600">Loading mentors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <XCircle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-lg text-red-600">{error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <div className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-16">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
              Select 3 Students to Connect With
            </h1>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Choose up to three LANG students you’d like to connect with for
              peer mentorship, networking, or collaboration.
            </p>
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-col gap-4 mb-8 max-w-4xl mx-auto">
            <Input
              placeholder="Search by name, bio, or hobbies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
            />
            <div className="flex flex-col sm:flex-row gap-4">
              <Select value={selectedMajor} onValueChange={setSelectedMajor}>
                <SelectTrigger className="w-full sm:w-[180px]">
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
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="year">Year</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  setSortOrder(sortOrder === "asc" ? "desc" : "asc")
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
                className="text-gray-600 hover:text-red-600 hover:bg-red-50 bg-transparent"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-12">
             {displayedStudents.length > 0 ? (
                              displayedStudents.map((student, index) => {
                 const isSelected = selectedStudents.includes(student.id);
                 const isDisabled = !isSelected && selectedStudents.length >= 3;
 
                 return (
                   <Card
                     key={`${student.id}-${index}`}
                    className={cn(
                      "relative transition-all duration-200 cursor-pointer h-full flex flex-col",
                      "hover:shadow-lg",
                      isSelected
                        ? "border-emerald-500 shadow-md ring-2 ring-emerald-200"
                        : "border-gray-200",
                      isDisabled && "opacity-60 cursor-not-allowed"
                    )}
                    onClick={() =>
                      !isDisabled && handleSelectStudent(student.id)
                    }
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
                            {student.minor && ` / Minor: ${student.minor}`}
                          </p>
                        </div>
                      </div>
                      <Checkbox
                        checked={isSelected}
                        disabled={isDisabled}
                        className="border-2 w-5 h-5"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </CardHeader>
                    <CardContent className="pt-2 pb-4 flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {Array.isArray(student.hobbies) &&
                          student.hobbies.map((hobby: string, idx: number) => (
                            <Badge
                              key={`${student.id}-${hobby}-${idx}`}
                              variant="secondary"
                              className="text-xs px-2.5 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full"
                            >
                              {hobby}
                            </Badge>
                          ))}
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed ">
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
      {selectedStudents.length > 0 && (
        <div className="sticky bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
          <div className="p-4 md:p-6">
            <Card className="max-w-2xl mx-auto shadow-none border-none bg-transparent">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">
                      {selectedStudents.length} of 3 students selected
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {selectedStudents
                        .map((id) => mentors.find((s) => s.id === id)?.full_name)
                        .join(", ")}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelections}
                      className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    >
                      Clear all
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={selectedStudents.length !== 3}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-md"
                    >
                      {selectedStudents.length === 3
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
    </div>
  );
}
