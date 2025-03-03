import type { PropsWithChildren } from "react"
import React, { useEffect } from "react"
import {
    Alert,
    Button,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    useColorScheme,
    View,
} from "react-native"

import {
    Colors,
    DebugInstructions,
    Header,
    LearnMoreLinks,
    ReloadInstructions,
} from "react-native/Libraries/NewAppScreen"

import { useAuth } from "./hooks/useAuth.ts"
import { ENV, isDevelopment } from "./config/env.ts"

type SectionProps = PropsWithChildren<{
    title: string
}>

function Section({ children, title }: SectionProps): React.JSX.Element {
    const isDarkMode = useColorScheme() === "dark"
    return (
        <View style={styles.sectionContainer}>
            <Text
                style={[
                    styles.sectionTitle,
                    {
                        color: isDarkMode ? Colors.white : Colors.black,
                    },
                ]}
            >
                {title}
            </Text>
            <Text
                style={[
                    styles.sectionDescription,
                    {
                        color: isDarkMode ? Colors.light : Colors.dark,
                    },
                ]}
            >
                {children}
            </Text>
        </View>
    )
}

function App(): React.JSX.Element {
    const isDarkMode = useColorScheme() === "dark"

    const backgroundStyle = {
        backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
    }

    const { isLoading, loginWithGoogle, user, logout } = useAuth()

    useEffect(() => {
        if (isDevelopment) {
            console.log("App running in environment:", ENV.ENV_NAME)

            // Check if required config is available
            if (!ENV.GOOGLE_CLIENT_ID_IOS) {
                console.warn(
                    "Missing Google client IDs for IOS in environment configuration"
                )
            }
            if (!ENV.GOOGLE_CLIENT_ID_ANDROID) {
                console.warn(
                    "Missing Google client IDs for Android in environment configuration"
                )
            }
        }
    }, [])

    return (
        <SafeAreaView style={[backgroundStyle, styles.safeArea]}>
            <StatusBar
                barStyle={isDarkMode ? "light-content" : "dark-content"}
                backgroundColor={backgroundStyle.backgroundColor}
            />
            <ScrollView
                style={backgroundStyle}
                contentInsetAdjustmentBehavior="automatic"
            >
                <Header />
                <View
                    style={{
                        backgroundColor: isDarkMode
                            ? Colors.black
                            : Colors.white,
                    }}
                >
                    <Text style={styles.appName}>{ENV.APP_NAME}</Text>
                    {isDevelopment && (
                        <Text style={styles.envLabel}>
                            Environment: {ENV.ENV_NAME}
                        </Text>
                    )}

                    <Section title="Authentication">
                        {user ? (
                            <View>
                                <Text style={styles.welcomeText}>
                                    Welcome, {user.name || user.email}!
                                </Text>
                                <Button
                                    title="Logout"
                                    onPress={logout}
                                    disabled={isLoading}
                                />
                            </View>
                        ) : (
                            <View>
                                <Text>Sign in to manage your documents</Text>
                                <Button
                                    title={
                                        isLoading
                                            ? "Logging in..."
                                            : "Login with Google"
                                    }
                                    onPress={async () => {
                                        try {
                                            await loginWithGoogle()
                                        } catch {
                                            Alert.alert(
                                                "Login Failed",
                                                "Could not sign in with Google. Please try again."
                                            )
                                        }
                                    }}
                                    disabled={isLoading}
                                />
                            </View>
                        )}
                    </Section>

                    {/* Only show these sections in development mode */}
                    {isDevelopment && (
                        <>
                            <Section title="See Your Changes">
                                <ReloadInstructions />
                            </Section>
                            <Section title="Debug">
                                <DebugInstructions />
                            </Section>
                            <Section title="Learn More">
                                <Text>
                                    Read the docs to discover what to do next:
                                </Text>
                            </Section>
                            <LearnMoreLinks />
                        </>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    sectionContainer: {
        marginTop: 32,
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: "600",
    },
    sectionDescription: {
        marginTop: 8,
        fontSize: 18,
        fontWeight: "400",
    },
    appName: {
        fontSize: 28,
        fontWeight: "bold",
        textAlign: "center",
        marginVertical: 20,
    },
    envLabel: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 20,
        opacity: 0.7,
    },
    welcomeText: {
        fontSize: 16,
        marginBottom: 10,
    },
})

export default App
