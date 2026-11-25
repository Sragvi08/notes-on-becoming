# Notes on Becoming

_Kindling Curiosity_

Notes on Becoming is a private journaling app designed around the experience of turning the pages of a spiral notebook. Its teal cover, engraved flame, ruled paper, and handwritten entries carry that idea through from the first visit to browsing an old note.

[Open the live journal](https://notes-on-becoming.vercel.app/)

## Inside the notebook

| Section         | What you can do                                                                                                                     |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Daily Log**   | Write dated notes, organize them with tags, and find them again by keyword, tag, or date. A full day flows onto continuation pages. |
| **Tech Log**    | Browse notes with technical tags. Editing a note here updates the same entry in Daily Log.                                          |
| **Habit Log**   | Set goals and record check-ins in weekly and monthly views.                                                                         |
| **Reflections** | Write weekly or monthly reflections and link them to earlier notes.                                                                 |

The layout shows facing pages on desktop and one page at a time on mobile. Page turns respect reduced-motion preferences. Settings also include handwriting preferences, a full JSON archive export, and a Markdown export for notes.

## Create a journal

Open the live app, choose **Create your own journal**, enter a display name, and save a passkey. Select **Sign in with a passkey** on subsequent visits. Every registration gets its own private notebook. For access across devices, save the passkey in a manager that supports sync. Keep a JSON backup of your journal because email-based account recovery is currently unavailable.

## Development and deployment

Use Node 24, npm ci, npm test, then npm run build. Source for the notebook lives in src/client.js, src/style.css and src/shell.html. Edit src/auth-page.html for the sign-in experience. Vercel runs api/journal.js. Set a private Blob store token and a random server-only JOURNAL_SESSION_SECRET of at least 32 characters. Passkeys are scoped to notes-on-becoming.vercel.app; preserve that hostname when linking your portfolio.


## Recovery

Use a passkey manager with device sync and export regular JSON backups. No email recovery is configured. A new account can import an export before its first save. Losing the only passkey and all exports prevents recovery through the app.
