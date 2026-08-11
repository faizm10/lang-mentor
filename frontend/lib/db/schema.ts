import {
  bigint,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core"

export const mentorProfiles = pgTable("mentor_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  capacity: integer("capacity").default(3),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  pronouns: text("pronouns"),
  yearOfStudy: text("year_of_study"),
  programOfStudy: text("program_of_study"),
  mentorDescription: text("mentor_description"),
  linkedinUrl: text("linkedin_url"),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
})

export const menteePreferences = pgTable("mentee_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstChoice: uuid("first_choice"),
  secondChoice: uuid("second_choice"),
  thirdChoice: uuid("third_choice"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  email: text("email").notNull(),
  studentId: bigint("student_id", { mode: "number" }).notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  program: text("program").notNull(),
  major: text("major").notNull(),
  year: text("year").notNull(),
})

export const mentorAssignments = pgTable("mentor_assignments", {
  id: uuid("id").primaryKey().defaultRandom(),
  mentorId: uuid("mentor_id"),
  menteeId: uuid("mentee_id").unique(),
  assignedBy: uuid("assigned_by"),
  assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow(),
})
