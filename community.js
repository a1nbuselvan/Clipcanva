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
      '<p class="privacy">No collections have been published by this creator yet.</p>',
    );
    return;
  }
  const section = document.createElement("section");
  section.setAttribute("aria-label", "Published collections");
  section.innerHTML =
    '<h2>Published collections</h2><div class="boards">' +
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

function showProjects(projects) {
  if (!projects.length) return;
  const section = document.createElement("section");
  section.setAttribute("aria-label", "Public team projects");
  section.innerHTML =
    "<h2>Public team projects</h2>" +
    projects
      .map(
        (project) => `
          <a class="team-board" href="canvas.html?project=${encodeURIComponent(project.id)}">
            <span><strong>${escapeHTML(project.name)}</strong><small>Public team project · Anyone can view</small></span>
            <span>View project →</span>
          </a>`,
      )
      .join("");
  results.append(section);
}

function showActivity(rows) {
  const activityByDate = new Map(
    rows.map((row) => [row.activity_date, row.contribution_count]),
  );
  const today = new Date();
  const end = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate(),
  );
  const start = end - 363 * 86400000;
  let total = 0;
  const days = [];
  for (let timestamp = start; timestamp <= end; timestamp += 86400000) {
    const date = new Date(timestamp).toISOString().slice(0, 10);
    const count = activityByDate.get(date) || 0;
    total += count;
    days.push({ date, count, weekday: new Date(timestamp).getUTCDay() });
  }
  const levelFor = (count) =>
    count === 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4;
  $("#activity-graph").innerHTML =
    `<div class="activity-graph-wrap"><div class="activity-grid" role="img" aria-label="Daily Clipcanva activity over the past year">${days
      .map(
        ({ date, count, weekday }) =>
          `<span class="activity-day" data-level="${levelFor(count)}" style="grid-row:${weekday + 1}" title="${count} saved change${count === 1 ? "" : "s"} on ${date}"></span>`,
      )
      .join("")}</div></div><div class="activity-legend">Less <i class="activity-day" data-level="0"></i><i class="activity-day" data-level="1"></i><i class="activity-day" data-level="2"></i><i class="activity-day" data-level="3"></i><i class="activity-day" data-level="4"></i> More</div>`;
  $("#activity-total").textContent = `${total} saved changes in the past year`;
}

async function showRelations(userId, kind) {
  const target = $("#relations");
  target.hidden = false;
  target.textContent = "Loading…";
  const column = kind === "followers" ? "followed_id" : "follower_id";
  const value = kind === "followers" ? "follower_id" : "followed_id";
  const { data: follows, error } = await supabase
    .from("clipcanva_follows")
    .select(`${value},created_at`)
    .eq(column, userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  const ids = (follows || []).map((follow) => follow[value]);
  const { data: profiles, error: profileError } = ids.length
    ? await supabase
        .from("clipcanva_profiles")
        .select("user_id,username,display_name")
        .in("user_id", ids)
    : { data: [], error: null };
  if (profileError) throw profileError;
  const byId = new Map(
    (profiles || []).map((profile) => [profile.user_id, profile]),
  );
  target.innerHTML = `<h2>${kind === "followers" ? "Followers" : "Following"}</h2>${
    ids
      .map((id) => {
        const profile = byId.get(id);
        return profile
          ? `<a href="community.html?user=${encodeURIComponent(profile.username)}">${escapeHTML(profile.display_name)} · @${escapeHTML(profile.username)}</a>`
          : "";
      })
      .join("") || "<p class=privacy>No accounts to show yet.</p>"
  }`;
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
  const panel = $("#profile-panel");
  panel.hidden = false;
  const [
    { data: boards, error: boardsError },
    { data: projects, error: projectsError },
    { data: activity, error: activityError },
    { count: followers, error: followersError },
    { count: following, error: followingError },
    { data: sessionData, error: sessionError },
  ] = await Promise.all([
    supabase
      .from("clipcanva_public_canvases")
      .select("id,title,data,published_at")
      .eq("user_id", profile.user_id)
      .eq("is_public", true)
      .order("published_at", { ascending: false }),
    supabase
      .from("clipcanva_projects")
      .select("id,name,updated_at")
      .eq("owner_id", profile.user_id)
      .eq("visibility", "public")
      .order("updated_at", { ascending: false }),
    supabase
      .from("clipcanva_activity_days")
      .select("activity_date,contribution_count")
      .eq("user_id", profile.user_id)
      .gte(
        "activity_date",
        new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10),
      )
      .order("activity_date"),
    supabase
      .from("clipcanva_follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("followed_id", profile.user_id),
    supabase
      .from("clipcanva_follows")
      .select("followed_id", { count: "exact", head: true })
      .eq("follower_id", profile.user_id),
    supabase.auth.getSession(),
  ]);
  if (boardsError) throw boardsError;
  if (projectsError) throw projectsError;
  if (followersError) throw followersError;
  if (followingError) throw followingError;
  if (sessionError) throw sessionError;
  const currentUser = sessionData.session?.user;
  let isFollowing = false;
  if (currentUser && currentUser.id !== profile.user_id) {
    const { data: follow, error: followError } = await supabase
      .from("clipcanva_follows")
      .select("follower_id")
      .eq("follower_id", currentUser.id)
      .eq("followed_id", profile.user_id)
      .maybeSingle();
    if (followError) throw followError;
    isFollowing = !!follow;
  }
  const social = $("#profile-social");
  social.innerHTML = `<strong>@${escapeHTML(profile.username)}</strong><div class="social-counts"><button type=button data-relations=followers>${followers || 0} followers</button><button type=button data-relations=following>${following || 0} following</button></div>${currentUser && currentUser.id !== profile.user_id ? `<button type=button id=follow-button class="follow-button${isFollowing ? " following" : ""}">${isFollowing ? "Following" : "Follow"}</button>` : !currentUser ? '<a class="follow-button" href="auth.html">Sign in to follow</a>' : ""}`;
  social.querySelectorAll("[data-relations]").forEach((button) => {
    button.addEventListener("click", () => {
      showRelations(profile.user_id, button.dataset.relations).catch(
        (error) => {
          $("#relations").textContent =
            `Could not load ${button.dataset.relations}: ${error.message}`;
        },
      );
    });
  });
  social
    .querySelector("#follow-button")
    ?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      const result = isFollowing
        ? await supabase
            .from("clipcanva_follows")
            .delete()
            .eq("follower_id", currentUser.id)
            .eq("followed_id", profile.user_id)
        : await supabase.from("clipcanva_follows").insert({
            follower_id: currentUser.id,
            followed_id: profile.user_id,
          });
      if (result.error) {
        button.disabled = false;
        status.textContent = `Could not update follow: ${result.error.message}`;
        return;
      }
      loadProfile(profile.username).catch((error) => {
        status.textContent = `Could not refresh profile: ${error.message}`;
      });
    });
  if (activityError) {
    $("#activity-graph").textContent =
      "Activity is temporarily unavailable.";
    $("#activity-total").textContent = "";
    console.error("Could not load profile activity:", activityError);
  } else {
    showActivity(activity || []);
  }
  showBoards(boards || []);
  showProjects(projects || []);
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
