import React, { useEffect, useRef } from "react"
import { StyleSheet, Animated, Dimensions, StatusBar } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import { DocWalletLogo } from "../../common/DocWalletLogo.tsx"
const { width, height } = Dimensions.get("window")

interface SplashScreenProps {
    onFinish?: () => void
    duration?: number
}

export function SplashScreen({ onFinish, duration = 2500 }: SplashScreenProps) {
    const { colors } = useTheme()
    const logoScale = useRef(new Animated.Value(0.8)).current
    const logoOpacity = useRef(new Animated.Value(0)).current
    const titleOpacity = useRef(new Animated.Value(0)).current
    const taglineOpacity = useRef(new Animated.Value(0)).current
    const containerOpacity = useRef(new Animated.Value(1)).current

    useEffect(() => {
        Animated.sequence([
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
            Animated.timing(titleOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(taglineOpacity, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.delay(duration - 2000),
            Animated.timing(containerOpacity, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (onFinish) {
                setTimeout(onFinish, 0)
            }
        })
    }, [
        duration,
        logoOpacity,
        logoScale,
        titleOpacity,
        taglineOpacity,
        containerOpacity,
        onFinish,
    ])

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
                    styles.contentContainer,
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
                    Tus documentos, siempre contigo.
                </Animated.Text>
            </Animated.View>
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
    contentContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontSize: 42,
        fontWeight: "bold",
        marginTop: 10,
        fontFamily: "Inter-Bold",
        textAlign: "center",
    },
    tagline: {
        fontSize: 18,
        fontFamily: "Inter-Medium",
        textAlign: "center",
        marginTop: 8,
        paddingHorizontal: 40,
    },
})
