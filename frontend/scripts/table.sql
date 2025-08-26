-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.mentee_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  first_choice uuid,
  second_choice uuid,
  third_choice uuid,
  submitted_at timestamp with time zone DEFAULT now(),
  email text NOT NULL,
  student_id bigint NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  program text NOT NULL,
  major text NOT NULL,
  year text NOT NULL,
  CONSTRAINT mentee_preferences_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mentor_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid,
  mentee_id uuid UNIQUE,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_assignments_pkey PRIMARY KEY (id)
);
CREATE TABLE public.mentor_profiles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  capacity integer DEFAULT 3,
  created_at timestamp with time zone DEFAULT now(),
  pronouns text,
  year_of_study text,
  program_of_study text,
  mentor_description text,
  linkedin_url text,
  full_name text NOT NULL,
  email text NOT NULL,
  CONSTRAINT mentor_profiles_pkey PRIMARY KEY (id)
);