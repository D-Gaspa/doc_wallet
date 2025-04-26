import React from "react"
import { View, StyleSheet } from "react-native"
import Svg, { Circle, Path, G } from "react-native-svg"

interface LogoProps {
    size?: number
    primaryColor?: string
    secondaryColor?: string
    backgroundColor?: string
}

export function DocWalletLogo({
    size = 120,
    primaryColor = "#31859A",
    secondaryColor = "#CBE9F1",
    backgroundColor = "#FFFFFF",
}: LogoProps) {
    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg width={size} height={size} viewBox="0 0 200 200">
                {/* Círculo de fondo */}
                <Circle cx="100" cy="100" r="90" fill={primaryColor} />

                {/* Fondo circular más claro para resaltar el ícono */}
                <Circle
                    cx="100"
                    cy="100"
                    r="70"
                    fill={secondaryColor}
                    opacity="0.3"
                />

                {/* Ícono de carpeta adaptado y centrado */}
                <G scale="4" x="50" y="50">
                    <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M14.2929 1.29289C14.6834 0.902369 15.3166 0.902369 15.7071 1.29289L23.7071 9.29289C24.0976 9.68342 24.0976 10.3166 23.7071 10.7071L18 16.4142V19C18 20.6569 16.6569 22 15 22H5C2.23858 22 0 19.7614 0 17V8C0 5.79086 1.79086 4 4 4H11.5858L14.2929 1.29289ZM9.58579 6H4C2.89543 6 2 6.89543 2 8V17C2 18.6569 3.34315 20 5 20H15C15.5523 20 16 19.5523 16 19V16.0007C16 16.0002 16 15.9998 16 15.9993V11C16 10.4477 15.5523 10 15 10H8.00069C8.00023 10 7.99977 10 7.99931 10H5C3.89543 10 3 9.10457 3 8V7.5C3 6.94772 3.44772 6.5 4 6.5C4.55228 6.5 5 6.94772 5 7.5V8H7.58579L9.58579 6ZM10.4142 8H15C16.6569 8 18 9.34315 18 11V13.5858L21.5858 10L15 3.41421L12.7071 5.70711L10.4142 8Z"
                        fill={backgroundColor}
                    />
                </G>
            </Svg>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        alignItems: "center",
    },
})
