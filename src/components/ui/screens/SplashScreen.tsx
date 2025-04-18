import React, { useEffect } from "react"
import { StyleSheet, Animated, Dimensions, StatusBar } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import { DocWalletLogo } from "../../common/DocWalletLogo.tsx"
const { width, height } = Dimensions.get("window")

interface SplashScreenProps {
    onFinish: () => void
    duration?: number
}

export function SplashScreen({ onFinish, duration = 2500 }: SplashScreenProps) {
    const { colors } = useTheme()
    const logoScale = new Animated.Value(0.8)
    const logoOpacity = new Animated.Value(0)
    const titleOpacity = new Animated.Value(0)
    const taglineOpacity = new Animated.Value(0)
    const containerOpacity = new Animated.Value(1)

    useEffect(() => {
        // Animation sequence
        Animated.sequence([
            // Logo animation
            Animated.parallel([
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.spring(logoScale, {
                    toValue: 1,
                    friction: 7,
                    tension: 40,
                    useNativeDriver: true,
                }),
            ]),
            // Fade in title
            Animated.timing(titleOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // Fade in tagline
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            // Wait a bit
            Animated.delay(duration - 2000),
            // Fade out entire screen
            Animated.timing(containerOpacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start(() => {
            // Call onFinish when animation completes
            onFinish()
        })
    }, [])

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    backgroundColor: colors.primary,
                    opacity: containerOpacity,
                },
            ]}
        >
            <StatusBar hidden />

            <Animated.View
                style={[
                    styles.logoContainer,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <DocWalletLogo
                    size={160}
                    primaryColor={colors.primary}
                    secondaryColor={colors.secondary}
                    backgroundColor={colors.tabbarIcon_active}
                />
            </Animated.View>

            <Animated.Text
                style={[
                    styles.title,
                    {
                        color: colors.tabbarIcon_active,
                        opacity: titleOpacity,
                    },
                ]}
            >
                DocWallet
            </Animated.Text>

            <Animated.Text
                style={[
                    styles.tagline,
                    {
                        color: colors.tabbarIcon_active,
                        opacity: taglineOpacity,
                    },
                ]}
            >
                All your documents, always with you.
            </Animated.Text>
        </Animated.View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width,
        height,
    },
    logoContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 50,
    },
    title: {
        fontSize: 42,
        fontWeight: "bold",
        marginBottom: 16,
        fontFamily: "Inter-Bold",
    },
    tagline: {
        fontSize: 18,
        fontFamily: "Inter-Medium",
        textAlign: "center",
        paddingHorizontal: 40,
    },
})
