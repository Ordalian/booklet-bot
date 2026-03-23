
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  file_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage assets" ON public.assets FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.template_pages ADD COLUMN IF NOT EXISTS page_type text NOT NULL DEFAULT 'visual';
ALTER TABLE public.template_pages ADD COLUMN IF NOT EXISTS event_data jsonb DEFAULT '[]'::jsonb;
