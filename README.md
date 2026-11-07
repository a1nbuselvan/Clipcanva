# Clipcanva

*A visual clipboard for the bits and pieces behind your next idea.*

Clipcanva gives screenshots, links, snippets, colors, and notes a place to live
together. Arrange them on a canvas, connect the dots, and find them again when
you need them.

It is for the references you collect while designing, coding, or figuring out
what to make next. It is not another folder full of files, and it does not
watch your clipboard behind your back.

## What you can do

- Add notes, code, links, colors, and images to your canvas.
- Paste something with **Ctrl/⌘ + V** or choose **Add → Import files** for
  images.
- Drag items around, resize them, connect related ideas, or group them into
  collections.
- Search and filter your canvas, then select text or code items to combine
  them. The original items stay where they are.
- Keep your canvas private, publish a collection when you want to share it, or
  invite people to a separate team project.
- Set up a public profile, add a profile picture, and follow other creators.

## Getting started

1. Create an account and confirm your email.
2. Add something to your blank canvas: make a note, paste content, or import an
   image.
3. Drag things into place. Create a collection when you want to group related
   items.
4. Search your canvas whenever you need to find something again.
5. Sharing is optional: publish only the collection you choose. Keep anything
   private by leaving it unpublished.

## A few things worth knowing

- Clipcanva does **not** automatically capture screenshots or monitor the
  system clipboard. Add things yourself by pasting or importing.
- Your canvas is private to your account by default. Publishing a collection
  makes that collection visible to others; public team projects can be viewed
  by anyone, while private projects are invite-only.
- Your canvas syncs to your account, and a local browser copy helps with
  recovery. If the app says cloud sync failed, your latest changes have not
  reached the server yet.
- Profile pictures and anything you publish are public. Don’t upload or share
  anything you wouldn’t want others to see.

## Credits

Logo credit: @metanokia

## Running Clipcanva from source

Clipcanva is a static HTML, CSS, and JavaScript app. To run it locally, serve
the project over HTTP (not `file://`):

```sh
python3 -m http.server 8000
```

Then open [http://localhost:8000/auth.html](http://localhost:8000/auth.html).
Cloud accounts require a configured Supabase project.

<details>
<summary>Supabase setup for self-hosting</summary>

1. Install the Supabase CLI using the
   [official instructions](https://supabase.com/docs/guides/cli).
2. From the project root, run `supabase login`, `supabase init`, and
   `supabase link --project-ref ldnjjoocmiyjeadsljxt`.
3. Apply the six migrations with `supabase db push`, or run them in timestamp
   order in the Supabase SQL Editor:
   [workspace and storage](./supabase/migrations/20261107173000_create_clipcanva_cloud.sql),
   [profiles and collaboration](./supabase/migrations/20261107190000_add_profiles_sharing_and_collaboration.sql),
   [publishing and follows](./supabase/migrations/20261107193000_collection_publishing_social_activity.sql),
   [profile activity](./supabase/migrations/20261107204000_restore_profile_activity.sql),
   [unique usernames](./supabase/migrations/20261107204500_add_case_insensitive_profile_username_uniqueness.sql),
   [profile pictures](./supabase/migrations/20261107205000_add_public_profile_photos.sql).
4. In Supabase **Authentication → URL Configuration**, set the site URL to
   `http://localhost:8000` and add `http://localhost:8000/**` to the redirect
   URL allow list. Update these to your HTTPS domain when deploying.
5. Keep email confirmation enabled under **Authentication → Providers →
   Email**. Test email confirmation and password reset on your deployed domain.

`supabase-config.js` contains the public client configuration used by the
browser. Never put a service-role key, database password, or other secret in
that file.

</details>
