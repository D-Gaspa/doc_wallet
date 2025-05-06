import React from "react"
import {
    Modal,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native"
import { useTheme } from "../../../hooks/useTheme.ts"
import { Stack } from "../../ui/layout"
import ExitIcon from "../../ui/assets/svg/close.svg"

export interface ActionOption {
    label: string
    action: () => void
    icon?: React.ReactNode
    style?: TextStyle
    testID?: string
}

interface ActionModalBaseProps {
    isVisible: boolean
    onClose: () => void
    title: string
    menuOptions: ActionOption[]
}

export function ActionModalBase({
    isVisible,
    onClose,
    title,
    menuOptions,
}: ActionModalBaseProps) {
    const { colors } = useTheme()

    const allOptions: ActionOption[] = [
        ...menuOptions,
        {
            label: "Close",
            action: onClose,
            icon: (
                <ExitIcon
                    width={20}
                    height={20}
                    stroke={colors.secondaryText}
                />
            ),
            style: { color: colors.secondaryText },
            testID: "action-modal-close-button",
        },
    ]

    return (
        <Modal
            visible={isVisible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View
                    style={[
                        styles.overlay,
                        { backgroundColor: colors.shadow + "60" },
                    ]}
                >
                    <TouchableWithoutFeedback
                        onPress={(e) => e.stopPropagation()}
                    >
                        <View
                            style={[
                                styles.modalContent,
                                {
                                    backgroundColor: colors.card,
                                    shadowColor: colors.shadow,
                                },
                            ]}
                        >
                            <Text
                                style={[styles.title, { color: colors.text }]}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                            >
                                {title}
                            </Text>
                            <Stack spacing={0} style={styles.optionsStack}>
                                {allOptions.map((option, index) => (
                                    <TouchableOpacity
                                        key={option.label}
                                        style={[
                                            styles.optionButton,
                                            index < allOptions.length - 1 && {
                                                borderBottomColor:
                                                    colors.border,
                                                borderBottomWidth:
                                                    StyleSheet.hairlineWidth,
                                            },
                                        ]}
                                        onPress={option.action}
                                        testID={option.testID}
                                        activeOpacity={0.7}
                                    >
                                        {option.icon && (
                                            <View style={styles.iconWrapper}>
                                                {option.icon}
                                            </View>
                                        )}
                                        <Text
                                            style={[
                                                styles.optionText,
                                                option.style,
                                            ]}
                                        >
                                            {option.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </Stack>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        maxWidth: 320,
        borderRadius: 12,
        paddingTop: 15,
        paddingBottom: 0,
        paddingHorizontal: 0,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        overflow: "hidden",
    },
    title: {
        fontSize: 18,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 15,
        paddingHorizontal: 15,
    },
    optionsStack: {},
    optionButton: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 20,
    },
    iconWrapper: {
        marginRight: 15,
        width: 24,
        alignItems: "center",
    },
    optionText: {
        fontSize: 16,
        fontWeight: "500",
    },
})
