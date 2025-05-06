import { Alert } from "react-native"

type ReplaceSourceOption = "upload" | "scan" | "cancel"

export function promptReplaceSource(
    onSelect: (option: ReplaceSourceOption) => void,
) {
    Alert.alert(
        "Replace Document",
        "Choose how you'd like to replace the document:",
        [
            {
                text: "Cancel",
                style: "cancel",
                onPress: () => onSelect("cancel"),
            },
            { text: "Scan Document", onPress: () => onSelect("scan") },
            { text: "Upload Document", onPress: () => onSelect("upload") },
        ],
        { cancelable: true },
    )
}
