"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, User, GraduationCap, Calendar } from "lucide-react";
import { toast } from "sonner";

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

export default function MenteeRegistration({ onComplete }: MenteeRegistrationProps) {
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

    // First Name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.trim().length < 2) {
      newErrors.firstName = "First name must be at least 2 characters";
    }

    // Last Name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.trim().length < 2) {
      newErrors.lastName = "Last name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!formData.email.endsWith("@uoguelph.ca")) {
      newErrors.email = "Email must be a valid Guelph email address (@uoguelph.ca)";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Student ID validation
    if (!formData.studentId.trim()) {
      newErrors.studentId = "Student ID is required";
    } else if (!/^\d{7,8}$/.test(formData.studentId.trim())) {
      newErrors.studentId = "Student ID must be 7-8 digits";
    }

    // Program validation
    if (!formData.program) {
      newErrors.program = "Program is required";
    }

    // Major validation
    if (!formData.major) {
      newErrors.major = "Major is required";
    }

    // Year of Study validation
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
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900">
            Welcome to the LSA Mentorship Program
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Please fill out this mentee application. You will then have access to our Mentor Bank, where you can select your top 3 choices.
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  First Name *
                </Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange("firstName", e.target.value)}
                  placeholder="Enter your first name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Last Name *
                </Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange("lastName", e.target.value)}
                  placeholder="Enter your last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email and Student ID Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Guelph Email Address *
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.name@uoguelph.ca"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
                <p className="text-sm text-gray-500">
                  Please use your official University of Guelph email address
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Student ID *
                </Label>
                <Input
                  id="studentId"
                  value={formData.studentId}
                  onChange={(e) => handleInputChange("studentId", e.target.value)}
                  placeholder="1234567"
                  className={errors.studentId ? "border-red-500" : ""}
                />
                {errors.studentId && (
                  <p className="text-sm text-red-600">{errors.studentId}</p>
                )}
                <p className="text-sm text-gray-500">
                  7-8 digit student ID number
                </p>
              </div>
            </div>

            {/* Program and Major */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="program" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Program *
                </Label>
                <Input
                  id="program"
                  value={formData.program}
                  onChange={(e) => handleInputChange("program", e.target.value)}
                  placeholder="e.g., Bachelor of Science"
                  className={errors.program ? "border-red-500" : ""}
                />
                {errors.program && (
                  <p className="text-sm text-red-600">{errors.program}</p>
                )}
                <p className="text-sm text-gray-500">
                  Enter your degree program (e.g., Bachelor of Arts, Bachelor of Science)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="major" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Major *
                </Label>
                <Input
                  id="major"
                  value={formData.major}
                  onChange={(e) => handleInputChange("major", e.target.value)}
                  placeholder="e.g., Computer Science"
                  className={errors.major ? "border-red-500" : ""}
                />
                {errors.major && (
                  <p className="text-sm text-red-600">{errors.major}</p>
                )}
                <p className="text-sm text-gray-500">
                  Enter your major or area of study
                </p>
              </div>
            </div>

            {/* Year of Study */}
            <div className="space-y-2">
              <Label htmlFor="year" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Year of Study *
              </Label>
              <Select
                value={formData.year}
                onValueChange={(value) => handleInputChange("year", value)}
              >
                <SelectTrigger className={errors.year ? "border-red-500" : ""}>
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
              {errors.year && (
                <p className="text-sm text-red-600">{errors.year}</p>
              )}
            </div>

            {/* Info Alert */}
            <Alert>
              <AlertDescription>
                <strong>Important:</strong> After completing this registration, you'll be able to browse and select your top 3 mentors from our available pool. Make sure all information is accurate before proceeding.
              </AlertDescription>
            </Alert>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 text-lg font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Continue to Mentor Selection"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
