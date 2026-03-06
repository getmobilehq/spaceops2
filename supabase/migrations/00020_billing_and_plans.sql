-- Migration: 00020_billing_and_plans.sql
-- SaaS Phase 1: Stripe billing, plan tracking, subscriptions

-- ============================================
-- 1. Plan enum
-- ============================================
CREATE TYPE org_plan AS ENUM ('free', 'pro', 'enterprise');

-- ============================================
-- 2. Add billing columns to organisations
-- ============================================
ALTER TABLE organisations
  ADD COLUMN stripe_customer_id text UNIQUE,
  ADD COLUMN plan org_plan NOT NULL DEFAULT 'free';

CREATE INDEX idx_organisations_stripe_customer_id ON organisations (stripe_customer_id);
CREATE INDEX idx_organisations_plan ON organisations (plan);

-- ============================================
-- 3. Subscriptions table
-- ============================================
CREATE TABLE subscriptions (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                  uuid NOT NULL REFERENCES organisations (id) ON DELETE CASCADE,
  stripe_subscription_id  text NOT NULL UNIQUE,
  stripe_price_id         text NOT NULL,
  status                  text NOT NULL,
  current_period_start    timestamptz NOT NULL,
  current_period_end      timestamptz NOT NULL,
  cancel_at_period_end    boolean NOT NULL DEFAULT false,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_org_id ON subscriptions (org_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER set_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 4. RLS policies for subscriptions
-- ============================================

-- Admins can read their org's subscriptions
CREATE POLICY "Admins can read org subscriptions"
  ON subscriptions FOR SELECT
  USING (org_id = auth_org_id() AND auth_role() = 'admin');

-- No INSERT/UPDATE/DELETE via RLS — only service role (webhook handler) writes
