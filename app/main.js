import {
  SUBJECTS,
  createManualRegion,
  createMockRecognition,
  createMockRegionCandidates,
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
  regionCandidates: [],
  selectedRegionId: null,
  selectedRegionImageUri: "",
  regionZoom: 1,
  dragState: null,
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
  startButton: document.querySelector("[data-action='start-region-selection']"),
  regionCanvas: document.querySelector("#region-canvas"),
  regionCanvasImage: document.querySelector("#region-canvas-image"),
  regionOverlay: document.querySelector("#region-overlay"),
  regionCandidateList: document.querySelector("#region-candidate-list"),
  selectedRegionSummary: document.querySelector("#selected-region-summary"),
  hubRecordList: document.querySelector("#hub-record-list"),
  uploadRecordList: document.querySelector("#upload-record-list"),
  recordsList: document.querySelector("#records-list"),
  recordsCount: document.querySelector("#records-count"),
  reviewOriginalImage: document.querySelector("#review-original-image"),
  reviewRegionImage: document.querySelector("#review-region-image"),
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
      "go-records": () => setScreen("records"),
      "replace-image": () => els.imageInput.click(),
      "start-region-selection": startRegionSelection,
      "start-recognition": startRecognition,
      "confirm-region": confirmSelectedRegion,
      "manual-region": useManualRegion,
      "rerun-region-detection": rerunRegionDetection,
      "zoom-in": () => setRegionZoom(Math.min(1.8, appState.regionZoom + 0.1)),
      "zoom-out": () => setRegionZoom(Math.max(0.7, appState.regionZoom - 0.1)),
      "zoom-fit": () => setRegionZoom(1),
      "save-record": saveCurrentRecord,
      "toggle-detail-image": toggleDetailImage,
      "edit-current-record": editCurrentRecord,
      "show-records": () => setScreen("records"),
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

  if ((screen === "detail" || screen === "records") && !getSelectedRecord()) {
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
    appState.regionCandidates = [];
    appState.selectedRegionId = null;
    appState.selectedRegionImageUri = "";
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

function startRegionSelection() {
  if (!appState.uploadedImageUri) {
    showUploadError("请先上传一张错题照片。");
    return;
  }

  appState.regionCandidates = createMockRegionCandidates();
  appState.selectedRegionId = appState.regionCandidates[1]?.id ?? appState.regionCandidates[0]?.id ?? null;
  appState.selectedRegionImageUri = "";
  appState.regionZoom = 1;
  setScreen("select-region");
}

function startRecognition() {
  confirmSelectedRegion();
}

async function confirmSelectedRegion() {
  const selectedRegion = getSelectedRegion();
  if (!appState.uploadedImageUri || !selectedRegion) {
    showUploadError("请先选择或手动画出一道题目区域。");
    return;
  }

  const subject = appState.selectedSubject === "auto" ? "math" : appState.selectedSubject;
  const selectedRegionImageUri = await createSelectedRegionImage(appState.uploadedImageUri, selectedRegion);
  appState.selectedRegionImageUri = selectedRegionImageUri;
  appState.draft = createMockRecognition({
    subject,
    imageUri: appState.uploadedImageUri,
    selectedRegion,
    selectedRegionImageUri,
  });
  setScreen("review");
}

function getSelectedRegion() {
  return appState.regionCandidates.find((region) => region.id === appState.selectedRegionId) ?? null;
}

function useManualRegion() {
  const manualRegion = createManualRegion();
  appState.regionCandidates = [
    manualRegion,
    ...appState.regionCandidates.filter((region) => region.source !== "manual"),
  ];
  appState.selectedRegionId = manualRegion.id;
  renderRegionSelection();
}

function rerunRegionDetection() {
  appState.regionCandidates = createMockRegionCandidates();
  appState.selectedRegionId = appState.regionCandidates[1]?.id ?? appState.regionCandidates[0]?.id ?? null;
  renderRegionSelection();
}

function setRegionZoom(value) {
  appState.regionZoom = Number(value.toFixed(2));
  renderRegionSelection();
}

function createSelectedRegionImage(imageUri, region) {
  return new Promise((resolve) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      const sourceX = Math.max(0, Math.round(image.naturalWidth * region.x));
      const sourceY = Math.max(0, Math.round(image.naturalHeight * region.y));
      const sourceWidth = Math.max(1, Math.round(image.naturalWidth * region.width));
      const sourceHeight = Math.max(1, Math.round(image.naturalHeight * region.height));
      canvas.width = sourceWidth;
      canvas.height = sourceHeight;
      const context = canvas.getContext("2d");
      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        sourceWidth,
        sourceHeight,
      );
      resolve(canvas.toDataURL("image/png"));
    });
    image.addEventListener("error", () => resolve(imageUri));
    image.src = imageUri;
  });
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
  const modes = ["clean", "region", "original"];
  const currentIndex = modes.indexOf(appState.detailMode);
  appState.detailMode = modes[(currentIndex + 1) % modes.length];
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
        (["upload", "select-region", "review"].includes(appState.screen) && action === "go-upload") ||
        (["records", "detail"].includes(appState.screen) && action === "go-records"),
    );
  });

  renderRecordLists();
  renderSidePanel();

  if (appState.screen === "upload") renderUploadPreview();
  if (appState.screen === "select-region") renderRegionSelection();
  if (appState.screen === "review") renderReview();
  if (appState.screen === "records") renderRecords();
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

