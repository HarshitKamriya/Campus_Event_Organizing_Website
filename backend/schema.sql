-- ============================================================
-- NIT Srinagar Campus Event Portal — Database Schema
-- ============================================================

-- Users table (with role for admin/user distinction)
CREATE TABLE IF NOT EXISTS users (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)   NOT NULL UNIQUE,
    email         VARCHAR(255)  NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(10)   NOT NULL DEFAULT 'user',
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
    id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    title         VARCHAR(200)  NOT NULL,
    description   TEXT          NOT NULL,
    event_date    TIMESTAMPTZ   NOT NULL,
    location      VARCHAR(200)  NOT NULL,
    category      VARCHAR(50)   NOT NULL DEFAULT 'General',
    created_by    UUID          REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_events_date ON events (event_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON events (category);
