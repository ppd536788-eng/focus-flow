
DROP INDEX IF EXISTS public.questions_year_index_lang_unique;
ALTER TABLE public.questions
  ADD CONSTRAINT questions_year_index_lang_key UNIQUE (year, index, language);
