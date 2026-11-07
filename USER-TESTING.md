# Clipcanva first-use test

Use this short, moderated test with three to five designers or developers to
learn whether Clipcanva fits their design or development workflow. The app syncs
workspace items to the signed-in user's private Supabase workspace. The tab
capture extension keeps captures in a local queue until the user imports its
downloaded bundle.

## Before the session

- Ask each participant to use a browser profile and sample material they are
  comfortable saving to their account. Do not ask for client work, private
  pages, or credentials.
- Confirm the Supabase migration and local auth redirect URL are configured.
  Have participants create and confirm their own account; never collect their
  passwords.
- Apply all three Supabase migrations in timestamp order before testing
  discovery, collection publishing, follows, activity, or public team projects.
- For the tab-capture task, install the unpacked Chromium extension using
  [browser-extension/README.md](./browser-extension/README.md). Otherwise,
  provide a non-sensitive sample screenshot for import.
- Ask permission to observe their screen and take notes. Do not record without
  separate consent.
- Do not explain the interface before the first task.

## Read aloud

> Clipcanva is a visual clipboard for design and development work. It helps you
> collect screenshots, references, snippets, and ideas in one canvas. Please
> think aloud as you try it. Your canvas syncs to your private account. The
> browser extension captures only when you click; captures stay in its local
> queue until you import them. Clipcanva cannot detect screenshots taken by
> your computer's screenshot tool.

## Tasks

1. **First impression:** Give the participant five seconds on the welcome
   screen. Ask, “What do you think this product is for? Who would you expect to
   use it?”
2. **Capture a reference:** Ask them to add a screenshot and find where it came
   from. If using the extension, have them capture the current non-sensitive
   tab, download the bundle, and import it into Clipcanva.
3. **Organize it:** Ask them to put the screenshot and one existing reference
   into a collection they name for a real project.
4. **Find it again:** Ask them to search for the captured website or a tag, then
   clear the search and return to the whole canvas.
5. **Make something with it:** Ask them to select two text or code objects,
   combine them, and explain what they expect to happen to the originals.
6. **Trust and value:** Ask whether they understand that their canvas is saved
   to their private account, that extension captures require a click, and what
   would make them comfortable using the product with real work.
7. **Sharing:** Ask them to choose one collection, publish it, and open the
   collection link in a signed-out browser. Confirm other collections remain
   private, then unpublish the shared collection.
8. **Community:** Find another creator, follow and unfollow them, inspect their
   public profile and activity graph, and verify follower counts update.
9. **Collaboration:** Create a private team project and invite a second test
   account as a viewer. Confirm it can view but cannot edit. Repeat as an
   editor and verify changes appear in the first account's project. Make a
   separate project public and confirm a signed-out browser can view it but
   cannot edit it.

## Record without coaching

For each participant, note:

- Their own one-sentence description of Clipcanva and who it is for.
- Whether they understood that screenshot capture requires an explicit action.
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
everyone understands that the extension captures only after a click; and at
least three can complete screenshot import, source discovery, and collection
organization without facilitator help. If those checks fail, improve
positioning, onboarding, or capture flow before evaluating paid plans or cloud
sync.
