"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Field, Fieldset } from "@/components/form-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { GraduationCap, Info, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MenteeRegistrationProps {
  onComplete: (menteeData: MenteeData) => void;
}

export interface MenteeData {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  program: string;
  major: string;
  year: string;
}

const YEARS_OF_STUDY = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year+",
];

export default function MenteeRegistration({
  onComplete,
}: MenteeRegistrationProps) {
  const [formData, setFormData] = useState<MenteeData>({
    firstName: "",
    lastName: "",
    email: "",
    studentId: "",
    program: "",
    major: "",
    year: "",
  });
  const [errors, setErrors] = useState<Partial<MenteeData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<MenteeData> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!formData.email.endsWith("@uoguelph.ca")) {
      newErrors.email =
        "Email must be a valid Guelph email address (@uoguelph.ca)";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (!/^\d{7,8}$/.test(formData.studentId.trim())) {
      newErrors.studentId = "Student ID must be 7-8 digits";
    }

    if (!formData.program) {
      newErrors.program = "Program is required";
    }

    if (!formData.major) {
      newErrors.major = "Major is required";
    }

    if (!formData.year) {
      newErrors.year = "Year of study is required";
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
      // Here you could save the mentee data to the database
      // For now, we'll just pass it to the parent component
      onComplete(formData);
      toast.success("Registration completed successfully!");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof MenteeData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /** Shared props that wire validation state to assistive tech. */
  const fieldStatus = (field: keyof MenteeData, hasHint = false) => ({
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field]
      ? `${field}-error`
      : hasHint
        ? `${field}-hint`
        : undefined,
    className: cn(errors[field] && "border-destructive"),
  });

  return (
    <div className="flex flex-1 items-start justify-center bg-muted/40 px-4 py-8 sm:px-6 sm:py-12">
      <Card className="w-full max-w-2xl shadow-sm sm:shadow-md">
        <CardHeader className="gap-0 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-brand-subtle sm:size-14">
            <GraduationCap
              className="size-6 text-brand-subtle-foreground sm:size-7"
              aria-hidden="true"
            />
          </div>
          <CardTitle className="text-2xl leading-tight font-bold sm:text-3xl">
            Welcome to the LSA Mentorship Program
          </CardTitle>
          <p className="prose-readable mx-auto mt-3 max-w-prose">
            Fill out this short application and you&apos;ll get access to our
            Mentor Bank, where you can pick your top 3 choices.
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-8" noValidate>
            <Fieldset title="About you">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field id="firstName" label="First name" required error={errors.firstName}>
                  <Input
                    id="firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    placeholder="Jordan"
                    {...fieldStatus("firstName")}
                  />
                </Field>

                <Field id="lastName" label="Last name" required error={errors.lastName}>
                  <Input
                    id="lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    placeholder="Lee"
                    {...fieldStatus("lastName")}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="email"
                  label="Guelph email address"
                  required
                  error={errors.email}
                  hint="Use your official @uoguelph.ca address"
                >
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="your.name@uoguelph.ca"
                    {...fieldStatus("email", true)}
                  />
                </Field>

                <Field
                  id="studentId"
                  label="Student ID"
                  required
                  error={errors.studentId}
                  hint="7-8 digit student ID number"
                >
                  <Input
                    id="studentId"
                    inputMode="numeric"
                    pattern="\d*"
                    maxLength={8}
                    value={formData.studentId}
                    onChange={(e) =>
                      handleInputChange("studentId", e.target.value)
                    }
                    placeholder="1234567"
                    {...fieldStatus("studentId", true)}
                  />
                </Field>
              </div>
            </Fieldset>

            <Fieldset title="Your studies">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  id="program"
                  label="Program"
                  required
                  error={errors.program}
                  hint="e.g. Bachelor of Arts, Bachelor of Science"
                >
                  <Input
                    id="program"
                    value={formData.program}
                    onChange={(e) =>
                      handleInputChange("program", e.target.value)
                    }
                    placeholder="Bachelor of Science"
                    {...fieldStatus("program", true)}
                  />
                </Field>

                <Field
                  id="major"
                  label="Major"
                  required
                  error={errors.major}
                  hint="Your major or area of study"
                >
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => handleInputChange("major", e.target.value)}
                    placeholder="Computer Science"
                    {...fieldStatus("major", true)}
                  />
                </Field>
              </div>

              <Field
                id="year"
                label="Year of study"
                required
                error={errors.year}
              >
                <Select
                  value={formData.year}
                  onValueChange={(value) => handleInputChange("year", value)}
                >
                  <SelectTrigger
                    id="year"
                    className={cn(
                      "w-full",
                      errors.year && "border-destructive",
                    )}
                    aria-invalid={errors.year ? true : undefined}
                    aria-describedby={errors.year ? "year-error" : undefined}
                  >
                    <SelectValue placeholder="Select your year of study" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS_OF_STUDY.map((year) => (
                      <SelectItem key={year} value={year}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Fieldset>

            <Alert className="bg-muted/60">
              <Info aria-hidden="true" />
              <AlertDescription>
                Next you&apos;ll browse the Mentor Bank and choose your top 3
                mentors. Double-check your details before continuing.
              </AlertDescription>
            </Alert>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  Processing…
                </>
              ) : (
                "Continue to mentor selection"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
