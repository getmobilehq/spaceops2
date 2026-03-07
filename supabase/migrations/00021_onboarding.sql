-- Add onboarding tracking to organisations
ALTER TABLE organisations
  ADD COLUMN onboarding_completed boolean NOT NULL DEFAULT false;

-- Existing orgs are already set up, mark them as completed
UPDATE organisations SET onboarding_completed = true;
