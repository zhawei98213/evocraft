const { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } = require("node:fs");
const { dirname, join } = require("node:path");

const configFileName = "config.json";

function createAiConfigStore(userDataDir, options = {}) {
  const safeStorage = options.safeStorage;
  const configPath = options.configPath ?? join(userDataDir, "ai-runtime", configFileName);

  return {
    get canPersistSecret() {
      return canUseSafeStorage(safeStorage);
    },
    load() {
      if (!canUseSafeStorage(safeStorage) || !existsSync(configPath)) return null;

      try {
        const parsed = JSON.parse(readFileSync(configPath, "utf8"));
        const encryptedApiKey = normalizeString(parsed.encryptedApiKey, "");
        if (!encryptedApiKey) return null;

        return {
          provider: normalizeString(parsed.provider, "qwen") || "qwen",
          model: normalizeString(parsed.model, "qwen-vl-ocr-latest") || "qwen-vl-ocr-latest",
          apiKey: safeStorage.decryptString(Buffer.from(encryptedApiKey, "base64")),
          updatedAt: normalizeString(parsed.updatedAt, ""),
          persisted: true,
        };
      } catch {
        return null;
      }
    },
    save(config) {
      if (!canUseSafeStorage(safeStorage)) {
        return { ok: false, reason: "encryption_unavailable" };
      }

      const updatedAt = new Date().toISOString();
      const encryptedApiKey = safeStorage.encryptString(config.apiKey).toString("base64");
      const payload = {
        schemaVersion: 1,
        provider: normalizeString(config.provider, "qwen") || "qwen",
        model: normalizeString(config.model, "qwen-vl-ocr-latest") || "qwen-vl-ocr-latest",
        encryptedApiKey,
        encryption: "electron-safe-storage",
        updatedAt,
      };

      mkdirSync(dirname(configPath), { recursive: true });
      writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
      return { ok: true, updatedAt };
    },
    clear() {
      rmSync(configPath, { force: true });
      return { ok: true };
    },
  };
}

function canUseSafeStorage(safeStorage) {
  return (
    Boolean(safeStorage) &&
    typeof safeStorage.isEncryptionAvailable === "function" &&
    safeStorage.isEncryptionAvailable() &&
    typeof safeStorage.encryptString === "function" &&
    typeof safeStorage.decryptString === "function"
  );
}

function normalizeString(value, fallback) {
  return typeof value === "string" ? value.trim() : fallback;
}

module.exports = {
  createAiConfigStore,
};
