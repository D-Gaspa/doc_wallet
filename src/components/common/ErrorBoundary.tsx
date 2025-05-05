import React, { Component, ErrorInfo, ReactNode } from "react"
import { ErrorTrackingService } from "../../services/monitoring/errorTrackingService"
import { LoggingService } from "../../services/monitoring/loggingService"
import { View, Text, StyleSheet } from "react-native"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
    private readonly logger: { error: (message: string, error: Error) => void }

    constructor(props: Props) {
        super(props)
        this.state = { hasError: false }

        this.logger = LoggingService.getLogger
            ? LoggingService.getLogger("ErrorBoundary")
            : { error: console.error }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    componentDidCatch(error: Error, info: ErrorInfo) {
        console.log("ErrorBoundary caught an error:", error)

        if (!this.logger || typeof this.logger.error !== "function") {
            console.error("Logger is undefined! Using console.error instead.")
            console.error("UI Error caught by boundary", error)
        } else {
            this.logger.error("UI Error caught by boundary", error)
        }

        ErrorTrackingService.handleError(error, false)
        this.setState({ hasError: true })
    }

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <Text style={styles.errorText}>Something went wrong.</Text>
                </View>
            )
        }
        return this.props.children
    }
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: "center", alignItems: "center" },
    // eslint-disable-next-line react-native/no-color-literals
    errorText: { fontSize: 18, color: "red" },
})

export default ErrorBoundary
