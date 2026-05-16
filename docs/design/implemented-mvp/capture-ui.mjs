import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  STORAGE_KEY,
  createMockRecognition,
  createMockRegionCandidates,
  createOriginalPlaceholderImage,
  createRecordFromDraft,
} from "../../../app/state.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const outputDir = join(here, "screens");
const assetsDir = join(here, "assets");
const chromePath =
  process.env.CHROME_PATH || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

if (!existsSync(chromePath)) {
  throw new Error(`Chrome executable not found: ${chromePath}`);
}

await mkdir(outputDir, { recursive: true });
await mkdir(assetsDir, { recursive: true });

const sampleImagePath = join(assetsDir, "sample-original-question.svg");
await writeFile(sampleImagePath, sampleOriginalQuestionSvg(), "utf8");

const server = await startStaticServer(repoRoot);
const port = server.address().port;
const userDataDir = join(repoRoot, ".tmp-ui-capture-profile");
await rm(userDataDir, { recursive: true, force: true });

const chrome = spawn(chromePath, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--no-default-browser-check",
  "--disable-background-networking",
  "--remote-debugging-port=9237",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
]);

try {
  const pageWsUrl = await waitForPageWebSocket("http://127.0.0.1:9237");
  const cdp = await createCdpClient(pageWsUrl);
  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("DOM.enable");
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 980,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await navigate(cdp, `http://127.0.0.1:${port}/app/index.html`);
  await seedDemoRecords(cdp);
  await reload(cdp);
  await waitForExpression(cdp, "document.body.dataset.screen === 'hub'", "hub screen");
  await capture(cdp, "01-app-hub.png");

  await click(cdp, "[data-action='go-upload']");
  await waitForExpression(cdp, "document.body.dataset.screen === 'upload'", "upload screen");
  await setFileInput(cdp, "#image-input", sampleImagePath);
  await waitForExpression(cdp, "!document.querySelector('#upload-preview').hidden", "upload preview");
  await click(cdp, "#privacy-consent");
  await waitForExpression(cdp, "!document.querySelector(\"[data-action='start-region-selection']\").disabled", "start enabled");
  await capture(cdp, "02-upload-privacy.png");

  await click(cdp, "[data-action='start-region-selection']");
  await waitForExpression(cdp, "document.body.dataset.screen === 'select-region'", "region screen");
  await capture(cdp, "03-region-selection.png");

  await click(cdp, ".region-tools [data-action='confirm-region']");
  await waitForExpression(cdp, "document.body.dataset.screen === 'review'", "review screen", 10000);
  await capture(cdp, "04-recognition-review.png");

  await click(cdp, ".review-screen [data-action='save-record']");
  await waitForExpression(cdp, "document.body.dataset.screen === 'detail'", "detail screen");
  await capture(cdp, "05-saved-record-detail.png");

  await click(cdp, ".detail-screen [data-action='go-records']");
  await waitForExpression(cdp, "document.body.dataset.screen === 'records'", "records screen");
  await capture(cdp, "06-records-notebook.png");

  await cdp.close();
  console.log(`UI screenshots written to ${outputDir}`);
} finally {
  await stopProcess(chrome);
  server.close();
  await rm(userDataDir, { recursive: true, force: true });
}

async function seedDemoRecords(cdp) {
  const candidates = createMockRegionCandidates();
  const mathDraft = createMockRecognition({
    subject: "math",
    imageUri: createOriginalPlaceholderImage(),
    selectedRegion: candidates[1],
    selectedRegionImageUri: createOriginalPlaceholderImage(),
  });
  const englishDraft = createMockRecognition({
    subject: "english",
    imageUri: createOriginalPlaceholderImage(),
    selectedRegion: candidates[0],
    selectedRegionImageUri: createOriginalPlaceholderImage(),
  });

  const records = [
    createRecordFromDraft(mathDraft, {
      id: "design-wq-math",
      title: "一次函数图像与坐标综合题",
      now: "2026-05-16T08:20:00.000Z",
    }),
    createRecordFromDraft(englishDraft, {
      id: "design-wq-english",
      title: "完形填空语境判断题",
      now: "2026-05-15T14:30:00.000Z",
    }),
  ];

  await evaluate(
    cdp,
    `localStorage.setItem(${JSON.stringify(STORAGE_KEY)}, ${JSON.stringify(
      JSON.stringify(records),
    )});`,
  );
}

