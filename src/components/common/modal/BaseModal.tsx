import React from "react"
import { Modal, View, TouchableWithoutFeedback, StyleSheet } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"

interface IBaseModalProps {
    isVisible: boolean
    onClose: () => void
    dismissOnBackdropPress?: boolean
    children: React.ReactNode
}

const BaseModal: React.FC<IBaseModalProps> = ({
    isVisible,
    onClose,
    dismissOnBackdropPress = true,
    children,
}) => {
    const { colors } = useTheme()
    return (
        <Modal transparent visible={isVisible} testID="base-modal">
            <TouchableWithoutFeedback
                onPress={dismissOnBackdropPress ? onClose : undefined}
                testID="modal-backdrop"
            >
                <View style={styles.overlay}>
                    <View
                        style={[
                            styles.modalContainer,
                            { backgroundColor: colors.background },
                        ]}
                        testID="modal-content"
                    >
                        {children}
                    </View>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    // eslint-disable-next-line react-native/no-color-literals
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContainer: {
        padding: 20,
        borderRadius: 10,
    },
})

export default BaseModal
