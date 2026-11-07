const MAX_CAPTURES = 10;
const $ = (selector) => document.querySelector(selector);
const status = $("#status");
const captureButton = $("#capture");
const exportButton = $("#export");
const clearButton = $("#clear");
let database;

function openDatabase() {
  if (database) return database;
  database = new Promise((resolve, reject) => {
    const request = indexedDB.open("clipcanva-capture-queue", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("captures", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        request.error || new Error("Could not open the local capture queue."),
      );
  });
  return database;
}

async function loadCaptures() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const request = db.transaction("captures").objectStore("captures").getAll();
    request.onsuccess = () =>
      resolve(request.result.sort((a, b) => a.capturedAt - b.capturedAt));
    request.onerror = () =>
      reject(
        request.error || new Error("Could not read the local capture queue."),
      );
  });
}

async function saveCapture(capture) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("captures", "readwrite");
    transaction.objectStore("captures").add(capture);
    transaction.oncomplete = resolve;
    transaction.onerror = () =>
      reject(
        transaction.error || new Error("Could not save this capture locally."),
      );
    transaction.onabort = () =>
      reject(
        transaction.error || new Error("The local capture could not be saved."),
      );
  });
}

async function clearCaptures() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction("captures", "readwrite");
    transaction.objectStore("captures").clear();
    transaction.oncomplete = resolve;
    transaction.onerror = () =>
      reject(
        transaction.error ||
          new Error("Could not clear the local capture queue."),
      );
    transaction.onabort = () =>
      reject(
        transaction.error ||
          new Error("The local capture queue was not cleared."),
      );
  });
}

async function render() {
  const captures = await loadCaptures();
  $("#count").textContent = `${captures.length} / ${MAX_CAPTURES}`;
  $("#captures").replaceChildren(
    ...captures
      .slice()
      .reverse()
      .map((capture) => {
        const row = document.createElement("li");
        const title = document.createElement("strong");
        const source = document.createElement("small");
        title.textContent = capture.title;
        source.textContent = new URL(capture.sourceUrl).hostname;
        row.append(title, source);
        return row;
      }),
  );
  exportButton.disabled = captures.length === 0;
  clearButton.disabled = captures.length === 0;
  captureButton.disabled = captures.length >= MAX_CAPTURES;
}

captureButton.addEventListener("click", async () => {
  captureButton.disabled = true;
  status.textContent = "Capturing the visible tab…";
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.url || tab.windowId == null)
      throw new Error("No active browser tab was found.");

    const pageUrl = new URL(tab.url);
    if (!["http:", "https:"].includes(pageUrl.protocol))
      throw new Error(
        "This browser page cannot be captured. Open a regular website and try again.",
      );

    const captures = await loadCaptures();
    if (captures.length >= MAX_CAPTURES)
      throw new Error("The queue is full. Download or clear it first.");

    const image = await chrome.tabs.captureVisibleTab(tab.windowId, {
      format: "png",
    });
    await saveCapture({
      id: crypto.randomUUID(),
      image,
      sourceUrl: pageUrl.origin,
      title: (tab.title || pageUrl.hostname).slice(0, 120),
      capturedAt: Date.now(),
    });
    status.textContent =
      "Tab captured locally. Download the bundle to import it.";
    await render();
  } catch (error) {
    status.textContent =
      error instanceof Error ? error.message : "The tab could not be captured.";
    try {
      await render();
    } catch (renderError) {
      captureButton.disabled = false;
      status.textContent +=
        renderError instanceof Error
          ? ` Queue refresh failed: ${renderError.message}`
          : " Queue refresh failed.";
    }
  }
});

exportButton.addEventListener("click", async () => {
  try {
    const captures = await loadCaptures();
    if (!captures.length) return;
    const bundle = {
      app: "clipcanva",
      version: 1,
      exportedAt: new Date().toISOString(),
      captures,
    };
    const file = new Blob([JSON.stringify(bundle)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(file);
    chrome.downloads.download(
      {
        url,
        filename: `Clipcanva-captures-${new Date().toISOString().slice(0, 10)}.clipcanva.json`,
        saveAs: true,
      },
      () => {
        const error = chrome.runtime.lastError;
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
        if (error) {
          status.textContent = `Bundle download failed: ${error.message}`;
          return;
        }
        status.textContent =
          "Bundle downloaded. Import it from Add → Import files in Clipcanva.";
      },
    );
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? `Bundle could not be created: ${error.message}`
        : "Bundle could not be created.";
  }
});

clearButton.addEventListener("click", async () => {
  try {
    await clearCaptures();
    status.textContent = "Local capture queue cleared.";
    await render();
  } catch (error) {
    status.textContent =
      error instanceof Error
        ? `Could not clear the local queue: ${error.message}`
        : "Could not clear the local queue.";
  }
});

render().catch((error) => {
  status.textContent =
    error instanceof Error
      ? `Could not read the local capture queue: ${error.message}`
      : "Could not read the local capture queue.";
});
