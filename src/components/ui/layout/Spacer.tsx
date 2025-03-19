import React from "react"
import { View } from "react-native"

export interface SpacerProps {
    size?: number // Default spacing if no value is provided
    horizontal?: boolean // If true, adds horizontal spacing instead of vertical
}

export function Spacer({ size = 10, horizontal = false }: SpacerProps) {
    return <View style={{ [horizontal ? "width" : "height"]: size }} />
}
