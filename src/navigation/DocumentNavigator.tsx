import React, { useCallback, useEffect, useRef, useState } from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { DocumentStackParamList } from "../types/navigation.ts"
import { DOCUMENT_ROUTES } from "./routes"
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native"
import {
    RouteProp,
    useIsFocused,
    useNavigation,
    useRoute,
} from "@react-navigation/native"
import { DocumentStorageService } from "../services/document/storage.ts"
import { LoggingService } from "../services/monitoring/loggingService.ts"
import {
    Camera,
    CameraDevice,
    useCameraDevices,
    useCameraPermission,
} from "react-native-vision-camera"
import { PerformanceMonitoringService } from "../services/monitoring/performanceMonitoringService.ts"
import { IDocument, DocumentType, ICapturedPhoto } from "../types/document.ts"
import { generateUniqueId } from "../utils"

// Import screen placeholders - these will be implemented later
const DocumentsHomeScreen = () => (
    <Text testID="documents-home-screen">Documents Home</Text>
)
const DocumentDetailsScreen = () => null
const AddDocumentScreen = () => null
const EditDocumentScreen = () => null

type DocumentScannerRouteProps = RouteProp<
    DocumentStackParamList,
    typeof DOCUMENT_ROUTES.DOCUMENT_SCANNER
>

