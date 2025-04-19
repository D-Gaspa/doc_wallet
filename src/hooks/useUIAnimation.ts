import { useRef } from "react"
import { Animated } from "react-native"

/**
 * A hook that provides common UI animations
 */
export function useUIAnimations() {
    const buttonScale = useRef(new Animated.Value(1)).current
    const shakeAnimation = useRef(new Animated.Value(0)).current

    // Button press animation
    const animateButtonPress = () => {
        Animated.sequence([
            Animated.timing(buttonScale, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(buttonScale, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start()
    }

    // Shake animation for errors
    const shakeError = () => {
        Animated.sequence([
            Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: -10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: 10,
                duration: 50,
                useNativeDriver: true,
            }),
            Animated.timing(shakeAnimation, {
                toValue: 0,
                duration: 50,
                useNativeDriver: true,
            }),
        ]).start()
    }

    // Fade-in animation
    const fadeIn = (value: Animated.Value, duration = 300) => {
        Animated.timing(value, {
            toValue: 1,
            duration,
            useNativeDriver: true,
        }).start()
    }

    // Fade-out animation
    const fadeOut = (value: Animated.Value, duration = 300) => {
        Animated.timing(value, {
            toValue: 0,
            duration,
            useNativeDriver: true,
        }).start()
    }

    return {
        buttonScale,
        shakeAnimation,
        animateButtonPress,
        shakeError,
        fadeIn,
        fadeOut,
    }
}
