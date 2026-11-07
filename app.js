import { supabase } from "./supabase-client.js";

const $ = (s) => document.querySelector(s),
  uid = () => Math.random().toString(36).slice(2, 9);
let SESSION = null;
let activeProjectId = null;
let projectRole = null;
let projectName = "";
let projectUpdatedAt = null;
let projectHasConflict = false;
let suppressSave = false;
let lastCloudContent = "";
let projectPollErrorShown = 0;
let activityErrorShown = 0;
let lastActivityAt = 0;
let publicCanvas = null;
const { data: sessionData, error: sessionError } =
  await supabase.auth.getSession();
if (sessionError || !sessionData.session) {
  window.location.replace("auth.html");
} else {
  SESSION = sessionData.session.user;
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_OUT" || !session) {
      window.location.replace("auth.html");
    }
  });
  $("#rail").addEventListener("contextmenu", (ev) => {
    const button = ev.target.closest("[data-co]");
    if (!button) return;
    ev.preventDefault();
    manageCollection(
      S.colls.find((collection) => collection.id == button.dataset.co),
      ev.clientX,
      ev.clientY,
    );
  });

  const STORAGE_BUCKET = "clipcanva-assets";
  const P = {
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    plus: '<path d="M5 12h14M12 5v14"/>',
    minus: '<path d="M5 12h14"/>',
    clip: '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    pen: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    pin: '<path d="M12 17v5M8 2h8M9 2v8l-3 5h12l-3-5V2"/>',
    trash:
      '<path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    merge:
      '<path d="m8 6 4-4 4 4M12 2v10a4 4 0 0 1-1.2 2.8L6 20M18 20l-4.5-4.5"/>',
    folder:
      '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.7-.9L9.6 3.9A2 2 0 0 0 7.9 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    fit: '<path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>',
    undo: '<path d="M3 7v6h6M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    redo: '<path d="M21 7v6h-6M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/>',
    up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    shield:
      '<path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.500 20.500 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.500-1.200 6.200-2.700a1.200 1.200 0 0 1 1.500 0C14.500 3.800 17 5 19 5a1 1 0 0 1 1 1z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="10" cy="7" r="4"/><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    share:
      '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 10.7 6.8-4.4m-6.8 7 6.8 4.4"/>',
    user: '<path d="M20 21a8 8 0 0 0-16 0"/><circle cx="12" cy="8" r="5"/>',
  };
  const ic = (n) => `<svg class="i" viewBox="0 0 24 24">${P[n]}</svg>`;
  document.body.innerHTML = document.body.innerHTML.replace(
    /__(\w+)__/g,
    (m, n) => ic(n),
  );
  const T = {
    text: { c: "#4c8dff", l: "Text" },
    code: { c: "#a96cf2", l: "Code" },
    link: { c: "#2fbf5b", l: "Link" },
    image: { c: "#f2545b", l: "Image" },
    file: { c: "#ff9f0a", l: "File" },
    color: { c: "#5b5b63", l: "Color" },
  };
  const CC = ["#ff9f0a", "#bc80ff", "#9ddc47", "#ff6b8a", "#4c8dff", "#2dd4bf"];
  const e = (s) =>
      String(s ?? "").replace(
        /[&<>]/g,
        (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c],
      ),
    ea = (s) => e(s).replace(/"/g, "&quot;");
  const ago = (t) => {
    const s = (Date.now() - t) / 1e3;
    return s < 45
      ? "just now"
      : s < 3600
        ? Math.round(s / 60) + " min ago"
        : s < 86400
          ? Math.round(s / 3600) + " hr ago"
          : Math.round(s / 86400) + " d ago";
  };
  const sourceHost = (url) => {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  };
  const bytes = (n) =>
    n < 1024
      ? n + " bytes"
      : n < 1048576
        ? (n / 1024).toFixed(1) + " KB"
        : (n / 1048576).toFixed(1) + " MB";
  const art = (a, b, s = 0) =>
    "data:image/svg+xml," +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="400" height="300" fill="url(#g)"/><circle cx="${120 + s * 90}" cy="130" r="70" fill="#fff" opacity=".2"/><circle cx="${280 - s * 40}" cy="190" r="110" fill="#000" opacity=".16"/><rect x="40" y="220" width="130" height="14" rx="7" fill="#fff" opacity=".5"/></svg>`,
    );
  const dom = (u) => {
    try {
      return new URL(/^https?:/.test(u) ? u : "https://" + u).hostname;
    } catch {
      return u;
    }
  };
  const hue = (s) =>
    [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7) % 360;
  const grad = (u) => {
    const h = Math.abs(hue(dom(u)));
    return `linear-gradient(135deg,hsl(${h} 65% 46%),hsl(${(h + 50) % 360} 60% 18%))`;
  };
  const hl = (s) =>
    e(s).replace(
      /(\/\/.*|^\s*#.*)|("[^"\n]*"|'[^'\n]*'|`[^`]*`)|\b(const|let|var|func|function|return|import|from|export|if|else|for|while|class|enum|case|async|await|def|new|type|interface|struct)\b|\b(\d+\.?\d*)\b/gm,
      (m, c, s2, k, n) =>
        c
          ? `<i class=c>${c}</i>`
          : s2
            ? `<i class=s>${s2}</i>`
            : k
              ? `<i class=k>${k}</i>`
              : `<i class=n>${n}</i>`,
    );

  /* ---------- state ---------- */
  let S = { items: [], links: [], colls: [], v: { x: 0, y: 0, z: 1 } },
    sel = new Set(),
    F = { q: "", type: "all", date: "any", coll: null, fav: false },
    last = "",
    hist = [],
    fut = [],
    conn = null,
    ptr = null,
    space = false,
    saved = "pending";
  let cloudReady = false,
    cloudUnavailable = false,
    syncQueue = Promise.resolve(),
    saveVersion = 0;
  let cap = { auto: false, state: "manual", lastTxt: "" };
  const contentSnapshot = (workspace = S) =>
    JSON.stringify({
      items: workspace.items,
      links: workspace.links,
      colls: workspace.colls,
    });
  const snap = () => contentSnapshot();
  const byId = (id) => S.items.find((i) => i.id == id),
    nodeOf = (id) => document.querySelector(`.it[data-id="${id}"]`);
  const DB = {
    o: null,
    open() {
      return (
        this.o ||
        (this.o = new Promise((r, j) => {
          const q = indexedDB.open("clipboard-universe", 1);
          q.onupgradeneeded = () => q.result.createObjectStore("s");
          q.onsuccess = () => r(q.result);
          q.onerror = () => j(q.error);
        }))
      );
    },
    async get() {
      const d = await this.open();
      return new Promise((resolve, reject) => {
        const q = d.transaction("s").objectStore("s").get(this.key());
        q.onsuccess = () => resolve(q.result);
        q.onerror = () => reject(q.error);
      });
    },
    async getPrevious(email) {
      const users = JSON.parse(
        localStorage.getItem("clipcanva-preview-users-v1") || "[]",
      );
      const previous = users.find(
        (user) => user.email?.toLowerCase() === email.toLowerCase(),
      );
      const d = await this.open();
      return new Promise((resolve, reject) => {
        const store = d.transaction("s").objectStore("s");
        const request = store.get(
          previous?.id ? `state:${previous.id}` : "state",
        );
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    },
    async set(v) {
      const d = await this.open();
      return new Promise((r, j) => {
        const t = d.transaction("s", "readwrite");
        t.objectStore("s").put(v, this.key());
        t.oncomplete = r;
        t.onerror = () => j(t.error);
      });
    },
    key() {
      return activeProjectId
        ? `project:${activeProjectId}`
        : `state:${SESSION.id}`;
    },
  };
  let st;
  const save = () => {
    if (suppressSave) return;
    clearTimeout(st);
    const version = ++saveVersion;
    saved = cloudUnavailable ? "fail" : "pending";
    rS();
    if (projectRole === "viewer") {
      saved = "ok";
      rS();
      return;
    }
    st = setTimeout(async () => {
      const snapshot = JSON.parse(JSON.stringify(S));
      try {
        await DB.set(snapshot);
      } catch (error) {
        saved = "fail";
        rS();
        toast(`Local save failed: ${error.message}`);
        return;
      }
      if (!cloudReady || projectRole === "viewer") {
        rS();
        return;
      }
      const cloudContent = contentSnapshot(snapshot);
      if (!cloudUnavailable && cloudContent === lastCloudContent) {
        saved = "ok";
        rS();
        return;
      }
      if (projectHasConflict) {
        saved = "fail";
        rS();
        return;
      }

      saved = "syncing";
      rS();
      syncQueue = syncQueue
        .catch(() => {})
        .then(() => syncCloudWorkspace(snapshot));
      try {
        await syncQueue;
        lastCloudContent = cloudContent;
        if (version === saveVersion) saved = "ok";
        if (Date.now() - lastActivityAt > 30000) {
          lastActivityAt = Date.now();
          const { error: activityError } = await supabase.rpc(
            "record_clipcanva_activity",
          );
          if (activityError && Date.now() - activityErrorShown > 60000) {
            activityErrorShown = Date.now();
            toast(
              `Canvas saved, but activity could not be recorded: ${activityError.message}`,
            );
          }
        }
      } catch (error) {
        if (version === saveVersion) saved = "fail";
        toast(
          `Cloud sync failed; changes remain on this device. ${error.message}`,
        );
      }
      rS();
    }, 250);
  };
  async function syncCloudWorkspace(snapshot) {
    const table = activeProjectId
      ? "clipcanva_projects"
      : "clipcanva_workspaces";
    let previousQuery = supabase.from(table).select("data,updated_at");
    previousQuery = activeProjectId
      ? previousQuery.eq("id", activeProjectId)
      : previousQuery.eq("user_id", SESSION.id);
    const { data: previous, error: readError } =
      await previousQuery.maybeSingle();
    if (readError) throw readError;

    const workspace = JSON.parse(JSON.stringify(snapshot));
    const retainedPaths = [];
    const storagePrefix = activeProjectId
      ? `projects/${activeProjectId}/`
      : `${SESSION.id}/`;
    for (const item of workspace.items) {
      if (item.type !== "image") continue;
      if (item.storagePath?.startsWith(storagePrefix)) {
        retainedPaths.push(item.storagePath);
        delete item.src;
        continue;
      }
      let imageSource = item.src;
      if (!imageSource && item.storagePath) {
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(item.storagePath, 60 * 60);
        if (error) throw error;
        imageSource = data.signedUrl;
      }
      if (!imageSource) {
        throw new Error(
          `Image "${item.title}" is missing its local image data.`,
        );
      }

      const blob = await (await fetch(imageSource)).blob();
      if (blob.size > 8e6) {
        throw new Error(
          `Image "${item.title}" is over the 8 MB storage limit.`,
        );
      }
      const extensions = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
        "image/gif": "gif",
        "image/svg+xml": "svg",
      };
      const extension = extensions[blob.type];
      if (!extension) {
        throw new Error(
          `Image type "${blob.type}" is not supported for cloud storage.`,
        );
      }

      const path = `${storagePrefix}${item.id}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, blob, {
          cacheControl: "3600",
          contentType: blob.type,
          upsert: true,
        });
      if (uploadError) throw uploadError;
      item.storagePath = path;
      retainedPaths.push(path);
      delete item.src;
    }

    const payload = activeProjectId
      ? { data: workspace, updated_at: new Date().toISOString() }
      : {
          user_id: SESSION.id,
          data: workspace,
          updated_at: new Date().toISOString(),
        };
    const mutation = activeProjectId
      ? supabase
          .from(table)
          .update(payload)
          .eq("id", activeProjectId)
          .eq("updated_at", projectUpdatedAt)
          .select("id,updated_at")
          .single()
      : supabase.from(table).upsert(payload, { onConflict: "user_id" });
    const { data: updated, error: upsertError } = await mutation;
    if (upsertError && activeProjectId && upsertError.code === "PGRST116") {
      throw new Error(
        "A teammate changed this project while you were editing. Reload the project to get their latest version before making more changes.",
      );
    }
    if (upsertError) throw upsertError;
    if (activeProjectId) projectUpdatedAt = updated.updated_at;

    const previousPaths = (previous?.data?.items || [])
      .map((item) => item.storagePath)
      .filter((path) => path?.startsWith(storagePrefix));
    const removedPaths = previousPaths.filter(
      (path) => !retainedPaths.includes(path),
    );
    if (removedPaths.length) {
      const { error: removeError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(removedPaths);
      if (removeError) throw removeError;
    }
  }

  async function loadCloudWorkspace(workspace) {
    if (
      !workspace ||
      !Array.isArray(workspace.items) ||
      !Array.isArray(workspace.links) ||
      !Array.isArray(workspace.colls)
    ) {
      throw new Error("The saved cloud workspace has an invalid format.");
    }
    const restored = JSON.parse(JSON.stringify(workspace));
    for (const item of restored.items) {
      if (item.type !== "image" || !item.storagePath) continue;
      const validPathPrefix = activeProjectId
        ? `projects/${activeProjectId}/`
        : `${SESSION.id}/`;
      if (!item.storagePath.startsWith(validPathPrefix)) {
        throw new Error("A screenshot does not belong to this cloud account.");
      }
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(item.storagePath, 60 * 60 * 24);
      if (error) throw error;
      item.src = data.signedUrl;
    }
    return restored;
  }

  function chooseLocalMigration(workspace) {
    return new Promise((resolve) => {
      const count = workspace.items.length;
      const o = modal(
        `<h2>Bring your local canvas to the cloud?</h2><p>A workspace from this browser was found with ${count} item${count === 1 ? "" : "s"}. You can upload it to your private Clipcanva account, or start with a fresh cloud canvas.</p><p><b>Photos and screenshots will be uploaded</b> to your private storage bucket. Only you can access them. You can also skip this migration and keep the local data on this device.</p><div class="row"><button class="btn" id=local-stay>Start fresh</button><button class="btn p" id=local-upload>Upload my canvas</button></div>`,
      );
      o.querySelector("#local-upload").onclick = () => {
        o.remove();
        resolve(true);
      };
      o.querySelector("#local-stay").onclick = () => {
        o.remove();
        resolve(false);
      };
    });
  }
  function commit(q) {
    if (projectRole === "viewer") {
      toast("You have viewer access to this project.");
      return;
    }
    hist.push(last);
    if (hist.length > 80) hist.shift();
    last = snap();
    fut = [];
    save();
    q ? (rF(), rL(), rR(), rP(), rH(), rS(), aV()) : rA();
  }
  function restore(s) {
    const d = JSON.parse(s);
    S.items = d.items;
    S.links = d.links;
    S.colls = d.colls;
    last = s;
    sel = new Set([...sel].filter(byId));
    save();
    rA();
  }
  const undo = () => {
    if (projectRole === "viewer") return toast("You have viewer access.");
    if (!hist.length) return toast("Nothing to undo");
    fut.push(last);
    restore(hist.pop());
  };
  const redo = () => {
    if (projectRole === "viewer") return toast("You have viewer access.");
    if (!fut.length) return toast("Nothing to redo");
    hist.push(last);
    restore(fut.pop());
  };

  const emptyWorkspace = () => ({
    items: [],
    links: [],
    colls: [],
    v: { x: 0, y: 0, z: 1 },
  });
  function isStarterWorkspace(workspace) {
    if (
      !Array.isArray(workspace?.items) ||
      workspace.items.length !== 13 ||
      !Array.isArray(workspace.links) ||
      workspace.links.length !== 3 ||
      !Array.isArray(workspace.colls) ||
      workspace.colls.length !== 2
    )
      return false;

    const starterItems = [
      [
        "link",
        "https://www.sketch.com",
        "www.sketch.com",
        60,
        60,
        270,
        200,
        ["tools"],
        0,
        0,
        "Launch brief",
        null,
        null,
        null,
        null,
      ],
      [
        "link",
        "https://www.framer.com",
        "www.framer.com",
        360,
        60,
        270,
        200,
        ["inspiration"],
        0,
        0,
        "Launch brief",
        null,
        null,
        null,
        null,
      ],
      [
        "image",
        "",
        "Elegant perfume display",
        660,
        60,
        270,
        230,
        ["inspiration"],
        0,
        0,
        "Launch brief",
        null,
        "2400 × 1800",
        null,
        null,
      ],
      [
        "text",
        "Hi {name},\n\nThanks for reaching out about the studio. We would love to hear more about the project and the timeline you have in mind.",
        "Hi {name},",
        960,
        60,
        260,
        200,
        ["email"],
        0,
        0,
        null,
        null,
        null,
        null,
        null,
      ],
      [
        "color",
        "#2110A2",
        "#2110A2",
        90,
        340,
        170,
        170,
        [],
        1,
        0,
        "Palette",
        null,
        null,
        null,
        null,
      ],
      [
        "color",
        "#BC80FF",
        "#BC80FF",
        280,
        340,
        170,
        170,
        [],
        0,
        0,
        "Palette",
        null,
        null,
        null,
        null,
      ],
      [
        "color",
        "#9DDC47",
        "#9DDC47",
        470,
        340,
        170,
        170,
        [],
        0,
        0,
        "Palette",
        null,
        null,
        null,
        null,
      ],
      [
        "color",
        "#DC4678",
        "#DC4678",
        660,
        340,
        170,
        170,
        [],
        0,
        0,
        "Palette",
        null,
        null,
        null,
        null,
      ],
      [
        "code",
        "enum DayOfWeek: CaseIterable {\n  case monday\n  case tuesday\n  case wednesday\n  case thursday\n  case friday\n}\n\nvar weekend: [DayOfWeek] = []",
        "DayOfWeek enum",
        900,
        310,
        330,
        220,
        ["swift"],
        0,
        0,
        null,
        "swift",
        null,
        null,
        null,
      ],
      [
        "text",
        "Give me 10 short, punchy landing page headlines for a productivity tool that remembers everything you copy.",
        "Give me 10 short, punchy landing page headlines",
        60,
        590,
        260,
        190,
        ["prompt"],
        1,
        0,
        null,
        null,
        null,
        null,
        null,
      ],
      [
        "file",
        "application/zip",
        "backup.zip",
        350,
        590,
        230,
        180,
        [],
        0,
        0,
        null,
        null,
        null,
        2621440,
        null,
      ],
      [
        "image",
        "",
        "Smiling woman portrait",
        610,
        580,
        270,
        230,
        ["photo"],
        0,
        0,
        null,
        null,
        "1890 × 1890",
        null,
        null,
      ],
      [
        "code",
        "// wait until calls stop\nconst debounce = (fn, ms = 200) => {\n  let t;\n  return (...a) => {\n    clearTimeout(t);\n    t = setTimeout(() => fn(...a), ms);\n  };\n};",
        "debounce helper",
        910,
        570,
        330,
        200,
        ["js", "utils"],
        0,
        0,
        null,
        "js",
        null,
        null,
        null,
      ],
    ];
    const itemSignature = (item) => [
      item.type,
      item.content ?? "",
      item.title ?? "",
      item.x,
      item.y,
      item.w,
      item.h,
      [...(item.tags || [])].sort(),
      item.fav ?? 0,
      item.pin ?? 0,
      workspace.colls.find((collection) => collection.id === item.coll)?.name ??
        null,
      item.lang ?? null,
      item.dims ?? null,
      item.size ?? null,
      item.sourceUrl ?? null,
    ];
    const actualItems = workspace.items
      .map((item) => JSON.stringify(itemSignature(item)))
      .sort();
    if (
      JSON.stringify(actualItems) !==
      JSON.stringify(starterItems.map((item) => JSON.stringify(item)).sort())
    )
      return false;

    if (
      workspace.colls
        .map((collection) => collection.name)
        .sort()
        .join("|") !== "Launch brief|Palette"
    )
      return false;

    const itemKeys = new Map(
      workspace.items.map((item) => [
        item.id,
        JSON.stringify([item.type, item.content ?? "", item.title ?? ""]),
      ]),
    );
    const actualLinks = workspace.links
      .map((link) =>
        JSON.stringify([itemKeys.get(link.a), itemKeys.get(link.b)].sort()),
      )
      .sort();
    const sketch = JSON.stringify([
      "link",
      "https://www.sketch.com",
      "www.sketch.com",
    ]);
    const framer = JSON.stringify([
      "link",
      "https://www.framer.com",
      "www.framer.com",
    ]);
    const reference = JSON.stringify(["image", "", "Elegant perfume display"]);
    const prompt = JSON.stringify([
      "text",
      "Give me 10 short, punchy landing page headlines for a productivity tool that remembers everything you copy.",
      "Give me 10 short, punchy landing page headlines",
    ]);
    return (
      JSON.stringify(actualLinks) ===
      JSON.stringify(
        [
          [prompt, sketch],
          [prompt, framer],
          [framer, reference],
        ]
          .map((link) => JSON.stringify(link.sort()))
          .sort(),
      )
    );
  }
  function autoTitle(i) {
    return i.type == "link"
      ? dom(i.content)
      : i.type == "color"
        ? i.content.toUpperCase()
        : i.type == "file" || i.type == "image"
          ? i.title || "Untitled"
          : (i.content.trim().split("\n")[0] || "Untitled").slice(0, 48);
  }

  /* ---------- render ---------- */
  function match(i) {
    const q = F.q.trim().toLowerCase();
    if (F.type != "all" && i.type != F.type) return false;
    if (F.coll && i.coll != F.coll) return false;
    if (F.fav && !i.fav) return false;
    if (F.date == "hour" && Date.now() - i.t > 36e5) return false;
    if (F.date == "today" && Date.now() - i.t > 864e5) return false;
    if (!q) return true;
    const c = S.colls.find((c) => c.id == i.coll);
    return [
      i.title,
      i.content,
      i.sourceUrl,
      i.tags.join(" "),
      T[i.type].l,
      c?.name,
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  }
  function itemHTML(i, vis) {
    const t = T[i.type];
    let b = "",
      m = "";
    if (i.type == "text") {
      b = `<div class=bt>${e(i.content)}</div>`;
      m = i.content.length + " characters";
    }
    if (i.type == "code") {
      b = `<pre class=bc>${hl(i.content)}</pre>`;
      m = (i.lang || "code") + " · " + i.content.split("\n").length + " lines";
    }
    if (i.type == "link") {
      b = `<div class=bl style="background:${grad(i.content)}">${e((dom(i.content).replace(/^www\./, "")[0] || "?").toUpperCase())}</div>`;
      m = i.content.replace(/^https?:\/\//, "");
    }
    if (i.type == "image") {
      b = `<div class=bi style="background-image:url('${i.src}')"></div>`;
      m = [i.dims, sourceHost(i.sourceUrl)].filter(Boolean).join(" · ");
    }
    if (i.type == "file") {
      b = `<div class=bf><div>${e((i.title.split(".").pop() || "FILE").slice(0, 4).toUpperCase())}</div></div>`;
      m = bytes(i.size || 0);
    }
    if (i.type == "color") {
      b = `<div class=bk style="background:${ea(i.content)}"></div>`;
      m = "Color";
    }
    const tg = i.tags.length ? " · #" + i.tags.join(" #") : "";
    return `<div class="it${sel.has(i.id) ? " sel" : ""}${vis ? "" : " dim"}${conn ? " cn" : ""}" data-id="${i.id}" style="left:${i.x}px;top:${i.y}px;width:${i.w}px;height:${i.h}px"><div class=hd style="background:${t.c}"><div>${t.l}<small>${ago(i.t)}</small></div><div class=ic>${i.fav ? ic("star").replace("fill:none", "").replace("<svg", '<svg style="fill:#fff"') : ""}${i.pin ? ic("pin") : ""}</div></div><div class=bd>${b}</div><div class=ft><b>${e(i.title)}</b><small>${e(m + tg)}</small></div><div class=rs></div></div>`;
  }
  function rC() {
    const v = new Set(S.items.filter(match).map((i) => i.id));
    $("#o").innerHTML = S.items.map((i) => itemHTML(i, v.has(i.id))).join("");
    rF();
    rL();
    const em = $("#emp");
    em.hidden = !!S.items.length && v.size > 0;
    if (!em.hidden)
      em.innerHTML = S.items.length
        ? "<div><h3>No matches</h3>Try another search or clear the filters.</div>"
        : '<div><h3>Your canvas, your way</h3>Start with a note, code snippet, link, color, or image. Paste with Ctrl/⌘+V or import files.<div class=emp-actions><button class="btn p" data-a=add>Create an object</button><button class=btn data-a=paste>Paste</button><button class=btn data-a=import>Import files</button></div></div>';
  }
  function rF() {
    $("#fr").innerHTML = S.colls
      .map((c) => {
        const m = S.items.filter((i) => i.coll == c.id);
        if (!m.length) return "";
        const x1 = Math.min(...m.map((i) => i.x)) - 26,
          y1 = Math.min(...m.map((i) => i.y)) - 26,
          x2 = Math.max(...m.map((i) => i.x + i.w)) + 26,
          y2 = Math.max(...m.map((i) => i.y + i.h)) + 26;
        return `<div class=fr style="left:${x1}px;top:${y1}px;width:${x2 - x1}px;height:${y2 - y1}px"><span data-c="${c.id}">${e(c.name)}</span></div>`;
      })
      .join("");
  }
  function anc(a, b) {
    const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 },
      bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 },
      dx = bc.x - ac.x,
      dy = bc.y - ac.y;
    if (Math.abs(dx) * a.h > Math.abs(dy) * a.w)
      return dx > 0
        ? { x: a.x + a.w, y: ac.y, d: 1, h: 1 }
        : { x: a.x, y: ac.y, d: -1, h: 1 };
    return dy > 0
      ? { x: ac.x, y: a.y + a.h, d: 1, h: 0 }
      : { x: ac.x, y: a.y, d: -1, h: 0 };
  }
  function rL() {
    $("#ln").innerHTML = S.links
      .map((l) => {
        const a = byId(l.a),
          b = byId(l.b);
        if (!a || !b) return "";
        const p = anc(a, b),
          q = anc(b, a),
          k = Math.max(40, Math.hypot(p.x - q.x, p.y - q.y) / 3);
        const c1 = p.h ? `${p.x + p.d * k} ${p.y}` : `${p.x} ${p.y + p.d * k}`,
          c2 = q.h ? `${q.x + q.d * k} ${q.y}` : `${q.x} ${q.y + q.d * k}`,
          d = `M${p.x} ${p.y}C${c1} ${c2} ${q.x} ${q.y}`;
        return `<path class=h data-l="${l.id}" d="${d}"/><path class=v d="${d}"/><circle cx="${p.x}" cy="${p.y}" r="4"/><circle cx="${q.x}" cy="${q.y}" r="4"/>`;
      })
      .join("");
  }
  function aV() {
    const v = S.v;
    $("#w").style.transform = `translate(${v.x}px,${v.y}px) scale(${v.z})`;
    const g = 24 * v.z;
    $("#vp").style.backgroundSize = `${g}px ${g}px`;
    $("#vp").style.backgroundPosition = `${v.x}px ${v.y}px`;
    $("#zl").textContent = Math.round(v.z * 100) + "%";
    save();
  }
  function rR() {
    const cs = S.colls
      .map(
        (c, k) =>
          `<button class="b co${F.coll == c.id ? " on" : ""}" style="background:${CC[k % 6]}" data-co="${c.id}" title="${ea(c.name)} · click to filter, click again or right-click to manage">${e(c.name[0].toUpperCase())}</button>`,
      )
      .join("");
    $("#rail").innerHTML =
      `<div class="b logo" role="img" aria-label="Clipcanva" title="Clipcanva">C</div><button class="b${!F.coll && !F.fav ? " on" : ""}" data-a="all" title="All objects">${ic("grid")}</button><button class="b${F.fav ? " on" : ""}" data-a="fav" title="Favorites">${ic("star")}</button><button class="b${$("#hist").classList.contains("o") ? " on" : ""}" data-a="hist" title="Recent history">${ic("clock")}</button><div style="width:24px;border-top:1px solid var(--ln);margin:4px 0"></div>${cs}<button class="b" data-a="newco" title="New collection">${ic("plus")}</button><div class=sp></div><button class="b" data-a="help" title="Shortcuts & help">${ic("help")}</button>`;
  }
  function rP() {
    const c = (k) =>
      k == "all" ? S.items.length : S.items.filter((i) => i.type == k).length;
    $("#pl").innerHTML =
      [
        ["all", "All"],
        ["text", "Text"],
        ["code", "Code"],
        ["link", "Links"],
        ["image", "Images"],
        ["file", "Files"],
        ["color", "Colors"],
      ]
        .map(
          ([k, l]) =>
            `<button class="pill${F.type == k ? " on" : ""}" data-ty="${k}">${l}<small>${c(k)}</small></button>`,
        )
        .join("") +
      `<select class=pill id=dt title="Filter by date" style="background:var(--b)"><option value=any>Any time</option><option value=hour${F.date == "hour" ? " selected" : ""}>Last hour</option><option value=today${F.date == "today" ? " selected" : ""}>Last 24 hours</option></select>`;
  }
  function rS() {
    const m = {
      manual: [
        "",
        projectRole === "viewer"
          ? `Shared project · ${projectName}`
          : activeProjectId
            ? `Shared project · ${projectName}`
            : "Clipboard capture · paste anytime",
      ],
      armed: ["g", "Auto-capture on tab focus"],
      granted: ["g", "Clipboard allowed · manual"],
      denied: ["r", "Clipboard access blocked"],
      unsupported: ["y", "Clipboard read unsupported here"],
    }[cap.state];
    $("#sb").innerHTML =
      `<button class="${m[0]}" data-a="cap" title="Capture clipboard text or images"><i></i>${m[1]}</button><div class="${saved == "ok" ? "g" : saved == "fail" ? "r" : "y"}"><i></i>${saved == "ok" ? "Synced to cloud" : saved == "fail" ? "Cloud sync failed · saved locally" : "Syncing…"}</div><div>${S.items.length} objects${sel.size ? " · " + sel.size + " selected" : ""}</div>`;
  }
  function rH() {
    $("#hist").innerHTML =
      `<div class=ih><b>Recent history</b><button class=b data-a="hist" title="Close history" aria-label="Close history" style="width:30px;height:30px">${ic("x")}</button></div>` +
      [...S.items]
        .sort((a, b) => b.t - a.t)
        .slice(0, 60)
        .map(
          (i) =>
            `<button class=hr data-h="${i.id}"><i style="background:${T[i.type].c}"></i><div><b>${e(i.title)}</b><small>${T[i.type].l} · ${ago(i.t)}</small></div></button>`,
        )
        .join("");
  }
  const one = () => (sel.size == 1 ? byId([...sel][0]) : null);
  function rI() {
    const p = $("#ins");
    p.classList.toggle("o", sel.size > 0);
    if (sel.size && innerWidth <= 640 && $("#hist").classList.contains("o")) {
      $("#hist").classList.remove("o");
      rR();
    }
    pO();
    if (!sel.size) return;
    const co = S.colls
      .map((c) => `<option value="${c.id}">${e(c.name)}</option>`)
      .join("");
    const i = one();
    if (i) {
      const hex = /^#[0-9a-f]{6}$/i.test(i.content) ? i.content : "#888888";
      p.innerHTML = `<div class=ih><span class=tg style="background:${T[i.type].c}">${T[i.type].l}</span><button class=b data-a="x" title="Close panel" aria-label="Close panel" style="width:30px;height:30px">${ic("x")}</button></div>
 <label>Title<input id=f-t value="${ea(i.title)}"></label>
 ${i.type == "color" ? `<label>Color<div style="display:flex;gap:8px"><input type=color id=f-k value="${hex}" style="width:56px"><input id=f-c value="${ea(i.content)}"></div></label>` : i.type == "image" ? `<img src="${ea(i.src)}" alt=""><label>Source website<input id=f-src type=url value="${ea(i.sourceUrl || "")}" placeholder="https://example.com/design"></label>` : i.type == "file" ? `<label>File<input value="${ea(i.title + " · " + bytes(i.size || 0))}" disabled></label>` : `<label>${i.type == "link" ? "URL" : "Content"}<textarea id=f-c rows=${i.type == "link" ? 2 : 8}>${e(i.content)}</textarea></label>`}
 ${i.type == "code" ? `<label>Language<input id=f-l value="${ea(i.lang || "")}"></label>` : ""}
 <label>Tags (comma separated)<input id=f-g value="${ea(i.tags.join(", "))}" placeholder="design, launch"></label>
 <label>Collection<select id=f-o><option value="">None</option>${co}</select></label>
 <div class=acts><button data-a="copy">${ic("copy")}Copy</button><button data-a="dup">${ic("copy")}Duplicate</button><button data-a="pin" class="${i.pin ? "on" : ""}">${ic("pin")}${i.pin ? "Pinned" : "Pin"}</button><button data-a="star" class="${i.fav ? "on" : ""}">${ic("star")}Favorite</button><button data-a="conn">${ic("link")}Connect</button><button data-a="del" class=dg>${ic("trash")}Delete</button></div>`;
      p.querySelector("#f-o").value = i.coll || "";
    } else
      p.innerHTML = `<div class=ih><b>${sel.size} objects selected</b><button class=b data-a="x" title="Close panel" aria-label="Close panel" style="width:30px;height:30px">${ic("x")}</button></div><p style="color:var(--mu);margin-top:0">Combine merges their contents into a new text object. Originals stay untouched.</p>
 <label>Move all to collection<select id=f-o><option value="">None</option>${co}</select></label>
 <div class=acts><button data-a="comb" class=on>${ic("merge")}Combine</button><button data-a="grp">${ic("folder")}Group</button><button data-a="conn">${ic("link")}Connect</button><button data-a="star">${ic("star")}Favorite</button><button data-a="dup">${ic("copy")}Duplicate</button><button data-a="del" class=dg>${ic("trash")}Delete</button></div>`;
    if (projectRole === "viewer") {
      p.querySelectorAll("input,textarea,select").forEach((control) => {
        control.disabled = true;
      });
      p.querySelectorAll(".acts [data-a]").forEach((button) => {
        if (button.dataset.a !== "copy") button.disabled = true;
      });
    }
  }
  const pO = () =>
    $("#stage").classList.toggle(
      "po",
      sel.size > 0 || $("#hist").classList.contains("o"),
    );
  function reveal() {
    const a = [...sel].map(byId).filter(Boolean);
    if (!a.length) return;
    const r = vp.getBoundingClientRect(),
      v = S.v,
      nar = innerWidth <= 640;
    const x1 = Math.min(...a.map((i) => i.x)) * v.z + v.x,
      x2 = Math.max(...a.map((i) => i.x + i.w)) * v.z + v.x,
      y1 = Math.min(...a.map((i) => i.y)) * v.z + v.y,
      y2 = Math.max(...a.map((i) => i.y + i.h)) * v.z + v.y;
    let dx = 0,
      dy = 0;
    if (nar) {
      const t = r.height - Math.min(r.height * 0.48, 380) - 16;
      if (y2 > t) dy = -Math.min(y2 - t, Math.max(0, y1 - 12));
    } else {
      const l = r.width - Math.min(300, r.width - 24) - 28;
      if (x2 > l) dx = -Math.min(x2 - l, Math.max(0, x1 - 16));
    }
    if (dx || dy) {
      const w = $("#w");
      w.style.transition = "transform .25s ease";
      vp.style.transition = "background-position .25s ease";
      v.x += dx;
      v.y += dy;
      aV();
      setTimeout(() => {
        w.style.transition = "";
        vp.style.transition = "";
      }, 300);
    }
  }
  function uS() {
    document
      .querySelectorAll(".it")
      .forEach((n) => n.classList.toggle("sel", sel.has(n.dataset.id)));
    rI();
    rS();
  }
  function rA() {
    rC();
    rR();
    rP();
    rH();
    rI();
    rS();
    aV();
  }

  /* ---------- toast / menu / modal ---------- */
  let tt;
  function toast(m, act) {
    $("#ts")?.remove();
    const d = document.createElement("div");
    d.id = "ts";
    d.innerHTML = e(m) + (act ? `<button>${act[0]}</button>` : "");
    if (act)
      d.querySelector("button").onclick = () => {
        act[1]();
        d.remove();
      };
    document.body.append(d);
    clearTimeout(tt);
    tt = setTimeout(() => d.remove(), act ? 5000 : 2600);
  }
  function menu(x, y, list) {
    hideMenu();
    const m = document.createElement("div");
    m.id = "menu";
    list.forEach((l) => {
      if (l == "-") {
        m.append(document.createElement("hr"));
        return;
      }
      const b = document.createElement("button");
      if (l[3]) b.className = "dg";
      b.innerHTML = `<span>${l[0]}</span><small>${l[2] || ""}</small>`;
      b.onclick = () => {
        hideMenu();
        l[1]();
      };
      m.append(b);
    });
    document.body.append(m);
    const r = m.getBoundingClientRect();
    m.style.left = Math.max(8, Math.min(x, innerWidth - r.width - 8)) + "px";
    m.style.top = Math.max(8, Math.min(y, innerHeight - r.height - 8)) + "px";
  }
  function manageCollection(collection, x, y) {
    if (!collection) return;
    if (projectRole === "viewer") {
      toast("You have viewer access to this project.");
      return;
    }
    menu(x, y, [
      [
        "Rename collection",
        () =>
          ask("Rename collection", collection.name, (name) => {
            collection.name = name;
            commit();
          }),
      ],
      [
        "Delete collection · keep objects",
        () => {
          S.items.forEach((item) => {
            if (item.coll == collection.id) item.coll = null;
          });
          S.colls = S.colls.filter((item) => item.id != collection.id);
          if (F.coll == collection.id) F.coll = null;
          commit(true);
          toast("Collection deleted; its objects remain on the canvas");
        },
        "",
        1,
      ],
    ]);
  }
  const hideMenu = () => $("#menu")?.remove();
  function modal(h) {
    const o = document.createElement("div");
    o.className = "ov";
    o.innerHTML = `<div class=dlg>${h}</div>`;
    o.addEventListener("pointerdown", (ev) => {
      if (ev.target == o) o.remove();
    });
    document.body.append(o);
    return o;
  }
  function ask(title, val, cb, extra) {
    const o = modal(
      `<h2>${title}</h2><input id=ai value="${ea(val)}" maxlength=40><div class=row>${extra ? `<button class="btn" id=ax style="color:#ff6b6b">${extra[0]}</button>` : ""}<button class="btn" id=ac>Cancel</button><button class="btn p" id=ao>Save</button></div>`,
    );
    const i = o.querySelector("#ai");
    i.focus();
    i.select();
    const ok = () => {
      if (i.value.trim()) {
        cb(i.value.trim());
        o.remove();
      }
    };
    o.querySelector("#ao").onclick = ok;
    o.querySelector("#ac").onclick = () => o.remove();
    i.onkeydown = (ev) => {
      if (ev.key == "Enter") ok();
      if (ev.key == "Escape") o.remove();
    };
    if (extra)
      o.querySelector("#ax").onclick = () => {
        extra[1]();
        o.remove();
      };
  }

  /* ---------- actions ---------- */
  const sn = (v) => Math.round(v / 12) * 12;
  function center() {
    const r = $("#vp").getBoundingClientRect(),
      v = S.v;
    return { x: (r.width / 2 - v.x) / v.z, y: (r.height / 2 - v.y) / v.z };
  }
  function spawn(type, p = {}, at, nc) {
    const d = {
        text: [250, 180],
        code: [330, 210],
        link: [270, 200],
        image: [270, 230],
        file: [230, 180],
        color: [170, 170],
      }[type],
      c = at || center(),
      n = (S.items.length % 6) * 18;
    const i = {
      id: uid(),
      type,
      x: sn(c.x - d[0] / 2 + n),
      y: sn(c.y - d[1] / 2 + n),
      w: d[0],
      h: d[1],
      title: "",
      content: "",
      tags: [],
      fav: 0,
      pin: 0,
      coll: F.coll || null,
      t: Date.now(),
      ...p,
    };
    i.title = i.title || autoTitle(i);
    S.items.push(i);
    sel = new Set([i.id]);
    if (!nc) commit();
    return i;
  }
  function classify(t) {
    t = t.trim();
    if (
      /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(t) ||
      /^(?=.*\d)[0-9a-f]{6}$/i.test(t) ||
      /^(rgb|hsl)a?\(.*\)$/i.test(t)
    )
      return ["color", { content: /^[0-9a-f]{6}$/i.test(t) ? "#" + t : t }];
    if (
      !/\s/.test(t) &&
      (/^https?:\/\/\S+$/i.test(t) ||
        /^(www\.)?[\w-]+(\.[a-z]{2,})+(\/\S*)?$/i.test(t))
    )
      return ["link", { content: /^https?/i.test(t) ? t : "https://" + t }];
    if (
      /\n/.test(t) &&
      /[{};]|=>|\bdef |\bfunction\b|\bimport\b|\bclass\b|\bconst\b|<\/?\w+>/.test(
        t,
      )
    )
      return [
        "code",
        {
          content: t,
          lang: /\bdef /.test(t) ? "py" : /<\/?\w+>/.test(t) ? "html" : "js",
        },
      ];
    return ["text", { content: t }];
  }
  function addText(t, at) {
    if (!t || !t.trim() || t == cap.lastTxt) return false;
    cap.lastTxt = t;
    const [k, p] = classify(t);
    spawn(k, p, at);
    return true;
  }
  function addFile(f, at) {
    return new Promise((res) => {
      if (f.size > 8e6) {
        toast(f.name + " is over 8 MB and was skipped");
        return res();
      }
      if (f.type.startsWith("image/")) {
        const r = new FileReader();
        r.onload = () => {
          const im = new Image();
          im.onload = () => {
            spawn(
              "image",
              {
                title: f.name,
                src: r.result,
                dims: im.width + " × " + im.height,
                size: f.size,
              },
              at,
            );
            res();
          };
          im.onerror = () => {
            toast("Could not read " + f.name);
            res();
          };
          im.src = r.result;
        };
        r.readAsDataURL(f);
      } else {
        spawn("file", { title: f.name, content: f.type, size: f.size }, at);
        res();
      }
    });
  }
  async function importCaptureBundle(file) {
    if (file.size > 50e6) {
      toast("Capture bundle is over 50 MB and was not imported");
      return;
    }
    let bundle;
    try {
      bundle = JSON.parse(await file.text());
    } catch {
      toast("This capture bundle is not valid JSON");
      return;
    }
    if (
      bundle?.app !== "clipcanva" ||
      bundle.version !== 1 ||
      !Array.isArray(bundle.captures) ||
      bundle.captures.length < 1 ||
      bundle.captures.length > 10
    ) {
      toast("This is not a supported Clipcanva capture bundle");
      return;
    }
    const valid = bundle.captures.filter((capture) => {
      if (
        typeof capture?.image !== "string" ||
        capture.image.length > 11_200_000 ||
        !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(capture.image)
      )
        return false;
      const encoded = capture.image.slice("data:image/png;base64,".length);
      if (Math.floor((encoded.length * 3) / 4) > 8e6) return false;
      try {
        const protocol = new URL(capture.sourceUrl).protocol;
        return protocol == "http:" || protocol == "https:";
      } catch {
        return false;
      }
    });
    const rejected = bundle.captures.length - valid.length;
    if (!valid.length) {
      toast("No valid screenshots were found in this bundle");
      return;
    }
    const ids = [];
    let unreadable = 0;
    for (const capture of valid) {
      const sourceUrl = new URL(capture.sourceUrl).origin;
      const image = new Image();
      image.src = capture.image;
      try {
        await image.decode();
      } catch {
        unreadable++;
        continue;
      }
      const item = spawn(
        "image",
        {
          title: `Screenshot · ${String(capture.title || sourceHost(sourceUrl)).slice(0, 120)}`,
          src: capture.image,
          dims: `${image.naturalWidth} × ${image.naturalHeight}`,
          size: Math.floor(
            (capture.image.length - "data:image/png;base64,".length) * 0.75,
          ),
          sourceUrl,
          tags: ["screenshot", "design-reference"],
          t: Number.isFinite(capture.capturedAt)
            ? capture.capturedAt
            : Date.now(),
        },
        undefined,
        true,
      );
      ids.push(item.id);
    }
    if (!ids.length) {
      toast("The screenshots could not be decoded; nothing was imported");
      return;
    }
    sel = new Set(ids);
    commit();
    const skipped = rejected + unreadable;
    toast(
      `Imported ${ids.length} screenshot${ids.length == 1 ? "" : "s"} with source details${skipped ? ` · skipped ${skipped} invalid or unreadable` : ""}`,
    );
  }
  async function copyItem(i) {
    try {
      if (i.type == "image") {
        const b = await (await fetch(i.src)).blob();
        await navigator.clipboard.write([new ClipboardItem({ [b.type]: b })]);
      } else {
        cap.lastTxt = i.content;
        await navigator.clipboard.writeText(i.content || i.title);
      }
      toast("Copied to clipboard");
    } catch {
      toast(
        "Copy was blocked by the browser. Select the text in the inspector and use Ctrl/⌘+C.",
      );
    }
  }
  async function readClip(silent) {
    try {
      let got = 0;
      if (navigator.clipboard?.read) {
        for (const it of await navigator.clipboard.read()) {
          const ty = it.types.find((t) => t.startsWith("image/"));
          if (ty) {
            const b = await it.getType(ty),
              k = "img" + b.size;
            if (k == cap.lastTxt) continue;
            cap.lastTxt = k;
            await addFile(new File([b], "Clipboard image", { type: ty }));
            got++;
          } else if (
            it.types.includes("text/plain") &&
            addText(await (await it.getType("text/plain")).text())
          )
            got++;
        }
      } else if (navigator.clipboard?.readText) {
        if (addText(await navigator.clipboard.readText())) got++;
      } else throw { name: "NotSupportedError" };
      cap.state = cap.auto ? "armed" : "granted";
      if (!silent)
        toast(
          got
            ? `Captured ${got} item${got > 1 ? "s" : ""}`
            : "Clipboard is empty or already captured",
        );
    } catch (er) {
      cap.state = er.name == "NotAllowedError" ? "denied" : "unsupported";
      if (!silent)
        toast(
          cap.state == "denied"
            ? "Clipboard access was blocked. Allow it in the site settings, or paste with Ctrl/⌘+V."
            : "This browser cannot read the clipboard. Use Ctrl/⌘+V to paste.",
        );
    }
    rS();
  }
  function delItems(ids) {
    const n = ids.length;
    S.items = S.items.filter((i) => !ids.includes(i.id));
    S.links = S.links.filter((l) => !ids.includes(l.a) && !ids.includes(l.b));
    sel.clear();
    commit();
    toast(`Deleted ${n} object${n > 1 ? "s" : ""}`, ["Undo", undo]);
  }
  function dup() {
    const n = [];
    [...sel].forEach((id) => {
      const o = byId(id);
      if (o) {
        const c = {
          ...JSON.parse(JSON.stringify(o)),
          id: uid(),
          x: o.x + 36,
          y: o.y + 36,
          t: Date.now(),
          pin: 0,
        };
        S.items.push(c);
        n.push(c.id);
      }
    });
    if (n.length) {
      sel = new Set(n);
      commit();
    }
  }
  function connect(a, b) {
    if (a == b) return;
    if (S.links.some((l) => (l.a == a && l.b == b) || (l.a == b && l.b == a)))
      return toast("Already connected");
    S.links.push({ id: uid(), a, b });
    commit();
    toast("Connected");
  }
  function doConn() {
    if (sel.size == 1) {
      conn = [...sel][0];
      $("#vp").classList.add("cn");
      rC();
      toast("Click another object to connect · Esc cancels");
      return;
    }
    const a = [...sel]
      .map(byId)
      .filter(Boolean)
      .sort((p, q) => p.x - q.x);
    for (let k = 0; k < a.length - 1; k++)
      if (!S.links.some((l) => l.a == a[k].id && l.b == a[k + 1].id))
        S.links.push({ id: uid(), a: a[k].id, b: a[k + 1].id });
    commit();
    toast("Connected in order");
  }
  function comb() {
    const a = [...sel]
      .map(byId)
      .filter(Boolean)
      .sort((p, q) => p.y - q.y || p.x - q.x);
    if (a.length < 2) return toast("Select two or more objects to combine");
    let out,
      type = "text",
      p = {};
    if (a.every((i) => i.type == "code")) {
      type = "code";
      p.lang = a[0].lang;
      out = a.map((i) => `// ${i.title}\n${i.content}`).join("\n\n");
    } else
      out = a
        .map((i) =>
          i.type == "code"
            ? "```" + (i.lang || "") + "\n" + i.content + "\n```"
            : i.type == "text"
              ? i.content
              : i.type == "link" || i.type == "color"
                ? i.content
                : `[${T[i.type].l}] ${i.title}`,
        )
        .join("\n\n");
    const x = Math.max(...a.map((i) => i.x + i.w)) + 60,
      y = Math.min(...a.map((i) => i.y));
    const n = spawn(
      type,
      {
        content: out,
        title: "Combined · " + a.length + " objects",
        ...p,
        tags: ["combined"],
      },
      { x: 0, y: 0 },
      1,
    );
    n.x = sn(x);
    n.y = sn(y);
    n.w = Math.max(300, n.w);
    n.h = 260;
    a.forEach((i) => S.links.push({ id: uid(), a: i.id, b: n.id }));
    commit();
    toast("Combined into a new object · originals kept");
  }
  function grp() {
    if (!sel.size) return;
    ask("Name this group", `Group ${S.colls.length + 1}`, (nm) => {
      const c = { id: uid(), name: nm };
      S.colls.push(c);
      sel.forEach((id) => (byId(id).coll = c.id));
      commit();
    });
  }
  function fav() {
    const a = [...sel].map(byId),
      v = !a.every((i) => i.fav);
    a.forEach((i) => (i.fav = v ? 1 : 0));
    commit();
  }
  function setView(v) {
    Object.assign(S.v, v);
    aV();
  }
  function zoomAt(cx, cy, f) {
    const r = $("#vp").getBoundingClientRect(),
      v = S.v,
      nz = Math.min(2.5, Math.max(0.2, v.z * f)),
      px = cx - r.left,
      py = cy - r.top;
    v.x = px - ((px - v.x) * nz) / v.z;
    v.y = py - ((py - v.y) * nz) / v.z;
    v.z = nz;
    aV();
  }
  function fit(ids) {
    const a = (ids ? ids.map(byId) : S.items).filter(Boolean);
    const r = $("#vp").getBoundingClientRect();
    if (!a.length) return setView({ x: 0, y: 0, z: 1 });
    const x1 = Math.min(...a.map((i) => i.x)),
      y1 = Math.min(...a.map((i) => i.y)),
      x2 = Math.max(...a.map((i) => i.x + i.w)),
      y2 = Math.max(...a.map((i) => i.y + i.h)),
      z = Math.min(
        1.2,
        Math.max(
          0.2,
          Math.min(
            (r.width - (r.width < 700 ? 24 : 120)) / (x2 - x1),
            (r.height - (r.width < 700 ? 24 : 120)) / (y2 - y1),
          ),
        ),
      );
    setView({
      z,
      x: (r.width - (x2 - x1) * z) / 2 - x1 * z,
      y: (r.height - (y2 - y1) * z) / 2 - y1 * z,
    });
  }
  function capModal() {
    const o =
      modal(`<h2>Clipboard capture · text &amp; images</h2><p>Browsers cannot watch your clipboard in the background. Clipcanva reads it only when you ask, after you grant permission, and only while this tab is open and focused.</p>
 <p style="margin-bottom:0">Status: <b style="color:#fff">${{ manual: "Not requested yet", armed: "Auto-capture on tab focus", granted: "Permission granted", denied: "Blocked by browser or embedding page", unsupported: "Not supported here" }[cap.state]}</b></p>
 <label class=ck><input type=checkbox id=au ${cap.auto ? "checked" : ""}>Capture new clipboard content whenever I return to this tab</label>
 <div class=row><button class=btn id=cl>Close</button><button class="btn p" id=rd>Allow &amp; read clipboard now</button></div><p style="margin:14px 0 0;font-size:12.5px">Webpage screenshots: use the <a href="browser-extension/README.md" target="_blank" rel="noopener">Clipcanva browser extension</a> to capture the active tab, download its bundle, then use Add → Import files. A website cannot detect OS screenshots or screenshots taken by other apps.</p><p style="margin:8px 0 0;font-size:12.5px">For clipboard content: press Ctrl/⌘+V on the canvas, drop files, or use Add → Import files.</p>`);
    o.querySelector("#cl").onclick = () => o.remove();
    o.querySelector("#au").onchange = (ev) => {
      cap.auto = ev.target.checked;
      if (cap.auto) readClip();
      else {
        cap.state = "manual";
        rS();
      }
    };
    o.querySelector("#rd").onclick = async () => {
      await readClip();
      o.remove();
    };
  }
  function helpModal() {
    const k = [
      ["Ctrl/⌘ + V", "Paste text, images, files"],
      ["Drag empty space", "Select with rectangle"],
      ["Space + drag / scroll", "Pan canvas"],
      ["Ctrl/⌘ + scroll", "Zoom"],
      ["Shift + click", "Multi-select"],
      ["Alt while dragging", "Disable snapping"],
      ["Double-click", "Edit in inspector"],
      ["M", "Combine selection"],
      ["Ctrl/⌘ + G", "Group into collection"],
      ["L", "Connect objects"],
      ["P / F", "Pin / favorite"],
      ["Ctrl/⌘ + D", "Duplicate"],
      ["Delete", "Remove"],
      ["Arrows", "Nudge"],
      ["Ctrl/⌘ + Z / Shift+Z", "Undo / redo"],
      ["/", "Search"],
      ["0", "Fit all"],
    ];
    const o = modal(
      `<h2>Shortcuts</h2><table>${k.map((r) => `<tr><td><kbd>${r[0]}</kbd></td><td>${r[1]}</td></tr>`).join("")}</table><div class=row><button class="btn p" id=cl>Done</button></div>`,
    );
    o.querySelector("#cl").onclick = () => o.remove();
  }
  async function ensureProfile() {
    const { data, error } = await supabase.rpc("ensure_clipcanva_profile");
    if (error) throw error;
    return data;
  }
  async function profileModal() {
    try {
      const profile = await ensureProfile();
      const o = modal(
        `<h2>Your public profile</h2><p>Your profile includes published collections, public projects, followers, and a GitHub-style activity graph. Your email and private work stay hidden.</p><label>Username<input id=profile-username value="${ea(profile.username)}" maxlength=24 autocomplete=off></label><label>Display name<input id=profile-name value="${ea(profile.display_name)}" maxlength=60></label><p id=profile-status role=status></p><div class=row><button class=btn id=profile-cancel>Cancel</button><button class=btn id=profile-view>View profile</button><button class="btn p" id=profile-save>Save profile</button></div>`,
      );
      o.querySelector("#profile-cancel").onclick = () => o.remove();
      o.querySelector("#profile-view").onclick = () => {
        window.open(
          `community.html?user=${encodeURIComponent(profile.username)}`,
          "_blank",
          "noopener",
        );
      };
      o.querySelector("#profile-save").onclick = async () => {
        const username = o
          .querySelector("#profile-username")
          .value.trim()
          .toLowerCase();
        const displayName = o.querySelector("#profile-name").value.trim();
        const message = o.querySelector("#profile-status");
        if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(username)) {
          message.textContent =
            "Username must be 3–24 characters: letters, numbers, _ or -.";
          return;
        }
        if (displayName.length < 1 || displayName.length > 60) {
          message.textContent = "Display name must be 1–60 characters.";
          return;
        }
        const button = o.querySelector("#profile-save");
        button.disabled = true;
        const { error } = await supabase
          .from("clipcanva_profiles")
          .update({
            username,
            display_name: displayName,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", SESSION.id);
        button.disabled = false;
        if (error) {
          message.textContent = `Profile could not be saved: ${error.message}`;
          return;
        }
        o.remove();
        toast("Public profile updated");
      };
    } catch (error) {
      toast(`Public profiles are unavailable: ${error.message}`);
    }
  }
  function publicAssetPath(url) {
    const marker = "/storage/v1/object/public/clipcanva-public-assets/";
    const index = url.indexOf(marker);
    if (index < 0) return null;
    try {
      return decodeURIComponent(url.slice(index + marker.length));
    } catch {
      return null;
    }
  }
  async function publishCurrentCanvas(title, collectionId) {
    const profile = await ensureProfile();
    const { data: existing, error: existingError } = await supabase
      .from("clipcanva_public_canvases")
      .select("id,data")
      .eq("user_id", SESSION.id)
      .eq("collection_id", collectionId)
      .maybeSingle();
    if (existingError) throw existingError;
    const canvasId = existing?.id || crypto.randomUUID();
    const previousPaths = (existing?.data?.items || [])
      .map((item) => publicAssetPath(item.publicSrc || ""))
      .filter(Boolean);
    const workspace = JSON.parse(JSON.stringify(S));
    const collection = workspace.colls.find(
      (entry) => entry.id === collectionId,
    );
    if (!collection) throw new Error("Choose a collection to publish.");
    workspace.items = workspace.items.filter(
      (item) => item.coll === collectionId,
    );
    const itemIds = new Set(workspace.items.map((item) => item.id));
    workspace.links = workspace.links.filter(
      (link) => itemIds.has(link.a) && itemIds.has(link.b),
    );
    workspace.colls = [collection];
    const retainedPaths = [];
    let published;
    try {
      for (const item of workspace.items) {
        if (item.type !== "image") continue;
        let source = item.src;
        if (!source && item.storagePath) {
          const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(item.storagePath, 60 * 60);
          if (error) throw error;
          source = data.signedUrl;
        }
        if (!source) {
          throw new Error(`Image "${item.title}" has no preview to publish.`);
        }
        const blob = await (await fetch(source)).blob();
        if (blob.size > 8e6) {
          throw new Error(`Image "${item.title}" is over the 8 MB limit.`);
        }
        const extensions = {
          "image/png": "png",
          "image/jpeg": "jpg",
          "image/webp": "webp",
          "image/gif": "gif",
        };
        const extension = extensions[blob.type];
        if (!extension) {
          throw new Error(`Image format "${blob.type}" cannot be published.`);
        }
        const path = `${SESSION.id}/${canvasId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from("clipcanva-public-assets")
          .upload(path, blob, {
            cacheControl: "3600",
            contentType: blob.type,
            upsert: false,
          });
        if (uploadError) throw uploadError;
        retainedPaths.push(path);
        item.publicSrc = supabase.storage
          .from("clipcanva-public-assets")
          .getPublicUrl(path).data.publicUrl;
        delete item.src;
        delete item.storagePath;
      }
      const { data, error } = await supabase
        .from("clipcanva_public_canvases")
        .upsert(
          {
            id: canvasId,
            user_id: SESSION.id,
            collection_id: collectionId,
            collection_name: collection.name,
            title: title.trim(),
            data: workspace,
            is_public: true,
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,collection_id" },
        )
        .select("id,title,data")
        .single();
      if (error) throw error;
      published = data;
    } catch (error) {
      if (retainedPaths.length) {
        const { error: cleanupError } = await supabase.storage
          .from("clipcanva-public-assets")
          .remove(retainedPaths);
        if (cleanupError) {
          throw new Error(
            `${error.message} Uploaded public images could not be cleaned up: ${cleanupError.message}`,
          );
        }
      }
      throw error;
    }
    publicCanvas = published;
    const obsoletePaths = previousPaths.filter(
      (path) => !retainedPaths.includes(path),
    );
    if (obsoletePaths.length) {
      const { error: removeError } = await supabase.storage
        .from("clipcanva-public-assets")
        .remove(obsoletePaths);
      if (removeError) {
        toast(
          `Canvas published, but old public images could not be removed: ${removeError.message}`,
        );
        return;
      }
    }
    const shareUrl = new URL(
      `canvas.html?id=${encodeURIComponent(published.id)}`,
      location.href,
    ).href;
    toast(`Published by @${profile.username}`, [
      "Copy link",
      () => navigator.clipboard.writeText(shareUrl),
    ]);
  }
  async function publishModal() {
    try {
      const profile = await ensureProfile();
      const { data: publications, error } = await supabase
        .from("clipcanva_public_canvases")
        .select("id,title,data,is_public,collection_id")
        .eq("user_id", SESSION.id);
      if (error) throw error;
      const collections = S.colls;
      const defaultCollection =
        collections.find((collection) => collection.id === F.coll) ||
        collections[0];
      if (!defaultCollection)
        throw new Error("Create a collection before publishing.");
      const publicationByCollection = new Map(
        (publications || []).map((entry) => [entry.collection_id, entry]),
      );
      const initialPublication = publicationByCollection.get(
        defaultCollection.id,
      );
      publicCanvas = initialPublication || null;
      const o = modal(
        `<h2>Publish a collection</h2><p>Choose one collection to share on your public profile. Only items in that collection will be visible; your private canvas and other collections stay private.</p><label>Collection<select id=publish-collection>${collections.map((collection) => `<option value="${ea(collection.id)}">${e(collection.name)}</option>`).join("")}</select></label><label>Public title<input id=publish-title maxlength=100 value="${ea(initialPublication?.title || defaultCollection.name)}"></label><p id=publish-status role=status></p><div class=row><button class=btn id=publish-cancel>Cancel</button><button class=btn id=unpublish ${initialPublication?.is_public ? "" : "hidden"}>Unpublish</button><button class="btn p" id=publish-confirm>${initialPublication?.is_public ? "Update published collection" : "Publish collection"}</button></div>`,
      );
      const collectionSelect = o.querySelector("#publish-collection");
      const titleInput = o.querySelector("#publish-title");
      const publishButton = o.querySelector("#publish-confirm");
      const unpublishButton = o.querySelector("#unpublish");
      const syncPublicationControls = () => {
        const selected = publicationByCollection.get(collectionSelect.value);
        publicCanvas = selected || null;
        titleInput.value =
          selected?.title ||
          collections.find((item) => item.id === collectionSelect.value)
            ?.name ||
          "";
        publishButton.textContent = selected?.is_public
          ? "Update published collection"
          : "Publish collection";
        unpublishButton.hidden = !selected?.is_public;
      };
      collectionSelect.addEventListener("change", syncPublicationControls);
      o.querySelector("#publish-cancel").onclick = () => o.remove();
      o.querySelector("#publish-confirm").onclick = async () => {
        const title = o.querySelector("#publish-title").value.trim();
        const collectionId = collectionSelect.value;
        const message = o.querySelector("#publish-status");
        if (!title || title.length > 100) {
          message.textContent = "Enter a title between 1 and 100 characters.";
          return;
        }
        const button = o.querySelector("#publish-confirm");
        button.disabled = true;
        try {
          await publishCurrentCanvas(title, collectionId);
          o.remove();
        } catch (error) {
          message.textContent = `Could not publish: ${error.message}`;
          button.disabled = false;
        }
      };
      o.querySelector("#unpublish")?.addEventListener("click", async () => {
        const button = o.querySelector("#unpublish");
        const data = publicCanvas;
        if (!data) return;
        button.disabled = true;
        const { error: updateError } = await supabase
          .from("clipcanva_public_canvases")
          .update({ is_public: false, updated_at: new Date().toISOString() })
          .eq("id", data.id);
        if (updateError) {
          o.querySelector("#publish-status").textContent =
            `Could not unpublish: ${updateError.message}`;
          button.disabled = false;
          return;
        }
        const paths = (data.data?.items || [])
          .map((item) => publicAssetPath(item.publicSrc || ""))
          .filter(Boolean);
        if (paths.length) {
          const { error: removeError } = await supabase.storage
            .from("clipcanva-public-assets")
            .remove(paths);
          if (removeError) {
            o.querySelector("#publish-status").textContent =
              `Canvas is unpublished, but public images could not be removed: ${removeError.message}`;
            button.disabled = false;
            return;
          }
        }
        publicCanvas = { ...data, is_public: false };
        publicationByCollection.delete(data.collection_id);
        syncPublicationControls();
        o.remove();
        toast("Canvas unpublished");
      });
    } catch (error) {
      toast(`Publishing is unavailable: ${error.message}`);
    }
  }
  async function teamModal() {
    try {
      await ensureProfile();
      const o = modal(
        `<h2>Team projects</h2><p>Create a shared canvas. Public projects can be viewed by anyone; only invited members can edit. Private projects are invite-only.</p><div class=row><input id=project-name maxlength=80 placeholder="New project name"><select id=project-visibility aria-label="Project visibility"><option value=private>Private · invite-only</option><option value=public>Public · anyone can view</option></select><button class="btn p" id=project-create>Create project</button></div><p id=team-status role=status></p><h3>Your projects</h3><div id=project-list></div><h3>Invitations</h3><div id=invite-list></div><h3>Invite by username</h3><label>Project<select id=invite-project></select></label><div class=row><input id=invite-username maxlength=24 placeholder="username"><select id=invite-role><option value=editor>Editor</option><option value=viewer>Viewer</option></select><button class="btn p" id=invite-send>Invite</button></div><div class=row><button class=btn id=team-close>Done</button></div>`,
      );
      o.querySelector("#team-close").onclick = () => o.remove();
      const status = o.querySelector("#team-status");
      const refresh = async () => {
        const [
          { data: projects, error: projectError },
          { data: memberships, error: membershipError },
          { data: invites, error: inviteError },
        ] = await Promise.all([
          supabase
            .from("clipcanva_projects")
            .select("id,name,owner_id,updated_at,visibility")
            .order("updated_at", { ascending: false }),
          supabase
            .from("clipcanva_project_members")
            .select("project_id,role")
            .eq("user_id", SESSION.id),
          supabase
            .from("clipcanva_project_invites")
            .select("id,project_id,role,created_at")
            .eq("invitee_id", SESSION.id)
            .order("created_at", { ascending: false }),
        ]);
        if (projectError) throw projectError;
        if (membershipError) throw membershipError;
        if (inviteError) throw inviteError;
        const roleByProject = new Map(
          (memberships || []).map((membership) => [
            membership.project_id,
            membership.role,
          ]),
        );
        const manageableProjects = (projects || []).filter((project) =>
          ["owner", "editor"].includes(roleByProject.get(project.id)),
        );
        const memberProjects = (projects || []).filter((project) =>
          roleByProject.has(project.id),
        );
        o.querySelector("#project-list").innerHTML =
          memberProjects
            .map(
              (project) =>
                `<div class="team-project-row"><button class=team-project data-project="${ea(project.id)}"><b>${e(project.name)}</b><small>${e(roleByProject.get(project.id))} · ${project.visibility === "public" ? "Public" : "Private"}</small></button>${roleByProject.get(project.id) === "owner" ? `<button class=btn data-visibility="${ea(project.id)}" data-next-visibility="${project.visibility === "public" ? "private" : "public"}">${project.visibility === "public" ? "Make private" : "Make public"}</button>` : ""}${project.visibility === "public" ? `<button class=btn data-copy-project="${ea(project.id)}">Copy link</button>` : ""}</div>`,
            )
            .join("") || "<p class=muted>No team projects yet.</p>";
        o.querySelector("#invite-project").innerHTML = (projects || [])
          .filter((project) => manageableProjects.includes(project))
          .map(
            (project) =>
              `<option value="${ea(project.id)}">${e(project.name)}</option>`,
          )
          .join("");
        o.querySelector("#invite-project").closest("label").hidden =
          !manageableProjects.length;
        o.querySelector("#invite-username").parentElement.hidden =
          !manageableProjects.length;
        o.querySelector(
          "#invite-username",
        ).parentElement.previousElementSibling.hidden =
          !manageableProjects.length;
        o
          .querySelector("#invite-project")
          .closest("label").previousElementSibling.hidden =
          !manageableProjects.length;
        o.querySelector("#invite-list").innerHTML =
          (invites || [])
            .map(
              (invite) =>
                `<div class=invite-row><span>Project invitation · ${e(invite.role)}</span><button class=btn data-accept="${ea(invite.id)}">Accept</button><button class=btn data-decline="${ea(invite.id)}">Decline</button></div>`,
            )
            .join("") || "<p class=muted>No pending invitations.</p>";
        o.querySelectorAll("[data-project]").forEach((button) => {
          button.onclick = () => {
            location.href = `index.html?project=${encodeURIComponent(button.dataset.project)}`;
          };
        });
        o.querySelectorAll("[data-visibility]").forEach((button) => {
          button.onclick = async () => {
            button.disabled = true;
            const { error } = await supabase.rpc(
              "set_clipcanva_project_visibility",
              {
                target_project: button.dataset.visibility,
                new_visibility: button.dataset.nextVisibility,
              },
            );
            if (error) {
              button.disabled = false;
              status.textContent = `Could not change project visibility: ${error.message}`;
              return;
            }
            await refresh();
          };
        });
        o.querySelectorAll("[data-copy-project]").forEach((button) => {
          button.onclick = async () => {
            const shareUrl = new URL(
              `canvas.html?project=${encodeURIComponent(button.dataset.copyProject)}`,
              location.href,
            ).href;
            try {
              await navigator.clipboard.writeText(shareUrl);
              status.textContent = "Public project link copied.";
            } catch (error) {
              status.textContent = `Could not copy the link: ${error.message}`;
            }
          };
        });
        o.querySelectorAll("[data-accept]").forEach((button) => {
          button.onclick = async () => {
            button.disabled = true;
            const { data: projectId, error } = await supabase.rpc(
              "accept_clipcanva_project_invite",
              { invite_id: button.dataset.accept },
            );
            if (error) {
              button.disabled = false;
              status.textContent = `Could not accept invitation: ${error.message}`;
              return;
            }
            location.href = `index.html?project=${encodeURIComponent(projectId)}`;
          };
        });
        o.querySelectorAll("[data-decline]").forEach((button) => {
          button.onclick = async () => {
            button.disabled = true;
            const { error } = await supabase
              .from("clipcanva_project_invites")
              .delete()
              .eq("id", button.dataset.decline);
            if (error) {
              button.disabled = false;
              status.textContent = `Could not decline invitation: ${error.message}`;
              return;
            }
            await refresh();
          };
        });
      };
      o.querySelector("#project-create").onclick = async () => {
        const button = o.querySelector("#project-create");
        const name = o.querySelector("#project-name").value.trim();
        if (!name || name.length > 80) {
          status.textContent = "Project name must be 1–80 characters.";
          return;
        }
        button.disabled = true;
        const { data: projectId, error } = await supabase.rpc(
          "create_clipcanva_project",
          {
            project_name: name,
            project_visibility: o.querySelector("#project-visibility").value,
          },
        );
        if (error) {
          button.disabled = false;
          status.textContent = `Could not create project: ${error.message}`;
          return;
        }
        location.href = `index.html?project=${encodeURIComponent(projectId)}`;
      };
      o.querySelector("#invite-send").onclick = async () => {
        const button = o.querySelector("#invite-send");
        const username = o
          .querySelector("#invite-username")
          .value.trim()
          .replace(/^@/, "")
          .toLowerCase();
        if (!/^[a-z0-9][a-z0-9_-]{2,23}$/.test(username)) {
          status.textContent = "Enter a valid Clipcanva username.";
          return;
        }
        const projectId = o.querySelector("#invite-project").value;
        if (!projectId) {
          status.textContent = "Create or select a project first.";
          return;
        }
        button.disabled = true;
        const { data: invitee, error: profileError } = await supabase
          .from("clipcanva_profiles")
          .select("user_id")
          .eq("username", username)
          .maybeSingle();
        if (profileError || !invitee) {
          status.textContent = profileError
            ? `Could not search that profile: ${profileError.message}`
            : "No public profile found for that username.";
          button.disabled = false;
          return;
        }
        const { error } = await supabase
          .from("clipcanva_project_invites")
          .insert({
            project_id: projectId,
            inviter_id: SESSION.id,
            invitee_id: invitee.user_id,
            role: o.querySelector("#invite-role").value,
          });
        button.disabled = false;
        if (error) {
          status.textContent = `Could not send invitation: ${error.message}`;
          return;
        }
        status.textContent = `Invitation sent to @${username}.`;
      };
      await refresh();
    } catch (error) {
      toast(`Team projects are unavailable: ${error.message}`);
    }
  }
  async function refreshSharedProject() {
    if (!activeProjectId || projectHasConflict) return;
    const { data: project, error } = await supabase
      .from("clipcanva_projects")
      .select("data,updated_at")
      .eq("id", activeProjectId)
      .maybeSingle();
    if (error) {
      if (Date.now() - projectPollErrorShown > 60000) {
        projectPollErrorShown = Date.now();
        toast(`Could not check for project updates: ${error.message}`);
      }
      return;
    }
    if (!project || project.updated_at === projectUpdatedAt) return;
    if (saved === "pending" || saved === "syncing") {
      projectHasConflict = true;
      saved = "fail";
      rS();
      toast(
        "A teammate updated this project while your edits were pending. Reload to see their version; unsynced local edits will be discarded.",
        ["Reload project", () => location.reload()],
      );
      return;
    }
    try {
      S = await loadCloudWorkspace(project.data);
      projectUpdatedAt = project.updated_at;
      last = snap();
      lastCloudContent = snap();
      hist = [];
      fut = [];
      sel.clear();
      suppressSave = true;
      rA();
      suppressSave = false;
      await DB.set(JSON.parse(JSON.stringify(S)));
      saved = "ok";
      rS();
      toast("Teammate’s latest changes are in.");
    } catch (error) {
      suppressSave = false;
      toast(`Could not load the latest project version: ${error.message}`);
    }
  }
  const A = {
    logout: async () => {
      clearTimeout(st);
      try {
        const snapshot = JSON.parse(JSON.stringify(S));
        await DB.set(snapshot);
        if (cloudReady) await syncCloudWorkspace(snapshot);
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      } catch (error) {
        toast(`Could not sign out safely: ${error.message}`);
      }
    },
    undo,
    redo,
    zi: () => {
      const r = $("#vp").getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.2);
    },
    zo: () => {
      const r = $("#vp").getBoundingClientRect();
      zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.2);
    },
    fit: () => fit(),
    cap: capModal,
    help: helpModal,
    community: () => {
      location.href = "community.html";
    },
    profile: profileModal,
    publish: publishModal,
    team: teamModal,
    personal: () => {
      location.href = "index.html";
    },
    hist: () => {
      const h = $("#hist");
      h.classList.toggle("o");
      if (innerWidth <= 640 && h.classList.contains("o") && sel.size) {
        sel.clear();
        uS();
      }
      pO();
      rH();
      rR();
    },
    fav: () => {
      F.fav = !F.fav;
      rR();
      rC();
    },
    all: () => {
      F.fav = false;
      F.coll = null;
      F.type = "all";
      F.q = "";
      $("#q").value = "";
      rA();
    },
    x: () => {
      sel.clear();
      uS();
    },
    copy: () => copyItem(one()),
    dup,
    pin: () => {
      const i = one();
      i.pin = i.pin ? 0 : 1;
      commit();
    },
    star: fav,
    conn: doConn,
    del: () => delItems([...sel]),
    comb,
    grp,
    newco: () =>
      ask("New collection", "", (nm) => {
        S.colls.push({ id: uid(), name: nm });
        commit();
      }),
    add: (b) => {
      const r = b.getBoundingClientRect();
      menu(r.left - 120, r.bottom + 6, [
        [
          "New text",
          () => {
            spawn("text", { content: "New note" });
            setTimeout(() => $("#f-c")?.focus(), 300);
          },
        ],
        [
          "New code snippet",
          () => {
            spawn("code", {
              content: "// your code",
              lang: "js",
              title: "Snippet",
            });
            setTimeout(() => $("#f-c")?.focus(), 300);
          },
        ],
        [
          "New link",
          () => {
            spawn("link", { content: "https://example.com" });
            setTimeout(() => $("#f-c")?.focus(), 300);
          },
        ],
        [
          "New color",
          () =>
            spawn("color", {
              content:
                "#" +
                Math.floor(Math.random() * 16777215)
                  .toString(16)
                  .padStart(6, "0"),
            }),
        ],
        "-",
        ["Paste from clipboard", () => readClip(), "Ctrl+V"],
        ["Import files…", () => $("#fi").click()],
      ]);
    },
    paste: () => readClip(),
    import: () => $("#fi").click(),
  };
  document.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-a]");
    if (b) {
      if (
        projectRole === "viewer" &&
        ![
          "community",
          "team",
          "profile",
          "personal",
          "help",
          "hist",
          "all",
          "fav",
          "zo",
          "zi",
          "fit",
          "copy",
        ].includes(b.dataset.a)
      ) {
        toast("You have viewer access to this project.");
        return;
      }
      A[b.dataset.a]?.(b, ev);
      return;
    }
    const co = ev.target.closest("[data-co]");
    if (co) {
      if (F.coll == co.dataset.co) {
        const collection = S.colls.find((item) => item.id == co.dataset.co);
        const rect = co.getBoundingClientRect();
        manageCollection(collection, rect.right + 8, rect.top);
        return;
      }
      F.coll = co.dataset.co;
      rR();
      rC();
      return;
    }
    const ty = ev.target.closest("[data-ty]");
    if (ty) {
      F.type = ty.dataset.ty;
      rP();
      rC();
      return;
    }
    const h = ev.target.closest("[data-h]");
    if (h) {
      sel = new Set([h.dataset.h]);
      fit([h.dataset.h]);
      uS();
      reveal();
      return;
    }
  });
  $("#fi").onchange = async (ev) => {
    if (projectRole === "viewer") {
      ev.target.value = "";
      toast("You have viewer access to this project.");
      return;
    }
    for (const f of ev.target.files) {
      if (f.name.endsWith(".clipcanva.json")) {
        await importCaptureBundle(f);
      } else {
        await addFile(f);
      }
    }
    ev.target.value = "";
  };
  $("#q").oninput = (ev) => {
    F.q = ev.target.value;
    rC();
  };
  $("#q").onkeydown = (ev) => {
    if (ev.key == "Enter") {
      const m = S.items.filter(match).map((i) => i.id);
      if (m.length) fit(m);
    }
  };
  document.addEventListener("change", (ev) => {
    if (ev.target.id == "dt") {
      F.date = ev.target.value;
      rC();
    }
  });
  const ins = $("#ins");
  ins.addEventListener("input", (ev) => {
    const i = one(),
      id = ev.target.id;
    if (!i && id != "f-o") return;
    if (id == "f-t") i.title = ev.target.value;
    if (id == "f-src") i.sourceUrl = ev.target.value;
    if (id == "f-c") {
      i.content = ev.target.value;
      if (i.type == "color" && /^#[0-9a-f]{6}$/i.test(i.content)) {
        const k = $("#f-k");
        if (k) k.value = i.content;
      }
    }
    if (id == "f-k") {
      i.content = ev.target.value;
      $("#f-c").value = i.content;
    }
    if (id == "f-l") i.lang = ev.target.value;
    if (id == "f-g")
      i.tags = ev.target.value
        .split(",")
        .map((s) => s.trim().replace(/^#/, ""))
        .filter(Boolean);
    if (id == "f-o") return;
    const n = nodeOf(i.id);
    if (n) n.outerHTML = itemHTML(i, match(i));
    rL();
    save();
  });
  ins.addEventListener("change", (ev) => {
    if (ev.target.id == "f-o") {
      [...sel].forEach((id) => (byId(id).coll = ev.target.value || null));
    }
    commit(1);
  });

  /* ---------- pointer ---------- */
  const vp = $("#vp"),
    tp = new Map();
  vp.addEventListener("pointerdown", (ev) => {
    hideMenu();
    if (ev.button == 2) return;
    if (ev.pointerType == "touch") {
      tp.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
      if (tp.size == 2) {
        if (ptr && ptr.m == "drag" && ptr.moved) commit();
        const [a, c] = [...tp.values()];
        vp.setPointerCapture(ev.pointerId);
        ptr = {
          m: "pinch",
          d0: Math.hypot(a.x - c.x, a.y - c.y) || 1,
          z0: S.v.z,
          vx: S.v.x,
          vy: S.v.y,
          cx: (a.x + c.x) / 2,
          cy: (a.y + c.y) / 2,
        };
        return;
      }
    }
    const it = ev.target.closest(".it"),
      lb = ev.target.closest(".fr span"),
      sx = ev.clientX,
      sy = ev.clientY;
    if (ev.button == 1 || space || (ev.altKey && !it)) {
      vp.setPointerCapture(ev.pointerId);
      ptr = { m: "pan", sx, sy, vx: S.v.x, vy: S.v.y };
      ev.preventDefault();
      return;
    }
    vp.setPointerCapture(ev.pointerId);
    if (it) {
      const id = it.dataset.id,
        o = byId(id);
      if (conn) {
        connect(conn, id);
        conn = null;
        vp.classList.remove("cn");
        rC();
        ptr = null;
        return;
      }
      if (ev.target.closest(".rs")) {
        ptr = { m: "rs", o, sx, sy, w: o.w, h: o.h };
        return;
      }
      if (ev.shiftKey || ev.metaKey || ev.ctrlKey) {
        sel.has(id) ? sel.delete(id) : sel.add(id);
      } else if (!sel.has(id)) sel = new Set([id]);
      uS();
      if (projectRole === "viewer") {
        ptr = null;
        return;
      }
      ptr = {
        m: "drag",
        sx,
        sy,
        ids: [...sel]
          .map(byId)
          .filter((i) => i && !i.pin)
          .map((i) => ({ o: i, x: i.x, y: i.y })),
        moved: 0,
      };
      return;
    }
    if (lb) {
      sel = new Set(
        S.items.filter((i) => i.coll == lb.dataset.c).map((i) => i.id),
      );
      uS();
      if (projectRole === "viewer") {
        ptr = null;
        return;
      }
      ptr = {
        m: "drag",
        sx,
        sy,
        ids: [...sel]
          .map(byId)
          .filter((i) => !i.pin)
          .map((i) => ({ o: i, x: i.x, y: i.y })),
        moved: 0,
      };
      return;
    }
    if (conn) {
      conn = null;
      vp.classList.remove("cn");
      rC();
    }
    if (!ev.shiftKey) {
      sel.clear();
      uS();
    }
    if (ev.pointerType == "touch") {
      ptr = { m: "pan", sx, sy, vx: S.v.x, vy: S.v.y };
      return;
    }
    ptr = { m: "mq", sx, sy, base: new Set(sel) };
  });
  vp.addEventListener("pointermove", (ev) => {
    if (tp.has(ev.pointerId))
      tp.set(ev.pointerId, { x: ev.clientX, y: ev.clientY });
    if (!ptr) return;
    if (ptr.m == "pinch") {
      if (tp.size < 2) return;
      const [a, c] = [...tp.values()],
        d = Math.hypot(a.x - c.x, a.y - c.y),
        cx = (a.x + c.x) / 2,
        cy = (a.y + c.y) / 2,
        r = vp.getBoundingClientRect(),
        nz = Math.min(2.5, Math.max(0.2, (ptr.z0 * d) / ptr.d0)),
        wx = (ptr.cx - r.left - ptr.vx) / ptr.z0,
        wy = (ptr.cy - r.top - ptr.vy) / ptr.z0;
      S.v.z = nz;
      S.v.x = cx - r.left - wx * nz;
      S.v.y = cy - r.top - wy * nz;
      aV();
      return;
    }
    const v = S.v,
      z = v.z,
      dx = ev.clientX - ptr.sx,
      dy = ev.clientY - ptr.sy;
    if (ptr.m == "pan") {
      v.x = ptr.vx + dx;
      v.y = ptr.vy + dy;
      aV();
    } else if (ptr.m == "drag") {
      if (!ptr.moved && Math.hypot(dx, dy) < 4) return;
      ptr.moved = 1;
      const one1 = ptr.ids.length == 1,
        f = ev.altKey ? (q) => q : sn;
      ptr.ids.forEach((s) => {
        s.o.x = one1 ? f(s.x + dx / z) : s.x + f(dx / z);
        s.o.y = one1 ? f(s.y + dy / z) : s.y + f(dy / z);
        const n = nodeOf(s.o.id);
        n.style.left = s.o.x + "px";
        n.style.top = s.o.y + "px";
      });
      rL();
      rF();
    } else if (ptr.m == "rs") {
      ptr.o.w = Math.max(150, sn(ptr.w + dx / z));
      ptr.o.h = Math.max(110, sn(ptr.h + dy / z));
      const n = nodeOf(ptr.o.id);
      n.style.width = ptr.o.w + "px";
      n.style.height = ptr.o.h + "px";
      rL();
      rF();
    } else if (ptr.m == "mq") {
      const r = vp.getBoundingClientRect(),
        q = $("#mq");
      q.hidden = false;
      const l = Math.min(ptr.sx, ev.clientX) - r.left,
        t = Math.min(ptr.sy, ev.clientY) - r.top,
        w = Math.abs(dx),
        h = Math.abs(dy);
      Object.assign(q.style, {
        left: l + "px",
        top: t + "px",
        width: w + "px",
        height: h + "px",
      });
      const x1 = (l - v.x) / z,
        y1 = (t - v.y) / z,
        x2 = x1 + w / z,
        y2 = y1 + h / z;
      sel = new Set([
        ...ptr.base,
        ...S.items
          .filter(
            (i) =>
              match(i) &&
              i.x < x2 &&
              i.x + i.w > x1 &&
              i.y < y2 &&
              i.y + i.h > y1,
          )
          .map((i) => i.id),
      ]);
      uS();
    }
  });
  const up = (ev) => {
    tp.delete(ev.pointerId);
    if (!ptr) return;
    const p = ptr;
    ptr = null;
    $("#mq").hidden = true;
    if ((p.m == "drag" && p.moved) || p.m == "rs") commit();
    else if ((p.m == "drag" || p.m == "mq") && sel.size) reveal();
  };
  vp.addEventListener("pointerup", up);
  vp.addEventListener("pointercancel", up);
  vp.addEventListener(
    "wheel",
    (ev) => {
      ev.preventDefault();
      if (ev.ctrlKey || ev.metaKey)
        zoomAt(
          ev.clientX,
          ev.clientY,
          Math.exp(-Math.max(-100, Math.min(100, ev.deltaY)) * 0.0035),
        );
      else {
        S.v.x -= ev.deltaX;
        S.v.y -= ev.deltaY;
        aV();
      }
    },
    { passive: false },
  );
  vp.addEventListener("dblclick", (ev) => {
    if (projectRole === "viewer") return;
    const el = document.elementFromPoint(ev.clientX, ev.clientY),
      it = el && el.closest(".it");
    if (it) {
      sel = new Set([it.dataset.id]);
      uS();
      setTimeout(() => $("#f-c,#f-t")?.focus(), 50);
    } else if (!(el && el.closest(".fr"))) {
      const r = vp.getBoundingClientRect();
      spawn(
        "text",
        { content: "New note" },
        {
          x: (ev.clientX - r.left - S.v.x) / S.v.z,
          y: (ev.clientY - r.top - S.v.y) / S.v.z,
        },
      );
      setTimeout(() => {
        const f = $("#f-c");
        f?.focus();
        f?.select();
      }, 300);
    }
  });
  vp.addEventListener("contextmenu", (ev) => {
    ev.preventDefault();
    if (projectRole === "viewer") return;
    const it = ev.target.closest(".it"),
      l = ev.target.closest("[data-l]"),
      lb = ev.target.closest(".fr span"),
      r = vp.getBoundingClientRect(),
      at = {
        x: (ev.clientX - r.left - S.v.x) / S.v.z,
        y: (ev.clientY - r.top - S.v.y) / S.v.z,
      };
    if (l)
      return menu(ev.clientX, ev.clientY, [
        [
          "Remove connection",
          () => {
            S.links = S.links.filter((k) => k.id != l.dataset.l);
            commit();
          },
          "",
          1,
        ],
      ]);
    if (lb) {
      const c = S.colls.find((c) => c.id == lb.dataset.c);
      return manageCollection(c, ev.clientX, ev.clientY);
    }
    if (it) {
      if (!sel.has(it.dataset.id)) {
        sel = new Set([it.dataset.id]);
        uS();
      }
      const i = one(),
        n = sel.size;
      return menu(ev.clientX, ev.clientY, [
        ...(n > 1
          ? [
              ["Combine into new text", comb, "M"],
              ["Group into collection…", grp, "⌘G"],
              "-",
            ]
          : []),
        ["Copy", () => copyItem(i || byId([...sel][0])), "⌘C"],
        [
          "Edit",
          () => {
            $("#f-c,#f-t")?.focus();
          },
          "2×click",
        ],
        ["Duplicate", dup, "⌘D"],
        [
          i && i.pin ? "Unpin" : "Pin",
          () => {
            [...sel].forEach((id) => {
              const o = byId(id);
              o.pin = o.pin ? 0 : 1;
            });
            commit();
          },
          "P",
        ],
        ["Toggle favorite", fav, "F"],
        ["Connect…", doConn, "L"],
        ...(S.items.some((o) => sel.has(o.id) && o.coll)
          ? [
              [
                "Remove from collection",
                () => {
                  [...sel].forEach((id) => (byId(id).coll = null));
                  commit();
                },
              ],
            ]
          : []),
        "-",
        ["Delete", () => delItems([...sel]), "⌫", 1],
      ]);
    }
    menu(ev.clientX, ev.clientY, [
      [
        "Paste here",
        async () => {
          try {
            const t = await navigator.clipboard.readText();
            if (!addText(t, at))
              toast("Clipboard is empty or already captured");
          } catch {
            toast("Paste blocked. Press Ctrl/⌘+V instead.");
          }
        },
      ],
      ["New text", () => spawn("text", { content: "New note" }, at)],
      ["New color", () => spawn("color", { content: "#4c8dff" }, at)],
      "-",
      [
        "Select all",
        () => {
          sel = new Set(S.items.map((i) => i.id));
          uS();
        },
        "⌘A",
      ],
      ["Fit all", () => fit(), "0"],
    ]);
  });
  vp.addEventListener("dragover", (ev) => ev.preventDefault());
  vp.addEventListener("drop", async (ev) => {
    ev.preventDefault();
    if (projectRole === "viewer") {
      toast("You have viewer access to this project.");
      return;
    }
    const r = vp.getBoundingClientRect(),
      at = {
        x: (ev.clientX - r.left - S.v.x) / S.v.z,
        y: (ev.clientY - r.top - S.v.y) / S.v.z,
      };
    if (ev.dataTransfer.files.length)
      for (const f of ev.dataTransfer.files) await addFile(f, at);
    else {
      const t = ev.dataTransfer.getData("text/plain");
      if (t) addText(t, at);
    }
  });
  document.addEventListener("paste", async (ev) => {
    if (/INPUT|TEXTAREA/.test(ev.target.tagName)) return;
    ev.preventDefault();
    if (projectRole === "viewer") {
      toast("You have viewer access to this project.");
      return;
    }
    const d = ev.clipboardData;
    if (!d) return;
    if (d.files.length) {
      for (const f of d.files) await addFile(f);
      return;
    }
    const t = d.getData("text/plain");
    if (!addText(t)) toast("Nothing new to paste");
  });
  addEventListener("focus", () => {
    if (cap.auto) readClip(true);
  });
  let pvT;
  $("#o").addEventListener("mouseover", (ev) => {
    clearTimeout(pvT);
    const it = ev.target.closest(".it"),
      p = $("#pv");
    p.hidden = true;
    if (!it || ptr) return;
    const i = byId(it.dataset.id);
    pvT = setTimeout(() => {
      if (ptr) return;
      p.innerHTML =
        i.type == "image"
          ? `<img src="${ea(i.src)}" alt="">`
          : e((i.type == "file" ? i.title : i.content).slice(0, 700));
      const r = it.getBoundingClientRect();
      p.hidden = false;
      p.style.left = Math.min(r.right + 10, innerWidth - 350) + "px";
      p.style.top = Math.max(8, Math.min(r.top, innerHeight - 310)) + "px";
    }, 650);
  });
  $("#o").addEventListener("mouseleave", () => {
    clearTimeout(pvT);
    $("#pv").hidden = true;
  });
  addEventListener("keyup", (ev) => {
    if (ev.key == " ") {
      space = false;
      vp.classList.remove("pan");
    }
  });
  addEventListener("keydown", (ev) => {
    const ty = /INPUT|TEXTAREA|SELECT/.test(ev.target.tagName),
      m = ev.ctrlKey || ev.metaKey,
      k = ev.key.toLowerCase();
    if (
      !ty &&
      projectRole === "viewer" &&
      ((m && ["d", "g", "z", "y"].includes(k)) ||
        ["delete", "backspace", "m", "l", "p", "f"].includes(k) ||
        k.startsWith("arrow"))
    ) {
      ev.preventDefault();
      toast("You have viewer access to this project.");
      return;
    }
    if (ev.key == "Escape") {
      conn = null;
      vp.classList.remove("cn");
      hideMenu();
      document.querySelector(".ov")?.remove();
      if (ty) ev.target.blur();
      else {
        sel.clear();
        rC();
        uS();
      }
      return;
    }
    if (m && k == "f") {
      ev.preventDefault();
      $("#q").focus();
      return;
    }
    if (ty) return;
    if (m && k == "z") {
      ev.preventDefault();
      ev.shiftKey ? redo() : undo();
      return;
    }
    if (m && k == "y") {
      ev.preventDefault();
      redo();
      return;
    }
    if (m && k == "a") {
      ev.preventDefault();
      sel = new Set(S.items.filter(match).map((i) => i.id));
      uS();
      return;
    }
    if (m && k == "d") {
      ev.preventDefault();
      dup();
      return;
    }
    if (m && k == "g") {
      ev.preventDefault();
      grp();
      return;
    }
    if (m && k == "c" && sel.size && !getSelection().toString()) {
      ev.preventDefault();
      copyItem(byId([...sel][0]));
      return;
    }
    if (m) return;
    if (ev.key == " ") {
      space = true;
      vp.classList.add("pan");
      ev.preventDefault();
      return;
    }
    if (k == "/") {
      ev.preventDefault();
      $("#q").focus();
      return;
    }
    if (ev.key == "?") {
      helpModal();
      return;
    }
    if (k == "0") {
      fit();
      return;
    }
    if (k == "+" || k == "=") {
      A.zi();
      return;
    }
    if (k == "-") {
      A.zo();
      return;
    }
    if (!sel.size) return;
    if (k == "delete" || k == "backspace") {
      ev.preventDefault();
      delItems([...sel]);
    } else if (k == "m") comb();
    else if (k == "l") doConn();
    else if (k == "p") {
      [...sel].forEach((id) => {
        const o = byId(id);
        o.pin = o.pin ? 0 : 1;
      });
      commit();
    } else if (k == "f") fav();
    else if (k.startsWith("arrow")) {
      ev.preventDefault();
      const s = ev.shiftKey ? 48 : 12;
      [...sel]
        .map(byId)
        .filter((i) => !i.pin)
        .forEach((i) => {
          if (k == "arrowleft") i.x -= s;
          if (k == "arrowright") i.x += s;
          if (k == "arrowup") i.y -= s;
          if (k == "arrowdown") i.y += s;
        });
      commit();
    }
  });
  addEventListener(
    "pointerdown",
    (ev) => {
      if (!ev.target.closest("#menu")) hideMenu();
    },
    true,
  );
  setInterval(() => {
    if (!ptr) rH();
  }, 60000);

  /* ---------- boot ---------- */
  (async () => {
    $("#account-chip").textContent = SESSION.email;
    saved = "syncing";
    rS();
    let profileSetupError = null;
    try {
      await ensureProfile();
    } catch (error) {
      profileSetupError = error;
    }

    const requestedProject = new URLSearchParams(location.search).get(
      "project",
    );
    if (requestedProject) {
      if (!/^[0-9a-f-]{36}$/i.test(requestedProject)) {
        throw new Error("This project link is invalid.");
      }
      activeProjectId = requestedProject;
      const { data: project, error: projectError } = await supabase
        .from("clipcanva_projects")
        .select("id,name,owner_id,data,updated_at,visibility")
        .eq("id", activeProjectId)
        .maybeSingle();
      if (projectError) throw projectError;
      if (!project) {
        throw new Error(
          "This project is unavailable or your account has not been invited.",
        );
      }
      const { data: membership, error: memberError } = await supabase
        .from("clipcanva_project_members")
        .select("role")
        .eq("project_id", activeProjectId)
        .eq("user_id", SESSION.id)
        .maybeSingle();
      if (memberError) throw memberError;
      projectRole =
        membership?.role ||
        (project.owner_id === SESSION.id
          ? "owner"
          : project.visibility === "public"
            ? "viewer"
            : null);
      if (!projectRole) {
        throw new Error("Your account is not a member of this project.");
      }
      projectName = project.name;
      projectUpdatedAt = project.updated_at;
      const publicVisitor = !membership && project.owner_id !== SESSION.id;
      $("#account-chip").textContent = publicVisitor
        ? `${project.name} · public view`
        : `${project.name} · ${projectRole}`;
      $("#my-canvas").hidden = false;
      if (projectRole === "viewer") document.body.classList.add("readonly");
      S = await loadCloudWorkspace(project.data);
      await DB.set(JSON.parse(JSON.stringify(S)));
      last = snap();
      lastCloudContent = snap();
      saved = "ok";
      cloudReady = true;
      cloudUnavailable = false;
      rA();
      if (!S.items.length) fit();
      window.setInterval(refreshSharedProject, 5000);
      if (profileSetupError) {
        toast(
          `Public profiles and team projects need the sharing migration applied in Supabase. ${profileSetupError.message}`,
        );
      }
      return;
    }

    let remoteWorkspace;
    try {
      const { data, error } = await supabase
        .from("clipcanva_workspaces")
        .select("data")
        .eq("user_id", SESSION.id)
        .maybeSingle();
      if (error) throw error;
      remoteWorkspace = data?.data;
    } catch (error) {
      saved = "fail";
      let cached;
      try {
        cached = await DB.get();
      } catch (cacheError) {
        toast(`Local cache could not be read: ${cacheError.message}`);
      }
      if (cached?.items) {
        S = isStarterWorkspace(cached) ? emptyWorkspace() : cached;
      } else {
        S = emptyWorkspace();
      }
      last = snap();
      rA();
      toast(
        `Could not load cloud workspace. Changes will stay local. ${error.message}`,
      );
      cloudReady = false;
      cloudUnavailable = true;
      return;
    }

    let removedStarterWorkspace = false;
    if (remoteWorkspace) {
      removedStarterWorkspace = isStarterWorkspace(remoteWorkspace);
      S = removedStarterWorkspace
        ? emptyWorkspace()
        : await loadCloudWorkspace(remoteWorkspace);
      saved = "ok";
    } else {
      let localWorkspace;
      try {
        localWorkspace =
          (await DB.get()) || (await DB.getPrevious(SESSION.email));
      } catch (error) {
        toast(`Previous local workspace could not be read: ${error.message}`);
      }
      if (isStarterWorkspace(localWorkspace)) localWorkspace = null;
      if (localWorkspace?.items?.length) {
        const shouldMigrate = await chooseLocalMigration(localWorkspace);
        if (shouldMigrate) {
          S = localWorkspace;
        } else {
          S = emptyWorkspace();
          fit();
        }
      } else {
        S = emptyWorkspace();
        fit();
      }
      cloudReady = true;
      cloudUnavailable = false;
      rA();
      clearTimeout(st);
      try {
        await DB.set(JSON.parse(JSON.stringify(S)));
        await syncCloudWorkspace(S);
        lastCloudContent = snap();
        saved = "ok";
      } catch (error) {
        saved = "fail";
        toast(
          `Initial cloud save failed; your canvas is kept locally. ${error.message}`,
        );
      }
    }
    if (remoteWorkspace) {
      await DB.set(JSON.parse(JSON.stringify(S)));
      cloudReady = true;
      cloudUnavailable = false;
      if (removedStarterWorkspace) {
        try {
          await syncCloudWorkspace(S);
          lastCloudContent = snap();
          saved = "ok";
          toast("Starter items removed. Your canvas is ready.");
        } catch (error) {
          saved = "fail";
          toast(
            `Your canvas is blank on this device, but starter items could not be removed from cloud storage yet. ${error.message}`,
          );
        }
      }
    }
    last = snap();
    lastCloudContent = snap();
    rA();
    if (!S.items.length) fit();
    if (profileSetupError) {
      toast(
        `Public profiles and team projects need the sharing migration applied in Supabase. ${profileSetupError.message}`,
      );
    }
    try {
      const p = await navigator.permissions.query({
        name: "clipboard-read",
      });
      if (p.state == "denied") cap.state = "denied";
      rS();
    } catch {}
  })().catch((error) => {
    saved = "fail";
    rS();
    toast(`Clipcanva could not start: ${error.message}`);
  });
}
