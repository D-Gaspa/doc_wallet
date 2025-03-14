import React, { useState } from "react"
import { ThemeProvider } from "./context/ThemeContext.tsx"
import { ScrollView, StyleSheet, View } from "react-native"
import { TabBar } from "./components/ui/Layout/TabBar/TabBar.tsx"
import { useTheme } from "./hooks/useTheme.ts"
import { SearchBar } from "./components/ui/SearchBar"
import { Container, Row, Spacer, Stack } from "./components/ui/Layout"
import { Checkbox, TextField } from "./components/ui/Form"
import { Button } from "./components/ui/Button"
import { Alert, Toast } from "./components/ui/Feedback"
import {
    DocumentCard,
    DocumentCardCarousel,
    FolderCard,
} from "./components/ui/Cards"
import { Text } from "./components/ui/Typography"
import { ProfileHeader } from "./components/ui/ProfileHeader"

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    )
}

const AppContent = () => {
    const { colors, toggleTheme } = useTheme()
    const [activeTab, setActiveTab] = useState("Home")
    const [checked, setChecked] = useState(false)
    const [text, setText] = useState<string>("")
    const [toastVisible, setToastVisible] = useState<boolean>(false)
    const [alertVisible, setAlertVisible] = useState<boolean>(false)

    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const CURP = require("../src/components/ui/assets/images/curp-ejemplo.jpg")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const INE = require("../src/components/ui/assets/images/ine-ejemplo.jpeg")
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Pasaporte = require("../src/components/ui/assets/images/pasaporte-ejemplo.jpg")

    return (
        <View style={[styles.screen, { backgroundColor: colors.background }]}>
            <ScrollView>
                <Container>
                    <Stack spacing={10}>
                        <Spacer size={10} />
                        <Text variant="xl" weight="bold">
                            Bienvenido a DocWallet
                        </Text>
                        <Text variant="lg" weight="bold">
                            Carpetas
                        </Text>
                        <Text variant="md" weight="medium">
                            Subtítulo
                        </Text>
                        <Text variant="base" weight="regular">
                            Nombre de usuario
                        </Text>
                        <Text variant="sm" weight="regular">
                            Ya tengo una cuenta
                        </Text>
                        <Text variant="xm" weight="regular">
                            Texto muy pequeño
                        </Text>
                        <Spacer size={10} />
                        <Row spacing={5}>
                            <Text style={styles.text}>
                                Current Tab: {activeTab}
                            </Text>
                            <Spacer size={15} horizontal />
                            <Checkbox
                                checked={checked}
                                label={"Checked checkbox?"}
                                onToggle={() => setChecked(!checked)}
                            />
                        </Row>
                        <SearchBar
                            placeholder="Buscar..."
                            onSearch={(query) =>
                                console.log("Searching for:", query)
                            }
                        />
                        <Button
                            title="Toggle theme"
                            onPress={() => {
                                toggleTheme()
                                setToastVisible(!toastVisible)
                            }}
                        />
                        <Toast
                            message="This is a toast message - toggle theme "
                            visible={toastVisible}
                        />
                        <TextField
                            placeholder={"Write something"}
                            value={text}
                            onChangeText={(newText) => setText(newText)}
                        />
                        <DocumentCardCarousel
                            documents={[
                                {
                                    type: "expiring",
                                    title: "INE",
                                    expirationDate: "25 de Abril de 2025",
                                },
                                {
                                    type: "expiring",
                                    title: "Visa USA",
                                    expirationDate: "10 de Marzo de 2025",
                                },
                                {
                                    type: "expiring",
                                    title: "Pasaporte",
                                    expirationDate: "30 de Julio de 2025",
                                },
                            ]}
                            onPress={(title) =>
                                console.log("Viewing document:", title)
                            }
                        />

                        <DocumentCardCarousel
                            documents={[
                                {
                                    title: "CURP",
                                    type: "favorite",
                                    image: CURP,
                                },
                                { title: "INE", type: "favorite", image: INE },
                                {
                                    title: "Pasaporte",
                                    type: "favorite",
                                    image: Pasaporte,
                                },
                            ]}
                            onPress={(title) =>
                                console.log("Viewing document:", title)
                            }
                        />
                        <Stack spacing={5}>
                            <DocumentCard
                                title={"INE"}
                                image={INE}
                                onPress={() => setAlertVisible(!alertVisible)}
                            />
                            <DocumentCard
                                title={"CURP"}
                                image={CURP}
                                onPress={() => setAlertVisible(!alertVisible)}
                            />
                            <DocumentCard
                                title={"Pasaporte"}
                                image={Pasaporte}
                                onPress={() => setAlertVisible(!alertVisible)}
                            />
                        </Stack>
                        <Alert
                            type="warning"
                            message="You clicked on a document !"
                            visible={alertVisible}
                            onClose={() => setAlertVisible(false)} // Hide on close
                        />
                    </Stack>

                    <Spacer size={30} />

                    <Stack spacing={5}>
                        <FolderCard
                            title="Documentos de viajes"
                            type="travel"
                            onPress={() =>
                                console.log("Opening travel documents")
                            }
                        />
                        <FolderCard
                            title="Recets médicas"
                            type="medical"
                            onPress={() =>
                                console.log("Opening medical documents")
                            }
                        />
                    </Stack>

                    <Spacer size={30} />

                    <ProfileHeader
                        username="Georgina Zerón"
                        profileImage={undefined}
                        onPressEdit={() => console.log("Edit??")}
                    />
                </Container>
            </ScrollView>
            <View style={styles.tabBarWrapper}>
                <TabBar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onAddPress={() => console.log("Center Add Button Pressed!")}
                />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "space-between",
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
    },
    tabBarWrapper: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
    },
})
