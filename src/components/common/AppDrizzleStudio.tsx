import React, { useEffect, useState } from "react"
import { Platform } from "react-native"
import * as schema from "../../../src/db/schema.ts"
import { useDatabaseStore } from "../../store/useDataBaseStore.ts"
import drizzleStudioPlugin from "expo-drizzle-studio-plugin"
import * as SQLite from "expo-sqlite"

type UseDrizzleStudioHook = (
    db: SQLite.SQLiteDatabase | null,
    options?: { schema: typeof schema },
) => void

let DrizzleStudioHook: UseDrizzleStudioHook | null = null

if (Platform.OS !== "web") {
    try {
        DrizzleStudioHook = drizzleStudioPlugin.useDrizzleStudio
        console.log(
            "Successfully loaded Drizzle Studio plugin in AppDrizzleStudio",
        )
    } catch (error) {
        console.error(
            "Failed to import expo-drizzle-studio-plugin in AppDrizzleStudio:",
            error,
        )
    }
}

/**
 * A standalone component that enables Drizzle Studio
 */
const AppDrizzleStudio: React.FC = () => {
    const { sqliteDb, isInitialized } = useDatabaseStore()
    const [isEnabled, setIsEnabled] = useState(false)

    // Effect to log database connection status
    useEffect(() => {
        if (Platform.OS !== "web" && sqliteDb && isInitialized) {
            console.log("AppDrizzleStudio: Database connection available")
            setIsEnabled(true)
        }
    }, [sqliteDb, isInitialized])

    if (DrizzleStudioHook) {
        try {
            const dbToUse =
                Platform.OS !== "web" && sqliteDb && isInitialized
                    ? sqliteDb
                    : null
            DrizzleStudioHook(dbToUse, { schema })

            if (dbToUse && isEnabled) {
                console.log(
                    "AppDrizzleStudio: Drizzle Studio initialized! Use Shift+M to open.",
                )
            }
        } catch (error) {
            console.error(
                "AppDrizzleStudio: Error in useDrizzleStudio hook:",
                error,
            )
        }
    }

    return null
}

export default AppDrizzleStudio
