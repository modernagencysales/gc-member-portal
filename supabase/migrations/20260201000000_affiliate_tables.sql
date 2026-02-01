-- Affiliate Program Tables
-- Supports referral tracking, commission payouts via Stripe Connect

-- Ensure moddatetime extension exists
CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

-- ============================================
-- Affiliates
-- ============================================
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  company TEXT,
  slug TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'active', 'rejected', 'suspended')),
  commission_amount INTEGER NOT NULL DEFAULT 500,
  stripe_connect_account_id TEXT,
  stripe_connect_onboarded BOOLEAN NOT NULL DEFAULT false,
  bootcamp_student_id UUID REFERENCES bootcamp_students(id),
  photo_url TEXT,
  bio TEXT,
  application_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate slug from name if not provided
CREATE OR REPLACE FUNCTION generate_affiliate_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  final_slug := base_slug;

  WHILE EXISTS (SELECT 1 FROM affiliates WHERE slug = final_slug AND id != NEW.id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_affiliate_slug
  BEFORE INSERT ON affiliates
  FOR EACH ROW
  WHEN (NEW.slug IS NULL OR NEW.slug = '')
  EXECUTE FUNCTION generate_affiliate_slug();

-- Auto-generate short referral code
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
BEGIN
  LOOP
    new_code := upper(substr(md5(random()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM affiliates WHERE code = new_code);
  END LOOP;
  NEW.code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_affiliate_code
  BEFORE INSERT ON affiliates
  FOR EACH ROW
  WHEN (NEW.code IS NULL OR NEW.code = '')
  EXECUTE FUNCTION generate_affiliate_code();

-- Updated_at trigger
CREATE TRIGGER set_affiliates_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION moddatetime(updated_at);

-- ============================================
-- Referrals
-- ============================================
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_email TEXT,
  referred_name TEXT,
  bootcamp_student_id UUID REFERENCES bootcamp_students(id),
  total_price INTEGER NOT NULL DEFAULT 0,
  amount_paid INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'clicked'
    CHECK (status IN ('clicked', 'enrolled', 'paying', 'paid_in_full', 'commission_paid')),
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  enrolled_at TIMESTAMPTZ,
  paid_in_full_at TIMESTAMPTZ,
  commission_paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_referrals_affiliate_id ON referrals(affiliate_id);
CREATE INDEX idx_referrals_referred_email ON referrals(referred_email);
CREATE INDEX idx_referrals_bootcamp_student_id ON referrals(bootcamp_student_id);

-- ============================================
-- Affiliate Payouts
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id UUID NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts(affiliate_id);

-- ============================================
-- Affiliate Assets (marketing materials)
-- ============================================
CREATE TABLE IF NOT EXISTS affiliate_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  asset_type TEXT NOT NULL
    CHECK (asset_type IN ('swipe_copy', 'image', 'video', 'document')),
  content_text TEXT,
  file_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_assets ENABLE ROW LEVEL SECURITY;

-- Public can read active/pending affiliates (landing pages + duplicate check)
CREATE POLICY "Public can read affiliates"
  ON affiliates FOR SELECT
  USING (status IN ('active', 'pending'));

-- Public can submit affiliate applications
CREATE POLICY "Anon can submit affiliate applications"
  ON affiliates FOR INSERT
  WITH CHECK (status = 'pending');

-- Anon can read visible assets
CREATE POLICY "Anon can read visible assets"
  ON affiliate_assets FOR SELECT
  USING (is_visible = true);

-- Indexes for common queries
CREATE INDEX idx_affiliates_status ON affiliates(status);
CREATE INDEX idx_affiliates_email ON affiliates(email);
CREATE INDEX idx_affiliates_code ON affiliates(code);
CREATE INDEX idx_affiliates_slug ON affiliates(slug);
