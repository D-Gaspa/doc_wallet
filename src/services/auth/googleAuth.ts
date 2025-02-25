export const googleConfig = {
    issuer: "https://accounts.google.com",
    clientId: process.env.GOOGLE_CLIENT_ID,
    redirectUrl: "com.doc_wallet.auth://oauth",
    scopes: ["openid", "profile", "email"],
    serviceConfiguration: {
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenEndpoint: "https://www.googleapis.com/oauth2/v4/token",
        revocationEndpoint: "https://oauth2.googleapis.com/revoke",
    },
}
