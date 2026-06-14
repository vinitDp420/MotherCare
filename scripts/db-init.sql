-- MotherCare — PostgreSQL Initialization Script
-- Run once on first database creation (via Docker entrypoint)

-- Enable trigram extension for patient name fuzzy search (PAT-09)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable uuid-ossp for UUID generation support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for SHA-256 session token hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\echo 'MotherCare PostgreSQL extensions enabled: pg_trgm, uuid-ossp, pgcrypto'
