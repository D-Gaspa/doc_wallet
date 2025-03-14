declare module "*.svg" {
    import React from "react"
    import { SvgProps } from "react-native-svg"
    const content: React.FC<SvgProps>
    export default content
}

declare module "*.png" {
    const src: string
    export default src
}

declare module "*.jpg" {
    const src: string
    export default src
}

declare module "*.jpeg" {
    const src: string
    export default src
}
