// src/components/ui/screens/settings/SettingsItem.tsx (or wherever it's located)
import React, { ReactNode } from "react"
// ---> Import StyleProp and TextStyle <---
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ViewStyle,
    StyleProp,
    TextStyle,
} from "react-native"
import { useTheme } from "../../../../hooks/useTheme" // Adjust path if needed
import { Row } from "../../layout" // Adjust path if needed
import { Text } from "../../typography" // Adjust path if needed
import RightChevronIcon from "../../assets/svg/chevron-right.svg" // Adjust path if needed

// Props for the SettingItem component
interface SettingItemProps {
    label: string
    icon?: ReactNode
    onPress?: () => void
    rightContent?: ReactNode
    isLastItem?: boolean
    containerStyle?: StyleProp<ViewStyle>
    labelStyle?: StyleProp<TextStyle> // ---> Add labelStyle prop <---
}

export const SettingItem: React.FC<SettingItemProps> = ({
    label,
    icon,
    onPress,
    rightContent,
    isLastItem = false,
    containerStyle,
    labelStyle, // ---> Destructure labelStyle <---
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
            activeOpacity={onPress ? 0.7 : 1}
            accessibilityRole={onPress ? "button" : undefined}
        >
            <Row align="center" justify="space-between">
                {/* Left side: Icon and Label */}
                <Row align="center" style={styles.labelContainer}>
                    {icon && <View style={styles.iconWrapper}>{icon}</View>}
                    {/* Apply labelStyle here */}
                    <Text variant="base" style={[styles.label, labelStyle]}>
                        {label}
                    </Text>
                </Row>

                {/* Right side: Custom Content or Chevron */}
                <View style={styles.rightWrapper}>
                    {rightContent}
                    {showChevron && (
                        <RightChevronIcon
                            width={16}
                            height={16}
                            color={colors.secondaryText}
                        />
                    )}
                </View>
            </Row>
        </Wrapper>
    )
}

// Styles specific to SettingItem
const styles = StyleSheet.create({
    itemContainer: {
        paddingVertical: 16,
        paddingHorizontal: 15,
    },
    labelContainer: {
        flex: 1,
        marginRight: 10,
    },
    iconWrapper: {
        marginRight: 16,
        width: 24,
        alignItems: "center",
    },
    label: {
        // Base label style if needed, otherwise rely on variant
        fontSize: 16,
    },
    rightWrapper: {
        flexDirection: "row",
        alignItems: "center",
    },
})
