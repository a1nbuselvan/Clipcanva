import { supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const params = new URLSearchParams(location.search);
const username = params.get("user");
const results = $("#results");
const status = $("#status");
const form = $("#search-form");
const search = $("#search");

function escapeHTML(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

function showProfiles(profiles) {
  results.innerHTML = profiles
    .map(
      (profile) => `
        <a class="creator" href="community.html?user=${encodeURIComponent(profile.username)}">
          <span class="avatar" aria-hidden="true">${escapeHTML(profile.display_name.slice(0, 1).toUpperCase())}</span>
          <span class="creator-info">
            <strong>${escapeHTML(profile.display_name)}</strong>
            <small>@${escapeHTML(profile.username)}</small>
          </span>
          <span class="creator-link">View profile →</span>
        </a>`,
    )
    .join("");
}

function showBoards(boards) {
  if (!boards.length) {
    results.insertAdjacentHTML(
      "beforeend",
      '<p class="privacy">No canvases have been published by this creator yet.</p>',
    );
    return;
  }
  const section = document.createElement("section");
  section.setAttribute("aria-label", "Published canvases");
  section.innerHTML =
    '<h2>Published canvases</h2><div class="boards">' +
    boards
      .map(
        (board) => `
          <a class="board" href="canvas.html?id=${encodeURIComponent(board.id)}">
            <strong>${escapeHTML(board.title)}</strong>
            <small>${board.data.items.length} objects · Open canvas →</small>
          </a>`,
      )
      .join("") +
    "</div>";
  results.append(section);
}

async function loadProfile(handle) {
  status.textContent = "Loading profile…";
  results.replaceChildren();
  const { data: profile, error } = await supabase
    .from("clipcanva_profiles")
    .select("user_id,username,display_name")
    .eq("username", handle)
    .maybeSingle();
  if (error) throw error;
  if (!profile) {
    $("#page-title").textContent = "Profile not found";
    $("#page-description").textContent =
      "This username may be incorrect or unavailable.";
    status.textContent = "";
    return;
  }
  document.title = `@${profile.username} — Clipcanva`;
  $("#page-title").textContent = profile.display_name;
  $("#page-description").textContent = `@${profile.username} on Clipcanva`;
  search.closest("form").hidden = true;
  $(".privacy").hidden = true;
  const { data: boards, error: boardsError } = await supabase
    .from("clipcanva_public_canvases")
    .select("id,title,data,published_at")
    .eq("user_id", profile.user_id)
    .eq("is_public", true)
    .order("published_at", { ascending: false });
  if (boardsError) throw boardsError;
  showBoards(boards || []);
  status.textContent = "";
}

async function searchProfiles(term) {
  const handle = term.trim().replace(/^@/, "").toLowerCase();
  status.textContent = "Searching usernames…";
  results.replaceChildren();
  if (handle.length < 3) {
    status.textContent = "Enter at least 3 characters to search.";
    return;
  }
  if (!/^[a-z0-9_-]+$/.test(handle)) {
    status.textContent = "Search usernames using letters, numbers, _ or -.";
    return;
  }
  const { data, error } = await supabase
    .from("clipcanva_profiles")
    .select("user_id,username,display_name")
    .ilike("username", `%${handle}%`)
    .order("username")
    .limit(30);
  if (error) throw error;
  showProfiles(data || []);
  status.textContent = data?.length
    ? `${data.length} profile${data.length === 1 ? "" : "s"} found.`
    : "No matching public usernames.";
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const term = search.value;
  const query = term.trim() ? `?q=${encodeURIComponent(term.trim())}` : "";
  history.replaceState(null, "", `community.html${query}`);
  searchProfiles(term).catch((error) => {
    status.textContent = `Could not search profiles: ${error.message}`;
  });
});

search.value = params.get("q") || "";
if (username) {
  loadProfile(username).catch((error) => {
    status.textContent = `Could not load this profile: ${error.message}`;
  });
} else if (search.value) {
  searchProfiles(search.value).catch((error) => {
    status.textContent = `Could not search profiles: ${error.message}`;
  });
}
