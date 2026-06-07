import {
  type CSSProperties,
  type ChangeEvent,
  type FormEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";

import evocraftLogoUrl from "../assets/evocraft-logo.png";
import {
  SUBJECTS,
  createManualRegion,
  createRecordFromDraft,
  formatTime,
  isSubject,
  type RegionCandidate,
  type Subject,
  type WrongQuestionDraft,
  type WrongQuestionRecord,
} from "../domain/wrongQuestion";
import {
  createInitialWrongQuestionState,
  wrongQuestionReducer,
  type Screen,
  type WrongQuestionState,
} from "../features/wrongQuestion/wrongQuestionReducer";
import type { AiAdapter, AiRuntimeConfigurationResult, AiRuntimeStatus } from "../services/aiAdapter";
import { createDesktopAiAdapter } from "../services/desktopAiAdapter";
import { getDesktopBridge, type EvoCraftDesktopApi } from "../services/desktopBridge";
import { createDesktopRecordStore } from "../services/desktopRecordStore";
import {
  getNextImageRotationDegrees,
  rotateImageDataUrl,
  type ImageRotationDirection,
} from "../services/imageTransforms";
import { mockAiAdapter } from "../services/mockAiAdapter";
import { createLocalStorageRecordStore, type RecordStore } from "../services/storage";

interface ReviewForm {
  subject: Subject | "";
  title: string;
  questionText: string;
  studentAnswer: string;
  correctAnswer: string;
  notes: string;
}

interface RegionDragState {
  regionId: string;
  handle: "move" | "ne" | "sw" | "se";
  startX: number;
  startY: number;
  startRegion: RegionCandidate;
  canvasWidth: number;
  canvasHeight: number;
}

const emptyReviewForm: ReviewForm = {
  subject: "",
  title: "",
  questionText: "",
  studentAnswer: "",
  correctAnswer: "",
  notes: "",
};

const externalAiAuthorizationMessage = "请先确认外部 AI 识别授权。";
const missingDesktopAiBridgeMessage = "真实 AI 桥接能力不可用，已回退到本地 mock。";
const missingDesktopAiConfigurationBridgeMessage =
  "真实 AI 配置只能在桌面应用窗口中保存。";
const defaultAiModel = "qwen-vl-ocr-latest";

interface AppProps {
  recordStore?: RecordStore;
}

function hasDesktopAiBridge(
  bridge: EvoCraftDesktopApi | null,
): bridge is EvoCraftDesktopApi &
  Required<Pick<EvoCraftDesktopApi, "detectRegions" | "recognizeQuestion" | "setExternalAiAuthorization">> {
  return Boolean(
    bridge?.detectRegions && bridge?.recognizeQuestion && bridge?.setExternalAiAuthorization,
  );
}

export function App({ recordStore: injectedRecordStore }: AppProps = {}) {
  const desktopBridge = getDesktopBridge();
  const [state, dispatch] = useReducer(
    wrongQuestionReducer,
    undefined,
    () => createInitialWrongQuestionState([]),
  );
  const recordStore = useMemo(
    () =>
      injectedRecordStore ??
      (desktopBridge
        ? createDesktopRecordStore(desktopBridge)
        : createLocalStorageRecordStore(getBrowserStorage())),
    [desktopBridge, injectedRecordStore],
  );
  const aiAdapter: AiAdapter = useMemo(
    () =>
      hasDesktopAiBridge(desktopBridge) && state.aiRuntimeMode === "real"
        ? createDesktopAiAdapter(desktopBridge)
        : mockAiAdapter,
    [desktopBridge, state.aiRuntimeMode],
  );
  const [isRecordStoreHydrated, setIsRecordStoreHydrated] = useState(false);
  const [reviewForm, setReviewForm] = useState<ReviewForm>(emptyReviewForm);
  const [regionDrag, setRegionDrag] = useState<RegionDragState | null>(null);
  const [aiConfigForm, setAiConfigForm] = useState({ apiKey: "", model: defaultAiModel });
  const [aiConfigFeedback, setAiConfigFeedback] = useState("");
  const canConfigureAiRuntime = Boolean(desktopBridge?.configureAiRuntime);

  useEffect(() => {
    document.body.dataset.screen = state.screen;
  }, [state.screen]);

  useEffect(() => {
    let active = true;
    setIsRecordStoreHydrated(false);

    recordStore
      .load()
      .then((records) => {
        if (!active) return;
        dispatch({ type: "RECORDS_LOADED", records });
      })
      .catch(() => undefined)
      .finally(() => {
        if (!active) return;
        setIsRecordStoreHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [recordStore]);

  useEffect(() => {
    if (!desktopBridge?.getAiRuntimeStatus) return;

    let active = true;

    desktopBridge
      .getAiRuntimeStatus()
      .then((status: AiRuntimeStatus) => {
        if (!active) return;
        applyAiRuntimeStatus(status);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [desktopBridge]);

  useEffect(() => {
    void desktopBridge
      ?.setExternalAiAuthorization?.(
        state.aiRuntimeMode === "real" && state.externalAiAcknowledged,
      )
      .catch(() => undefined);
  }, [desktopBridge, state.aiRuntimeMode, state.externalAiAcknowledged]);

  useEffect(() => {
    if (!regionDrag) return undefined;
    const activeDrag = regionDrag;

    function handlePointerMove(event: globalThis.PointerEvent) {
      dispatch({ type: "REGION_UPDATED", region: getDraggedRegion(activeDrag, event) });
    }

    function handlePointerUp() {
      setRegionDrag(null);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp, { once: true });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [regionDrag]);

  const selectedRegion =
    state.regionCandidates.find((region) => region.id === state.selectedRegionId) ?? null;
  const selectedRecord =
    state.records.find((record) => record.id === state.selectedRecordId) ?? state.records[0] ?? null;

  function goToScreen(screen: Screen) {
    dispatch({ type: "GO_TO_SCREEN", screen });
  }

  function openRecord(recordId: string) {
    dispatch({ type: "RECORD_SELECTED", recordId });
  }

  function applyAiRuntimeStatus(status: AiRuntimeStatus) {
    const canUseRealAi = status.enabled && hasDesktopAiBridge(desktopBridge);
    dispatch({
      type: "AI_RUNTIME_READY",
      mode: canUseRealAi ? "real" : "mock",
      message: status.enabled && !canUseRealAi ? missingDesktopAiBridgeMessage : status.message,
      provider: status.provider,
      model: status.model || defaultAiModel,
      configured: status.configured,
      persisted: status.persisted,
      canPersistSecret: status.canPersistSecret,
      updatedAt: status.updatedAt,
    });
    setAiConfigForm((current) => ({
      ...current,
      model: status.model || current.model || defaultAiModel,
    }));
  }

  async function saveAiConfiguration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const apiKey = aiConfigForm.apiKey.trim();
    const model = aiConfigForm.model.trim();
    const configureAiRuntime = desktopBridge?.configureAiRuntime;

    if (!apiKey || !model) {
      setAiConfigFeedback("请填写 API Key 和 LLM 名称。");
      return;
    }

    if (!configureAiRuntime) {
      setAiConfigFeedback(missingDesktopAiConfigurationBridgeMessage);
      return;
    }

    try {
      const result: AiRuntimeConfigurationResult = await configureAiRuntime({
        apiKey,
        model,
      });

      if (!result.ok) {
        setAiConfigFeedback(result.message);
        if (result.status) applyAiRuntimeStatus(result.status);
        return;
      }

      dispatch({ type: "EXTERNAL_AI_ACKNOWLEDGED", acknowledged: false });
      applyAiRuntimeStatus(result.status);
      setAiConfigForm({ apiKey: "", model: result.status.model || model });
      setAiConfigFeedback("配置已保存。");
    } catch {
      setAiConfigFeedback("真实 AI 配置保存失败，请重试。");
    }
  }

  async function clearAiConfiguration() {
    const clearAiRuntimeConfig = desktopBridge?.clearAiRuntimeConfig;

    if (!clearAiRuntimeConfig) {
      setAiConfigFeedback(missingDesktopAiConfigurationBridgeMessage);
      return;
    }

    try {
      const result = await clearAiRuntimeConfig();
      if (!result.ok) {
        setAiConfigFeedback(result.message);
        if (result.status) applyAiRuntimeStatus(result.status);
        return;
      }

      dispatch({ type: "EXTERNAL_AI_ACKNOWLEDGED", acknowledged: false });
      applyAiRuntimeStatus(result.status);
      setAiConfigForm((current) => ({
        apiKey: "",
        model: result.status.model || current.model || defaultAiModel,
      }));
      setAiConfigFeedback("API Key 已清除。");
    } catch {
      setAiConfigFeedback("真实 AI 配置清除失败，请重试。");
    }
  }

  async function ensureExternalAiAuthorization(surface: "upload" | "region") {
    if (state.aiRuntimeMode !== "real") return true;

    if (!state.externalAiAcknowledged) {
      if (surface === "upload") {
        dispatch({ type: "UPLOAD_BLOCKED", message: externalAiAuthorizationMessage });
      } else {
        dispatch({ type: "REGION_SELECTION_FAILED", message: externalAiAuthorizationMessage });
      }
      return false;
    }

    try {
      await desktopBridge?.setExternalAiAuthorization?.(true);
      return true;
    } catch {
      const message = "外部 AI 授权同步失败，请重试。";
      if (surface === "upload") {
        dispatch({ type: "UPLOAD_BLOCKED", message });
      } else {
        dispatch({ type: "REGION_SELECTION_FAILED", message });
      }
      return false;
    }
  }

  async function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith("image/") || file.name.toLowerCase().endsWith(".heic");
    if (!isImage) return;

    try {
      const imageUri = await readFileAsDataUrl(file);
      dispatch({
        type: "IMAGE_SELECTED",
        imageUri,
        fileName: file.name,
        fileMeta: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      });
    } catch {
      dispatch({ type: "UPLOAD_FAILED", message: "图片读取失败，请重新选择图片。" });
    }
  }

  async function handleDesktopImageSelected() {
    if (!desktopBridge) return;

    try {
      const filePath = await desktopBridge.selectImage();
      if (!filePath) return;

      const imageUri = await desktopBridge.readImageAsDataUrl(filePath);
      dispatch({
        type: "IMAGE_SELECTED",
        imageUri,
        fileName: getFileNameFromPath(filePath),
        fileMeta: "桌面图片",
      });
    } catch {
      dispatch({ type: "UPLOAD_FAILED", message: "桌面图片读取失败，请重新选择图片。" });
    }
  }

  async function rotateUploadedImage(direction: ImageRotationDirection) {
    if (!state.uploadedImageUri) return;

    try {
      const rotatedImageUri = await rotateImageDataUrl(state.uploadedImageUri, direction);
      dispatch({
        type: "IMAGE_ROTATED",
        imageUri: rotatedImageUri,
        rotationDegrees: getNextImageRotationDegrees(state.uploadedImageRotationDegrees, direction),
      });
    } catch {
      dispatch({
        type: "UPLOAD_BLOCKED",
        message: "图片旋转失败，请重新选择图片或继续使用当前方向。",
      });
    }
  }

  async function startRegionSelection() {
    if (!state.uploadedImageUri || !state.privacyAcknowledged) {
      dispatch({ type: "START_REGION_SELECTION" });
      return;
    }

    if (!(await ensureExternalAiAuthorization("upload"))) return;

    const result = await aiAdapter.detectRegions({ imageUri: state.uploadedImageUri });
    if (!result.ok) {
      dispatch({ type: "REGION_SELECTION_FAILED", message: result.message });
      return;
    }

    dispatch({ type: "REGION_CANDIDATES_READY", candidates: result.candidates });
  }

  async function rerunRegionDetection() {
    if (!state.uploadedImageUri) {
      dispatch({ type: "REGION_SELECTION_FAILED", message: "请先选择一张错题照片。" });
      return;
    }

    if (!(await ensureExternalAiAuthorization("region"))) return;

    const result = await aiAdapter.detectRegions({ imageUri: state.uploadedImageUri });
    if (!result.ok) {
      dispatch({ type: "REGION_SELECTION_FAILED", message: result.message });
      return;
    }

    dispatch({ type: "REGION_CANDIDATES_READY", candidates: result.candidates });
  }

  function addManualRegion() {
    dispatch({ type: "MANUAL_REGION_ADDED", region: createManualRegion() });
  }

  function deleteRegion(regionId: string) {
    setRegionDrag(null);
    dispatch({ type: "REGION_DELETED", regionId });
  }

  function updateRegionZoom(zoom: number) {
    dispatch({
      type: "REGION_ZOOM_CHANGED",
      zoom: Math.min(1.8, Math.max(0.7, Number(zoom.toFixed(2)))),
    });
  }

  function startRegionDrag(
    event: PointerEvent<HTMLElement>,
    region: RegionCandidate,
    handle: RegionDragState["handle"],
  ) {
    event.preventDefault();
    event.stopPropagation();
    dispatch({ type: "REGION_SELECTED", regionId: region.id });

    const overlay = event.currentTarget.closest(".region-overlay");
    const canvasRect = overlay?.getBoundingClientRect();
    if (!canvasRect) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    setRegionDrag({
      regionId: region.id,
      handle,
      startX: event.clientX,
      startY: event.clientY,
      startRegion: { ...region },
      canvasWidth: canvasRect.width,
      canvasHeight: canvasRect.height,
    });
  }

  async function confirmSelectedRegion() {
    if (!selectedRegion) {
      dispatch({ type: "REGION_SELECTION_FAILED", message: "请先选择或手动画出一道题目区域。" });
      return;
    }

    if (!(await ensureExternalAiAuthorization("region"))) return;

    const selectedRegionImageUri = await createSelectedRegionImage(
      state.uploadedImageUri,
      selectedRegion,
    );

    const result = await aiAdapter.recognizeQuestion({
      subject: "auto",
      imageUri: state.uploadedImageUri,
      selectedRegion,
      selectedRegionImageUri,
    });
    if (!result.ok) {
      dispatch({ type: "REGION_SELECTION_FAILED", message: result.message });
      return;
    }

    setReviewForm(createReviewForm(result.draft));
    dispatch({ type: "DRAFT_READY", draft: result.draft });
  }

  async function saveRecord() {
    if (!state.draft || !isRecordStoreHydrated) return;
    if (!isSubject(reviewForm.subject)) {
      dispatch({ type: "SAVE_FAILED", message: "请先确认科目。" });
      return;
    }

    const record = createRecordFromDraft(state.draft, {
      ...reviewForm,
      subject: reviewForm.subject,
    });
    const nextRecords = [record, ...state.records.filter((item) => item.id !== record.id)];
    const saveResult = await recordStore.save(nextRecords);

    if (!saveResult.ok) {
      dispatch({ type: "SAVE_FAILED", message: getStorageErrorMessage(saveResult.reason) });
      return;
    }

    dispatch({ type: "RECORD_SAVED", record });
  }

  return (
    <div className="app-shell" data-testid="app-shell">
      <aside className="app-rail" aria-label="EvoCraft 应用集合">
        <div className="brand">
          <img className="brand-mark" src={evocraftLogoUrl} alt="EvoCraft logo" />
          <div>
            <strong>EvoCraft</strong>
            <span>AI 学习助手应用集合</span>
          </div>
        </div>

        <nav className="rail-nav" aria-label="主导航">
          <RailButton active={state.screen === "hub"} onClick={() => goToScreen("hub")}>
            应用集合
          </RailButton>
          <RailButton
            active={["upload", "select-region", "review"].includes(state.screen)}
            onClick={() => goToScreen("upload")}
          >
            错题收集
          </RailButton>
          <RailButton
            active={["records", "detail"].includes(state.screen)}
            onClick={() => goToScreen("records")}
          >
            错题本
          </RailButton>
          <RailButton disabled>复习计划</RailButton>
          <RailButton disabled>学习奖励</RailButton>
        </nav>

        <div className="rail-footer">
          <RailButton active={state.screen === "settings"} onClick={() => goToScreen("settings")}>
            设置
          </RailButton>
          <div className="student-switch">
            <span className="avatar" aria-hidden="true">
              小
            </span>
            <span>小明同学</span>
          </div>
        </div>
      </aside>

      <main className="main-workspace" id="main-content">
        {state.screen === "hub" && (
          <section className="screen hub-screen" aria-labelledby="hub-title">
            <header className="workspace-header">
              <div>
                <h1 id="hub-title">应用集合</h1>
                <p>选择应用，开始高效学习</p>
              </div>
              <div className="window-controls" aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </header>

            <div className="app-grid">
              <article className="app-tile app-tile-active">
                <div className="tile-icon primary" aria-hidden="true">
                  题
                </div>
                <h2>错题收集</h2>
                <p>拍照上传，AI 去痕整理</p>
                <button className="button-primary" type="button" onClick={() => goToScreen("upload")}>
                  当前可用
                </button>
              </article>
              {["背单词", "复习计划", "学习奖励"].map((name) => (
                <article className="app-tile app-tile-locked" key={name}>
                  <div className="tile-icon locked" aria-hidden="true">
                    {name[0]}
                  </div>
                  <h2>{name}</h2>
                  <p>规划中</p>
                  <span className="soft-pill">规划中</span>
                </article>
              ))}
            </div>

            <section className="recent-section" aria-labelledby="recent-title">
              <div className="section-heading">
                <h2 id="recent-title">最近使用</h2>
                <button className="button-ghost" type="button" onClick={() => goToScreen("records")}>
                  查看全部
                </button>
              </div>
              <RecordList records={state.records.slice(0, 1)} compact />
            </section>
          </section>
        )}

        {state.screen === "upload" && (
          <section className="screen upload-screen" aria-labelledby="upload-title">
            <header className="workspace-header">
              <div>
                <h1 id="upload-title">错题收集</h1>
                <p>上传错题照片，AI 帮你整理成干净题面</p>
              </div>
              <button className="button-secondary" type="button">
                使用指南
              </button>
            </header>
            <FlowStageTracker screen={state.screen} />

            <div className="upload-layout">
              <div className="upload-card">
                {desktopBridge ? (
                  <button
                    aria-label="从电脑选择图片"
                    className={`upload-dropzone ${state.uploadedImageUri ? "has-preview" : ""}`}
                    type="button"
                    onClick={handleDesktopImageSelected}
                  >
                    <UploadDropzoneContent
                      imageUri={state.uploadedImageUri}
                      primaryText={state.uploadedImageUri ? "图片已准备好" : "从电脑选择图片"}
                      secondaryText={state.uploadedImageUri ? "点击可替换图片" : "本地读取，不上传真实照片"}
                    />
                  </button>
                ) : (
                  <>
                    <label
                      className={`upload-dropzone ${state.uploadedImageUri ? "has-preview" : ""}`}
                      htmlFor="image-input"
                    >
                      <UploadDropzoneContent
                        imageUri={state.uploadedImageUri}
                        primaryText={state.uploadedImageUri ? "图片已准备好" : "将错题照片拖拽到这里"}
                        secondaryText={state.uploadedImageUri ? "点击可替换图片" : "或点击选择图片"}
                      />
                    </label>
                    <input
                      hidden
                      id="image-input"
                      aria-label="选择错题照片"
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/bmp,.heic"
                      onChange={handleFileSelected}
                    />
                  </>
                )}

                {state.uploadedImageUri && (
                  <div className="upload-preview">
                    <div>
                      <strong>{state.uploadedFileName}</strong>
                      <span>{state.uploadedFileMeta}</span>
                    </div>
                  </div>
                )}
                {state.uploadedImageUri && (
                  <section className="image-orientation-controls" aria-label="照片方向调整">
                    <div>
                      <strong>照片方向</strong>
                      <span>{formatImageRotation(state.uploadedImageRotationDegrees)}</span>
                    </div>
                    <button
                      className="button-secondary"
                      onClick={() => rotateUploadedImage("left")}
                      type="button"
                    >
                      左转照片
                    </button>
                    <button
                      className="button-secondary"
                      onClick={() => rotateUploadedImage("right")}
                      type="button"
                    >
                      右转照片
                    </button>
                  </section>
                )}
                <p className="form-error" role="alert">
                  {state.uploadError}
                </p>

                <label className="privacy-consent">
                  <input
                    checked={state.privacyAcknowledged}
                    onChange={(event) =>
                      dispatch({
                        type: "PRIVACY_ACKNOWLEDGED",
                        acknowledged: event.target.checked,
                      })
                    }
                    type="checkbox"
                  />
                  <span>
                    <strong>本地隐私确认</strong>
                    <small>当前照片和错题记录只保存在此浏览器；未来外部 AI 识别会单独授权。</small>
                  </span>
                </label>

                {state.aiRuntimeMode === "real" ? (
                  <label className="privacy-consent ai-consent">
                    <input
                      checked={state.externalAiAcknowledged}
                      onChange={(event) =>
                        dispatch({
                          type: "EXTERNAL_AI_ACKNOWLEDGED",
                          acknowledged: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    <span>
                      <strong>真实 AI 测试模式</strong>
                      <small>开启后会把确认的题目区域发送到外部 AI 服务进行识别。</small>
                      <small>LLM 名称：{state.aiModel}</small>
                      {state.aiRuntimeMessage ? <small>{state.aiRuntimeMessage}</small> : null}
                    </span>
                  </label>
                ) : (
                  <div className="ai-mode-note">
                    <strong>本地 mock 识别</strong>
                    {state.aiRuntimeMessage ? <small>{state.aiRuntimeMessage}</small> : null}
                  </div>
                )}

                <button
                  className="button-primary start-button"
                  disabled={!state.uploadedImageUri || !state.privacyAcknowledged}
                  onClick={startRegionSelection}
                  type="button"
                >
                  下一步：选择题目区域
                </button>
              </div>

              <section className="mini-records" aria-labelledby="mini-records-title">
                <div className="section-heading">
                  <h2 id="mini-records-title">最近记录</h2>
                  <button className="button-ghost" type="button" onClick={() => goToScreen("records")}>
                    查看更多
                  </button>
                </div>
                <RecordList records={state.records.slice(0, 3)} compact />
              </section>
            </div>
          </section>
        )}

        {state.screen === "settings" && (
          <section className="screen settings-screen" aria-labelledby="settings-title">
            <header className="workspace-header">
              <div>
                <h1 id="settings-title">设置</h1>
                <p>配置桌面版真实 AI。配置完成后，上传题目区域前仍需要单独确认外部 AI 授权。</p>
              </div>
            </header>

            <div className="settings-layout">
              <section className="settings-panel" aria-labelledby="ai-config-title">
                <div className="section-heading">
                  <div>
                    <h2 id="ai-config-title">真实 AI 配置</h2>
                    <p>API key 由桌面主进程加密保存，不写入错题记录或网页存储。</p>
                  </div>
                  <span
                    className={`status-chip ${state.aiRuntimeMode === "real" ? "ai" : "review"}`}
                  >
                    {state.aiRuntimeMode === "real" ? "真实 AI 已配置" : "当前使用本地 mock 识别"}
                  </span>
                </div>

                <div className="settings-status">
                  <div>
                    <span>Provider</span>
                    <strong>{state.aiProvider}</strong>
                  </div>
                  <div>
                    <span>LLM 名称</span>
                    <strong>LLM 名称：{state.aiModel}</strong>
                  </div>
                  <div>
                    <span>API Key</span>
                    <strong>{state.aiConfigPersisted ? "API Key 已保存" : "API Key 未保存"}</strong>
                    <small>
                      {state.aiConfigPersisted && state.aiConfigCanPersistSecret
                        ? "本机加密保存"
                        : state.aiConfigured
                          ? "仅本次会话可用"
                          : "未配置真实 AI"}
                    </small>
                    {state.aiConfigUpdatedAt ? (
                      <small>更新时间：{formatTime(state.aiConfigUpdatedAt)}</small>
                    ) : null}
                  </div>
                </div>

                <form className="settings-form" onSubmit={saveAiConfiguration}>
                  {!canConfigureAiRuntime && (
                    <p className="settings-note">
                      <strong>{missingDesktopAiConfigurationBridgeMessage}</strong>
                      <small>请打开 Electron 桌面应用的设置页配置；当前网页预览继续使用本地 mock。</small>
                    </p>
                  )}
                  <label>
                    <span>API Key</span>
                    <input
                      autoComplete="off"
                      disabled={!canConfigureAiRuntime}
                      placeholder="输入 DashScope API Key"
                      type="password"
                      value={aiConfigForm.apiKey}
                      onChange={(event) =>
                        setAiConfigForm((current) => ({
                          ...current,
                          apiKey: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label>
                    <span>LLM 名称</span>
                    <input
                      disabled={!canConfigureAiRuntime}
                      type="text"
                      value={aiConfigForm.model}
                      onChange={(event) =>
                        setAiConfigForm((current) => ({
                          ...current,
                          model: event.target.value,
                        }))
                      }
                    />
                  </label>

                  <button
                    className="button-primary"
                    disabled={!canConfigureAiRuntime}
                    type="submit"
                  >
                    保存配置
                  </button>
                  <button
                    className="button-secondary"
                    disabled={!canConfigureAiRuntime || !state.aiConfigured}
                    onClick={clearAiConfiguration}
                    type="button"
                  >
                    清除 key
                  </button>
                  <p className="form-error" role="alert">
                    {aiConfigFeedback}
                  </p>
                </form>
              </section>
            </div>
          </section>
        )}

        {state.screen === "select-region" && (
          <section className="screen region-screen" aria-labelledby="region-title">
            <header className="workspace-header">
              <div>
                <h1 id="region-title">选择题目区域</h1>
                <p>确认本次要识别的一道题，AI 会只整理这个区域</p>
              </div>
              <div className="header-actions">
                <button className="button-secondary" type="button" onClick={() => goToScreen("upload")}>
                  返回上传
                </button>
                <button
                  className="button-primary"
                  disabled={!selectedRegion}
                  type="button"
                  onClick={confirmSelectedRegion}
                >
                  确认此区域并识别
                </button>
              </div>
            </header>
            <FlowStageTracker screen={state.screen} />

            <div className="region-layout">
              <section className="region-canvas-card" aria-labelledby="region-canvas-title">
                <header>
                  <div>
                    <h2 id="region-canvas-title">整张原图</h2>
                    <p>拖动蓝框调整范围，或使用手动画框</p>
                  </div>
                  <div className="canvas-tools" aria-label="画布工具">
                    <button
                      className="button-ghost"
                      type="button"
                      onClick={() => updateRegionZoom(state.regionZoom - 0.1)}
                    >
                      缩小
                    </button>
                    <button className="button-ghost" type="button" onClick={() => updateRegionZoom(1)}>
                      适配
                    </button>
                    <button
                      className="button-ghost"
                      type="button"
                      onClick={() => updateRegionZoom(state.regionZoom + 0.1)}
                    >
                      放大
                    </button>
                  </div>
                </header>
                <div
                  className="region-canvas"
                  style={{ "--region-zoom": state.regionZoom } as CSSProperties}
                >
                  <img src={state.uploadedImageUri} alt="用于框选题目区域的整张原图" />
                  <div className="region-overlay" aria-label="题目候选区域">
                    {state.regionCandidates.map((region) => (
                      <div
                        aria-label={region.label}
                        className={`region-frame ${region.id === state.selectedRegionId ? "is-selected" : ""}`}
                        key={region.id}
                        onClick={() => dispatch({ type: "REGION_SELECTED", regionId: region.id })}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            dispatch({ type: "REGION_SELECTED", regionId: region.id });
                          }
                        }}
                        onPointerDown={(event) => startRegionDrag(event, region, "move")}
                        role="button"
                        style={{
                          left: `${region.x * 100}%`,
                          top: `${region.y * 100}%`,
                          width: `${region.width * 100}%`,
                          height: `${region.height * 100}%`,
                        }}
                        tabIndex={0}
                      >
                        <span>区域{region.label}</span>
                        <button
                          aria-label={`从画布删除${region.label}`}
                          className="region-frame-delete"
                          onClick={(event) => {
                            event.stopPropagation();
                            deleteRegion(region.id);
                          }}
                          onPointerDown={(event) => {
                            event.stopPropagation();
                          }}
                          type="button"
                        >
                          删除
                        </button>
                        {region.id === state.selectedRegionId && (
                          <>
                            <i
                              aria-hidden="true"
                              data-handle="se"
                              onPointerDown={(event) => startRegionDrag(event, region, "se")}
                            ></i>
                            <i
                              aria-hidden="true"
                              data-handle="ne"
                              onPointerDown={(event) => startRegionDrag(event, region, "ne")}
                            ></i>
                            <i
                              aria-hidden="true"
                              data-handle="sw"
                              onPointerDown={(event) => startRegionDrag(event, region, "sw")}
                            ></i>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <aside className="region-tools" aria-labelledby="region-tools-title">
                <h2 id="region-tools-title">选题工具</h2>
                <p>先选 AI 候选框；如果没有框中，就手动画框。</p>
                <div className="region-candidate-list">
                  {state.regionCandidates.length ? (
                    state.regionCandidates.map((region) => (
                      <div
                        className={`region-candidate ${
                          region.id === state.selectedRegionId ? "is-selected" : ""
                        }`}
                        key={region.id}
                      >
                        <button
                          className="region-candidate-main"
                          onClick={() => dispatch({ type: "REGION_SELECTED", regionId: region.id })}
                          type="button"
                        >
                          <strong>{region.label}</strong>
                          <span>
                            {region.source === "manual"
                              ? "手动画框"
                              : `AI 候选 · ${Math.round(region.confidence * 100)}%`}
                          </span>
                        </button>
                        <button
                          aria-label={`删除${region.label}`}
                          className="region-delete-button"
                          onClick={() => deleteRegion(region.id)}
                          type="button"
                        >
                          删除
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="region-empty-state">
                      <strong>候选框已清空</strong>
                      <span>可以手动画框，或重新自动找题。</span>
                    </div>
                  )}
                </div>
                <div className="region-summary">
                  <strong>当前区域</strong>
                  <span>
                    {selectedRegion
                      ? `当前选择：${selectedRegion.label}`
                      : "未选择区域，请手动画框或重新自动找题"}
                  </span>
                </div>
                <div className="region-action-stack">
                  <button className="button-secondary full" type="button" onClick={addManualRegion}>
                    手动画框
                  </button>
                  <button className="button-secondary full" type="button" onClick={rerunRegionDetection}>
                    重新自动找题
                  </button>
                </div>
                <p className="form-error" role="alert">
                  {state.regionError}
                </p>
              </aside>
            </div>
          </section>
        )}

        {state.screen === "review" && state.draft && (
          <ReviewScreen
            draft={state.draft}
            form={reviewForm}
            onBack={() => goToScreen("upload")}
            onFormChange={setReviewForm}
            onSave={saveRecord}
            saveDisabled={!isRecordStoreHydrated || !isSubject(reviewForm.subject)}
            saveError={state.saveError}
            screen={state.screen}
          />
        )}

        {state.screen === "records" && (
          <section className="screen records-screen" aria-labelledby="records-title">
            <header className="workspace-header">
              <div>
                <button className="inline-back" type="button" onClick={() => goToScreen("hub")}>
                  返回应用集合
                </button>
                <h1 id="records-title">错题本</h1>
                <p>这里集中查看已经保存的错题记录，默认展示干净题面，点开后可查看原图。</p>
              </div>
              <div className="header-actions">
                <button className="button-primary" type="button" onClick={() => goToScreen("upload")}>
                  继续收集
                </button>
              </div>
            </header>
            <FlowStageTracker screen={state.screen} />

            <div className="records-layout">
              <section className="records-overview" aria-label="错题本概览">
                <article>
                  <span>已保存</span>
                  <strong>{state.records.length}</strong>
                  <small>道错题</small>
                </article>
                <article>
                  <span>默认复习材料</span>
                  <strong>干净题面</strong>
                  <small>原图仍保留用于复核</small>
                </article>
                <article>
                  <span>待复核</span>
                  <strong>{getPendingReviewCount(state.records)}</strong>
                  <small>道错题</small>
                </article>
                <article>
                  <span>本周新增</span>
                  <strong>{state.records.length}</strong>
                  <small>道错题</small>
                </article>
              </section>

              <section className="records-panel" aria-labelledby="records-list-title">
                <div className="section-heading">
                  <div>
                    <h2 id="records-list-title">全部错题</h2>
                    <p>共 {state.records.length} 条</p>
                  </div>
                  <button className="button-secondary" type="button" onClick={() => goToScreen("upload")}>
                    新增错题
                  </button>
                </div>
                <RecordList records={state.records} onOpenRecord={openRecord} showActions />
              </section>
            </div>
          </section>
        )}

        {state.screen === "detail" && selectedRecord && (
          <section className="screen detail-screen" aria-labelledby="detail-title">
            <header className="workspace-header">
              <div>
                <button className="inline-back" type="button" onClick={() => goToScreen("records")}>
                  返回错题本
                </button>
                <h1 id="detail-title">{selectedRecord.title}</h1>
              </div>
              <div className="header-actions">
                <button className="button-primary" type="button" onClick={() => goToScreen("upload")}>
                  继续收集
                </button>
              </div>
            </header>
            <FlowStageTracker screen={state.screen} />

            <div className="detail-layout">
              <article className="saved-question-card">
                <div className="section-heading">
                  <div>
                    <h2>题目（干净题面）</h2>
                    <p>{selectedRecord.title}</p>
                  </div>
                  <span className="status-chip clean">干净题面</span>
                </div>
                <div className="detail-image-tabs" role="tablist" aria-label="题面来源">
                  {[
                    ["clean", "干净题面"],
                    ["region", "确认区域"],
                    ["original", "原图"],
                  ].map(([mode, label]) => (
                    <button
                      aria-selected={state.detailImageMode === mode}
                      className={state.detailImageMode === mode ? "is-selected" : ""}
                      key={mode}
                      onClick={() =>
                        dispatch({
                          type: "DETAIL_IMAGE_MODE_CHANGED",
                          mode: mode as WrongQuestionState["detailImageMode"],
                        })
                      }
                      role="tab"
                      type="button"
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <img src={getDetailImageUri(selectedRecord, state.detailImageMode)} alt="已保存错题题面" />
                <div className="question-text">{selectedRecord.questionText}</div>
              </article>

              <aside className="detail-info" aria-label="题目信息">
                <h2>题目信息</h2>
                <dl>
                  <div>
                    <dt>科目</dt>
                    <dd>{SUBJECTS[selectedRecord.subject]}</dd>
                  </div>
                  <div>
                    <dt>创建时间</dt>
                    <dd>{formatTime(selectedRecord.createdAt)}</dd>
                  </div>
                </dl>
                <div className="status-row">
                  <span className="status-chip clean">去痕完成</span>
                  <span className="status-chip ai">已人工修正</span>
                  <span className="status-chip review">{getRecordProviderLabel(selectedRecord)}</span>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <aside className="ai-review-panel" aria-label="AI 复核面板">
        <SidePanel selectedRegion={selectedRegion} state={state} />
      </aside>
    </div>
  );
}

function UploadDropzoneContent({
  imageUri,
  primaryText,
  secondaryText,
}: {
  imageUri: string;
  primaryText: string;
  secondaryText: string;
}) {
  return (
    <>
      {imageUri ? (
        <img className="upload-dropzone-preview" src={imageUri} alt="已上传的错题原图预览" />
      ) : (
        <span className="upload-icon" aria-hidden="true">
          +
        </span>
      )}
      <strong>{primaryText}</strong>
      <span>{secondaryText}</span>
      <small>支持 JPG / PNG / BMP / HEIC，单张不超过 20MB</small>
    </>
  );
}

function RailButton({
  active = false,
  children,
  disabled = false,
  onClick,
}: {
  active?: boolean;
  children: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`rail-link ${active ? "is-active" : ""}`}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="nav-icon" aria-hidden="true">
        {children[0]}
      </span>
      {children}
    </button>
  );
}

const flowStages = [
  { label: "上传照片", screens: ["upload"] },
  { label: "授权与找题", screens: ["upload"] },
  { label: "选择区域", screens: ["select-region"] },
  { label: "识别复核", screens: ["review"] },
  { label: "保存", screens: ["detail", "records"] },
] as const;

function FlowStageTracker({ screen }: { screen: Screen }) {
  const currentIndex = getFlowStageIndex(screen);

  return (
    <nav aria-label="错题收集流程" className="flow-stage-tracker">
      {flowStages.map((stage, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div
            className={`flow-stage ${isComplete ? "is-complete" : ""} ${
              isCurrent ? "is-current" : ""
            }`}
            key={stage.label}
          >
            <span>{index + 1}</span>
            <strong>
              {isCurrent ? `${index + 1} / ${flowStages.length} ` : ""}
              {stage.label}
            </strong>
          </div>
        );
      })}
    </nav>
  );
}

function ReviewScreen({
  draft,
  form,
  onBack,
  onFormChange,
  onSave,
  saveDisabled = false,
  saveError,
  screen,
}: {
  draft: WrongQuestionDraft;
  form: ReviewForm;
  onBack: () => void;
  onFormChange: (form: ReviewForm) => void;
  onSave: () => void;
  saveDisabled?: boolean;
  saveError: string;
  screen: Screen;
}) {
  function updateForm<K extends keyof ReviewForm>(key: K, value: ReviewForm[K]) {
    onFormChange({ ...form, [key]: value });
  }

  return (
    <section className="screen review-screen" aria-labelledby="review-title">
      <header className="workspace-header">
        <div>
          <h1 id="review-title">识别复核</h1>
          <p>检查 AI 草稿和去痕效果，如果词句或图形不对就修改后保存</p>
        </div>
        <div className="header-actions">
          <button className="button-secondary" type="button" onClick={onBack}>
            重新上传
          </button>
          <button className="button-primary" disabled={saveDisabled} type="button" onClick={onSave}>
            保存到错题本
          </button>
        </div>
      </header>
      <FlowStageTracker screen={screen} />

      <div className="review-workshop">
        <article className="review-evidence-panel">
          <header>
            <div>
              <h2>原始证据</h2>
              <p>保留确认区域和整张原图，方便复核 AI 是否漏掉题干或图形。</p>
            </div>
            <span className="status-chip ai">已确认</span>
          </header>
          <div className="evidence-stack">
            <div>
              <strong>确认区域</strong>
              <img src={draft.selectedRegionImageUri} alt="已确认的题目区域" />
            </div>
            <div>
              <strong>原图溯源</strong>
              <img src={draft.originalImageUri} alt="错题原图" />
            </div>
          </div>
        </article>

        <article className="review-clean-panel">
          <header>
            <div>
              <h2>清晰复核面</h2>
              <p>去除作答痕迹，默认用于复习</p>
            </div>
            <span className="status-chip clean">去痕后</span>
          </header>
          <img src={draft.cleanedQuestionImageUri} alt="AI 生成的干净题面" />
          <footer>
            <button className="button-secondary" type="button">
              复制文字
            </button>
            <button className="button-secondary" type="button">
              复制图形
            </button>
          </footer>
        </article>

        <form className="editor-form review-inspector">
          <div className="section-heading compact">
            <div>
              <h2>题目信息</h2>
              <p>确认 AI 建议并补全可复习字段。</p>
            </div>
          </div>
          <label>
            <span>科目</span>
            <select
              aria-label="科目"
              value={form.subject}
              onChange={(event) =>
                updateForm(
                  "subject",
                  isSubject(event.target.value) ? event.target.value : "",
                )
              }
            >
              <option value="">待确认科目</option>
              <option value="chinese">语文</option>
              <option value="math">数学</option>
              <option value="english">英语</option>
            </select>
            <small className="field-note">
              {isSubject(draft.subject) ? `AI 建议：${SUBJECTS[draft.subject]}` : "AI 未能确认科目"}
            </small>
          </label>
          <label>
            <span>标题</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </label>
          <label>
            <span>题目文字</span>
            <textarea
              rows={7}
              value={form.questionText}
              onChange={(event) => updateForm("questionText", event.target.value)}
            ></textarea>
          </label>
          <label>
            <span>学生答案痕迹</span>
            <textarea
              rows={2}
              value={form.studentAnswer}
              onChange={(event) => updateForm("studentAnswer", event.target.value)}
            ></textarea>
          </label>
          <label>
            <span>正确答案</span>
            <textarea
              rows={2}
              value={form.correctAnswer}
              onChange={(event) => updateForm("correctAnswer", event.target.value)}
            ></textarea>
          </label>
          <label>
            <span>备注</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(event) => updateForm("notes", event.target.value)}
            ></textarea>
          </label>
          <p className="form-error" role="alert">
            {saveError}
          </p>
        </form>
      </div>
    </section>
  );
}

function RecordList({
  compact = false,
  onOpenRecord,
  records,
  showActions = false,
}: {
  compact?: boolean;
  onOpenRecord?: (recordId: string) => void;
  records: WrongQuestionRecord[];
  showActions?: boolean;
}) {
  if (!records.length) {
    return (
      <div className="record-list">
        <div className="empty-record">
          <strong>还没有保存的错题</strong>
          <span>上传第一张照片后，会在这里看到记录。</span>
        </div>
      </div>
    );
  }

  if (!compact && showActions) {
    return (
      <table aria-label="错题资料库" className="records-table">
        <thead>
          <tr>
            <th>题目预览</th>
            <th>标题</th>
            <th>科目</th>
            <th>保存时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <button
                  className="record-preview-button"
                  onClick={() => onOpenRecord?.(record.id)}
                  type="button"
                >
                  <img src={record.cleanedQuestionImageUri} alt="" />
                  <span className="sr-only">{record.title} 打开</span>
                </button>
              </td>
              <td>
                <strong>{record.title}</strong>
                <small>默认复习：干净题面</small>
              </td>
              <td>{SUBJECTS[record.subject]}</td>
              <td>{formatTime(record.createdAt)}</td>
              <td>
                <div className="record-status-chips">
                  <span className="status-chip clean">已确认区域</span>
                  <span className="status-chip ai">科目已确认</span>
                  <span className="status-chip review">{getRecordProviderLabel(record)}</span>
                </div>
              </td>
              <td>
                <div className="record-row-actions">
                  <button
                    className="button-ghost"
                    onClick={() => onOpenRecord?.(record.id)}
                    type="button"
                  >
                    打开
                  </button>
                  <button className="button-ghost" type="button">
                    复核
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return (
    <div className={`record-list ${compact ? "compact" : "records-list"}`}>
      {records.map((record) => (
        <div className={`record-row ${compact ? "is-compact" : ""}`} key={record.id}>
          <button
            className="record-open"
            onClick={() => onOpenRecord?.(record.id)}
            type="button"
          >
            <img src={record.cleanedQuestionImageUri} alt="" />
            <span>
              <strong>{record.title}</strong>
              <small>
                {SUBJECTS[record.subject]} · {formatTime(record.createdAt)} · 已确认题目区域
              </small>
            </span>
            <em>打开</em>
          </button>
        </div>
      ))}
    </div>
  );
}

function SidePanel({
  selectedRegion,
  state,
}: {
  selectedRegion: RegionCandidate | null;
  state: WrongQuestionState;
}) {
  const diagnostics = getRedactedDiagnostics(state);

  return (
    <section className="side-block">
      <h2>AI 处理状态</h2>
      <div className="metric-card">
        <strong>{state.records.length}</strong>
        <span>已整理错题</span>
      </div>
      <div className="status-summary">
        <div>
          <span>AI 模式</span>
          <strong>{state.aiRuntimeMode === "real" ? "真实 AI" : "本地 mock"}</strong>
        </div>
        <div>
          <span>授权状态</span>
          <strong>{state.externalAiAcknowledged ? "已授权" : "独立授权"}</strong>
        </div>
        <div>
          <span>当前阶段</span>
          <strong>{getCurrentFlowStageLabel(state.screen)}</strong>
        </div>
        <div>
          <span>当前区域</span>
          <strong>{selectedRegion ? `已选${selectedRegion.label}` : "未选择"}</strong>
        </div>
      </div>
      <section className="diagnostics-block" aria-labelledby="diagnostics-title">
        <h3 id="diagnostics-title">诊断信息（已脱敏）</h3>
        <div className="review-checklist">
          {diagnostics.map((item) => (
            <div key={item.label}>
              <span className={`dot ${item.status}`}></span> {item.label}
              <em>{item.value}</em>
            </div>
          ))}
        </div>
      </section>
      {state.uploadError || state.regionError || state.saveError ? (
        <p className="side-error">
          {state.uploadError || state.regionError || state.saveError}
        </p>
      ) : (
        <p className="storage-status is-success">当前流程可继续，敏感信息不会显示在诊断区。</p>
      )}
    </section>
  );
}

function getFlowStageIndex(screen: Screen) {
  if (screen === "select-region") return 2;
  if (screen === "review") return 3;
  if (screen === "detail" || screen === "records") return 4;
  return 0;
}

function getCurrentFlowStageLabel(screen: Screen) {
  return flowStages[getFlowStageIndex(screen)]?.label ?? "上传照片";
}

function getPendingReviewCount(records: WrongQuestionRecord[]) {
  return records.filter(
    (record) => record.recognitionStatus !== "reviewed" || record.cleanupStatus !== "reviewed",
  ).length;
}

function getRecordProviderLabel(record: WrongQuestionRecord) {
  const provider = record.modelTraces[0]?.provider ?? "mock";
  return provider === "mock" ? "mock" : "真实 AI";
}

function getDetailImageUri(
  record: WrongQuestionRecord,
  mode: WrongQuestionState["detailImageMode"],
) {
  if (mode === "original") return record.originalImageUri;
  if (mode === "region") return record.selectedRegionImageUri;
  return record.cleanedQuestionImageUri;
}

function formatImageRotation(rotationDegrees: number) {
  if (rotationDegrees === 0) return "当前方向：原始方向";
  if (rotationDegrees === 90) return "当前方向：右转 90度";
  if (rotationDegrees === 180) return "当前方向：旋转 180度";
  return "当前方向：左转 90度";
}

function getRedactedDiagnostics(state: WrongQuestionState) {
  const hasRegions = state.regionCandidates.length > 0;
  const hasDraft = Boolean(state.draft);

  return [
    {
      label: "配置状态",
      status: state.aiConfigured ? "done" : "wait",
      value: state.aiConfigured ? "已配置" : "未配置",
    },
    {
      label: "授权状态",
      status: state.externalAiAcknowledged || state.aiRuntimeMode === "mock" ? "done" : "warn",
      value: state.aiRuntimeMode === "mock" ? "本地" : state.externalAiAcknowledged ? "已授权" : "待确认",
    },
    {
      label: "detectRegions",
      status: hasRegions ? "done" : state.screen === "select-region" ? "warn" : "wait",
      value: hasRegions ? `${state.regionCandidates.length} 个候选` : "未运行",
    },
    {
      label: "recognizeQuestion",
      status: hasDraft ? "done" : state.screen === "review" ? "warn" : "wait",
      value: hasDraft ? "草稿已生成" : "未运行",
    },
  ] as const;
}

function createReviewForm(draft: WrongQuestionDraft): ReviewForm {
  return {
    subject: isSubject(draft.subject) ? draft.subject : "",
    title: draft.title,
    questionText: draft.questionText,
    studentAnswer: draft.studentAnswer,
    correctAnswer: draft.correctAnswer,
    notes: draft.notes,
  };
}

function getDraggedRegion(dragState: RegionDragState, event: globalThis.PointerEvent): RegionCandidate {
  const dx = (event.clientX - dragState.startX) / dragState.canvasWidth;
  const dy = (event.clientY - dragState.startY) / dragState.canvasHeight;
  const start = dragState.startRegion;
  const next = { ...start };

  if (dragState.handle === "move") {
    next.x = clamp(start.x + dx, 0, 1 - start.width);
    next.y = clamp(start.y + dy, 0, 1 - start.height);
    return next;
  }

  if (dragState.handle === "ne") {
    const nextY = clamp(start.y + dy, 0, start.y + start.height - 0.08);
    next.y = nextY;
    next.width = clamp(start.width + dx, 0.08, 1 - start.x);
    next.height = clamp(start.height + (start.y - nextY), 0.08, 1 - nextY);
    return next;
  }

  if (dragState.handle === "sw") {
    const nextX = clamp(start.x + dx, 0, start.x + start.width - 0.08);
    next.x = nextX;
    next.width = clamp(start.width + (start.x - nextX), 0.08, 1 - nextX);
    next.height = clamp(start.height + dy, 0.08, 1 - start.y);
    return next;
  }

  next.width = clamp(start.width + dx, 0.08, 1 - start.x);
  next.height = clamp(start.height + dy, 0.08, 1 - start.y);
  return next;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createSelectedRegionImage(imageUri: string, region: RegionCandidate) {
  if (typeof document === "undefined" || typeof Image === "undefined") {
    return Promise.resolve(imageUri);
  }

  if (window.navigator.userAgent.toLowerCase().includes("jsdom")) {
    return Promise.resolve(imageUri);
  }

  const contextProbe = document.createElement("canvas").getContext("2d");
  if (!contextProbe) return Promise.resolve(imageUri);

  return new Promise<string>((resolve) => {
    const image = new Image();
    const fallbackTimer = window.setTimeout(() => resolve(imageUri), 300);

    image.addEventListener(
      "load",
      () => {
        window.clearTimeout(fallbackTimer);
        try {
          const canvas = document.createElement("canvas");
          const sourceX = Math.max(0, Math.round(image.naturalWidth * region.x));
          const sourceY = Math.max(0, Math.round(image.naturalHeight * region.y));
          const sourceWidth = Math.max(1, Math.round(image.naturalWidth * region.width));
          const sourceHeight = Math.max(1, Math.round(image.naturalHeight * region.height));
          canvas.width = sourceWidth;
          canvas.height = sourceHeight;
          const context = canvas.getContext("2d");
          if (!context) {
            resolve(imageUri);
            return;
          }

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
        } catch {
          resolve(imageUri);
        }
      },
      { once: true },
    );
    image.addEventListener(
      "error",
      () => {
        window.clearTimeout(fallbackTimer);
        resolve(imageUri);
      },
      { once: true },
    );
    image.src = imageUri;
  });
}

function getStorageErrorMessage(reason: string) {
  const messages: Record<string, string> = {
    storage_unavailable: "当前浏览器无法访问本地存储，请检查隐私模式或浏览器设置。",
    storage_write_failed: "本地保存失败，可能是浏览器存储空间已满，请删除旧记录后再试。",
    storage_clear_failed: "本地数据清空失败，请检查浏览器存储权限后重试。",
  };
  return messages[reason] ?? "本地存储操作失败，请稍后重试。";
}

function getFileNameFromPath(filePath: string) {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const fileName = normalizedPath.split("/").filter(Boolean).pop();

  return fileName ?? "本地图片";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener(
      "load",
      () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }

        reject(new Error("FileReader did not return a data URL."));
      },
      { once: true },
    );
    reader.addEventListener(
      "error",
      () => reject(reader.error ?? new Error("FileReader failed.")),
      { once: true },
    );
    reader.readAsDataURL(file);
  });
}

function getBrowserStorage() {
  if (typeof window === "undefined") return undefined;

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
