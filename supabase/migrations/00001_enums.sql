-- Migration: 00001_enums.sql
-- Create all enum types used across the application

CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'janitor', 'client');
CREATE TYPE activity_status AS ENUM ('draft', 'active', 'closed', 'cancelled');
CREATE TYPE room_status AS ENUM (
  'unassigned',
  'not_started',
  'in_progress',
  'done',
  'inspected_pass',
  'inspected_fail',
  'has_issues'
);
CREATE TYPE deficiency_status AS ENUM ('open', 'in_progress', 'resolved');
CREATE TYPE plan_status AS ENUM ('none', 'uploaded', 'vectorised', 'confirmed');
CREATE TYPE inspection_status AS ENUM ('pass', 'fail');
