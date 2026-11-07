# Clipcanva first-use test

Use this short, moderated test with three to five designers or developers to
learn whether Clipcanva fits their design or development workflow. The app syncs
workspace items to the signed-in user's private Supabase workspace. Clipboard
content is added only when a user pastes it into the canvas.

## Before the session

- Ask each participant to use a browser profile and sample material they are
  comfortable saving to their account. Do not ask for client work, private
  pages, or credentials.
- Confirm the Supabase migration and local auth redirect URL are configured.
  Have participants create and confirm their own account; never collect their
  passwords.
- Apply all six Supabase migrations in timestamp order before testing
  discovery, collection publishing, follows, public team projects, or profile
  activity. Verify that a taken username is rejected with a clear message and
  profile pictures can be cropped, zoomed, uploaded, and removed.
- Ask permission to observe their screen and take notes. Do not record without
  separate consent.
- Do not explain the interface before the first task.

## Read aloud

> Clipcanva is a visual clipboard for design and development work. It helps you
> collect images, references, snippets, and ideas in one canvas. Please think
> aloud as you try it. Your canvas syncs to your private account. Clipboard
> content is added only when you paste it into Clipcanva.

## Tasks

1. **First impression:** Give the participant five seconds on the welcome
   screen. Ask, “What do you think this product is for? Who would you expect to
   use it?”
2. **Add a reference:** Ask them to import a non-sensitive image from their
   device, then add its source website in the inspector.
3. **Organize it:** Ask them to put the image and one existing reference
   into a collection they name for a real project.
4. **Find it again:** Ask them to search for the source website or a tag, then
   clear the search and return to the whole canvas.
5. **Make something with it:** Ask them to select two text or code objects,
   combine them, and explain what they expect to happen to the originals.
6. **Trust and value:** Ask whether they understand that their canvas is saved
   to their private account, that clipboard content is pasted only when they
   choose, and what would make them comfortable using the product with real
   work.
7. **Sharing:** Ask them to choose one collection, publish it, and open the
   collection link in a signed-out browser. Confirm other collections remain
   private, then unpublish the shared collection.
8. **Community:** Find another creator, follow and unfollow them, inspect their
   public profile, and verify follower counts update. Confirm saved canvas
   changes appear in the profile's activity graph.
9. **Collaboration:** Create a private team project and invite a second test
   account as a viewer. Confirm it can view but cannot edit. Repeat as an
   editor and verify changes appear in the first account's project. Make a
   separate project public and confirm a signed-out browser can view it but
   cannot edit it.

## Record without coaching

For each participant, note:

- Their own one-sentence description of Clipcanva and who it is for.
- Whether they understood how images and clipboard content are added.
- Whether they understood that publishing shares only the selected collection,
  while other collections remain private.
- Whether they found source attribution and collection organization without
  help.
- Any hesitation, failed action, or expectation that differed from what the
  prototype does.
- The workflow they would return for, how often they would use it, and what
  they would need before trusting it with work.

## Decision checks

Treat these as discussion prompts, not product claims: at least four of five
participants can describe the design/development use case in their own words;
everyone understands that Clipcanva does not monitor the clipboard in the
background; and at least three can complete image import, source discovery,
and collection organization without facilitator help. If those checks fail,
improve positioning, onboarding, or image import before evaluating paid plans
or cloud sync.
