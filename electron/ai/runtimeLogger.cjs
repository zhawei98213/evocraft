function createRuntimeLogger(options = {}) {
  const write = options.write ?? console.log;
  const now = options.now ?? (() => new Date().toISOString());

  return {
    log(event, details = {}) {
      write(
        JSON.stringify({
          ts: now(),
          event,
          ...redact(details),
        }),
      );
    },
  };
}

function redact(value, key = "") {
  if (typeof value === "string") return redactString(value, key);
  if (Array.isArray(value)) return value.map((item) => redact(item, key));
  if (!value || typeof value !== "object") return value;

  const redacted = {};
  for (const [entryKey, entryValue] of Object.entries(value)) {
    redacted[entryKey] = redact(entryValue, entryKey);
  }
  return redacted;
}

function redactString(value, key) {
  const normalizedKey = key.toLowerCase();
  if (
    normalizedKey.includes("apikey") ||
    normalizedKey.includes("api_key") ||
    normalizedKey.includes("authorization") ||
    normalizedKey.includes("token") ||
    normalizedKey.includes("secret")
  ) {
    return "[redacted]";
  }

  return value
    .replace(/data:(image\/[a-z0-9.+-]+);base64,[a-z0-9+/=._-]+/gi, (match, mimeType) => {
      return `data:${mimeType};base64,[redacted length=${match.length}]`;
    })
    .replace(/Authorization:\s*Bearer\s+[a-z0-9._-]+/gi, "Authorization: Bearer [redacted]")
    .replace(/Bearer\s+[a-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/sk-[a-z0-9._-]+/gi, "[redacted]")
    .replace(/dashscope-[a-z0-9._-]+/gi, "[redacted]");
}

module.exports = {
  createRuntimeLogger,
  redact,
};
