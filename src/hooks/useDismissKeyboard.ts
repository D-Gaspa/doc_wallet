import { useCallback } from "react"
import { Keyboard, ViewProps } from "react-native"

/**
 * A hook that returns props for a view that will dismiss the keyboard when touched.
 * Used to create a user-friendly experience where tapping outside inputs will dismiss keyboard.
 */
export const useDismissKeyboard = (): Pick<
    ViewProps,
    "onStartShouldSetResponder" | "onResponderRelease"
> => {
    const handleStartShouldSetResponder = useCallback(() => true, [])
    const handleResponderRelease = useCallback(() => {
        Keyboard.dismiss()
    }, [])

    return {
        onStartShouldSetResponder: handleStartShouldSetResponder,
        onResponderRelease: handleResponderRelease,
    }
}