function renderRegionSelection() {
  if (!appState.uploadedImageUri) {
    setScreen("upload");
    return;
  }

  els.regionCanvasImage.src = appState.uploadedImageUri;
  els.regionCanvas.style.setProperty("--region-zoom", appState.regionZoom);

  const selectedRegion = getSelectedRegion();
  els.regionOverlay.innerHTML = appState.regionCandidates
    .map((region) => renderRegionFrame(region, region.id === appState.selectedRegionId))
    .join("");

  els.regionCandidateList.innerHTML = appState.regionCandidates
    .map(
      (region) => `
        <button class="region-candidate ${region.id === appState.selectedRegionId ? "is-selected" : ""}" type="button" data-region-id="${region.id}">
          <strong>${escapeHtml(region.label)}</strong>
          <span>${region.source === "manual" ? "手动画框" : `AI 候选 · ${Math.round((region.confidence ?? 0) * 100)}%`}</span>
        </button>
      `,
    )
    .join("");

  els.selectedRegionSummary.innerHTML = selectedRegion
    ? `<strong>当前区域</strong><span>${escapeHtml(selectedRegion.label)} · 宽 ${Math.round(
        selectedRegion.width * 100,
      )}% · 高 ${Math.round(selectedRegion.height * 100)}%</span>`
    : `<strong>未选择区域</strong><span>请选择 AI 候选框或手动画框。</span>`;

  els.regionOverlay.querySelectorAll("[data-region-id]").forEach((frame) => {
    frame.addEventListener("pointerdown", handleRegionPointerDown);
  });

  els.regionCandidateList.querySelectorAll("[data-region-id]").forEach((button) => {
    button.addEventListener("click", () => {
      appState.selectedRegionId = button.dataset.regionId;
      renderRegionSelection();
    });
  });
}

function renderRegionFrame(region, selected) {
  return `
    <button
      class="region-frame ${selected ? "is-selected" : ""}"
      type="button"
      data-region-id="${region.id}"
      style="left:${region.x * 100}%;top:${region.y * 100}%;width:${region.width * 100}%;height:${region.height * 100}%"
      aria-label="${escapeHtml(region.label)}"
    >
      <span>${escapeHtml(region.label)}</span>
      ${selected ? `<i data-handle="se"></i><i data-handle="ne"></i><i data-handle="sw"></i>` : ""}
    </button>
  `;
}

function handleRegionPointerDown(event) {
  event.preventDefault();
  const frame = event.currentTarget;
  appState.selectedRegionId = frame.dataset.regionId;
  const region = getSelectedRegion();
  if (!region) return;

  const canvasRect = els.regionOverlay.getBoundingClientRect();
  appState.dragState = {
    regionId: region.id,
    handle: event.target.dataset.handle ?? "move",
    startX: event.clientX,
    startY: event.clientY,
    startRegion: { ...region },
    canvasWidth: canvasRect.width,
    canvasHeight: canvasRect.height,
  };

  frame.setPointerCapture(event.pointerId);
  window.addEventListener("pointermove", handleRegionPointerMove);
  window.addEventListener("pointerup", handleRegionPointerUp, { once: true });
}

function handleRegionPointerMove(event) {
  if (!appState.dragState) return;
  const region = appState.regionCandidates.find((item) => item.id === appState.dragState.regionId);
  if (!region) return;

  const dx = (event.clientX - appState.dragState.startX) / appState.dragState.canvasWidth;
  const dy = (event.clientY - appState.dragState.startY) / appState.dragState.canvasHeight;
  const start = appState.dragState.startRegion;

  if (appState.dragState.handle === "move") {
    region.x = clamp(start.x + dx, 0, 1 - start.width);
    region.y = clamp(start.y + dy, 0, 1 - start.height);
  } else if (appState.dragState.handle === "ne") {
    const nextY = clamp(start.y + dy, 0, start.y + start.height - 0.08);
    region.y = nextY;
    region.width = clamp(start.width + dx, 0.08, 1 - start.x);
    region.height = clamp(start.height + (start.y - nextY), 0.08, 1 - nextY);
  } else if (appState.dragState.handle === "sw") {
    const nextX = clamp(start.x + dx, 0, start.x + start.width - 0.08);
    region.x = nextX;
    region.width = clamp(start.width + (start.x - nextX), 0.08, 1 - nextX);
    region.height = clamp(start.height + dy, 0.08, 1 - start.y);
  } else {
    region.width = clamp(start.width + dx, 0.08, 1 - start.x);
    region.height = clamp(start.height + dy, 0.08, 1 - start.y);
  }

  renderRegionSelection();
}