async function capture(cdp, fileName) {
  await evaluate(
    cdp,
    "document.fonts && document.fonts.ready ? document.fonts.ready.then(() => true) : true;",
  );
  const metrics = await cdp.send("Page.getLayoutMetrics");
  const contentSize = metrics.cssContentSize || metrics.contentSize;
  const screenshot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: true,
    clip: {
      x: 0,
      y: 0,
      width: Math.ceil(contentSize.width),
      height: Math.ceil(contentSize.height),
      scale: 1,
    },
  });
  await writeFile(join(outputDir, fileName), Buffer.from(screenshot.data, "base64"));
}

async function navigate(cdp, url) {
  const loaded = cdp.waitFor("Page.loadEventFired");
  await cdp.send("Page.navigate", { url });
  await loaded;
}

async function reload(cdp) {
  const loaded = cdp.waitFor("Page.loadEventFired");
  await cdp.send("Page.reload", { ignoreCache: true });
  await loaded;
}

async function click(cdp, selector) {
  await evaluate(
    cdp,
    `(() => {
      const target = document.querySelector(${JSON.stringify(selector)});
      if (!target) throw new Error("Missing selector: ${selector}");
      target.click();
      return true;
    })();`,
  );
}

async function setFileInput(cdp, selector, filePath) {
  const { root } = await cdp.send("DOM.getDocument", { depth: 1 });
  const { nodeId } = await cdp.send("DOM.querySelector", {
    nodeId: root.nodeId,
    selector,
  });
  if (!nodeId) throw new Error(`Missing file input: ${selector}`);
  await cdp.send("DOM.setFileInputFiles", {
    nodeId,
    files: [filePath],
  });
}

async function waitForExpression(cdp, expression, label, timeoutMs = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const value = await evaluate(cdp, `Boolean(${expression})`);
    if (value) return;
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function evaluate(cdp, expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const text = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
    throw new Error(text);
  }
  return result.result?.value;
}

async function createCdpClient(wsUrl) {
  const ws = new WebSocket(wsUrl);
  const pending = new Map();
  const listeners = new Map();
  let nextId = 1;

  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", reject, { once: true });
  });

  ws.addEventListener("message", (event) => {
    const message = JSON.parse(typeof event.data === "string" ? event.data : Buffer.from(event.data).toString("utf8"));
    if (message.id && pending.has(message.id)) {
      const { resolve: resolvePending, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolvePending(message.result ?? {});
      return;
    }

    const handlers = listeners.get(message.method);
    if (handlers) {
      for (const handler of handlers) handler(message.params ?? {});
    }
  });

  return {
    send(method, params = {}) {
      const id = nextId++;
      ws.send(JSON.stringify({ id, method, params }));
      return new Promise((resolveSend, rejectSend) => {
        pending.set(id, { resolve: resolveSend, reject: rejectSend });
      });
    },
    waitFor(method, timeoutMs = 10000) {
      return new Promise((resolveWait, rejectWait) => {
        const timer = setTimeout(() => {
          rejectWait(new Error(`Timed out waiting for ${method}`));
        }, timeoutMs);
        const handler = (params) => {
          clearTimeout(timer);
          listeners.set(
            method,
            (listeners.get(method) || []).filter((item) => item !== handler),
          );
          resolveWait(params);
        };
        listeners.set(method, [...(listeners.get(method) || []), handler]);
      });
    },
    close() {
      ws.close();
    },
  };
}

