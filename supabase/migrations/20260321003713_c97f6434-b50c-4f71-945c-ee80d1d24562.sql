
-- Storage bucket for template PDFs, images, and brochure source files
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true);

CREATE POLICY "Anyone can upload files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'uploads');

CREATE POLICY "Anyone can read files"
ON storage.objects FOR SELECT
USING (bucket_id = 'uploads');

CREATE POLICY "Anyone can delete files"
ON storage.objects FOR DELETE
USING (bucket_id = 'uploads');

-- Templates table
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  contact_info JSONB DEFAULT '{}'::jsonb,
  accueil_horaires JSONB DEFAULT '{}'::jsonb,
  fixed_pages_count INT NOT NULL DEFAULT 4,
  dynamic_insert_after INT NOT NULL DEFAULT 1,
  charter_pdfs TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage templates" ON public.templates FOR ALL USING (true) WITH CHECK (true);

-- Template pages (fixed pages content)
CREATE TABLE public.template_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  title TEXT,
  content_instructions TEXT,
  image_urls TEXT[] DEFAULT '{}',
  layout_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(template_id, page_number)
);

ALTER TABLE public.template_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can manage template_pages" ON public.template_pages FOR ALL USING (true) WITH CHECK (true);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_templates_updated_at
BEFORE UPDATE ON public.templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
