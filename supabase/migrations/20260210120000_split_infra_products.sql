-- ============================================
-- Split Infrastructure Provisioning into Email Infra + Outreach Tools
-- ============================================

-- 1. Add product_type column to infra_provisions
ALTER TABLE infra_provisions
  ADD COLUMN product_type TEXT NOT NULL DEFAULT 'email_infra'
    CHECK (product_type IN ('email_infra', 'outreach_tools'));

-- 2. Add linked_provision_id (outreach links to its email infra)
ALTER TABLE infra_provisions
  ADD COLUMN linked_provision_id UUID REFERENCES infra_provisions(id);

-- 3. Make tier_id, mailbox_pattern_1, mailbox_pattern_2 nullable
--    (outreach_tools provisions don't need them)
ALTER TABLE infra_provisions
  ALTER COLUMN tier_id DROP NOT NULL;

ALTER TABLE infra_provisions
  ALTER COLUMN mailbox_pattern_1 DROP NOT NULL;

ALTER TABLE infra_provisions
  ALTER COLUMN mailbox_pattern_2 DROP NOT NULL;

-- 4. Replace UNIQUE(student_id) with UNIQUE(student_id, product_type)
ALTER TABLE infra_provisions
  DROP CONSTRAINT infra_provisions_student_id_key;

ALTER TABLE infra_provisions
  ADD CONSTRAINT infra_provisions_student_product_unique UNIQUE (student_id, product_type);

-- 5. Create outreach pricing table (single-row config)
CREATE TABLE IF NOT EXISTS infra_outreach_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setup_fee_cents INT NOT NULL DEFAULT 0,
  monthly_fee_cents INT NOT NULL DEFAULT 0,
  stripe_setup_price_id TEXT,
  stripe_monthly_price_id TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick active lookup
CREATE INDEX IF NOT EXISTS idx_infra_outreach_pricing_active ON infra_outreach_pricing(is_active);

-- RLS
ALTER TABLE infra_outreach_pricing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active outreach pricing"
ON infra_outreach_pricing FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages infra_outreach_pricing"
ON infra_outreach_pricing FOR ALL USING (auth.role() = 'service_role');

-- Seed with pricing (no setup fee — monthly only)
INSERT INTO infra_outreach_pricing (setup_fee_cents, monthly_fee_cents) VALUES
  (0, 4700);
