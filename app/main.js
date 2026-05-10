import {
  SUBJECTS,
  createMockRecognition,
  createRecordFromDraft,
  formatTime,
  loadRecords,
  persistRecords,
} from "./state.js";

const appState = {
  screen: "hub",
  selectedSubject: "auto",
  uploadedImageUri: "",
  uploadedFile: null,
  draft: null,
  records: loadRecords(),
  selectedRecordId: null,
  detailMode: "clean",
};

const els = {
  screens: [...document.querySelectorAll("[data-screen]")],
  sidePanel: document.querySelector("#side-panel"),
  imageInput: document.querySelector("#image-input"),
  dropzone: document.querySelector("#dropzone"),
  dropzoneTitle: document.querySelector("#dropzone-title"),
  dropzoneCopy: document.querySelector("#dropzone-copy"),
  uploadPreview: document.querySelector("#upload-preview"),
  previewImage: document.querySelector("#preview-image"),
  previewName: document.querySelector("#preview-name"),
  previewMeta: document.querySelector("#preview-meta"),
  uploadError: document.querySelector("#upload-error"),
  startButton: document.querySelector("[data-action='start-recognition']"),
  hubRecordList: document.querySelector("#hub-record-list"),
  uploadRecordList: document.querySelector("#upload-record-list"),
  reviewOriginalImage: document.querySelector("#review-original-image"),
  reviewCleanImage: document.querySelector("#review-clean-image"),
  form: document.querySelector("#record-form"),
  fieldSubject: document.querySelector("#field-subject"),
  fieldTitle: document.querySelector("#field-title"),
  fieldQuestion: document.querySelector("#field-question"),
  fieldStudentAnswer: document.querySelector("#field-student-answer"),
  fieldCorrectAnswer: document.querySelector("#field-correct-answer"),
  fieldNotes: document.querySelector("#field-notes"),
  detailImage: document.querySelector("#detail-image"),
  detailRecordTitle: document.querySelector("#detail-record-title"),
  detailRecordSubtitle: document.querySelector("#detail-record-subtitle"),
  detailQuestionText: document.querySelector("#detail-question-text"),
  detailSubject: document.querySelector("#detail-subject"),
  detailCreated: document.querySelector("#detail-created"),
  detailModeChip: document.querySelector("#detail-mode-chip"),
};

render();
bindEvents();

function bindEvents() {
  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    const action = button.dataset.action;
    if (!action) return;

    const actions = {
      "go-hub": () => setScreen("hub"),
      "go-upload": () => setScreen("upload"),
      "replace-image": () => els.imageInput.click(),
      "start-recognition": startRecognition,
      "save-record": saveCurrentRecord,
      "toggle-detail-image": toggleDetailImage,
      "edit-current-record": editCurrentRecord,
      "show-records": () => setScreen(appState.records.length ? "detail" : "upload"),
    };

    actions[action]?.();
  });

  document.querySelectorAll("[data-subject]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedSubject = button.dataset.subject;
      document.querySelectorAll("[data-subject]").forEach((item) => {
        item.classList.toggle("is-selected", item === button);
      });
    });
  });

  els.dropzone.addEventListener("click", () => els.imageInput.click());
  els.imageInput.addEventListener("change", () => {
    const [file] = els.imageInput.files;
    if (file) handleFile(file);
  });

  ["dragenter", "dragover"].forEach((type) => {
    els.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropzone.classList.add("is-dragging");
    });
  });

  ["dragleave", "drop"].forEach((type) => {
    els.dropzone.addEventListener(type, (event) => {
      event.preventDefault();
      els.dropzone.classList.remove("is-dragging");
    });
  });

  els.dropzone.addEventListener("drop", (event) => {
    const [file] = event.dataTransfer.files;
    if (file) handleFile(file);
  });

  els.form.addEventListener("input", () => {
    if (!appState.draft) return;
    appState.draft.updatedAt = new Date().toISOString();
  });
}

function setScreen(screen) {
  appState.screen = screen;

  if (screen === "detail" && !getSelectedRecord()) {
    appState.selectedRecordId = appState.records[0]?.id ?? null;
  }

  render();
}

function handleFile(file) {
  const isImage = file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".heic");
  const maxBytes = 20 * 1024 * 1024;

  if (!isImage) {
    showUploadError("文件格式不支持，请上传 JPG、PNG、BMP 或 HEIC 图片。");
    return;
  }

  if (file.size > maxBytes) {
    showUploadError("图片超过 20MB，请换一张更小的照片。");
    return;
  }

  const reader = new FileReader();
  reader.addEventListener("load", () => {
    appState.uploadedFile = file;
    appState.uploadedImageUri = reader.result;
    appState.draft = null;
    els.uploadError.textContent = "";
    renderUploadPreview();
  });
  reader.addEventListener("error", () => {
    showUploadError("图片读取失败，请重新选择一张照片。");
  });
  reader.readAsDataURL(file);
}

