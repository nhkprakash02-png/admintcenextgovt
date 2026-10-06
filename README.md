# TCE Admin

Standalone admin dashboard for **TCE – The Competitive Edge** (runs at `admin.tcenahata.in`).
It talks to the **same Firebase project (tce-nahata)** as the student website, so anything you
change here (approvals, uploads, notices, solution photos…) appears on the student site at once.

## Sections
| Tab | What's inside |
|---|---|
| Mock Manager | Mock/PYQ tests, question upload, solution photos |
| Students | Pending Approvals · Students List · Mock Results |
| PYQ Uploader | PYQ sets |
| GK Quiz | GK quiz pool |
| Materials | Study materials |
| Batches | Batches & fees |
| Updates | Banner Slider · Urgent Notice · Notices |
| Settings | System / database backup |

## Run it on your computer
```bash
npm install
cp .env.example .env.local     # then fill in ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_SESSION_SECRET
npm run dev                    # opens on http://localhost:3001
```

## Environment variables
| Name | Required | Purpose |
|---|---|---|
| `ADMIN_EMAIL` | yes | Admin login email (checked on the server) |
| `ADMIN_PASSWORD` | yes | Admin login password (checked on the server) |
| `ADMIN_SESSION_SECRET` | yes | Random text, 32+ characters, used to sign the login cookie |
| `NEXT_PUBLIC_FIREBASE_*` | no | Firebase settings; default to the live `tce-nahata` project |

The login is verified on the server and kept in a signed, HttpOnly cookie (7 days), so the
credentials are never inside the JavaScript sent to browsers, and the dashboard is not rendered
at all for anyone who isn't logged in. To change the email/password later, just change the
environment variables and redeploy.

## Deploy on Vercel (separate project, separate repo)
1. Create a new GitHub repository and push this folder to it.
2. Vercel → **Add New → Project** → import that repository (Framework: Next.js, no other settings).
3. Before deploying, add the three required environment variables above.
4. Deploy.
5. Project → **Settings → Domains** → add `admin.tcenahata.in`. Vercel shows a DNS record
   (normally `CNAME`, name `admin`, value `cname.vercel-dns.com`). Add exactly that record where
   your domain's DNS is managed, wait a few minutes, and Vercel issues the HTTPS certificate.

## Security notes (please read)
* This login protects the **dashboard**. The data itself lives in Firestore, and the admin
  screens write to it directly from the browser (as the old admin panel did), so your Firestore
  security rules must allow those writes. That also means the database is only as protected as
  those rules. The proper long-term fix is Firebase Authentication for the admin plus tighter
  Firestore rules.
* Never commit `.env` / `.env.local`. Use a long, unique password.
* There's a basic brake on repeated wrong passwords (8 tries per 15 minutes per address, best-effort on serverless).
