import {
  type CSSProperties,
  type ChangeEvent,
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
  type RegionCandidate,
  type Subject,
  type WrongQuestionDraft,
} from "../domain/wrongQuestion";
import {
  createInitialWrongQuestionState,
  wrongQuestionReducer,
  type Screen,
} from "../features/wrongQuestion/wrongQuestionReducer";
import { getDesktopBridge } from "../services/desktopBridge";
import { mockAiAdapter } from "../services/mockAiAdapter";
import { createLocalStorageRecordStore } from "../services/storage";

interface ReviewForm {
  subject: Subject;
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
  subject: "math",
  title: "",
  questionText: "",
  studentAnswer: "",
  correctAnswer: "",
  notes: "",
};

export function App() {
  const recordStore = useMemo(
    () => createLocalStorageRecordStore(getBrowserStorage()),
    [],
  );
  const [state, dispatch] = useReducer(
    wrongQuestionReducer,
    undefined,
    () => createInitialWrongQuestionState([]),
  );
  const desktopBridge = getDesktopBridge();
  const [reviewForm, setReviewForm] = useState<ReviewForm>(emptyReviewForm);
  const [regionDrag, setRegionDrag] = useState<RegionDragState | null>(null);

  useEffect(() => {
    document.body.dataset.screen = state.screen;
  }, [state.screen]);

  useEffect(() => {
    let active = true;

    recordStore.load().then((records) => {
      if (!active) return;
      dispatch({ type: "RECORDS_LOADED", records });
    });

    return () => {
      active = false;
    };
  }, [recordStore]);

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

  async function startRegionSelection() {
    if (!state.uploadedImageUri || !state.privacyAcknowledged) {
      dispatch({ type: "START_REGION_SELECTION" });
      return;
    }

    const result = await mockAiAdapter.detectRegions({ imageUri: state.uploadedImageUri });
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

    const result = await mockAiAdapter.detectRegions({ imageUri: state.uploadedImageUri });
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

    const selectedRegionImageUri = await createSelectedRegionImage(
      state.uploadedImageUri,
      selectedRegion,
    );

    const result = await mockAiAdapter.recognizeQuestion({
      subject: state.selectedSubject,
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
    if (!state.draft) return;

    const record = createRecordFromDraft(state.draft, reviewForm);
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
          <RailButton disabled>设置</RailButton>
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
                <p className="form-error" role="alert">
                  {state.uploadError}
                </p>

                <div className="subject-block" aria-labelledby="subject-title">
                  <h2 id="subject-title">
                    选择学科 <span>可由 AI 自动识别</span>
                  </h2>
                  <div className="segmented-control" role="radiogroup" aria-label="选择学科">
                    <button className="is-selected" type="button">
                      自动
                    </button>
                    <button type="button">语文</button>
                    <button type="button">数学</button>
                    <button type="button">英语</button>
                  </div>
                </div>

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
                        {region.id === state.selectedRegionId && (
                          <>
                            <button
                              aria-label={`从画布删除${region.label}`}
                              className="region-frame-delete"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteRegion(region.id);
                              }}
                              type="button"
                            >
                              删除
                            </button>
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
            saveError={state.saveError}
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
                <RecordList records={state.records} />
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

            <div className="detail-layout">
              <article className="saved-question-card">
                <div className="section-heading">
                  <div>
                    <h2>题目（干净题面）</h2>
                    <p>{selectedRecord.title}</p>
                  </div>
                  <span className="status-chip clean">干净题面</span>
                </div>
                <img src={selectedRecord.cleanedQuestionImageUri} alt="已保存错题题面" />
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
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <aside className="ai-review-panel" aria-label="AI 复核面板">
        <SidePanel screen={state.screen} recordCount={state.records.length} />
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

function ReviewScreen({
  draft,
  form,
  onBack,
  onFormChange,
  onSave,
  saveError,
}: {
  draft: WrongQuestionDraft;
  form: ReviewForm;
  onBack: () => void;
  onFormChange: (form: ReviewForm) => void;
  onSave: () => void;
  saveError: string;
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
          <button className="button-primary" type="button" onClick={onSave}>
            保存到错题本
          </button>
        </div>
      </header>

      <div className="review-grid">
        <article className="image-panel selected-region-panel">
          <header>
            <div>
              <h2>确认区域</h2>
              <p>本次只识别这道题</p>
            </div>
            <span className="status-chip ai">已确认</span>
          </header>
          <img src={draft.selectedRegionImageUri} alt="已确认的题目区域" />
        </article>

        <article className="image-panel source-image-panel">
          <header>
            <div>
              <h2>原图</h2>
              <p>含手写与批改痕迹</p>
            </div>
            <span className="status-chip review">含手写与批改</span>
          </header>
          <img src={draft.originalImageUri} alt="错题原图" />
        </article>

        <article className="image-panel clean-question-panel">
          <header>
            <div>
              <h2>干净题面</h2>
              <p>去除作答痕迹，默认用于复习</p>
            </div>
            <span className="status-chip clean">去痕后</span>
          </header>
          <img src={draft.cleanedQuestionImageUri} alt="AI 生成的干净题面" />
        </article>
      </div>

      <form className="editor-form">
        <div className="form-row two">
          <label>
            <span>科目</span>
            <select
              value={form.subject}
              onChange={(event) => updateForm("subject", event.target.value as Subject)}
            >
              <option value="chinese">语文</option>
              <option value="math">数学</option>
              <option value="english">英语</option>
            </select>
          </label>
          <label>
            <span>标题</span>
            <input
              type="text"
              value={form.title}
              onChange={(event) => updateForm("title", event.target.value)}
            />
          </label>
        </div>
        <label>
          <span>题目文字</span>
          <textarea
            rows={6}
            value={form.questionText}
            onChange={(event) => updateForm("questionText", event.target.value)}
          ></textarea>
        </label>
        <div className="form-row two">
          <label>
            <span>学生答案</span>
            <textarea
              rows={3}
              value={form.studentAnswer}
              onChange={(event) => updateForm("studentAnswer", event.target.value)}
            ></textarea>
          </label>
          <label>
            <span>正确答案</span>
            <textarea
              rows={3}
              value={form.correctAnswer}
              onChange={(event) => updateForm("correctAnswer", event.target.value)}
            ></textarea>
          </label>
        </div>
        <label>
          <span>备注</span>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(event) => updateForm("notes", event.target.value)}
          ></textarea>
        </label>
        <p className="form-error" role="alert">
          {saveError}
        </p>
      </form>
    </section>
  );
}

function RecordList({ compact = false, records }: { compact?: boolean; records: WrongQuestionDraft[] }) {
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

  return (
    <div className={`record-list ${compact ? "compact" : "records-list"}`}>
      {records.map((record) => (
        <div className={`record-row ${compact ? "is-compact" : ""}`} key={record.id}>
          <button className="record-open" type="button">
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

function SidePanel({ recordCount, screen }: { recordCount: number; screen: Screen }) {
  const title =
    screen === "upload"
      ? "AI 处理流程"
      : screen === "select-region"
        ? "选题区域状态"
        : screen === "review"
          ? "AI 识别与去痕状态"
          : screen === "records"
            ? "错题本"
            : "今日学习状态";

  return (
    <section className="side-block">
      <h2>{title}</h2>
      <div className="metric-card">
        <strong>{recordCount}</strong>
        <span>已整理错题</span>
      </div>
      <div className="review-checklist">
        <div>
          <span className="dot done"></span> 本地优先，不上传真实照片
        </div>
        <div>
          <span className="dot wait"></span> 后续可接入 AI 分析
        </div>
      </div>
    </section>
  );
}

function createReviewForm(draft: WrongQuestionDraft): ReviewForm {
  return {
    subject: draft.subject,
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
