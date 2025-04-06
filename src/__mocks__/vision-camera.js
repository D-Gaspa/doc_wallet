import React from "react"
import RNFS from "react-native-fs"
import { Platform } from "react-native"

console.log("[MOCK] Using mocked react-native-vision-camera")

// Mock Camera class
export class Camera extends React.PureComponent {
    static async getAvailableCameraDevices() {
        return [
            {
                id: "mock-back-camera",
                position: "back",
                name: "Simulated Back Camera",
            },
        ]
    }

    static async getCameraPermissionStatus() {
        return "granted"
    }

    static async requestCameraPermission() {
        return "granted"
    }

    async takePhoto() {
        const writePath = `${
            RNFS.DocumentDirectoryPath
        }/simulated_camera_photo_${Date.now()}.png`

        // Base64 encoded 1x1 pixel transparent PNG
        const imageDataBase64 =
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="

        try {
            await RNFS.writeFile(writePath, imageDataBase64, "base64")
            return {
                path: writePath,
                width: 1,
                height: 1,
                orientation: "up",
            }
        } catch (error) {
            console.error("Mock photo generation error:", error)
            throw error
        }
    }
}

// Mock for useCameraDevices hook
export function useCameraDevices() {
    return {
        back: {
            id: "mock-back-camera",
            position: "back",
            name: "Simulated Back Camera",
        },
    }
}

// Mock for useCameraPermission hook
export function useCameraPermission() {
    return {
        hasPermission: Platform.OS !== "web",
        requestPermission: async () => true,
    }
}
