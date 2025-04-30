// src/services/database/repositories/tagRepository.ts
import * as SQLite from "expo-sqlite"
import { BaseRepository } from "./baseRepository"

export class TagRepository extends BaseRepository {
    constructor(db: SQLite.SQLiteDatabase) {
        super(db, "tags")
    }
}
