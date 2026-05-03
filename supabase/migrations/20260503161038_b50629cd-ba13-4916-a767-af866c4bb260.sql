
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  topic TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  statement TEXT NOT NULL,
  choices JSONB NOT NULL,
  correct_choice TEXT NOT NULL,
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions_read_authenticated" ON public.questions
  FOR SELECT TO authenticated USING (true);

CREATE TABLE public.question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  chosen TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  ai_explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.question_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "attempts_select_own" ON public.question_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "attempts_insert_own" ON public.question_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "attempts_update_own" ON public.question_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX idx_attempts_user ON public.question_attempts(user_id, created_at DESC);
CREATE INDEX idx_questions_subject ON public.questions(subject, topic);

-- seed a few sample questions
INSERT INTO public.questions (subject, topic, difficulty, statement, choices, correct_choice, explanation) VALUES
('Matemática', 'Funções', 'medium',
 'Se f(x) = 2x + 3, qual o valor de f(5)?',
 '[{"id":"a","text":"10"},{"id":"b","text":"13"},{"id":"c","text":"15"},{"id":"d","text":"8"}]'::jsonb,
 'b', 'f(5) = 2·5 + 3 = 13.'),
('Português', 'Concordância', 'easy',
 'Assinale a frase correta:',
 '[{"id":"a","text":"Fazem dois anos que estudo."},{"id":"b","text":"Faz dois anos que estudo."},{"id":"c","text":"Fazia dois anos que estudo."},{"id":"d","text":"Fizeram dois anos que estudo."}]'::jsonb,
 'b', 'O verbo "fazer" indicando tempo decorrido é impessoal — fica no singular.'),
('História', 'Brasil Colônia', 'medium',
 'A Inconfidência Mineira (1789) tinha como principal motivação econômica:',
 '[{"id":"a","text":"O fim da escravidão"},{"id":"b","text":"A derrama do ouro"},{"id":"c","text":"A independência política total imediata"},{"id":"d","text":"O monopólio do café"}]'::jsonb,
 'b', 'A iminência da derrama (cobrança forçada do quinto) motivou a revolta.'),
('Matemática', 'Geometria', 'hard',
 'A área de um círculo de raio 4 cm é (use π ≈ 3,14):',
 '[{"id":"a","text":"25,12 cm²"},{"id":"b","text":"50,24 cm²"},{"id":"c","text":"12,56 cm²"},{"id":"d","text":"100,48 cm²"}]'::jsonb,
 'b', 'Área = π·r² = 3,14·16 ≈ 50,24 cm².'),
('Biologia', 'Genética', 'medium',
 'Em ervilhas, amarelo (V) é dominante sobre verde (v). Cruzando Vv × Vv, qual a proporção fenotípica?',
 '[{"id":"a","text":"1:1"},{"id":"b","text":"3:1 amarelo:verde"},{"id":"c","text":"1:2:1"},{"id":"d","text":"100% amarelo"}]'::jsonb,
 'b', 'Cruzamento heterozigoto Vv × Vv resulta em 3 amarelos para 1 verde.');