export const DocumentScannerScreen: React.FC = () => {
    const navigation = useNavigation()
    useRoute<DocumentScannerRouteProps>()
    const documentStorage = DocumentStorageService.create()
    const logger = LoggingService.getLogger("DocumentScanner")
    const isFocused = useIsFocused()

    // Camera state
    const { hasPermission, requestPermission } = useCameraPermission()
    const devices = useCameraDevices()
    const backDevice = "back" in devices ? devices.back : undefined
    const camera = useRef<Camera>(null)

    // Captured photos state
    const [capturedPhotos, setCapturedPhotos] = useState<ICapturedPhoto[]>([])
    const [isCapturing, setIsCapturing] = useState<boolean>(false)
    const [saving, setSaving] = useState<boolean>(false)
    const [flash, setFlash] = useState<"off" | "on">("off")

    // Request camera permission on mount
    useEffect(() => {
        const checkPermission = async () => {
            if (!hasPermission) {
                const granted = await requestPermission()
                if (!granted) {
                    Alert.alert(
                        "Camera Permission Required",
                        "This feature requires camera access. Please enable it in your device settings.",
                        [
                            {
                                text: "Cancel",
                                onPress: () => navigation.goBack(),
                                style: "cancel",
                            },
                            {
                                text: "Try Again",
                                onPress: checkPermission,
                            },
                        ],
                    )
                }
            }
        }

        checkPermission().catch((error) => {
            logger.error("Failed to check camera permission", error)
            Alert.alert(
                "Error",
                "There was a problem checking camera permissions. Please try again.",
            )
        })
    }, [hasPermission, requestPermission, navigation])

    // Handle capturing a photo
    const capturePhoto = useCallback(async () => {
        if (camera.current && !isCapturing) {
            try {
                setIsCapturing(true)
                PerformanceMonitoringService.startMeasure("document_capture")

                const photo = await camera.current.takePhoto({
                    flash: flash,
                })

                const photoUri = `file://${photo.path}`

                // Add captured photo to the list
                setCapturedPhotos((prevPhotos) => [
                    ...prevPhotos,
                    { id: generateUniqueId(), uri: photoUri },
                ])

                logger.info("Document photo captured successfully")
                PerformanceMonitoringService.endMeasure("document_capture")
            } catch (error) {
                logger.error("Failed to capture document photo", error)
                Alert.alert(
                    "Error",
                    "Failed to capture the photo. Please try again.",
                )
            } finally {
                setIsCapturing(false)
            }
        }
    }, [camera, isCapturing, flash, logger])

    // Handle toggling flash
    const toggleFlash = useCallback(() => {
        setFlash((prevFlash) => (prevFlash === "off" ? "on" : "off"))
    }, [])

    // Handle removing a photo from the list
    const removePhoto = useCallback((photoId: string) => {
        setCapturedPhotos((prevPhotos) =>
            prevPhotos.filter((photo) => photo.id !== photoId),
        )
    }, [])

    // Handle saving all captured photos
    const saveDocuments = useCallback(async () => {
        if (capturedPhotos.length === 0) {
            Alert.alert(
                "Error",
                "Please capture at least one photo before saving.",
            )
            return
        }

        try {
            setSaving(true)
            PerformanceMonitoringService.startMeasure("documents_save")

            // Create a temporary document object
            const baseDocument: IDocument = {
                id: generateUniqueId(),
                title: `Document ${new Date().toLocaleDateString()}`,
                content: "",
                sourceUri: "",
                metadata: {
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    type: DocumentType.UNKNOWN,
                },
                tags: [],
            }

            const savedDocuments: IDocument[] = []

            // Save each photo as a separate document
            for (const photo of capturedPhotos) {
                try {
                    const singleDoc = {
                        ...baseDocument,
                        id: generateUniqueId(),
                    }

                    const savedDoc = await (
                        await documentStorage
                    ).importAndStoreDocument(singleDoc, photo.uri, true)

                    savedDocuments.push(savedDoc)
                    logger.debug(`Saved document with ID: ${savedDoc.id}`)
                } catch (error) {
                    logger.error(
                        `Failed to save document from photo: ${photo.uri}`,
                        error,
                    )
                }
            }

            PerformanceMonitoringService.endMeasure("documents_save")

            if (savedDocuments.length > 0) {
                logger.info(
                    `Successfully saved ${savedDocuments.length} documents`,
                )

                navigation.navigate(
                    DOCUMENT_ROUTES.DOCUMENTS_HOME as never,
                    {
                        newDocuments: savedDocuments,
                    } as never,
                )
            } else {
                throw new Error("No documents were saved successfully")
            }
        } catch (error) {
            logger.error("Failed to save documents", error)
            Alert.alert("Error", "Failed to save documents. Please try again.")
        } finally {
            setSaving(false)
        }
    }, [capturedPhotos, navigation, logger])

    // If no camera permission or camera device, show appropriate UI
    if (!hasPermission) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>
                    Camera permission is required
                </Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={requestPermission}
                >
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        )
    }

    if (!backDevice) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>No camera device available</Text>
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            {/* Camera Preview */}
            {isFocused && capturedPhotos.length < 10 && (
                <Camera
                    ref={camera}
                    style={styles.camera}
                    device={backDevice as CameraDevice}
                    isActive={isFocused}
                    photo={true}
                />
            )}

            {/* Overlay if we're displaying captured photos instead of camera */}
            {(capturedPhotos.length > 0 || !isFocused) && (
                <View style={styles.capturedContainer}>
                    <Text style={styles.captureCountText}>
                        {capturedPhotos.length}{" "}
                        {capturedPhotos.length === 1 ? "photo" : "photos"}{" "}
                        captured
                    </Text>

                    {/* Gallery of captured photos */}
                    <FlatList
                        data={capturedPhotos}
                        keyExtractor={(item) => item.id}
                        horizontal={false}
                        numColumns={2}
                        renderItem={({ item }) => (
                            <View style={styles.capturedImageContainer}>
                                {/*TODO ADD RENDER OF TAKEN PHOTO*/}
                                {/*<Image source={{ uri: item.uri } as ImageSourcePropType} style={styles.capturedImage} />*/}
                                <TouchableOpacity
                                    style={styles.removeButton}
                                    onPress={() => removePhoto(item.id)}
                                >
                                    <Text style={styles.removeButtonText}>
                                        ✕
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        contentContainerStyle={styles.capturedPhotosList}
                    />
                </View>
            )}

            {/* Camera controls */}
            <View style={styles.controlsContainer}>
                {/* Flash toggle button */}
                {capturedPhotos.length < 10 && (
                    <TouchableOpacity
                        style={[
                            styles.controlButton,
                            flash === "on" && styles.activeControlButton,
                        ]}
                        onPress={toggleFlash}
                        disabled={isCapturing}
                    >
                        <Text style={styles.controlButtonText}>
                            {flash === "on" ? "Flash On" : "Flash Off"}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Capture button - only show if less than 10 photos captured */}
                {capturedPhotos.length < 10 && (
                    <TouchableOpacity
                        style={[
                            styles.captureButton,
                            isCapturing && styles.disabledButton,
                        ]}
                        onPress={capturePhoto}
                        disabled={isCapturing}
                    >
                        {isCapturing ? (
                            <ActivityIndicator color="#fff" size="small" />
                        ) : (
                            <View style={styles.captureButtonInner} />
                        )}
                    </TouchableOpacity>
                )}

                {/* Done/Save button - only enable if photos have been captured */}
                <TouchableOpacity
                    style={[
                        styles.controlButton,
                        capturedPhotos.length > 0
                            ? styles.saveButton
                            : styles.disabledButton,
                    ]}
                    onPress={saveDocuments}
                    disabled={capturedPhotos.length === 0 || saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <Text style={styles.controlButtonText}>
                            {capturedPhotos.length > 0 ? "Save" : "Save"}
                        </Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    )
}

const Stack = createNativeStackNavigator<DocumentStackParamList>()

export function DocumentNavigator() {
    return (
        <Stack.Navigator
            initialRouteName={DOCUMENT_ROUTES.DOCUMENTS_HOME}
            screenOptions={{
                animation: "slide_from_right",
            }}
        >
            <Stack.Screen
                name={DOCUMENT_ROUTES.DOCUMENTS_HOME}
                component={DocumentsHomeScreen}
                options={{ title: "My Documents" }}
            />
            <Stack.Screen
                name={DOCUMENT_ROUTES.DOCUMENT_DETAILS}
                component={DocumentDetailsScreen}
                options={{ title: "Document Details" }}
            />
            <Stack.Screen
                name={DOCUMENT_ROUTES.ADD_DOCUMENT}
                component={AddDocumentScreen}
                options={{ title: "Add Document" }}
            />
            <Stack.Screen
                name={DOCUMENT_ROUTES.EDIT_DOCUMENT}
                component={EditDocumentScreen}
                options={{ title: "Edit Document" }}
            />
            <Stack.Screen
                name={DOCUMENT_ROUTES.DOCUMENT_SCANNER}
                component={DocumentScannerScreen}
                options={{ title: "Scan Document" }}
            />
        </Stack.Navigator>
    )
}
// TODO remove styles for testing
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000",
    },
    camera: {
        flex: 1,
    },
    capturedContainer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#000",
        zIndex: 1,
    },
    captureCountText: {
        color: "#fff",
        fontSize: 16,
        textAlign: "center",
        marginTop: 20,
        marginBottom: 10,
    },
    capturedPhotosList: {
        padding: 10,
    },
    capturedImageContainer: {
        margin: 5,
        width: "47%",
        height: 200,
        position: "relative",
    },
    // TODO to be added preview of photo
    // eslint-disable-next-line react-native/no-unused-styles
    capturedImage: {
        width: "100%",
        height: "100%",
        borderRadius: 8,
    },
    removeButton: {
        position: "absolute",
        top: 5,
        right: 5,
        backgroundColor: "rgba(0,0,0,0.6)",
        width: 30,
        height: 30,
        borderRadius: 15,
        justifyContent: "center",
        alignItems: "center",
    },
    removeButtonText: {
        color: "#fff",
        fontSize: 16,
    },
    controlsContainer: {
        flexDirection: "row",
        justifyContent: "space-around",
        alignItems: "center",
        padding: 20,
        paddingBottom: 40, // Extra padding at bottom for better accessibility
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    controlButton: {
        padding: 15,
        borderRadius: 10,
        backgroundColor: "#333",
        minWidth: 80,
        alignItems: "center",
    },
    activeControlButton: {
        backgroundColor: "#4CAF50",
    },
    saveButton: {
        backgroundColor: "#2196F3",
    },
    controlButtonText: {
        color: "#fff",
        fontWeight: "bold",
    },
    captureButton: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: "#f44336",
        justifyContent: "center",
        alignItems: "center",
    },
    captureButtonInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#e57373",
    },
    disabledButton: {
        opacity: 0.5,
    },
    errorText: {
        color: "#fff",
        fontSize: 18,
        textAlign: "center",
        marginTop: 50,
    },
    button: {
        backgroundColor: "#2196F3",
        padding: 15,
        borderRadius: 10,
        margin: 20,
        alignItems: "center",
    },
    buttonText: {
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
    },
})
