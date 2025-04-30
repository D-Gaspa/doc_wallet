// src/services/database/databaseService.ts
import * as SQLite from "expo-sqlite"
import { LoggingService } from "../monitoring/loggingService"
import { initialSchema } from "./migrations/initialSchema"
import { UserRepository } from "./repositories/userRespository.ts"

const logger = LoggingService.getLogger("DatabaseService")
const DATABASE_VERSION = 1
export const DATABASE_NAME = "doc_wallet.db"

export class DatabaseService {
    private static instance: DatabaseService
    private db: SQLite.SQLiteDatabase | null = null
    private initialized: boolean = false
    private userRepositoryInstance: UserRepository | null = null

    private constructor() {}

    public static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService()
        }
        return DatabaseService.instance
    }

    /**
     * Sets the database connection.
     * This should be called before initialize().
     * @param db - The opened SQLite database connection.
     */
    public setDatabase(db: SQLite.SQLiteDatabase): void {
        if (this.db) {
            logger.warn("Database connection is already set. Overwriting.")
        }
        this.db = db
        logger.debug("Database connection set.")
    }

    /**
     * Initializes the database service, creates/migrates schema,
     * and initializes repository singletons.
     */
    public async initialize(): Promise<void> {
        if (this.initialized) {
            logger.debug("DatabaseService already initialized.")
            return
        }
        if (!this.db) {
            logger.error(
                "Database connection not set before calling initialize(). Call setDatabase() first.",
            )
            throw new Error(
                "Database connection not set. Call setDatabase() first.",
            )
        }

        try {
            logger.debug("Initializing database connection and schema...")

            const version = await this.getDatabaseVersion()
            logger.debug(`Current database version: ${version}`)

            if (version === 0) {
                await this.createSchema()
                await this.setDatabaseVersion(DATABASE_VERSION)
                logger.info(
                    `Database schema created and version set to ${DATABASE_VERSION}.`,
                )
            } else if (version < DATABASE_VERSION) {
                await this.migrateDatabase(version)
                await this.setDatabaseVersion(DATABASE_VERSION)
                logger.info(
                    `Database migrated from ${version} to ${DATABASE_VERSION} and version updated.`,
                )
            } else {
                logger.debug(`Database is up to date (Version ${version}).`)
            }

            this.userRepositoryInstance = UserRepository.getInstance(this.db)
            logger.debug(
                "UserRepository Singleton instance obtained/initialized.",
            )

            this.initialized = true
            logger.info("DatabaseService initialized successfully.")
        } catch (error) {
            logger.error("Failed to initialize DatabaseService", error)
            this.initialized = false
            throw error
        }
    }

    private async getDatabaseVersion(): Promise<number> {
        if (!this.db) {
            logger.error("getDatabaseVersion called before DB was set.")
            return 0
        }
        try {
            const tableExistsResult = await this.db.getFirstAsync<{
                count: number
            }>(
                "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='db_version'",
            )

            if (!tableExistsResult || tableExistsResult.count === 0) {
                logger.debug(
                    "'db_version' table not found, assuming version 0.",
                )
                return 0 // triggers schema creation ad version
            }

            const versionResult = await this.db.getFirstAsync<{
                version: number
            }>("SELECT version FROM db_version ORDER BY version DESC LIMIT 1")
            return versionResult ? versionResult.version : 0
        } catch (error) {
            logger.error("Error getting database version:", error)
            return 0
        }
    }

    private async setDatabaseVersion(version: number): Promise<void> {
        if (!this.db) throw new Error("Database not set in setDatabaseVersion.")
        try {
            await this.db.withTransactionAsync(async () => {
                await this.db!.execAsync(
                    "CREATE TABLE IF NOT EXISTS db_version (version INTEGER PRIMARY KEY)",
                )
                await this.db!.runAsync(
                    "INSERT OR REPLACE INTO db_version (version) VALUES (?)",
                    [version],
                )
            })
            logger.debug(`Database version set to ${version}`)
        } catch (error) {
            logger.error("Error setting database version:", error)
            throw error
        }
    }

    private async createSchema(): Promise<void> {
        if (!this.db) throw new Error("Database not set in createSchema.")
        try {
            logger.debug("Creating database schema")
            await this.db.withTransactionAsync(async () => {
                for (const statement of initialSchema) {
                    logger.debug(
                        `Executing schema statement: ${statement.substring(
                            0,
                            100,
                        )}...`,
                    ) // Log snippet
                    await this.db!.execAsync(statement)
                }
                await this.db!.getFirstAsync("SELECT 1")
            })
            logger.info("Database schema created successfully")
        } catch (error) {
            logger.error("Error creating database schema:", error)
            throw error
        }
    }

    private async migrateDatabase(currentVersion: number): Promise<void> {
        if (!this.db) throw new Error("Database not set in migrateDatabase.")
        logger.debug(
            `Migrating database from version ${currentVersion} to ${DATABASE_VERSION}`,
        )
        // Example migration structure
        // await this.db.withTransactionAsync(async () => {
        //     if (currentVersion < 2) {
        //         logger.info("Applying migration for version 2...");
        //         // await this.db.execAsync('ALTER TABLE users ADD COLUMN new_field TEXT;');
        //     }
        //     if (currentVersion < 3) {
        //         logger.info("Applying migration for version 3...");
        //         // await this.db.execAsync('CREATE TABLE new_table (...);');
        //     }
        //     // ... more migrations
        // });
        logger.info(
            `Database migration steps completed up to version ${DATABASE_VERSION}.`,
        )
        // Note: setDatabaseVersion is called after this in initialize()
        return Promise.resolve()
    }

    /**
     * Gets the initialized SQLite database connection.
     * @returns The SQLiteDatabase instance.
     * @throws Error if the database is not initialized.
     */
    public getDatabase(): SQLite.SQLiteDatabase {
        if (!this.initialized || !this.db) {
            logger.error(
                "Attempted to get database before initialization was complete.",
            )
            throw new Error(
                "Database not initialized. Call initialize() first and ensure it completes.",
            )
        }
        return this.db
    }
}

// Export the singleton instance of the service
export const databaseService = DatabaseService.getInstance()
