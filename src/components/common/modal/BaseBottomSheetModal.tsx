import React from "react"
import {
    Dimensions,
    Modal,
    StyleSheet,
    TouchableWithoutFeedback,
    View,
    ViewStyle,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import { useSafeAreaInsets } from "react-native-safe-area-context"

const screenHeight = Dimensions.get("window").height

interface IBaseBottomSheetModalProps {
    isVisible: boolean
    onClose: () => void
    dismissOnBackdropPress?: boolean
    children: React.ReactNode
    contentStyle?: ViewStyle
}

export function BaseBottomSheetModal({
    isVisible,
    onClose,
    dismissOnBackdropPress = true,
    children,
    contentStyle, // Added prop
}: IBaseBottomSheetModalProps) {
    const { colors } = useTheme()
    const insets = useSafeAreaInsets()

    return (
        <Modal
            transparent
            visible={isVisible}
            onRequestClose={onClose}
            animationType="slide"
        >
            <TouchableWithoutFeedback
                onPress={dismissOnBackdropPress ? onClose : undefined}
                testID="bottom-sheet-backdrop"
            >
                {/* Overlay */}
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View
                            style={[
                                styles.modalContainer,
                                {
                                    backgroundColor: colors.background,
                                    paddingBottom: insets.bottom,
                                    shadowColor: colors.shadow,
                                },
                                contentStyle,
                            ]}
                            testID="bottom-sheet-content"
                        >
                            <View
                                style={[
                                    styles.handleIndicator,
                                    { backgroundColor: colors.border + "80" },
                                ]}
                            />
                            {children}
                        </View>
                    </TouchableWithoutFeedback>
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
        justifyContent: "flex-end",
    },
    modalContainer: {
        width: "100%",
        maxHeight: screenHeight * 0.85,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 10,
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
        overflow: "hidden",
    },
    // eslint-disable-next-line react-native/no-color-literals
    handleIndicator: {
        width: 40,
        height: 5,
        borderRadius: 2.5,
        backgroundColor: "#CCCCCC",
        alignSelf: "center",
        marginBottom: 8,
    },
})
