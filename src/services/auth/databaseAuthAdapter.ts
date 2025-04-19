// services/auth/databaseAuthAdapter.ts
import { IUser, IUserCredentials } from "../../types/user"
import { LoggingService } from "../monitoring/loggingService"

const logger = LoggingService.getLogger("DatabaseAuthAdapter")

/**
 * This adapter handles authentication operations with a mock database.
 * Later, it can be updated to work with a real database or API.
 */
export class DatabaseAuthAdapter {
    private static instance: DatabaseAuthAdapter
    private mockUsers: IUserCredentials[] = []

    private constructor() {
        // Initialize with any default data if needed
    }

    public static getInstance(): DatabaseAuthAdapter {
        if (!DatabaseAuthAdapter.instance) {
            DatabaseAuthAdapter.instance = new DatabaseAuthAdapter()
        }
        return DatabaseAuthAdapter.instance
    }

    // Set the mock user database (called from the auth store)
    public setMockUsers(users: IUserCredentials[]): void {
        this.mockUsers = [...users]
        logger.debug(`Mock database initialized with ${users.length} users`)
    }

    // Find a user by email
    public async findUserByEmail(
        email: string,
    ): Promise<IUserCredentials | null> {
        logger.debug(`Searching for user with email: ${email}`)
        const user = this.mockUsers.find(
            (u) => u.email.toLowerCase() === email.toLowerCase(),
        )
        return user || null
    }

    // Helper method to create a user object without password
    private createSafeUserObject(user: IUserCredentials): IUser {
        // Type-safe way to create a user object without the password
        const { id, name, email, profileImage } = user
        return { id, name, email, ...(profileImage ? { profileImage } : {}) }
    }

    // Verify credentials
    public async verifyCredentials(
        email: string,
        password: string,
    ): Promise<IUser | null> {
        try {
            const user = await this.findUserByEmail(email)

            if (!user) {
                logger.warn(`User not found for email: ${email}`)
                return null
            }

            // In a real implementation, you would use bcrypt or similar to compare hashed passwords
            if (user.password !== password) {
                logger.warn(`Invalid password for user: ${email}`)
                return null
            }

            // Return user without password using our helper method
            return this.createSafeUserObject(user)
        } catch (error) {
            logger.error(`Error verifying credentials: ${error}`)
            return null
        }
    }

    // Add a new user
    public async addUser(
        userData: Omit<IUserCredentials, "id" | "createdAt">,
    ): Promise<IUser | null> {
        try {
            // Check if user already exists
            const existingUser = await this.findUserByEmail(userData.email)
            if (existingUser) {
                logger.warn(`User with email ${userData.email} already exists`)
                return null
            }

            // Create new user
            const newUser: IUserCredentials = {
                id: `user-${Date.now()}`,
                ...userData,
                createdAt: new Date().toISOString(),
            }

            // Add to mock database
            this.mockUsers.push(newUser)

            logger.info(`New user created: ${newUser.id} (${newUser.email})`)

            // Return user without password using our helper method
            return this.createSafeUserObject(newUser)
        } catch (error) {
            logger.error(`Error adding user: ${error}`)
            return null
        }
    }

    // Get all users (for admin purposes)
    public async getAllUsers(): Promise<IUser[]> {
        // Map users without passwords using our helper method
        return this.mockUsers.map((user) => this.createSafeUserObject(user))
    }

    // Update user information
    public async updateUser(
        userId: string,
        updates: Partial<Omit<IUserCredentials, "id" | "createdAt">>,
    ): Promise<IUser | null> {
        try {
            const userIndex = this.mockUsers.findIndex((u) => u.id === userId)

            if (userIndex === -1) {
                logger.warn(`User not found for ID: ${userId}`)
                return null
            }

            // Update user data
            this.mockUsers[userIndex] = {
                ...this.mockUsers[userIndex],
                ...updates,
            }

            logger.info(`User updated: ${userId}`)

            // Return updated user without password using our helper method
            return this.createSafeUserObject(this.mockUsers[userIndex])
        } catch (error) {
            logger.error(`Error updating user: ${error}`)
            return null
        }
    }

    // Delete a user
    public async deleteUser(userId: string): Promise<boolean> {
        try {
            const initialLength = this.mockUsers.length
            this.mockUsers = this.mockUsers.filter((u) => u.id !== userId)

            const success = this.mockUsers.length < initialLength
            if (success) {
                logger.info(`User deleted: ${userId}`)
            } else {
                logger.warn(`User not found for deletion: ${userId}`)
            }

            return success
        } catch (error) {
            logger.error(`Error deleting user: ${error}`)
            return false
        }
    }
}

// Export a singleton instance
export const databaseAuth = DatabaseAuthAdapter.getInstance()
