import { useRef } from "react"
import { Animated, PanResponder } from "react-native"

/**
 * Custom hook that creates a swipe-to-dismiss gesture handler
 * Can be used for modal and drawer components
 *
 * @param onDismiss - Function to call when gesture should dismiss the component
 * @param threshold - Distance in pixels needed to trigger dismissal (default: 50)
 * @param direction - Direction of swipe that causes dismissal ('horizontal', 'vertical', or 'both', default: 'horizontal')
 * @param initialValue - Initial value for the animation (default: 0)
 *
 * @returns Object containing animated value, transform styles and panHandlers for PanResponder
 */
export function useDismissGesture({
    onDismiss,
    threshold = 50,
    direction = "horizontal",
    initialValue = 0,
}: {
    onDismiss: () => void
    threshold?: number
    direction?: "horizontal" | "vertical" | "both"
    initialValue?: number
}) {
    // Create animated value for gesture tracking
    const pan = useRef(new Animated.Value(initialValue)).current

    // Create interpolation for transform
    const translateX = pan.interpolate({
        inputRange: [-1, 0, 1],
        outputRange: [0, 0, 1],
    })

    // Create pan responder for gesture handling
    const panResponder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            // Apply movement based on configured direction
            if (direction === "horizontal" || direction === "both") {
                pan.setValue(gesture.dx)
            } else if (direction === "vertical") {
                pan.setValue(gesture.dy)
            }
        },
        onPanResponderRelease: (_, gesture) => {
            // Determine if should dismiss based on gesture distance and direction
            const shouldDismiss =
                (direction === "horizontal" &&
                    Math.abs(gesture.dx) > threshold) ||
                (direction === "vertical" && gesture.dy > threshold) ||
                (direction === "both" &&
                    (Math.abs(gesture.dx) > threshold ||
                        gesture.dy > threshold))

            if (shouldDismiss) {
                // Call dismiss callback
                onDismiss()
            } else {
                // Otherwise reset position with animation
                Animated.spring(pan, {
                    toValue: 0,
                    useNativeDriver: true,
                }).start()
            }
        },
    })

    // Return values and handlers for component to use
    return {
        pan,
        translateX,
        panHandlers: panResponder.panHandlers,
        resetPosition: () => {
            pan.setValue(0)
        },
    }
}
