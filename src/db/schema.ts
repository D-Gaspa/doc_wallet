import {
    sqliteTable,
    text,
    integer,
    real,
    primaryKey,
} from "drizzle-orm/sqlite-core"
import { sql } from "drizzle-orm"

// Users Table
export const users = sqliteTable("users", {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    phoneNumber: text("phone_number"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    lastLogin: text("last_login"),
    authProvider: text("auth_provider"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    preferredLanguage: text("preferred_language"),
    notificationPreferences: text("notification_preferences", { mode: "json" }),
    avatarUrl: text("avatar_url"),
})

// Document Tags Table (Many-to-Many)
export const documentTags = sqliteTable(
    "document_tags",
    {
        documentId: text("document_id").references(() => documents.id),
        tagId: text("tag_id").references(() => tags.id),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.documentId, table.tagId] }),
    }),
)

// Reminders Table
export const reminders = sqliteTable("reminders", {
    id: text("id").primaryKey(),
    documentId: text("document_id").references(() => documents.id),
    daysBefore: integer("days_before").notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).default(true),
    notificationMethod: text("notification_method"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    isRecurring: integer("is_recurring", { mode: "boolean" }).default(false),
    customMessage: text("custom_message"),
})

// Collections Table
export const collections = sqliteTable("collections", {
    id: text("id").primaryKey(),
    profileId: text("profile_id").references(() => profiles.id),
    name: text("name").notNull(),
    description: text("description"),
    icon: text("icon"),
    color: text("color"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    isDefault: integer("is_default", { mode: "boolean" }).default(false),
    sortOrder: integer("sort_order"),
})

// Collection Documents Table (Many-to-Many)
export const collectionDocuments = sqliteTable(
    "collection_documents",
    {
        collectionId: text("collection_id").references(() => collections.id),
        documentId: text("document_id").references(() => documents.id),
        addedAt: text("added_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => ({
        pk: primaryKey({ columns: [table.collectionId, table.documentId] }),
    }),
)

// Document Relationships Table
export const documentRelationships = sqliteTable(
    "document_relationships",
    {
        sourceDocumentId: text("source_document_id").references(
            () => documents.id,
        ),
        relatedDocumentId: text("related_document_id").references(
            () => documents.id,
        ),
        relationshipType: text("relationship_type").notNull(),
        notes: text("notes"),
        createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    },
    (table) => ({
        pk: primaryKey({
            columns: [table.sourceDocumentId, table.relatedDocumentId],
        }),
    }),
)

// Access Logs Table
export const accessLogs = sqliteTable("access_logs", {
    id: text("id").primaryKey(),
    documentId: text("document_id").references(() => documents.id),
    userId: text("user_id").references(() => users.id),
    timestamp: text("timestamp").default(sql`CURRENT_TIMESTAMP`),
    action: text("action").notNull(),
    ipAddress: text("ip_address"),
    deviceInfo: text("device_info"),
    location: text("location"),
})

// Government Integrations Table
export const governmentIntegrations = sqliteTable("government_integrations", {
    id: text("id").primaryKey(),
    documentId: text("document_id").references(() => documents.id),
    platformName: text("platform_name").notNull(),
    platformId: text("platform_id").notNull(),
    authToken: text("auth_token"),
    renewalUrl: text("renewal_url"),
    requirements: text("requirements", { mode: "json" }),
    lastSynced: text("last_synced"),
    syncEnabled: integer("sync_enabled", { mode: "boolean" }).default(true),
})

// Document OCR Table
export const documentOcr = sqliteTable("document_ocr", {
    id: text("id").primaryKey(),
    documentId: text("document_id").references(() => documents.id),
    extractedText: text("extracted_text"),
    processedAt: text("processed_at").default(sql`CURRENT_TIMESTAMP`),
    confidenceScore: real("confidence_score"),
    isComplete: integer("is_complete", { mode: "boolean" }).default(true),
})

// Notification Settings Table
export const notificationSettings = sqliteTable("notification_settings", {
    id: text("id").primaryKey(),
    profileId: text("profile_id").references(() => profiles.id),
    channel: text("channel").notNull(),
    isEnabled: integer("is_enabled", { mode: "boolean" }).default(true),
    quietHoursStart: text("quiet_hours_start"),
    quietHoursEnd: text("quiet_hours_end"),
    documentTypeId: text("document_type_id").references(() => documentTypes.id),
})

// Profiles Table
export const profiles = sqliteTable("profiles", {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id),
    name: text("name").notNull(),
    description: text("description"),
    isDefault: integer("is_default", { mode: "boolean" }).default(false),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    icon: text("icon"),
    color: text("color"),
})

// Document Types Table
export const documentTypes = sqliteTable("document_types", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    description: text("description"),
    category: text("category").notNull(),
    icon: text("icon"),
    defaultReminderDays: text("default_reminder_days", { mode: "json" }),
    requiredFields: text("required_fields", { mode: "json" }),
    optionalFields: text("optional_fields", { mode: "json" }),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    isSystem: integer("is_system", { mode: "boolean" }).default(false),
})

// Documents Table
export const documents = sqliteTable("documents", {
    id: text("id").primaryKey(),
    profileId: text("profile_id").references(() => profiles.id),
    documentTypeId: text("document_type_id").references(() => documentTypes.id),
    title: text("title").notNull(),
    filename: text("filename").notNull(),
    filePath: text("file_path").notNull(),
    fileSize: integer("file_size").notNull(),
    fileType: text("file_type").notNull(),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at"),
    issuedAt: text("issued_at"),
    expiresAt: text("expires_at"),
    status: text("status").notNull(),
    issuer: text("issuer"),
    documentNumber: text("document_number"),
    verificationStatus: integer("verification_status", { mode: "boolean" }),
    isEncrypted: integer("is_encrypted", { mode: "boolean" }).default(true),
    notes: text("notes"),
    thumbnailPath: text("thumbnail_path"),
    lastViewedAt: text("last_viewed_at"),
})

// Document Fields Table
export const documentFields = sqliteTable(
    "document_fields",
    {
        id: text("id").primaryKey(),
        documentId: text("document_id").references(() => documents.id),
        key: text("key").notNull(),
        value: text("value"),
        type: text("type"),
        isSearchable: integer("is_searchable", { mode: "boolean" }).default(
            true,
        ),
        isSystem: integer("is_system", { mode: "boolean" }).default(false),
        isOcr: integer("is_ocr", { mode: "boolean" }),
    },
    (table) => ({
        uniqueDocumentKey: primaryKey({
            columns: [table.documentId, table.key],
        }),
    }),
)

// Tags Table
export const tags = sqliteTable("tags", {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    color: text("color"),
    icon: text("icon"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    profileId: text("profile_id").references(() => profiles.id),
})
