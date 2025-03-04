import React from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { DocumentStackParamList } from "./types"
import { DOCUMENT_ROUTES } from "./routes"
import { Text } from "react-native"

// Import screen placeholders - these will be implemented later
const DocumentsHomeScreen = () => (
    <Text testID="documents-home-screen">Documents Home</Text>
)
const DocumentDetailsScreen = () => null
const AddDocumentScreen = () => null
const EditDocumentScreen = () => null
const DocumentScannerScreen = () => null

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