function showUploadError(message) {
  els.uploadError.textContent = message;
  els.startButton.disabled = true;
}

function startRecognition() {
  if (!appState.uploadedImageUri) {
    showUploadError("请先上传一张错题照片。");
    return;
  }

  const subject = appState.selectedSubject === "auto" ? "math" : appState.selectedSubject;
  appState.draft = createMockRecognition({
    subject,
    imageUri: appState.uploadedImageUri,
  });
  setScreen("review");
}

function saveCurrentRecord() {
  if (!appState.draft) return;

  const record = createRecordFromDraft(appState.draft, {
    title: els.fieldTitle.value.trim() || appState.draft.title,
    subject: els.fieldSubject.value,
    questionText: els.fieldQuestion.value.trim(),
    studentAnswer: els.fieldStudentAnswer.value.trim(),
    correctAnswer: els.fieldCorrectAnswer.value.trim(),
    notes: els.fieldNotes.value.trim(),
  });

  appState.records = [record, ...appState.records.filter((item) => item.id !== record.id)];
  appState.selectedRecordId = record.id;
  appState.detailMode = "clean";
  persistRecords(appState.records);
  setScreen("detail");
}

function toggleDetailImage() {
  appState.detailMode = appState.detailMode === "clean" ? "original" : "clean";
  renderDetail();
}

function editCurrentRecord() {
  const record = getSelectedRecord();
  if (!record) return;
  appState.draft = { ...record };
  setScreen("review");
}

function render() {
  document.body.dataset.screen = appState.screen;

  els.screens.forEach((screen) => {
    screen.hidden = screen.dataset.screen !== appState.screen;
  });

  document.querySelectorAll(".rail-link").forEach((link) => {
    const action = link.dataset.action;
    link.classList.toggle(
      "is-active",
      (appState.screen === "hub" && action === "go-hub") ||
        (appState.screen !== "hub" && action === "go-upload"),
    );
  });

  renderRecordLists();
  renderSidePanel();

  if (appState.screen === "upload") renderUploadPreview();
  if (appState.screen === "review") renderReview();
  if (appState.screen === "detail") renderDetail();
}

function renderUploadPreview() {
  const hasImage = Boolean(appState.uploadedImageUri);
  els.uploadPreview.hidden = !hasImage;
  els.startButton.disabled = !hasImage;

  if (!hasImage) return;

  els.previewImage.src = appState.uploadedImageUri;
  els.previewName.textContent = appState.uploadedFile?.name ?? "已上传图片";
  els.previewMeta.textContent = appState.uploadedFile
    ? `${Math.max(1, Math.round(appState.uploadedFile.size / 1024))} KB`
    : "本地预览";
  els.dropzoneTitle.textContent = "图片已准备好";
  els.dropzoneCopy.textContent = "可以替换图片或开始整理";
}

function renderReview() {
  if (!appState.draft) return;

  els.reviewOriginalImage.src = appState.draft.originalImageUri;
  els.reviewCleanImage.src = appState.draft.cleanedQuestionImageUri;
  els.fieldSubject.value = appState.draft.subject;
  els.fieldTitle.value = appState.draft.title;
  els.fieldQuestion.value = appState.draft.questionText;
  els.fieldStudentAnswer.value = appState.draft.studentAnswer || "";
  els.fieldCorrectAnswer.value = appState.draft.correctAnswer || "";
  els.fieldNotes.value = appState.draft.notes || "";
}

function renderDetail() {
  const record = getSelectedRecord();
  if (!record) {
    setScreen("upload");
    return;
  }

  const showingOriginal = appState.detailMode === "original";
  els.detailImage.src = showingOriginal ? record.originalImageUri : record.cleanedQuestionImageUri;
  els.detailRecordTitle.textContent = showingOriginal ? "题目（原图）" : "题目（干净题面）";
  els.detailRecordSubtitle.textContent = record.title;
  els.detailQuestionText.textContent = record.questionText;
  els.detailSubject.textContent = SUBJECTS[record.subject] ?? record.subject;
  els.detailCreated.textContent = formatTime(record.createdAt);
  els.detailModeChip.textContent = showingOriginal ? "原图" : "干净题面";
  els.detailModeChip.className = `status-chip ${showingOriginal ? "review" : "clean"}`;
}

function renderRecordLists() {
  renderRecordList(els.hubRecordList, appState.records.slice(0, 1), false);
  renderRecordList(els.uploadRecordList, appState.records.slice(0, 3), true);
}

