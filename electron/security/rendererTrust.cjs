const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");

const DEFAULT_DEV_RENDERER_URL = "http://127.0.0.1:5173";

function isTrustedRendererUrl(url, options = {}) {
  const parsedUrl = parseUrl(url);
  if (!parsedUrl) return false;

  if (options.isDev) {
    return matchesDevRendererUrl(parsedUrl, options.devRendererUrl ?? DEFAULT_DEV_RENDERER_URL);
  }

  return matchesProductionRendererUrl(parsedUrl, options.appDirname);
}

function matchesDevRendererUrl(parsedUrl, devRendererUrl) {
  const trustedUrl = parseUrl(devRendererUrl);
  if (!trustedUrl) return false;

  return (
    parsedUrl.protocol === trustedUrl.protocol &&
    parsedUrl.origin === trustedUrl.origin &&
    parsedUrl.pathname === trustedUrl.pathname &&
    parsedUrl.search === trustedUrl.search
  );
}

function matchesProductionRendererUrl(parsedUrl, appDirname) {
  if (parsedUrl.protocol !== "file:") return false;

  const trustedUrl = parseUrl(createProductionRendererUrl(appDirname));
  return Boolean(trustedUrl && parsedUrl.href === trustedUrl.href);
}

function createProductionRendererUrl(appDirname) {
  return pathToFileURL(resolve(appDirname, "../dist/index.html")).toString();
}

function parseUrl(value) {
  if (typeof value !== "string" || value.length === 0) return null;

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

module.exports = { createProductionRendererUrl, isTrustedRendererUrl };
