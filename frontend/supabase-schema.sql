-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.mentee_preferences (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentee_id uuid UNIQUE,
  first_choice uuid,
  second_choice uuid,
  third_choice uuid,
  submitted_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentee_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT mentee_preferences_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES public.users(id),
  CONSTRAINT mentee_preferences_third_choice_fkey FOREIGN KEY (third_choice) REFERENCES public.users(id),
  CONSTRAINT mentee_preferences_first_choice_fkey FOREIGN KEY (first_choice) REFERENCES public.users(id),
  CONSTRAINT mentee_preferences_second_choice_fkey FOREIGN KEY (second_choice) REFERENCES public.users(id)
);
CREATE TABLE public.mentor_assignments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  mentor_id uuid,
  mentee_id uuid UNIQUE,
  assigned_by uuid,
  assigned_at timestamp with time zone DEFAULT now(),
  CONSTRAINT mentor_assignments_pkey PRIMARY KEY (id),
  CONSTRAINT mentor_assignments_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.users(id),
  CONSTRAINT mentor_assignments_mentee_id_fkey FOREIGN KEY (mentee_id) REFERENCES public.users(id),
  CONSTRAINT mentor_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id)
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
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['mentor'::text, 'mentee'::text, 'admin'::text])),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);