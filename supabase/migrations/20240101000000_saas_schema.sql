-- SaaS Schema Migration
-- Adds multi-tenant support: profiles, subscriptions, usage tracking

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_price_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'starter' | 'pro' | 'agency'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for Stripe webhooks)
CREATE POLICY "Service role manages subscriptions"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Auto-create free subscription on signup
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON public.profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- =============================================
-- USAGE LOGS (track AI calls per user/month)
-- =============================================
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'scrape_events' | 'generate_brochure' | 'scrape_preview'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.usage_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage"
  ON public.usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role manages usage"
  ON public.usage_logs FOR ALL
  USING (auth.role() = 'service_role');

-- Helper function: get usage count for current month
CREATE OR REPLACE FUNCTION public.get_monthly_usage(p_user_id UUID, p_action TEXT)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM public.usage_logs
  WHERE user_id = p_user_id
    AND action = p_action
    AND created_at >= date_trunc('month', NOW());
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- ADD USER_ID TO EXISTING TABLES (multi-tenant)
-- =============================================
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own templates" ON public.templates;
CREATE POLICY "Users can manage own templates"
  ON public.templates FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Update RLS on template_pages (inherit from template)
ALTER TABLE public.template_pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own template pages" ON public.template_pages;
CREATE POLICY "Users can manage own template pages"
  ON public.template_pages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.templates t
      WHERE t.id = template_pages.template_id
        AND (t.user_id = auth.uid() OR t.user_id IS NULL)
    )
  );

-- Update RLS on assets
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own assets" ON public.assets;
CREATE POLICY "Users can manage own assets"
  ON public.assets FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- PLAN LIMITS VIEW
-- =============================================
CREATE OR REPLACE VIEW public.plan_limits AS
SELECT
  plan,
  CASE plan
    WHEN 'free'    THEN 3
    WHEN 'starter' THEN 20
    WHEN 'pro'     THEN 100
    WHEN 'agency'  THEN 9999
    ELSE 3
  END AS brochures_per_month,
  CASE plan
    WHEN 'free'    THEN 1
    WHEN 'starter' THEN 5
    WHEN 'pro'     THEN 20
    WHEN 'agency'  THEN 9999
    ELSE 1
  END AS templates_limit
FROM (VALUES ('free'), ('starter'), ('pro'), ('agency')) AS plans(plan);
