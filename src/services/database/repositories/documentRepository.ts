// src/services/database/repositories/documentRepository.ts
import * as SQLite from "expo-sqlite"
import { BaseRepository } from "./baseRepository"

export class DocumentRepository extends BaseRepository {
    constructor(db: SQLite.SQLiteDatabase) {
        super(db, "documents")
    }
}
