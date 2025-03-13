import React from "react"
import { View, Text, Button, StyleSheet } from "react-native"
import BaseModal from "./BaseModal"

interface Props {
    isVisible: boolean
    message: string
    onConfirm: () => void
    onCancel: () => void
    children?: React.ReactNode
}

const Dialog: React.FC<Props> = ({
    isVisible,
    message,
    onConfirm,
    onCancel,
    children,
}) => {
    return (
        <BaseModal isVisible={isVisible} onClose={onCancel}>
            <View style={styles.container} testID="dialog-container">
                <Text style={styles.message} testID="dialog-message">
                    {message}
                </Text>
                {children && <View testID="dialog-content">{children}</View>}
                <Button
                    testID="dialog-confirm-button"
                    title="Confirm"
                    onPress={onConfirm}
                />
                <Button
                    testID="dialog-cancel-button"
                    title="Cancel"
                    onPress={onCancel}
                />
            </View>
        </BaseModal>
    )
}

const styles = StyleSheet.create({
    container: { padding: 20 },
    message: { fontSize: 16, marginBottom: 10 },
})

export default Dialog
