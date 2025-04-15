import { create } from "zustand"
import * as SQLite from "expo-sqlite"
import { drizzle } from "drizzle-orm/expo-sqlite"
import { migrate } from "drizzle-orm/expo-sqlite/migrator"
import * as schema from "../db/schema.ts"

// Define the type for the database connection and Drizzle instance
type SqliteDb = SQLite.SQLiteDatabase
type DrizzleDb = ReturnType<typeof drizzle<typeof schema>>

interface DatabaseStore {
    db: DrizzleDb | null
    sqliteDb: SqliteDb | null
    isInitialized: boolean

    initializeDatabase: () => Promise<boolean>
    resetDatabase: () => Promise<boolean>
    insertInitialData: () => Promise<boolean>
}

export const useDatabaseStore = create<DatabaseStore>((set, get) => ({
    db: null,
    sqliteDb: null,
    isInitialized: false,

    initializeDatabase: async () => {
        try {
            // Open database connection
            const sqliteDb = SQLite.openDatabaseSync("docwallet.db")

            // Create Drizzle instance
            const drizzleDb = drizzle(sqliteDb, { schema })

            // Run migrations
            await migrate(drizzleDb, { migrationsFolder: "./migrations" })

            // Insert initial data if needed
            await get().insertInitialData()

            set({
                sqliteDb,
                db: drizzleDb,
                isInitialized: true,
            })

            return true
        } catch (error) {
            console.error("Database initialization failed:", error)
            return false
        }
    },

    resetDatabase: async () => {
        try {
            const { sqliteDb } = get()

            if (!sqliteDb) {
                console.warn("No database connection to reset")
                return false
            }

            // Close existing connection
            sqliteDb.closeSync()

            // Delete the database file (platform-specific)
            await SQLite.deleteDatabaseAsync("docwallet.db")

            // Reinitialize
            return await get().initializeDatabase()
        } catch (error) {
            console.error("Database reset failed:", error)
            return false
        }
    },

    insertInitialData: async () => {
        try {
            const { db } = get()
            if (!db) throw new Error("Database not initialized")

            // Example: Insert initial document types
            const initialDocumentTypes = [
                {
                    name: "Passport",
                    category: "identification",
                    description: "Personal identification document",
                    default_reminder_days: [30, 15, 7],
                    is_system: true,
                },
                {
                    name: "Driver's License",
                    category: "identification",
                    description: "Driving authorization document",
                    default_reminder_days: [60, 30, 15],
                    is_system: true,
                },
            ]

            // Insert initial document types if they don't exist
            const existingTypes = await db
                .select()
                .from(schema.documentTypes)
                .where(sql`is_system = true`)
                .execute()

            if (existingTypes.length === 0) {
                await db
                    .insert(schema.documentTypes)
                    .values(initialDocumentTypes)
                    .execute()
            }

            return true
        } catch (error) {
            console.error("Failed to insert initial data:", error)
            return false
        }
    },
}))

// Optional: Add a hook to initialize on app start
export const initializeDatabaseOnStart = () => {
    const { initializeDatabase } = useDatabaseStore.getState()
    initializeDatabase()
}
