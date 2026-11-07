# Clipcanva

Clipcanva is a visual clipboard for design and development work. Collect
screenshots, design references, code snippets, links, and notes on one canvas.

## Run locally

Serve this folder over HTTP; ES modules, Supabase authentication, and browser
storage do not work correctly from a `file://` URL:

```sh
python3 -m http.server 8000
```

Open [http://localhost:8000/auth.html](http://localhost:8000/auth.html).

## Supabase setup

1. Install the Supabase CLI using the [official instructions](https://supabase.com/docs/guides/cli).
2. From the project root, run `supabase login`, then `supabase init` and
   `supabase link --project-ref ldnjjoocmiyjeadsljxt`. CLI linking may prompt
   for the database password; enter it only in the CLI prompt.
3. Apply the checked-in database and storage policies with `supabase db push`.
   Alternatively, run
   [the migration](./supabase/migrations/20261107173000_create_clipcanva_cloud.sql)
   in the Supabase SQL Editor.
4. In Supabase **Authentication → URL Configuration**, set the site URL to
   `http://localhost:8000` and add `http://localhost:8000/**` to the redirect
   URL allow list. Set these to the production HTTPS domain when deploying.
5. In **Authentication → Providers → Email**, keep email confirmation enabled.
   The password-reset flow redirects back to `auth.html?mode=recovery`.
6. Run the local HTTP server above, create an account, and confirm the email.

`supabase-config.js` contains only the Supabase project URL and its public
publishable client key. The browser needs these public values to connect.
**Never place a service-role key, database password, or other secret in this
file or commit one to the repository.**

## Cloud storage and privacy

- Each authenticated account has one workspace row protected by row-level
  security policies. Users can access only their own row.
- Images and screenshots are stored in the private `clipcanva-assets` bucket.
  The app requests temporary signed URLs for viewing them.
- New accounts start with a blank canvas and can create objects, paste
  clipboard content, or import files immediately. Existing untouched demo
  canvases from earlier versions are cleared automatically; other local preview
  canvases require confirmation before they are uploaded to private storage.
- The browser keeps a local cache for offline recovery. A “Cloud sync failed”
  status means local changes did **not** reach the server.
- The browser extension captures the active tab only after the user clicks.
  It exports a local bundle for importing into the signed-in workspace.

## Project structure

- `index.html`, `styles.css`, `app.js` — workspace app
- `auth.html`, `auth.css`, `auth.js` — Supabase sign-up, login, and password reset
- `supabase-config.js`, `supabase-client.js` — public client configuration
- `supabase/migrations/` — workspace schema, private storage bucket, and RLS
- `browser-extension/` — click-to-capture Chromium extension
- `USER-TESTING.md` — guide for first user sessions

## Publishing

Deploy the static app to an HTTPS host such as Vercel or Netlify, set the
production site and redirect URLs in Supabase, and test email confirmation and
password reset on that domain. Do not publish until the database migration and
row-level security policies have been applied and verified.