async function waitForPageWebSocket(baseUrl) {
  const started = Date.now();
  while (Date.now() - started < 10000) {
    try {
      const targets = await fetchJson(`${baseUrl}/json/list`);
      const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {
      // Chrome is still starting.
    }
    await delay(100);
  }
  throw new Error("Timed out waiting for Chrome debugging target");
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return response.json();
}

function startStaticServer(rootDir) {
  const mimeTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml; charset=utf-8",
  };

  const server = createServer(async (request, response) => {
    try {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const pathname = decodeURIComponent(url.pathname);
      const target = resolve(rootDir, pathname.slice(1) || "app/index.html");
      if (!target.startsWith(rootDir)) {
        response.writeHead(403).end("Forbidden");
        return;
      }

      const body = await readFile(target);
      response.writeHead(200, {
        "content-type": mimeTypes[extname(target)] || "application/octet-stream",
      });
      response.end(body);
    } catch {
      response.writeHead(404).end("Not found");
    }
  });

  return new Promise((resolveServer) => {
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function stopProcess(childProcess) {
  if (childProcess.exitCode !== null || childProcess.killed) return Promise.resolve();

  return new Promise((resolveStop) => {
    const timer = setTimeout(() => {
      childProcess.kill("SIGKILL");
      resolveStop();
    }, 2000);
    childProcess.once("exit", () => {
      clearTimeout(timer);
      resolveStop();
    });
    childProcess.kill("SIGTERM");
  });
}

function sampleOriginalQuestionSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="820" viewBox="0 0 1200 820">
  <rect width="1200" height="820" fill="#fffdf7"/>
  <rect x="48" y="42" width="1104" height="732" rx="18" fill="#fff" stroke="#ead8c2" stroke-width="2"/>
  <text x="90" y="115" fill="#17212b" font-family="Arial, sans-serif" font-size="34" font-weight="700">23. 二次函数图像与面积综合题</text>
  <text x="90" y="178" fill="#24313d" font-family="Arial, sans-serif" font-size="27">如图，抛物线与 x 轴交于 A(-1,0)、B(3,0)，与 y 轴交于 C(0,3)。</text>
  <text x="90" y="230" fill="#24313d" font-family="Arial, sans-serif" font-size="27">(1) 求抛物线的解析式；</text>
  <text x="90" y="282" fill="#24313d" font-family="Arial, sans-serif" font-size="27">(2) 当点 P 的横坐标为 1 时，求三角形 POC 的面积；</text>
  <text x="90" y="334" fill="#24313d" font-family="Arial, sans-serif" font-size="27">(3) 当 CP 垂直 OP 时，求点 P 的坐标。</text>
  <g transform="translate(170 430)">
    <line x1="0" y1="210" x2="470" y2="210" stroke="#17212b" stroke-width="4"/>
    <line x1="120" y1="250" x2="120" y2="0" stroke="#17212b" stroke-width="4"/>
    <path d="M48 210 C120 20 285 8 410 210" fill="none" stroke="#17212b" stroke-width="5"/>
    <line x1="120" y1="210" x2="318" y2="86" stroke="#17212b" stroke-width="4"/>
    <circle cx="48" cy="210" r="6" fill="#17212b"/>
    <circle cx="410" cy="210" r="6" fill="#17212b"/>
    <circle cx="120" cy="210" r="6" fill="#17212b"/>
    <circle cx="318" cy="86" r="7" fill="#17212b"/>
    <text x="28" y="250" fill="#17212b" font-size="27">A</text>
    <text x="400" y="250" fill="#17212b" font-size="27">B</text>
    <text x="92" y="28" fill="#17212b" font-size="27">C</text>
    <text x="335" y="80" fill="#17212b" font-size="27">P</text>
    <text x="135" y="250" fill="#17212b" font-size="27">O</text>
  </g>
  <path d="M744 286 c48 28 98 24 130 -18" fill="none" stroke="#e85d75" stroke-width="10" stroke-linecap="round"/>
  <path d="M748 396 l35 39 l106 -132" fill="none" stroke="#e85d75" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="760" y="505" fill="#e85d75" font-family="Arial, sans-serif" font-size="42" font-weight="700" transform="rotate(-8 760 505)">老师批注：思路对</text>
  <text x="786" y="588" fill="#e85d75" font-family="Arial, sans-serif" font-size="34" font-weight="700">学生草稿：a=-1, b=2</text>
</svg>
`.trim();
}
