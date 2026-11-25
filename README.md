# Notes on Becoming
Private notebooks with passkey registration and sign-in. Visitors use the stable production URL directly from a portfolio. Each passkey registration creates an independent account, even if two people enter the same display name. Sign in with the original passkey to return to an existing journal.

## Development and deployment
Use Node 24, npm ci, npm test, then npm run build. Source for the notebook lives in src/client.js, src/style.css and src/shell.html. Edit src/auth-page.html for the sign-in experience. Vercel runs api/journal.js. Set a private Blob store token and a random server-only JOURNAL_SESSION_SECRET of at least 32 characters. Passkeys are scoped to notes-on-becoming.vercel.app; preserve that hostname when linking your portfolio.
## Existing owner's notes
The original archive remains accessible at /owner with the previous owner password. Export its JSON under Settings, sign out, create your passkey account, and import the file in Settings before your first save. JOURNAL_OWNER_PASSWORD is only needed for legacy access. Keep exports outside Git.
## Recovery
Use a passkey manager with device sync and export regular JSON backups. No email recovery is configured. A new account can import an export before its first save. Losing the only passkey and all exports prevents recovery through the app.
