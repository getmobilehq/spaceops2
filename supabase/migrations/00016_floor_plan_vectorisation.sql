-- 00016: Add extraction columns to vectorised_plans for AI-powered floor plan analysis

ALTER TABLE vectorised_plans
  ADD COLUMN extracted_data jsonb,
  ADD COLUMN extraction_status text NOT NULL DEFAULT 'pending'
    CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  ADD COLUMN extraction_error text,
  ADD COLUMN extracted_at timestamptz;
