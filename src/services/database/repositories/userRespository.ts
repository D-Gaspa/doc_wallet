import * as SQLite from "expo-sqlite"
import { BaseRepository } from "./baseRepository"
import { generateUniqueId } from "../../../utils"
import { IUser } from "../../../types/user"
import { LoggingService } from "../../monitoring/loggingService"

interface UserQueryResult {
    id: string
    email: string
    name: string
    phoneNumber?: string
    createdAt: string
    updatedAt?: string
    lastLogin?: string
    authProvider?: string
    isActive?: boolean
    preferredLanguage?: string
    notificationPreference?: string
    avatar_url?: string | null
}

/**
 * UserRepository class for managing user data in the database.
 * Implements the Singleton pattern to ensure only one instance exists.
 */
export class UserRepository extends BaseRepository {
    private static instance: UserRepository | null = null
    private static logger = LoggingService.getLogger("UserRepository")

    /**
     * Private constructor to prevent direct instantiation.
     * Use UserRepository.getInstance() to get the instance.
     * @param db - The SQLite database connection.
     */
    private constructor(db: SQLite.SQLiteDatabase) {
        super(db, "users")
        UserRepository.logger.debug(
            "UserRepository Singleton instance created with DB connection.",
        )
    }

    /**
     * Static method to get the single instance of UserRepository.
     * Initializes the instance on first call.
     * @param db - The SQLite database connection (required only on the first call).
     * @returns The singleton instance of UserRepository.
     * @throws Error if the database connection is not provided on the first instantiation.
     */
    public static getInstance(db?: SQLite.SQLiteDatabase): UserRepository {
        if (!UserRepository.instance) {
            if (!db) {
                UserRepository.logger.error(
                    "Database connection must be provided for the first instantiation of UserRepository.",
                )
                throw new Error(
                    "Database connection must be provided for the first instantiation of UserRepository.",
                )
            }
            UserRepository.instance = new UserRepository(db)
        }
        return UserRepository.instance
    }

    /**
     * Instance method to create a user in the database.
     * @param user - User data to create (excluding 'id', which is generated).
     * @returns The created IUser object or null if an error occurred.
     */
    async create(user: Omit<IUser, "id">): Promise<IUser | null> {
        const uniqueId = generateUniqueId()
        const now = Date.now()
        try {
            await this.executeInsert(
                `INSERT INTO users (id, email, name, phone_number, created_at, updated_at, last_login, auth_provider,
                                    is_active, preferred_language, notification_preferences, avatar_url)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    uniqueId,
                    user.email,
                    user.name,
                    null,
                    now,
                    now,
                    now,
                    null,
                    true,
                    null,
                    null,
                    user.profileImage || null,
                ],
            )
            UserRepository.logger.debug("User data stored successfully in DB", {
                userId: uniqueId,
            })

            return {
                id: uniqueId,
                email: user.email,
                name: user.name,
                profileImage: user.profileImage,
            }
        } catch (error) {
            UserRepository.logger.error("Error storing user data in DB:", error)
            return null
        }
    }

    /**
     * Example instance method to find a user by email.
     * @param email - The email of the user to find.
     * @returns The found IUser object or null if not found or an error occurred.
     */
    async findByEmail(email: string): Promise<IUser | null> {
        try {
            const result = await this.executeQuery<UserQueryResult>(
                `SELECT id, email, name, profileImage FROM users WHERE email = ? LIMIT 1`,
                [email],
            )

            if (result && result.length > 0) {
                const rawUser = result[0]
                UserRepository.logger.debug("RawUser:", { rawUser })
                const user: IUser = {
                    id: rawUser.id,
                    email: rawUser.email,
                    name: rawUser.name,
                }
                UserRepository.logger.debug("User found by email:", {
                    email: user.email,
                })
                return user
            } else {
                UserRepository.logger.debug("User not found by email:", {
                    email,
                })
                return null
            }
        } catch (error) {
            UserRepository.logger.error("Error finding user by email:", error)
            return null
        }
    }

    /**
     * Optional instance method: Finds a user by email, or creates them if they don't exist.
     * Useful after social logins (Google, etc.).
     * @param userData - User data (excluding id).
     * @returns The found or newly created IUser object, or null on error.
     */
    async findOrCreate(userData: Omit<IUser, "id">): Promise<IUser | null> {
        try {
            let user = await this.findByEmail(userData.email)

            if (!user) {
                UserRepository.logger.debug(
                    "User not found, creating new user:",
                    { email: userData.email },
                )
                user = await this.create(userData)
            } else {
                UserRepository.logger.debug(
                    "User found, optionally update details",
                    { email: userData.email },
                )
                // Optional: If the user already exists, you might want to update their 'last_login' or other details.
                // Example: Update profile image if it has changed
                //if (user.profileImage !== userData.profileImage) {
                //    await this.executeUpdate(
                //        `UPDATE users SET profileImage = ?, updated_at = ? WHERE id = ?`,
                //        [userData.profileImage, Date.now(), user.id]
                //    );
                //    // Update the user object in memory to reflect changes
                //    user.profileImage = userData.profileImage;
                //}
                // You could add more update logic here (e.g., last login time)
                // await this.executeUpdate(`UPDATE users SET last_login = ? WHERE id = ?`, [Date.now(), user.id]);
            }
            return user
        } catch (error) {
            UserRepository.logger.error("Error in findOrCreate user:", error)
            return null
        }
    }
}
