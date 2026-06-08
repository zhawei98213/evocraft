#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const defaultOutput = ".omx/context/current-session-handoff.md";

function redact(value) {
  return String(value)
    .replace(/data:image\/[a-zA-Z0-9.+-]+;base64,[A-Za-z0-9+/=]+/g, "[redacted-image-data-url]")
    .replace(/\bAuthorization\s*[:=]\s*Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Authorization: [redacted]")
    .replace(/\b(api[-_ ]?key|token|secret|password)\s*[:=]\s*["']?[^"'\s]+["']?/gi, "$1: [redacted]")
    .replace(/\bsk-[A-Za-z0-9_-]{8,}\b/g, "sk-[redacted]");
}

function runGit(args) {
  try {
    const output = execFileSync("git", args, {
      cwd: repoRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();

    return redact(output || "无");
  } catch (error) {
    const details = error.stderr || error.message || String(error);
    return redact(`命令失败: git ${args.join(" ")}\n${details}`);
  }
}

function readProjectFile(relativePath) {
  const absolutePath = path.join(repoRoot, relativePath);
  if (!existsSync(absolutePath)) {
    return `缺少文件：${relativePath}`;
  }

  return redact(readFileSync(absolutePath, "utf8"));
}

function latestProgressSection(progressText) {
  const currentProgressIndex = progressText.indexOf("## 当前进度");
  const progressBody = currentProgressIndex >= 0
    ? progressText.slice(currentProgressIndex)
    : progressText;
  const firstEntry = progressBody.search(/^###\s+/m);

  if (firstEntry < 0) {
    return tailLines(progressBody, 80);
  }

  const afterFirstEntry = progressBody.slice(firstEntry + 4);
  const secondEntry = afterFirstEntry.search(/^###\s+/m);
  const section = secondEntry >= 0
    ? progressBody.slice(firstEntry, firstEntry + 4 + secondEntry)
    : progressBody.slice(firstEntry);

  return tailLines(section.trim(), 120);
}

function tailLines(value, maxLines) {
  const lines = String(value).trim().split(/\r?\n/);
  if (lines.length <= maxLines) {
    return lines.join("\n");
  }

  return [
    `...省略前 ${lines.length - maxLines} 行...`,
    ...lines.slice(-maxLines),
  ].join("\n");
}

function parseArgs(argv) {
  const args = {
    outputPath: defaultOutput,
    stdout: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--stdout") {
      args.stdout = true;
      continue;
    }

    if (arg === "--out") {
      const value = argv[index + 1];
      if (!value || value.startsWith("--")) {
        throw new Error("Usage: node scripts/create-session-handoff.mjs [--stdout] [--out <path>]");
      }
      args.outputPath = value;
      index += 1;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      args.help = true;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function buildHandoff() {
  const generatedAt = new Date().toISOString();
  const branch = runGit(["branch", "--show-current"]);
  const status = runGit(["status", "--short", "--branch"]);
  const recentCommits = runGit(["log", "--oneline", "--decorate", "-5"]);
  const progress = readProjectFile("docs/planning/evocraft-roadmap-progress.md");
  const latestProgress = latestProgressSection(progress);

  return `# EvoCraft 当前 Codex 会话 Handoff

生成时间：${generatedAt}

## 新窗口启动提示

请先读取：

1. \`AGENTS.md\`
2. \`docs/README.md\`
3. \`docs/planning/evocraft-project-memory.md\`
4. \`docs/planning/evocraft-roadmap-progress.md\`
5. 本文件：\`.omx/context/current-session-handoff.md\`
6. \`git status --short --branch\`

然后继续最新未完成任务。不要依赖旧聊天上下文；如果本文件和仓库文档冲突，以仓库文档和当前 git 状态为准。

## 当前分支

\`\`\`text
${branch}
\`\`\`

## Git 状态

\`\`\`text
${status}
\`\`\`

## 最近提交

\`\`\`text
${recentCommits}
\`\`\`

## 最新路线图进度

${latestProgress}

## 隐私边界

- 不把 API key、Authorization header、token 或 secret 写入 handoff。
- 不把原始儿童学习照片、图片 data URL、raw provider response 或完整 OCR 内容写入 handoff。
- 动态 handoff 默认留在 ignored \`.omx/\`，长期结论继续写入 \`docs/\`。
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log("Usage: node scripts/create-session-handoff.mjs [--stdout] [--out <path>]");
    return;
  }

  const handoff = buildHandoff();

  if (args.stdout) {
    console.log(handoff);
    return;
  }

  const absoluteOutputPath = path.resolve(repoRoot, args.outputPath);
  mkdirSync(path.dirname(absoluteOutputPath), { recursive: true });
  writeFileSync(absoluteOutputPath, handoff, "utf8");
  console.log(`Session handoff written to ${path.relative(repoRoot, absoluteOutputPath)}`);
}

main();
