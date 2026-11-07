import { supabase } from "./supabase-client.js";

const $ = (selector) => document.querySelector(selector);
const status = $("#status");

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

function safeWebURL(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function safePublishedImageURL(value) {
  const projectURL = window.CLIPCANVA_SUPABASE_CONFIG?.url?.replace(/\/$/, "");
  const prefix = `${projectURL}/storage/v1/object/public/clipcanva-public-assets/`;
  const url = safeWebURL(value);
  return url?.startsWith(prefix) ? url : "";
}

function safeProjectImageURL(value) {
  const projectURL = window.CLIPCANVA_SUPABASE_CONFIG?.url?.replace(/\/$/, "");
  const prefix = `${projectURL}/storage/v1/object/sign/clipcanva-assets/`;
  const url = safeWebURL(value);
  return url?.startsWith(prefix) ? url : "";
}

function sourceHostname(value) {
  const url = safeWebURL(value);
  return url ? new URL(url).hostname : "";
}

function objectCard(item) {
  const colors = {
    text: "#4c8dff",
    code: "#a96cf2",
    link: "#2fbf5b",
    image: "#f2545b",
    file: "#ff9f0a",
    color: "#5b5b63",
  };
  const color = colors[item.type] || colors.text;
  let body = "";
  const publicImageURL = safePublishedImageURL(item.publicSrc);
  const projectImageURL = safeProjectImageURL(item.src);
  if (item.type === "image" && (publicImageURL || projectImageURL)) {
    body = `<img src="${escapeHTML(publicImageURL || projectImageURL)}" alt="${escapeHTML(item.title || "Shared image")}" loading="lazy">`;
  } else if (item.type === "link") {
    const url = safeWebURL(item.content);
    body = url
      ? `<a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(item.content)}</a>`
      : escapeHTML(item.content);
  } else if (item.type === "color") {
    const color = /^#[0-9a-f]{6}$/i.test(item.content || "")
      ? item.content
      : "#777777";
    body = `<span class="swatch" style="display:block;width:100%;height:90px;border-radius:10px;background:${color}"></span><code>${escapeHTML(item.content)}</code>`;
  } else if (item.type === "code") {
    body = `<pre>${escapeHTML(item.content)}</pre>`;
  } else {
    body = escapeHTML(item.content || item.title || "Attachment");
  }
  const source = sourceHostname(item.sourceUrl);
  return `<article class="object"><header style="background:${color}">${escapeHTML(item.type.toUpperCase())}</header><div class="body">${body}</div><span class="label">${escapeHTML(item.title || "")}${source ? ` · ${escapeHTML(source)}` : ""}</span></article>`;
}

async function loadCanvas() {
  const params = new URLSearchParams(location.search);
  const projectId = params.get("project");
  if (projectId) {
    if (!/^[0-9a-f-]{36}$/i.test(projectId)) {
      throw new Error("This project link is invalid.");
    }
    const { data: project, error } = await supabase
      .from("clipcanva_projects")
      .select("id,owner_id,name,data,visibility")
      .eq("id", projectId)
      .eq("visibility", "public")
      .maybeSingle();
    if (error) throw error;
    if (!project) throw new Error("This project is private or unavailable.");
    const items = project.data.items;
    for (const item of items) {
      if (item.type !== "image" || !item.storagePath) continue;
      const { data, error: imageError } = await supabase.storage
        .from("clipcanva-assets")
        .createSignedUrl(item.storagePath, 10 * 60);
      if (imageError) throw imageError;
      item.src = data.signedUrl;
    }
    const { data: profile, error: profileError } = await supabase
      .from("clipcanva_profiles")
      .select("username")
      .eq("user_id", project.owner_id)
      .maybeSingle();
    if (profileError) throw profileError;
    document.title = `${project.name} — Clipcanva`;
    $("#title").textContent = project.name;
    $("#owner").innerHTML = profile
      ? `Public team project · owned by <a href="community.html?user=${encodeURIComponent(profile.username)}">@${escapeHTML(profile.username)}</a>`
      : "Public team project on Clipcanva";
    $("#items").innerHTML = items.map(objectCard).join("");
    status.textContent = `${items.length} shared object${items.length === 1 ? "" : "s"} · view only`;
    return;
  }
  const id = params.get("id");
  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    throw new Error("This canvas link is invalid.");
  }
  const { data: canvas, error } = await supabase
    .from("clipcanva_public_canvases")
    .select("id,user_id,title,data,is_public")
    .eq("id", id)
    .eq("is_public", true)
    .maybeSingle();
  if (error) throw error;
  if (!canvas)
    throw new Error("This canvas is private or no longer available.");
  const { data: profile, error: profileError } = await supabase
    .from("clipcanva_profiles")
    .select("username,display_name")
    .eq("user_id", canvas.user_id)
    .maybeSingle();
  if (profileError) throw profileError;
  document.title = `${canvas.title} — Clipcanva`;
  $("#title").textContent = canvas.title;
  $("#owner").innerHTML = profile
    ? `Published by <a href="community.html?user=${encodeURIComponent(profile.username)}">@${escapeHTML(profile.username)}</a>`
    : "Published on Clipcanva";
  $("#items").innerHTML = canvas.data.items.map(objectCard).join("");
  status.textContent = `${canvas.data.items.length} shared object${canvas.data.items.length === 1 ? "" : "s"}`;
}

loadCanvas().catch((error) => {
  $("#title").textContent = "Canvas unavailable";
  status.textContent = error.message;
});
