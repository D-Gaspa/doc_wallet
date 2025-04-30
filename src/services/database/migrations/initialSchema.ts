// src/services/database/migrations/initialSchema.ts
export const initialSchema = [
    // Users table
    `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone_number TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    last_login TEXT,
    auth_provider TEXT,
    is_active INTEGER DEFAULT 1,
    preferred_language TEXT,
    notification_preferences TEXT,
    avatar_url TEXT
  )`,

    // Profiles table
    `CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_default INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    icon TEXT,
    color TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`,

    // Document types table
    `CREATE TABLE IF NOT EXISTS document_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    icon TEXT,
    default_reminder_days TEXT, -- JSON array of integers
    required_fields TEXT, -- JSON schema
    optional_fields TEXT, -- JSON schema
    created_at TEXT NOT NULL,
    is_system INTEGER DEFAULT 0
  )`,

    // Documents table
    `CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    profile_id TEXT NOT NULL,
    document_type_id TEXT,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    issued_at TEXT,
    expires_at TEXT,
    status TEXT NOT NULL,
    issuer TEXT,
    document_number TEXT,
    verification_status INTEGER,
    is_encrypted INTEGER DEFAULT 1,
    notes TEXT,
    thumbnail_path TEXT,
    last_viewed_at TEXT
  )`,

    // Document metadata table
    `CREATE TABLE IF NOT EXISTS document_metadata (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT,
    type TEXT,
    is_searchable INTEGER DEFAULT 1,
    is_system INTEGER DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents (id),
    UNIQUE (document_id, key)
  )`,

    // Tags table
    `CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    created_at TEXT NOT NULL,
    profile_id TEXT
  )`,

    // Document tags relationship table
    `CREATE TABLE IF NOT EXISTS document_tags (
    document_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (document_id, tag_id),
    FOREIGN KEY (document_id) REFERENCES documents (id),
    FOREIGN KEY (tag_id) REFERENCES tags (id)
  )`,

    // Folders/Collections table
    `CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    profile_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    is_default INTEGER DEFAULT 0,
    sort_order INTEGER,
    parent_id TEXT,
    FOREIGN KEY (parent_id) REFERENCES collections (id)
  )`,

    // Collection documents relationship
    `CREATE TABLE IF NOT EXISTS collection_documents (
    collection_id TEXT NOT NULL,
    document_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (collection_id, document_id),
    FOREIGN KEY (collection_id) REFERENCES collections (id),
    FOREIGN KEY (document_id) REFERENCES documents (id)
  )`,

    // Reminders table
    `CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    document_id TEXT NOT NULL,
    days_before INTEGER NOT NULL,
    is_enabled INTEGER DEFAULT 1,
    notification_method TEXT,
    created_at TEXT NOT NULL,
    is_recurring INTEGER DEFAULT 0,
    custom_message TEXT,
    FOREIGN KEY (document_id) REFERENCES documents (id)
  )`,
]
