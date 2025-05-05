import React from "react"
import { Modal, View, TouchableWithoutFeedback, StyleSheet } from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import { ViewStyle } from "react-native"

interface IBaseModalProps {
    isVisible: boolean
    onClose: () => void
    dismissOnBackdropPress?: boolean
    children: React.ReactNode
    containerStyle?: ViewStyle
}

const BaseModal: React.FC<IBaseModalProps> = ({
    isVisible,
    onClose,
    dismissOnBackdropPress = true,
    children,
    containerStyle,
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
                            containerStyle,
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
        alignItems: "stretch",
    },
    modalContainer: {
        maxWidth: 600,
        width: "100%",
        height: "100%",
        padding: 0,
        borderRadius: 0,
    },
})

export default BaseModal
