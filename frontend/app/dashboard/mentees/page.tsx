"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form-field";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteMenteePreferences,
  fetchMenteePreferences,
  fetchMentorProfiles,
  submitMenteePreferences,
  updateMenteePreferences,
  type MenteePreferencesRow,
  type MentorProfileRow,
} from "@/lib/db/actions";
import {
  AlertCircle,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const YEARS_OF_STUDY = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year+",
];

const NONE_VALUE = "__none__";

type MenteeFormState = {
  first_name: string;
  last_name: string;
  email: string;
  student_id: string;
  program: string;
  major: string;
  year: string;
  first_choice: string;
  second_choice: string;
  third_choice: string;
};

const emptyForm: MenteeFormState = {
  first_name: "",
  last_name: "",
  email: "",
  student_id: "",
  program: "",
  major: "",
  year: "",
  first_choice: "",
  second_choice: "",
  third_choice: "",
};

function menteeToForm(m: MenteePreferencesRow): MenteeFormState {
  return {
    first_name: m.first_name ?? "",
    last_name: m.last_name ?? "",
    email: m.email ?? "",
    student_id: String(m.student_id ?? ""),
    program: m.program ?? "",
    major: m.major ?? "",
    year: m.year ?? "",
    first_choice: m.first_choice ?? "",
    second_choice: m.second_choice ?? "",
    third_choice: m.third_choice ?? "",
  };
}

function validateMenteeForm(form: MenteeFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.first_name.trim() || form.first_name.trim().length < 2) {
    errors.first_name = "First name is required";
  }
  if (!form.last_name.trim() || form.last_name.trim().length < 2) {
    errors.last_name = "Last name is required";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email";
  }
  if (!form.student_id.trim() || !/^\d+$/.test(form.student_id.trim())) {
    errors.student_id = "Student ID must be a number";
  }
  if (!form.program.trim()) errors.program = "Program is required";
  if (!form.major.trim()) errors.major = "Major is required";
  if (!form.year.trim()) errors.year = "Year is required";
  return errors;
}

function choiceOrNull(value: string): string | null {
  return value && value !== NONE_VALUE ? value : null;
}

