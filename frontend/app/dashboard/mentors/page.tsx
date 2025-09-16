"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fetchMentorProfiles, type MentorProfileRow } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export default function MentorsPage() {
  const [mentors, setMentors] = useState<MentorProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">Mentors</CardTitle>
            <p className="text-gray-600">Listing mentors from Supabase.</p>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-gray-500 text-sm mb-4">Loading mentors…</p>
            )}
            {error && (
              <p className="text-red-600 text-sm mb-4">{error}</p>
            )}

            {!loading && !error && (
              <p className="text-sm text-gray-600 mb-4">
                Total mentors: <span className="font-semibold text-gray-900">{mentors.length}</span>
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentors.map((m) => {
                const initials = (m.full_name || "?")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();
                return (
                  <Card key={m.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar>
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 truncate">
                              {m.full_name}
                            </p>
                            {m.pronouns && (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                                {m.pronouns}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">{m.email}</p>
                          <div className="mt-2 text-sm text-gray-700">
                            <p>
                              <span className="text-gray-500">Program:</span>{" "}
                              {m.program_of_study || "—"}
                            </p>
                            <p>
                              <span className="text-gray-500">Year:</span>{" "}
                              {m.year_of_study || "—"}
                            </p>
                          </div>
                          {m.mentor_description && (
                            <p className="mt-2 text-sm text-gray-700 line-clamp-3">
                              {m.mentor_description}
                            </p>
                          )}
                          <div className="mt-3">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">View details</Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[min(90vw,480px)] max-h-[60vh] overflow-auto">
                                <pre className="text-xs whitespace-pre-wrap break-words">
{JSON.stringify(m, null, 2)}
                                </pre>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {mentors.length === 0 && !loading && !error && (
              <p className="text-gray-500 text-sm mt-4">No mentors found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


