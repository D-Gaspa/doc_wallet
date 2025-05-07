import React from "react"
import FontAwesome6 from "@react-native-vector-icons/fontawesome6"

type FontAwesome6AllPossibleProps = React.ComponentProps<typeof FontAwesome6>

type FontAwesome6SolidProps = Extract<
    FontAwesome6AllPossibleProps,
    { iconStyle: "solid" }
>

export type FA6IconName = FontAwesome6SolidProps["name"]
