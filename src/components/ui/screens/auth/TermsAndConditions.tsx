// src/components/ui/screens/TermsAndConditionsScreen.tsx
import React, { useState, useCallback } from "react"
import {
    View,
    StyleSheet,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
    TouchableOpacity,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme"
import { Stack } from "../../layout"
import { Text } from "../../typography"
import { Button } from "../../button"

interface Props {
    onAccept: () => void
    onDecline?: () => void
}

export function TermsAndConditionsScreen({ onAccept, onDecline }: Props) {
    const { colors } = useTheme()
    const [canAccept, setCanAccept] = useState(false)

    const handleScroll = useCallback(
        (e: NativeSyntheticEvent<NativeScrollEvent>) => {
            const { layoutMeasurement, contentOffset, contentSize } =
                e.nativeEvent
            if (
                layoutMeasurement.height + contentOffset.y >=
                contentSize.height - 20
            ) {
                setCanAccept(true)
            }
        },
        [],
    )

    return (
        <View
            style={[styles.container, { backgroundColor: colors.background }]}
        >
            <Stack spacing={16} style={styles.inner}>
                <Text variant="lg" weight="bold" style={{ color: colors.text }}>
                    Términos y condiciones
                </Text>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    onScroll={handleScroll}
                    scrollEventThrottle={200}
                >
                    {/* Aquí pon tu texto real de T&C */}
                    <Text
                        style={[styles.text, { color: colors.secondaryText }]}
                    >
                        1. Introducción{"\n"}
                        Bienvenido a DocWallet. Al usar esta aplicación,
                        aceptas...
                    </Text>
                    <Text
                        style={[styles.text, { color: colors.secondaryText }]}
                    >
                        2. Uso permitido{"\n"}
                        No debes usar la app para...
                    </Text>
                    {/* ... más secciones ... */}
                    <Text
                        style={[styles.text, { color: colors.secondaryText }]}
                    >
                        10. Privacidad{"\n"}
                        Tus datos están encriptados y...
                    </Text>
                </ScrollView>

                <Button
                    title="Acepto"
                    onPress={onAccept}
                    disabled={!canAccept}
                    style={styles.acceptButton}
                />

                {onDecline && (
                    <TouchableOpacity
                        onPress={onDecline}
                        style={styles.declineLink}
                    >
                        <Text style={{ color: colors.primary }} weight="medium">
                            Cancelar
                        </Text>
                    </TouchableOpacity>
                )}
            </Stack>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    inner: {
        flex: 1,
        padding: 24,
        justifyContent: "flex-start",
    },
    scroll: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
    },
    scrollContent: {
        padding: 16,
    },
    text: {
        marginBottom: 12,
        lineHeight: 22,
        fontSize: 14,
    },
    acceptButton: {
        marginBottom: 12,
    },
    declineLink: {
        alignSelf: "center",
        padding: 8,
    },
})
