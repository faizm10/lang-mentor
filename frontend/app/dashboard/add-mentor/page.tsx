"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Fieldset } from "@/components/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createMentorProfile } from "@/lib/db/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Info, Loader2 } from "lucide-react";

const PRONOUNS_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "other",
  "prefer not to say",
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
    capacity: 3,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 2) {
      newErrors.full_name = "Full name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.year_of_study) {
      newErrors.year_of_study = "Year of study is required";
    }

    if (!formData.program_of_study) {
      newErrors.program_of_study = "Program of study is required";
    }

    if (!formData.mentor_description.trim()) {
      newErrors.mentor_description = "Mentor description is required";
    } else if (formData.mentor_description.trim().length < 10) {
      newErrors.mentor_description =
        "Description must be at least 10 characters";
    }

    if (
      formData.linkedin_url &&
      !formData.linkedin_url.includes("linkedin.com")
    ) {
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
      const { error } = await createMentorProfile({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        pronouns: formData.pronouns || null,
        year_of_study: formData.year_of_study,
        program_of_study: formData.program_of_study,
        mentor_description: formData.mentor_description.trim(),
        linkedin_url: formData.linkedin_url.trim() || null,
        capacity: formData.capacity,
      });

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
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  /** Shared props that wire validation state to assistive tech. */
  const fieldStatus = (field: string, hasHint = false) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined,
    className: cn(errors[field] && "border-destructive"),
  });

  return (
    <div className="page-container">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Add a new mentor
          </h2>
          <p className="prose-readable mt-1">
            Create a mentor profile for the mentorship program.
          </p>
        </div>

        <Card>
          <CardHeader className="sr-only">
            <CardTitle>Mentor details</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              <Fieldset title="Contact">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field
                    id="full_name"
                    label="Full name"
                    required
                    error={errors.full_name}
                  >
                    <Input
                      id="full_name"
                      autoComplete="name"
                      value={formData.full_name}
                      onChange={(e) =>
                        handleInputChange("full_name", e.target.value)
                      }
                      placeholder="Jordan Lee"
                      {...fieldStatus("full_name")}
                    />
                  </Field>

                  <Field
                    id="email"
                    label="Email address"
                    required
                    error={errors.email}
                  >
                    <Input
                      id="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      autoCapitalize="none"
                      spellCheck={false}
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange("email", e.target.value)
                      }
                      placeholder="jordan.lee@uoguelph.ca"
                      {...fieldStatus("email")}
                    />
                  </Field>
                </div>

                <Field id="pronouns" label="Pronouns" error={errors.pronouns}>
                  <Select
                    value={formData.pronouns}
                    onValueChange={(value) =>
                      handleInputChange("pronouns", value)
                    }
                  >
                    <SelectTrigger id="pronouns" className="w-full">
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
                </Field>
              </Fieldset>

              <Fieldset title="Studies">
                <Field
                  id="year_of_study"
                  label="Year of study"
                  required
                  error={errors.year_of_study}
                >
                  <Input
                    id="year_of_study"
                    value={formData.year_of_study}
                    onChange={(e) =>
                      handleInputChange("year_of_study", e.target.value)
                    }
                    placeholder="e.g. Senior, Graduate Student, Alumni"
                    {...fieldStatus("year_of_study")}
                  />
                </Field>

                <Field
                  id="program_of_study"
                  label="Program of study"
                  required
                  error={errors.program_of_study}
                  hint="Degree program or field of study"
                >
                  <Input
                    id="program_of_study"
                    value={formData.program_of_study}
                    onChange={(e) =>
                      handleInputChange("program_of_study", e.target.value)
                    }
                    placeholder="e.g. Computer Science"
                    {...fieldStatus("program_of_study", true)}
                  />
                </Field>
              </Fieldset>

              <Fieldset title="Profile">
                <Field
                  id="mentor_description"
                  label="Mentor description"
                  required
                  error={errors.mentor_description}
                  hint="Mentees read this when choosing — cover experience, interests, and how you can help."
                >
                  <Textarea
                    id="mentor_description"
                    value={formData.mentor_description}
                    onChange={(e) =>
                      handleInputChange("mentor_description", e.target.value)
                    }
                    placeholder="Describe your background, interests, and what you can offer as a mentor…"
                    rows={5}
                    {...fieldStatus("mentor_description", true)}
                  />
                </Field>

                <Field
                  id="linkedin_url"
                  label="LinkedIn profile URL"
                  error={errors.linkedin_url}
                  hint="Optional — lets mentees connect with you."
                >
                  <Input
                    id="linkedin_url"
                    type="url"
                    inputMode="url"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={formData.linkedin_url}
                    onChange={(e) =>
                      handleInputChange("linkedin_url", e.target.value)
                    }
                    placeholder="https://linkedin.com/in/yourprofile"
                    {...fieldStatus("linkedin_url", true)}
                  />
                </Field>
              </Fieldset>

              <Alert className="bg-muted/60">
                <Info aria-hidden="true" />
                <AlertDescription>
                  Fields marked with * are required. This profile becomes
                  visible to mentees when they make their selections.
                </AlertDescription>
              </Alert>

              {/* Primary action first on mobile, conventional order on desktop */}
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                  className="sm:flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="sm:flex-1"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      Creating…
                    </>
                  ) : (
                    "Create mentor profile"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
