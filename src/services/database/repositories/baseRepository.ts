// src/services/database/repositories/baseRepository.ts
import * as SQLite from "expo-sqlite"
import { LoggingService } from "../../monitoring/loggingService"
import { SQLiteBindParams } from "expo-sqlite"

const logger = LoggingService.getLogger("BaseRepository")

export abstract class BaseRepository {
    protected db: SQLite.SQLiteDatabase
    protected tableName: string

    constructor(db: SQLite.SQLiteDatabase, tableName: string) {
        this.db = db
        this.tableName = tableName
    }

    /**
     * Execute a query and return all results as an array
     */
    protected async executeQuery<R = never>(
        query: string,
        params: SQLiteBindParams = [],
    ): Promise<R[]> {
        try {
            return await this.db.getAllAsync<R>(query, params)
        } catch (error) {
            logger.error(`Error executing query: ${query}`, error)
            throw error
        }
    }

    /**
     * Execute a query and return the first result or null
     */
    protected async executeSingleResultQuery<R = never>(
        query: string,
        params: SQLiteBindParams = [],
    ): Promise<R | null> {
        try {
            return await this.db.getFirstAsync<R>(query, params)
        } catch (error) {
            logger.error(`Error executing single result query: ${query}`, error)
            throw error
        }
    }

    /**
     * Execute an insert query and return the inserted ID
     * (Note: requires adding `RETURNING id` to your INSERT statements for this to work correctly)
     */
    protected async executeInsert(
        query: string,
        params: SQLiteBindParams = [],
    ): Promise<number> {
        try {
            const result = await this.db.runAsync(query, params)
            return result.lastInsertRowId
        } catch (error) {
            logger.error(`Error executing insert: ${query}`, error)
            throw error
        }
    }

    /**
     * Execute an update query and return the number of affected rows
     */
    protected async executeUpdate(
        query: string,
        params: SQLiteBindParams = [],
    ): Promise<number> {
        try {
            const result = await this.db.runAsync(query, params)
            return result.changes
        } catch (error) {
            logger.error(`Error executing update: ${query}`, error)
            throw error
        }
    }

    /**
     * Execute a list of queries in a transaction
     */
    protected async executeInTransaction(
        callback: (db: SQLite.SQLiteDatabase) => Promise<void>,
    ): Promise<void> {
        try {
            await this.db.withTransactionAsync(async () => {
                await callback(this.db)
            })
        } catch (error) {
            logger.error("Error executing transaction", error)
            throw error
        }
    }
}