function renderRecordList(container, records, compact) {
  if (!records.length) {
    container.innerHTML = `
      <div class="empty-record">
        <strong>还没有保存的错题</strong>
        <span>上传第一张照片后，会在这里看到记录。</span>
      </div>
    `;
    return;
  }

  container.innerHTML = records
    .map(
      (record) => `
        <button class="record-row ${compact ? "is-compact" : ""}" type="button" data-record-id="${record.id}">
          <img src="${record.cleanedQuestionImageUri}" alt="" />
          <span>
            <strong>${escapeHtml(record.title)}</strong>
            <small>${SUBJECTS[record.subject] ?? record.subject} · ${formatTime(record.createdAt)}</small>
          </span>
          <em>打开</em>
        </button>
      `,
    )
    .join("");

  container.querySelectorAll("[data-record-id]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedRecordId = button.dataset.recordId;
      appState.detailMode = "clean";
      setScreen("detail");
    });
  });
}

function renderSidePanel() {
  const sideContent = {
    hub: renderHubSidePanel,
    upload: renderUploadSidePanel,
    review: renderReviewSidePanel,
    detail: renderDetailSidePanel,
  };

  els.sidePanel.innerHTML = sideContent[appState.screen]?.() ?? "";
}

function renderHubSidePanel() {
  return `
    <section class="side-block">
      <h2>今日学习状态</h2>
      <div class="metric-card">
        <strong>${appState.records.length}</strong>
        <span>已整理错题</span>
      </div>
      <div class="review-checklist">
        <div><span class="dot done"></span> 本地优先，不上传真实照片</div>
        <div><span class="dot wait"></span> 后续可接入 AI 分析</div>
        <div><span class="dot wait"></span> 背单词与奖励规划中</div>
      </div>
    </section>
  `;
}

function renderUploadSidePanel() {
  return `
    <section class="side-block">
      <h2>AI 处理流程</h2>
      <ol class="step-list">
        <li class="is-current"><span>1</span><strong>上传</strong><small>等待上传照片</small></li>
        <li><span>2</span><strong>识别</strong><small>识别题目内容与版式</small></li>
        <li><span>3</span><strong>去痕</strong><small>去除手写与批改痕迹</small></li>
        <li><span>4</span><strong>复核</strong><small>检查识别与去痕结果</small></li>
        <li><span>5</span><strong>保存</strong><small>保存到错题本</small></li>
      </ol>
    </section>
  `;
}

function renderReviewSidePanel() {
  const draft = appState.draft;
  if (!draft) return renderUploadSidePanel();

  return `
    <section class="side-block">
      <h2>AI 识别与去痕状态</h2>
      <div class="draft-block">
        <span class="status-chip ai">识别草稿</span>
        <strong>${escapeHtml(draft.title)}</strong>
        <p>${escapeHtml(shorten(draft.questionText, 72))}</p>
      </div>
      <div class="status-summary">
        <div><span>科目</span><strong>${SUBJECTS[draft.subject]}</strong></div>
        <div><span>识别可信度</span><strong>92% · 可信</strong></div>
        <div><span>去痕可信度</span><strong>78% · 请检查</strong></div>
      </div>
      <div class="review-checklist">
        ${draft.reviewItems
          .map(
            (item) =>
              `<div><span class="dot ${item.status === "可信" ? "done" : "warn"}"></span>${escapeHtml(
                item.label,
              )}<em>${escapeHtml(item.status)}</em></div>`,
          )
          .join("")}
      </div>
      <button class="button-primary full" type="button" data-action="save-record">复核后保存</button>
      <button class="button-secondary full" type="button" data-action="go-upload">返回重传</button>
    </section>
  `;
}

function renderDetailSidePanel() {
  const record = getSelectedRecord();
  if (!record) return renderHubSidePanel();

  return `
    <section class="side-block">
      <h2>记录状态</h2>
      <div class="status-summary">
        <div><span>科目</span><strong>${SUBJECTS[record.subject]}</strong></div>
        <div><span>去痕状态</span><strong>去痕完成</strong></div>
        <div><span>保存时间</span><strong>${formatTime(record.createdAt)}</strong></div>
      </div>
      <div class="reward-note compact">
        <strong>继续加油！</strong>
        <p>后续分析入口已预留，当前 MVP 先完成收集闭环。</p>
      </div>
      <button class="button-primary full" type="button" data-action="go-upload">继续收集</button>
    </section>
  `;
}

function getSelectedRecord() {
  return appState.records.find((record) => record.id === appState.selectedRecordId) ?? appState.records[0];
}

function shorten(value, max) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
