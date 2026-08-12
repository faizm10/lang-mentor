"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  createMentorProfile,
  deleteMentorProfile,
  fetchMentorProfiles,
  updateMentorProfile,
  type CreateMentorProfileInput,
  type MentorProfileRow,
} from "@/lib/db/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Field } from "@/components/form-field";
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
  AlertCircle,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRONOUNS_OPTIONS = [
  "he/him",
  "she/her",
  "they/them",
  "other",
  "prefer not to say",
];

type MentorFormState = {
  full_name: string;
  email: string;
  pronouns: string;
  year_of_study: string;
  program_of_study: string;
  mentor_description: string;
  linkedin_url: string;
  capacity: string;
};

const emptyForm: MentorFormState = {
  full_name: "",
  email: "",
  pronouns: "",
  year_of_study: "",
  program_of_study: "",
  mentor_description: "",
  linkedin_url: "",
  capacity: "3",
};

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

function mentorToForm(m: MentorProfileRow): MentorFormState {
  return {
    full_name: m.full_name ?? "",
    email: m.email ?? "",
    pronouns: m.pronouns ?? "",
    year_of_study: m.year_of_study ?? "",
    program_of_study: m.program_of_study ?? "",
    mentor_description: m.mentor_description ?? "",
    linkedin_url: m.linkedin_url ?? "",
    capacity: String(m.capacity ?? 3),
  };
}

function validateMentorForm(form: MentorFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.full_name.trim() || form.full_name.trim().length < 2) {
    errors.full_name = "Full name is required";
  }
  if (!form.email.trim()) {
    errors.email = "Email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = "Enter a valid email";
  }
  if (!form.year_of_study.trim()) {
    errors.year_of_study = "Year of study is required";
  }
  if (!form.program_of_study.trim()) {
    errors.program_of_study = "Program of study is required";
  }
  if (!form.mentor_description.trim() || form.mentor_description.trim().length < 10) {
    errors.mentor_description = "Description must be at least 10 characters";
  }
  if (form.linkedin_url && !form.linkedin_url.includes("linkedin.com")) {
    errors.linkedin_url = "Enter a valid LinkedIn URL";
  }
  const capacity = Number(form.capacity);
  if (!Number.isFinite(capacity) || capacity < 1) {
    errors.capacity = "Capacity must be at least 1";
  }
  return errors;
}

function toPayload(form: MentorFormState): CreateMentorProfileInput {
  return {
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    pronouns: form.pronouns || null,
    year_of_study: form.year_of_study.trim(),
    program_of_study: form.program_of_study.trim(),
    mentor_description: form.mentor_description.trim(),
    linkedin_url: form.linkedin_url.trim() || null,
    capacity: Number(form.capacity) || 3,
  };
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
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MentorProfileRow | null>(null);
  const [form, setForm] = useState<MentorFormState>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MentorProfileRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchMentorProfiles();
      setMentors(data ?? []);
    } catch (e) {
      console.error(e);
      setError("Failed to load mentors.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return mentors;
    return mentors.filter((m) =>
      [m.full_name, m.email, m.program_of_study, m.mentor_description]
        .filter(Boolean)
        .some((field) => (field as string).toLowerCase().includes(q)),
    );
  }, [mentors, query]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (mentor: MentorProfileRow) => {
    setEditing(mentor);
    setForm(mentorToForm(mentor));
    setFormErrors({});
    setSelected(null);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateMentorForm(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setSaving(true);
    try {
      const payload = toPayload(form);
      const result = editing
        ? await updateMentorProfile(editing.id, payload)
        : await createMentorProfile(payload);

      if (result.error) {
        toast.error(result.error.message);
        return;
      }

      toast.success(editing ? "Mentor updated" : "Mentor added");
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
      const result = await deleteMentorProfile(deleteTarget.id);
      if (result.error) {
        toast.error(result.error.message);
        return;
      }
      toast.success("Mentor deleted");
      setDeleteTarget(null);
      setSelected(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Mentors
          </h2>
          <p className="prose-readable mt-1">
            Everyone currently available in the Mentor Bank.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/dashboard/add-mentor">CSV / full form</Link>
          </Button>
          <Button onClick={openCreate}>
            <Plus className="size-4" aria-hidden="true" />
            Add mentor
          </Button>
        </div>
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
            {mentors.length === 0 ? (
              <Button className="mt-4" onClick={openCreate}>
                <Plus className="size-4" aria-hidden="true" />
                Add mentor
              </Button>
            ) : null}
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

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelected(m)}
                  >
                    View details
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(m)}
                  >
                    <Pencil className="size-3.5" aria-hidden="true" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(m)}
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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

              <DialogFooter className="gap-2 sm:justify-start">
                <Button variant="outline" onClick={() => openEdit(selected)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteTarget(selected);
                  }}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit mentor" : "Add mentor"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this mentor’s profile."
                : "Create a new mentor profile."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="mentor-full-name" label="Full name" required error={formErrors.full_name}>
                <Input
                  id="mentor-full-name"
                  value={form.full_name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                  className={cn(formErrors.full_name && "border-destructive")}
                />
              </Field>
              <Field id="mentor-email" label="Email" required error={formErrors.email}>
                <Input
                  id="mentor-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className={cn(formErrors.email && "border-destructive")}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="mentor-pronouns" label="Pronouns">
                <Select
                  value={form.pronouns || undefined}
                  onValueChange={(value) =>
                    setForm((prev) => ({ ...prev, pronouns: value }))
                  }
                >
                  <SelectTrigger id="mentor-pronouns">
                    <SelectValue placeholder="Select pronouns" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRONOUNS_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                id="mentor-year"
                label="Year of study"
                required
                error={formErrors.year_of_study}
              >
                <Input
                  id="mentor-year"
                  value={form.year_of_study}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      year_of_study: e.target.value,
                    }))
                  }
                  className={cn(formErrors.year_of_study && "border-destructive")}
                />
              </Field>
            </div>

            <Field
              id="mentor-program"
              label="Program of study"
              required
              error={formErrors.program_of_study}
            >
              <Input
                id="mentor-program"
                value={form.program_of_study}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    program_of_study: e.target.value,
                  }))
                }
                className={cn(
                  formErrors.program_of_study && "border-destructive",
                )}
              />
            </Field>

            <Field
              id="mentor-description"
              label="Description"
              required
              error={formErrors.mentor_description}
            >
              <Textarea
                id="mentor-description"
                rows={4}
                value={form.mentor_description}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    mentor_description: e.target.value,
                  }))
                }
                className={cn(
                  formErrors.mentor_description && "border-destructive",
                )}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="mentor-linkedin"
                label="LinkedIn URL"
                error={formErrors.linkedin_url}
              >
                <Input
                  id="mentor-linkedin"
                  value={form.linkedin_url}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      linkedin_url: e.target.value,
                    }))
                  }
                  className={cn(formErrors.linkedin_url && "border-destructive")}
                />
              </Field>
              <Field
                id="mentor-capacity"
                label="Capacity"
                required
                error={formErrors.capacity}
              >
                <Input
                  id="mentor-capacity"
                  type="number"
                  min={1}
                  value={form.capacity}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, capacity: e.target.value }))
                  }
                  className={cn(formErrors.capacity && "border-destructive")}
                />
              </Field>
            </div>

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
                  "Add mentor"
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
            <AlertDialogTitle>Delete mentor?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.full_name}
              </span>
              . Assignments linked to this mentor will keep the mentee but clear
              the mentor.
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