export default function MenteesPage() {
  const [mentees, setMentees] = useState<MenteePreferencesRow[]>([]);
  const [mentors, setMentors] = useState<MentorProfileRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenteePreferencesRow | null>(null);
  const [form, setForm] = useState<MenteeFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<MenteePreferencesRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [menteeRows, mentorRows] = await Promise.all([
        fetchMenteePreferences(),
        fetchMentorProfiles(),
      ]);
      setMentees(menteeRows);
      setMentors(mentorRows ?? []);
    } catch (e) {
      console.error(e);
      setError("Failed to load mentees.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const mentorNameById = useMemo(() => {
    return new Map(mentors.map((m) => [m.id, m.full_name]));
  }, [mentors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentees;
    return mentees.filter((m) =>
      [
        m.first_name,
        m.last_name,
        m.email,
        m.program,
        m.major,
        String(m.student_id),
      ]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [mentees, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (mentee: MenteePreferencesRow) => {
    setEditing(mentee);
    setForm(menteeToForm(mentee));
    setFormErrors({});
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateMenteeForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      student_id: Number(form.student_id),
      program: form.program.trim(),
      major: form.major.trim(),
      year: form.year.trim(),
      first_choice: choiceOrNull(form.first_choice),
      second_choice: choiceOrNull(form.second_choice),
      third_choice: choiceOrNull(form.third_choice),
    };

    setSaving(true);
    try {
      const result = editing
        ? await updateMenteePreferences(editing.id, payload)
        : await submitMenteePreferences(payload);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success(editing ? "Mentee updated" : "Mentee added");
      setFormOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await deleteMenteePreferences(deleteTarget.id);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Mentee deleted");
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const mentorLabel = (id: string | null | undefined) => {
    if (!id) return "—";
    return mentorNameById.get(id) ?? "Unknown mentor";
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Mentees
          </h2>
          <p className="prose-readable mt-1">
            Add, edit, or remove mentee preference records.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" aria-hidden="true" />
          Add mentee
        </Button>
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
            placeholder="Search mentees…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            aria-label="Search mentees"
          />
        </div>
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {loading
            ? "Loading…"
            : `${filtered.length} of ${mentees.length} mentees`}
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center px-4 py-12 text-center">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <UserRound
                  className="size-6 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-base font-semibold">
                {mentees.length === 0 ? "No mentees yet" : "No matches"}
              </h3>
              <p className="prose-readable mt-1 max-w-sm">
                {mentees.length === 0
                  ? "Add a mentee to get started."
                  : "Try a different search term."}
              </p>
              {mentees.length === 0 ? (
                <Button className="mt-4" onClick={openCreate}>
                  <Plus className="size-4" aria-hidden="true" />
                  Add mentee
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Choices</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((mentee) => (
                    <TableRow key={mentee.id}>
                      <TableCell className="font-medium">
                        {mentee.first_name} {mentee.last_name}
                        <div className="mt-1">
                          <Badge variant="secondary" className="font-normal">
                            {mentee.year || "—"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate">
                        {mentee.email}
                      </TableCell>
                      <TableCell>{mentee.student_id}</TableCell>
                      <TableCell>
                        <div className="text-sm">{mentee.program}</div>
                        <div className="text-xs text-muted-foreground">
                          {mentee.major}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div>1. {mentorLabel(mentee.first_choice)}</div>
                        <div>2. {mentorLabel(mentee.second_choice)}</div>
                        <div>3. {mentorLabel(mentee.third_choice)}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(mentee)}
                          >
                            <Pencil className="size-3.5" aria-hidden="true" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(mentee)}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit mentee" : "Add mentee"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this mentee’s details and mentor choices."
                : "Create a mentee preference record."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="mentee-first-name"
                label="First name"
                required
                error={formErrors.first_name}
              >
                <Input
                  id="mentee-first-name"
                  value={form.first_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, first_name: e.target.value }))
                  }
                  className={cn(formErrors.first_name && "border-destructive")}
                />
              </Field>
              <Field
                id="mentee-last-name"
                label="Last name"
                required
                error={formErrors.last_name}
              >
                <Input
                  id="mentee-last-name"
                  value={form.last_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, last_name: e.target.value }))
                  }
                  className={cn(formErrors.last_name && "border-destructive")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="mentee-email"
                label="Email"
                required
                error={formErrors.email}
              >
                <Input
                  id="mentee-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={cn(formErrors.email && "border-destructive")}
                />
              </Field>
              <Field
                id="mentee-student-id"
                label="Student ID"
                required
                error={formErrors.student_id}
              >
                <Input
                  id="mentee-student-id"
                  value={form.student_id}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, student_id: e.target.value }))
                  }
                  className={cn(formErrors.student_id && "border-destructive")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="mentee-program"
                label="Program"
                required
                error={formErrors.program}
              >
                <Input
                  id="mentee-program"
                  value={form.program}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, program: e.target.value }))
                  }
                  className={cn(formErrors.program && "border-destructive")}
                />
              </Field>
              <Field
                id="mentee-major"
                label="Major"
                required
                error={formErrors.major}
              >
                <Input
                  id="mentee-major"
                  value={form.major}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, major: e.target.value }))
                  }
                  className={cn(formErrors.major && "border-destructive")}
                />
              </Field>
            </div>

            <Field id="mentee-year" label="Year" required error={formErrors.year}>
              <Select
                value={form.year || undefined}
                onValueChange={(value) =>
                  setForm((prev) => ({ ...prev, year: value }))
                }
              >
                <SelectTrigger
                  id="mentee-year"
                  className={cn(formErrors.year && "border-destructive")}
                >
                  <SelectValue placeholder="Select year" />
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

            {(
              [
                ["first_choice", "1st choice mentor"],
                ["second_choice", "2nd choice mentor"],
                ["third_choice", "3rd choice mentor"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} id={`mentee-${key}`} label={label}>
                <Select
                  value={form[key] || NONE_VALUE}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      [key]: value === NONE_VALUE ? "" : value,
                    }))
                  }
                >
                  <SelectTrigger id={`mentee-${key}`}>
                    <SelectValue placeholder="Optional" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_VALUE}>None</SelectItem>
                    {mentors.map((mentor) => (
                      <SelectItem key={mentor.id} value={mentor.id}>
                        {mentor.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ))}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    Saving…
                  </>
                ) : editing ? (
                  "Save changes"
                ) : (
                  "Add mentee"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete mentee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.first_name} {deleteTarget?.last_name}
              </span>{" "}
              and any saved assignment for them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
