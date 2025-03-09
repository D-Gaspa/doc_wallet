export const typography = {
    fontSize: {
        xl: 64, // i.e "Bienvenido a DocWallet" en la página de inicio
        lg: 60, // i.e los títulos de páginas "Carpetas", "Documentos de viaje", etc.
        md: 24, //i.e subtitles
        base: 20, // i.e títulos de documentos, nombre de usuario, resultados de búsqueda, etc
        sm: 15, // i.e "Ya tengo una cuenta" en la página de registro
        xm: 12,
    },

    lineHeight: {
        xl: 60,
        lg: 60,
        md: 26,
        base: 23,
        sm: 18,
        xm: 14,
    },

    // Only medium and bold used in the Figma
    fonts: {
        regular: { fontFamily: "Inter-Regular", fontWeight: "400" as const },
        medium: { fontFamily: "Inter-Medium", fontWeight: "500" as const },
        bold: { fontFamily: "Inter-Bold", fontWeight: "700" as const },
        heavy: { fontFamily: "Inter-Heavy", fontWeight: "900" as const },
    },
}
