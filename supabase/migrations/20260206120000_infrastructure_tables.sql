-- ============================================
-- GTM Infrastructure Provisioning Tables
-- ============================================

-- Tier packages (admin-configurable)
CREATE TABLE IF NOT EXISTS infra_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  domain_count INT NOT NULL,
  mailboxes_per_domain INT NOT NULL DEFAULT 2,
  setup_fee_cents INT NOT NULL,
  monthly_fee_cents INT NOT NULL,
  stripe_setup_price_id TEXT,
  stripe_monthly_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provision records (one per student)
CREATE TABLE IF NOT EXISTS infra_provisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES bootcamp_students(id),
  tier_id UUID NOT NULL REFERENCES infra_tiers(id),
  status TEXT NOT NULL DEFAULT 'pending_payment'
    CHECK (status IN ('pending_payment', 'provisioning', 'active', 'failed', 'cancelled', 'upgrading')),
  stripe_checkout_session_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  mailbox_pattern_1 TEXT NOT NULL,
  mailbox_pattern_2 TEXT NOT NULL,
  zapmail_workspace_id TEXT,
  zapmail_workspace_key TEXT,
  plusvibe_workspace_id TEXT,
  plusvibe_client_id TEXT,
  plusvibe_client_email TEXT,
  plusvibe_client_password TEXT,
  heyreach_list_id BIGINT,
  provisioning_log JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id)
);

-- Domains per provision
CREATE TABLE IF NOT EXISTS infra_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provision_id UUID NOT NULL REFERENCES infra_provisions(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  zapmail_domain_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'purchasing', 'dns_pending', 'connected', 'active', 'failed')),
  mailboxes JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_infra_provisions_student ON infra_provisions(student_id);
CREATE INDEX IF NOT EXISTS idx_infra_provisions_status ON infra_provisions(status);
CREATE INDEX IF NOT EXISTS idx_infra_domains_provision ON infra_domains(provision_id);
CREATE INDEX IF NOT EXISTS idx_infra_tiers_active ON infra_tiers(is_active, sort_order);

-- RLS
ALTER TABLE infra_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra_provisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE infra_domains ENABLE ROW LEVEL SECURITY;

-- Everyone can read active tiers
CREATE POLICY "Anyone can read active tiers"
ON infra_tiers FOR SELECT USING (is_active = true);

-- Students read own provisions
CREATE POLICY "Students read own provisions"
ON infra_provisions FOR SELECT
USING (student_id IN (
  SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
));

-- Students read own domains
CREATE POLICY "Students read own domains"
ON infra_domains FOR SELECT
USING (provision_id IN (
  SELECT id FROM infra_provisions WHERE student_id IN (
    SELECT id FROM bootcamp_students WHERE email = auth.jwt() ->> 'email'
  )
));

-- Service role full access
CREATE POLICY "Service role manages infra_tiers"
ON infra_tiers FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages infra_provisions"
ON infra_provisions FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages infra_domains"
ON infra_domains FOR ALL USING (auth.role() = 'service_role');

-- Seed default tiers (placeholder Stripe price IDs — update after creating in Stripe)
INSERT INTO infra_tiers (name, slug, domain_count, mailboxes_per_domain, setup_fee_cents, monthly_fee_cents, sort_order) VALUES
  ('Starter', 'starter', 3, 2, 9700, 4700, 0),
  ('Growth', 'growth', 5, 2, 14700, 7700, 1),
  ('Scale', 'scale', 10, 2, 24700, 12700, 2);
