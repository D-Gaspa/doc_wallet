import React, { ReactNode } from "react"
import {
    StyleProp,
    StyleSheet,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"
import { useTheme } from "../../../../hooks/useTheme"
import { Row } from "../../layout"
import { Text } from "../../typography"

interface SettingItemProps {
    label: string
    icon?: ReactNode
    onPress?: () => void
    rightContent?: ReactNode
    isLastItem?: boolean
    containerStyle?: StyleProp<ViewStyle>
    labelStyle?: StyleProp<TextStyle>
    testID?: string
}

export const SettingItem: React.FC<SettingItemProps> = ({
    label,
    icon,
    onPress,
    rightContent,
    isLastItem = false,
    containerStyle,
    labelStyle,
    testID,
}) => {
    const { colors } = useTheme()
    const Wrapper = onPress ? TouchableOpacity : View
    const showChevron = onPress && !rightContent

    return (
        <Wrapper
            onPress={onPress}
            style={[
                styles.itemContainer,
                !isLastItem && {
                    borderBottomColor: colors.border,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                },
                containerStyle,
            ]}
            testID={testID}
            activeOpacity={onPress ? 0.7 : 1}
            accessibilityRole={onPress ? "button" : undefined}
            accessibilityLabel={label}
            accessibilityHint={onPress ? "Navigates to setting" : undefined}
        >
            <Row
                align="center"
                justify="space-between"
                style={styles.contentRow}
            >
                {/* Left side: Icon and Label */}
                <Row align="center" style={styles.labelContainer} spacing={0}>
                    {icon && <View style={styles.iconWrapper}>{icon}</View>}
                    <Text
                        variant="base"
                        style={[styles.label, labelStyle]}
                        numberOfLines={1}
                    >
                        {label}
                    </Text>
                </Row>

                {/* Right side: Custom Content or Chevron */}
                <View style={styles.rightWrapper}>
                    {rightContent}
                    {showChevron && (
                        <FontAwesome6
                            name="chevron-right"
                            size={14}
                            color={colors.secondaryText}
                            iconStyle="solid"
                            style={styles.chevronIcon}
                        />
                    )}
                </View>
            </Row>
        </Wrapper>
    )
}

const styles = StyleSheet.create({
    itemContainer: {
        paddingVertical: 16,
        paddingHorizontal: 15,
    },
    contentRow: {
        minHeight: 24,
    },
    labelContainer: {
        flex: 1,
        marginRight: 10,
    },
    iconWrapper: {
        marginRight: 16,
        width: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    label: {
        fontSize: 16,
    },
    rightWrapper: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
    },
    chevronIcon: {
        marginLeft: 6,
    },
})
