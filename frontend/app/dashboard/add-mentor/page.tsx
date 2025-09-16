"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";



const PRONOUNS_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "other",
  "prefer not to say"
];

export default function AddMentorPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    pronouns: "",
    year_of_study: "",
    program_of_study: "",
    mentor_description: "",
    linkedin_url: "",
    capacity: 3
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Full Name validation
    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Year of Study validation
    if (!formData.year_of_study) {
      newErrors.year_of_study = "Year of study is required";
    }

    // Program validation
    if (!formData.program_of_study) {
      newErrors.program_of_study = "Program of study is required";
    }

    // Mentor Description validation
    if (!formData.mentor_description.trim()) {
      newErrors.mentor_description = "Mentor description is required";
    } else if (formData.mentor_description.trim().length < 10) {
      newErrors.mentor_description = "Description must be at least 10 characters";
    }

    // LinkedIn URL validation (optional but if provided, should be valid)
    if (formData.linkedin_url && !formData.linkedin_url.includes("linkedin.com")) {
      newErrors.linkedin_url = "Please enter a valid LinkedIn URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const supabase = createClient(url, key);

      const { data, error } = await supabase
        .from("mentor_profiles")
        .insert([{
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          pronouns: formData.pronouns || null,
          year_of_study: formData.year_of_study,
          program_of_study: formData.program_of_study,
          mentor_description: formData.mentor_description.trim(),
          linkedin_url: formData.linkedin_url.trim() || null,
          capacity: formData.capacity
        }])
        .select()
        .single();

      if (error) {
        console.error("Error creating mentor profile:", error);
        toast.error(`Failed to create mentor profile: ${error.message}`);
        return;
      }

      toast.success("Mentor profile created successfully!");
      router.push("/dashboard/mentors");
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto w-full">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Add New Mentor
            </CardTitle>
            <p className="text-gray-600">
              Create a new mentor profile for the mentorship program.
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">
                    Full Name *
                  </Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleInputChange("full_name", e.target.value)}
                    placeholder="Enter full name"
                    className={errors.full_name ? "border-red-500" : ""}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-600">{errors.full_name}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Enter email address"
                    className={errors.email ? "border-red-500" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* Pronouns and Year of Study */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pronouns">
                    Pronouns
                  </Label>
                  <Select
                    value={formData.pronouns}
                    onValueChange={(value) => handleInputChange("pronouns", value)}
                  >
                    <SelectTrigger className={errors.pronouns ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select pronouns" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRONOUNS_OPTIONS.map((pronoun) => (
                        <SelectItem key={pronoun} value={pronoun}>
                          {pronoun}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.pronouns && (
                    <p className="text-sm text-red-600">{errors.pronouns}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year_of_study">
                    Year of Study *
                  </Label>
                  <Input
                    id="year_of_study"
                    value={formData.year_of_study}
                    onChange={(e) => handleInputChange("year_of_study", e.target.value)}
                    placeholder="e.g., Senior, Graduate Student, Alumni, etc."
                    className={errors.year_of_study ? "border-red-500" : ""}
                  />
                  {errors.year_of_study && (
                    <p className="text-sm text-red-600">{errors.year_of_study}</p>
                  )}
                </div>
              </div>

              {/* Program of Study */}
              <div className="space-y-2">
                <Label htmlFor="program_of_study">
                  Program of Study *
                </Label>
                <Input
                  id="program_of_study"
                  value={formData.program_of_study}
                  onChange={(e) => handleInputChange("program_of_study", e.target.value)}
                  placeholder="e.g., Computer Science, Business Administration, etc."
                  className={errors.program_of_study ? "border-red-500" : ""}
                />
                {errors.program_of_study && (
                  <p className="text-sm text-red-600">{errors.program_of_study}</p>
                )}
                <p className="text-sm text-gray-500">
                  Enter your degree program or field of study.
                </p>
              </div>

              {/* Mentor Description */}
              <div className="space-y-2">
                <Label htmlFor="mentor_description">
                  Mentor Description *
                </Label>
                <Textarea
                  id="mentor_description"
                  value={formData.mentor_description}
                  onChange={(e) => handleInputChange("mentor_description", e.target.value)}
                  placeholder="Describe your background, interests, and what you can offer as a mentor..."
                  className={errors.mentor_description ? "border-red-500" : ""}
                  rows={4}
                />
                {errors.mentor_description && (
                  <p className="text-sm text-red-600">{errors.mentor_description}</p>
                )}
                <p className="text-sm text-gray-500">
                  Tell mentees about your experience, interests, and how you can help them.
                </p>
              </div>

              {/* LinkedIn URL */}
              <div className="space-y-2">
                <Label htmlFor="linkedin_url">
                  LinkedIn Profile URL
                </Label>
                <Input
                  id="linkedin_url"
                  type="url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className={errors.linkedin_url ? "border-red-500" : ""}
                />
                {errors.linkedin_url && (
                  <p className="text-sm text-red-600">{errors.linkedin_url}</p>
                )}
                <p className="text-sm text-gray-500">
                  Optional: Share your LinkedIn profile for mentees to connect with you.
                </p>
              </div>


              {/* Info Alert */}
              <Alert>
                <AlertDescription>
                  <strong>Note:</strong> All fields marked with * are required. 
                  Your mentor profile will be visible to mentees when they make their selections.
                </AlertDescription>
              </Alert>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {isSubmitting ? "Creating..." : "Create Mentor Profile"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
