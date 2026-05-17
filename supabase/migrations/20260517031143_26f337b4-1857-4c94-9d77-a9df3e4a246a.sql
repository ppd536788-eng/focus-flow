
DROP INDEX IF EXISTS public.questions_year_index_lang_unique;

UPDATE public.questions SET language = '' WHERE language IS NULL;
ALTER TABLE public.questions ALTER COLUMN language SET DEFAULT '';
ALTER TABLE public.questions ALTER COLUMN language SET NOT NULL;

CREATE UNIQUE INDEX questions_year_index_lang_unique
  ON public.questions (year, index, language)
  WHERE year IS NOT NULL AND index IS NOT NULL;
