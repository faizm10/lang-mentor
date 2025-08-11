-- PARAMETERS
WITH params AS (
  SELECT
    90::int  AS n_mentees,            -- target number of fake mentees
    7::int   AS cap_per_mentor,       -- max total times any mentor can appear
    30::int  AS shortlist_per_mentee, -- how many random candidates per mentee before capping
    'example.com'::text AS email_domain
),

-- GRAB MENTORS
mentors AS (
  SELECT id
  FROM public.mentor_profiles
  WHERE id IS NOT NULL
),

-- NAME POOLS FOR RANDOMIZATION (expand as you like)
name_pools AS (
  SELECT
    ARRAY[
      'Aaliyah','Arjun','Mateo','Layla','Noah','Zara','Ethan','Maya','Lucas','Ava',
      'Liam','Sofia','Kian','Nora','Owen','Mila','Jasper','Elena','Amir','Chloe',
      'Caleb','Isla','Ibrahim','Naomi','Xavier','Leah','Yusuf','Freya','Leo','Ana',
      'Kira','Aiden','Hana','Ivy','Maddox','Nadia','Amaya','Felix','Zain','Elise',
      'Noor','Micah','Aya','Rowan','Sana','Iris','Kai','Lena','Rayan','Alina'
    ]::text[] AS firsts,
    ARRAY[
      'Nguyen','Patel','Garcia','Hernandez','Wong','Singh','Kim','Ali','Martin','Khan',
      'Rodriguez','Brown','Baker','Zhang','Murphy','Lopez','Williams','Bouchard','Kaur','Wilson',
      'Chen','Smith','Lam','Santos','Haddad','Cohen','Hussain','Anders','Dubois','Costa',
      'Silva','Iqbal','Rahman','Taylor','Das','Kumar','Fischer','Romero','Jensen','Nowak',
      'Novak','Kowalski','Popov','Rossi','Schmidt','Ivanova','Johansson','Meyer','Liu','Tran'
    ]::text[] AS lasts
),

-- CREATE ~90 FAKE MENTEES
fake_mentees AS (
  SELECT
    uuid_generate_v4() AS mentee_row_id,
    now()               AS submitted_at,
    initcap(
      (np.firsts[1 + floor(random() * array_length(np.firsts,1))::int])
      || ' ' ||
      (np.lasts[1 + floor(random() * array_length(np.lasts,1))::int])
    ) AS full_name,
    lower(
      (np.firsts[1 + floor(random() * array_length(np.firsts,1))::int])
      || '.' ||
      (np.lasts[1 + floor(random() * array_length(np.lasts,1))::int])
      || '.' ||
      substring(replace(uuid_generate_v4()::text,'-',''), 1, 6)
      || '@' || (SELECT email_domain FROM params)
    ) AS email,
    (10000000 + gs)::bigint AS student_id
  FROM params p
  CROSS JOIN name_pools np
  CROSS JOIN generate_series(1, (SELECT n_mentees FROM params)) gs
),

-- ALL MENTEE x MENTOR PAIRS WITH RANDOM SCORES
pairs AS (
  SELECT
    fm.mentee_row_id,
    m.id AS mentor_id,
    random() AS rnd
  FROM fake_mentees fm
  CROSS JOIN mentors m
),

-- TAKE A RANDOM SHORTLIST PER MENTEE (e.g., top 30)
shortlisted AS (
  SELECT *
  FROM (
    SELECT
      mentee_row_id,
      mentor_id,
      rnd,
      row_number() OVER (PARTITION BY mentee_row_id ORDER BY rnd) AS rn_mentee
    FROM pairs
  ) s
  WHERE s.rn_mentee <= (SELECT shortlist_per_mentee FROM params)
),

-- APPLY GLOBAL CAP: FOR EACH MENTOR, KEEP ONLY THE FIRST cap_per_mentor (by random)
capped AS (
  SELECT *
  FROM (
    SELECT
      mentee_row_id,
      mentor_id,
      rnd,
      row_number() OVER (PARTITION BY mentor_id ORDER BY rnd) AS rn_mentor
    FROM shortlisted
  ) t
  WHERE t.rn_mentor <= (SELECT cap_per_mentor FROM params)
),

-- FOR EACH MENTEE, PICK TOP 3 DISTINCT MENTORS REMAINING
picked AS (
  SELECT
    mentee_row_id,
    array_agg(mentor_id ORDER BY rnd)[1:3] AS picks
  FROM capped
  GROUP BY mentee_row_id
  HAVING array_length(array_agg(mentor_id ORDER BY rnd), 1) >= 3
),

-- INSERT INTO mentee_preferences
ins AS (
  INSERT INTO public.mentee_preferences (
    id, submitted_at, email, student_id, full_name,
    first_choice, second_choice, third_choice
  )
  SELECT
    fm.mentee_row_id AS id,
    fm.submitted_at,
    fm.email,
    fm.student_id,
    fm.full_name,
    p.picks[1],
    p.picks[2],
    p.picks[3]
  FROM fake_mentees fm
  JOIN picked p ON p.mentee_row_id = fm.mentee_row_id
  RETURNING 1
)
SELECT count(*) AS inserted_rows FROM ins;