function handleRegionPointerUp() {
  appState.dragState = null;
  window.removeEventListener("pointermove", handleRegionPointerMove);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function renderReview() {
  if (!appState.draft) return;

  els.reviewOriginalImage.src = appState.draft.originalImageUri;
  els.reviewRegionImage.src = appState.draft.selectedRegionImageUri;
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

  const modeConfig = {
    clean: {
      src: record.cleanedQuestionImageUri,
      title: "题目（干净题面）",
      chip: "干净题面",
      chipClass: "clean",
    },
    region: {
      src: record.selectedRegionImageUri ?? record.originalImageUri,
      title: "题目（确认区域）",
      chip: "题目区域",
      chipClass: "ai",
    },
    original: {
      src: record.originalImageUri,
      title: "题目（整张原图）",
      chip: "整张原图",
      chipClass: "review",
    },
  };
  const currentMode = modeConfig[appState.detailMode] ?? modeConfig.clean;

  els.detailImage.src = currentMode.src;
  els.detailRecordTitle.textContent = currentMode.title;
  els.detailRecordSubtitle.textContent = record.title;
  els.detailQuestionText.textContent = record.questionText;
  els.detailSubject.textContent = SUBJECTS[record.subject] ?? record.subject;
  els.detailCreated.textContent = formatTime(record.createdAt);
  els.detailModeChip.textContent = currentMode.chip;
  els.detailModeChip.className = `status-chip ${currentMode.chipClass}`;
}

function renderRecordLists() {
  renderRecordList(els.hubRecordList, appState.records.slice(0, 1), false);
  renderRecordList(els.uploadRecordList, appState.records.slice(0, 3), true);
  if (els.recordsList) renderRecordList(els.recordsList, appState.records, false);
  if (els.recordsCount) els.recordsCount.textContent = String(appState.records.length);
}

function renderRecords() {
  renderRecordList(els.recordsList, appState.records, false);
  els.recordsCount.textContent = String(appState.records.length);
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
            <small>${SUBJECTS[record.subject] ?? record.subject} · ${formatTime(record.createdAt)} · 已确认题目区域</small>
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
    "select-region": renderRegionSidePanel,
    review: renderReviewSidePanel,
    records: renderRecordsSidePanel,
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
        <li><span>2</span><strong>选题</strong><small>确认本次识别的一道题</small></li>
        <li><span>3</span><strong>识别</strong><small>识别题目内容与版式</small></li>
        <li><span>4</span><strong>去痕</strong><small>去除手写与批改痕迹</small></li>
        <li><span>5</span><strong>复核</strong><small>检查识别与去痕结果</small></li>
        <li><span>6</span><strong>保存</strong><small>保存到错题本</small></li>
      </ol>
    </section>
  `;
}

function renderRegionSidePanel() {
  const selectedRegion = getSelectedRegion();

  return `
    <section class="side-block">
      <h2>选题区域状态</h2>
      <div class="draft-block">
        <span class="status-chip ai">本地 mock 找题</span>
        <strong>${selectedRegion ? escapeHtml(selectedRegion.label) : "未选择区域"}</strong>
        <p>确认区域后，识别和去痕只处理这一道题；整张原图仍会保留用于溯源。</p>
      </div>
      <div class="status-summary">
        <div><span>候选框</span><strong>${appState.regionCandidates.length} 个</strong></div>
        <div><span>当前缩放</span><strong>${Math.round(appState.regionZoom * 100)}%</strong></div>
        <div><span>区域来源</span><strong>${selectedRegion?.source === "manual" ? "手动画框" : "AI 候选"}</strong></div>
      </div>
      <button class="button-primary full" type="button" data-action="confirm-region">确认此区域并识别</button>
      <button class="button-secondary full" type="button" data-action="manual-region">手动画框</button>
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

function renderRecordsSidePanel() {
  return `
    <section class="side-block">
      <h2>错题本</h2>
      <div class="metric-card">
        <strong>${appState.records.length}</strong>
        <span>已保存记录</span>
      </div>
      <div class="review-checklist">
        <div><span class="dot done"></span> 点开记录可看干净题面</div>
        <div><span class="dot done"></span> 详情页可切换题目区域和原图</div>
        <div><span class="dot wait"></span> 后续接入错题分析</div>
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
