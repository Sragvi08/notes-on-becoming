# Notes on Becoming

*Kindling Curiosity*

Notes on Becoming is a private journaling app designed around the experience of turning the pages of a spiral notebook. Its teal cover, engraved flame, ruled paper, and handwritten entries carry that idea through from the first visit to browsing an old note.

[Open the live journal](https://notes-on-becoming.vercel.app/)

## Inside the notebook

| Section | What you can do |
| --- | --- |
| **Daily Log** | Write dated notes, organize them with tags, and find them again by keyword, tag, or date. A full day flows onto continuation pages. |
| **Tech Log** | Browse notes with technical tags. Editing a note here updates the same entry in Daily Log. |
| **Habit Log** | Set goals and record check-ins in weekly and monthly views. |
| **Reflections** | Write weekly or monthly reflections and link them to earlier notes. |

The layout shows facing pages on desktop and one page at a time on mobile. Page turns respect reduced-motion preferences. Settings also include handwriting preferences, a full JSON archive export, and a Markdown export for notes.

## Create a journal

Open the live app, choose **Create your own journal**, enter a display name, and save a passkey. Select **Sign in with a passkey** on subsequent visits. Every registration gets its own private notebook. For access across devices, save the passkey in a manager that supports sync. Keep a JSON backup of your journal because email-based account recovery is currently unavailable.

## How it works

The interface uses vanilla JavaScript, HTML, and CSS. SimpleWebAuthn handles passkey registration and verification, and iron-session seals the session cookie. A Vercel Function verifies the session and selects the corresponding account archive in private Vercel Blob storage. Revision checks protect against stale saves from another tab.

| File | Responsibility |
| --- | --- |
| [`src/client.js`](src/client.js) | Notebook interactions, pagination, and journal views |
| [`src/style.css`](src/style.css) and [`src/shell.html`](src/shell.html) | Notebook layout and visual design |
| [`src/auth-page.html`](src/auth-page.html) and [`src/accounts.mjs`](src/accounts.mjs) | Sign-in interface, passkey verification, and session handling |
| [`api/journal.js`](api/journal.js) and [`src/model.mjs`](src/model.mjs) | Journal API, archive storage, and validation |
| [`test/accounts.mjs`](test/accounts.mjs) | Tests for account isolation, returning sign-in, and replay rejection using simulated storage |

## Build and test

Use **Node.js 24** and run these commands from the repository root.

```bash
npm ci
npm test
npm run build
```

The build generates `src/journal.html` and `src/signin.html` from the editable source. The test suite runs without production credentials. Passkey testing in a browser requires an HTTPS deployment that matches the configured hostname.

## Deploy to Vercel

1. Connect the GitHub repository to the Vercel project. The build command is defined in [`vercel.json`](vercel.json).
2. Connect a **private Vercel Blob store** to the project.
3. Set the following environment variables in Vercel before deploying.

| Variable | Purpose |
| --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Server-side access to the private Blob store. |
| `JOURNAL_SESSION_SECRET` | Random server-side secret of at least 32 characters used to seal session cookies. |
| `JOURNAL_OWNER_PASSWORD` | Optional password for accessing the original single-user archive during migration. |

The current passkey configuration targets `notes-on-becoming.vercel.app`. A separate deployment needs the relying-party hostname and expected origin in the authentication code updated to match its HTTPS domain, including the sign-in redirect in `api/journal.js`. Existing passkeys are scoped to the hostname where they were created.

Keep credential values in Vercel and journal exports outside the repository.

### Migrate an existing archive

Export JSON from **Settings** in the original notebook. To access a legacy archive on the same Vercel project, open `/owner` using the original owner password. Sign out, create a passkey account, and use **Settings → Import previous journal** before saving anything in the new account.
