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
3. Apply the checked-in migrations with `supabase db push`. In the Supabase SQL
   Editor, run the files in timestamp order:
   [private workspace and storage](./supabase/migrations/20261107173000_create_clipcanva_cloud.sql),
   then
   [profiles, publishing, and collaboration](./supabase/migrations/20261107190000_add_profiles_sharing_and_collaboration.sql),
   then
   [collection publishing, public projects, follows, and activity](./supabase/migrations/20261107193000_collection_publishing_social_activity.sql).
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
- Public profiles expose only a username and display name; account email is
  never included in public profile queries. Profiles are discoverable by
  username.
- New accounts start with a blank canvas and no collections. Create a
  collection when you want to organize objects; new objects remain ungrouped
  unless a collection is selected.
- Publishing is an explicit action. Choose a collection to publish; only that
  collection's objects are copied to the public profile. Other collections and
  the private canvas remain private. Unpublishing hides that collection's
  public page and attempts to remove its public images.
- Team projects are separate canvases with a Private or Public setting. Private
  projects are invite-only; anyone can view a Public project, but only invited
  Editors can change it. Viewers are read-only. Project canvases check for
  teammate updates every five seconds and reject stale edits rather than
  overwriting a newer saved version. This is asynchronous collaboration, not
  simultaneous live cursors. Image preview links that were already issued can
  remain valid for up to 10 minutes after a project is made private.
- Profiles can follow creators and show followers, following, published
  collections, public projects, and a GitHub-style daily activity graph. Email
  stays private. Activity totals are based on successful saved changes.
- Existing publications are hidden by the collection-sharing migration. Review
  them and explicitly republish the collection you want public.
- Existing untouched demo
  canvases from earlier versions are cleared automatically; other local preview
  canvases require confirmation before they are uploaded to private storage.
- The browser keeps a local cache for offline recovery. A “Cloud sync failed”
  status means local changes did **not** reach the server.
- The browser extension captures the active tab only after the user clicks.
  It exports a local bundle for importing into the signed-in workspace.

## Project structure

- `index.html`, `styles.css`, `app.js` — workspace app
- `community.html`, `community.css`, `community.js` — public username search and creator pages
- `canvas.html`, `canvas.css`, `canvas.js` — published canvas viewer
- `auth.html`, `auth.css`, `auth.js` — Supabase sign-up, login, and password reset
- `supabase-config.js`, `supabase-client.js` — public client configuration
- `supabase/migrations/` — workspace, sharing, collection publishing, social
  features, storage buckets, and RLS
- `browser-extension/` — click-to-capture Chromium extension
- `USER-TESTING.md` — guide for first user sessions

## Publishing

Deploy the static app to an HTTPS host such as Vercel or Netlify, set the
production site and redirect URLs in Supabase, and test email confirmation and
password reset on that domain. Do not publish until the database migration and
row-level security policies have been applied and verified.
