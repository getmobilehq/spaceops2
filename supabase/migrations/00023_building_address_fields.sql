-- Migration: 00023_building_address_fields.sql
-- Add structured address fields to buildings table

ALTER TABLE buildings
  ADD COLUMN city text NOT NULL DEFAULT '',
  ADD COLUMN state text NOT NULL DEFAULT '',
  ADD COLUMN zip_code text NOT NULL DEFAULT '',
  ADD COLUMN country text NOT NULL DEFAULT 'United States';
