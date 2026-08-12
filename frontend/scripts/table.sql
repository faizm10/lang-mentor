-- Generated from Drizzle schema (lib/db/schema.ts).
-- Prefer: npm run db:push  (or db:generate + db:migrate)

CREATE TABLE IF NOT EXISTS mentor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capacity integer DEFAULT 3,
  created_at timestamptz DEFAULT now(),
  pronouns text,
  year_of_study text,
  program_of_study text,
  mentor_description text,
  linkedin_url text,
  full_name text NOT NULL,
  email text NOT NULL
);

CREATE TABLE IF NOT EXISTS mentee_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_choice uuid,
  second_choice uuid,
  third_choice uuid,
  submitted_at timestamptz DEFAULT now(),
  email text NOT NULL,
  student_id bigint NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  program text NOT NULL,
  major text NOT NULL,
  year text NOT NULL
);

CREATE TABLE IF NOT EXISTS mentor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid,
  mentee_id uuid UNIQUE,
  assigned_by uuid,
  assigned_at timestamptz DEFAULT now()
);
