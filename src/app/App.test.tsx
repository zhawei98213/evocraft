import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  STORAGE_KEY,
  createMockRecognition,
  createRecordFromDraft,
  type WrongQuestionRecord,
} from "../domain/wrongQuestion";
import { App } from "./App";
import type { EvoCraftDesktopApi } from "../services/desktopBridge";
import type { RecordStore } from "../services/storage";

afterEach(() => {
  vi.restoreAllMocks();
  Reflect.deleteProperty(window, "evocraft");
  window.localStorage.clear();
});

describe("App", () => {
  it("uses the selected EvoCraft logo in the app shell", () => {
    render(<App />);

    expect(screen.getByRole("img", { name: "EvoCraft logo" })).toHaveAttribute(
      "src",
      expect.stringContaining("evocraft-logo"),
    );
  });

  it("keeps the wrong-question app tile using its original mark", () => {
    render(<App />);

    const appTile = screen.getByRole("heading", { name: "错题收集" }).closest("article");
    expect(appTile).not.toBeNull();
    expect(within(appTile as HTMLElement).getByText("题")).toBeInTheDocument();
  });

  it("runs the desktop MVP flow through upload, region selection, review, save, and notebook", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    expect(screen.getByRole("heading", { name: "错题收集" })).toBeInTheDocument();

    const file = new File(["fake-image"], "question.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("选择错题照片"), file);
    await waitFor(() => {
      expect(screen.getByAltText("已上传的错题原图预览")).toHaveAttribute(
        "src",
        expect.stringMatching(/^data:image\/png;base64,/),
      );
    });
    await user.click(screen.getByRole("checkbox", { name: /本地隐私确认/ }));
    await user.click(screen.getByRole("button", { name: "下一步：选择题目区域" }));

    expect(screen.getByRole("heading", { name: "选择题目区域" })).toBeInTheDocument();
    expect(screen.getByText("候选 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "确认此区域并识别" }));
    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "识别复核" })).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText("标题"));
    await user.type(screen.getByLabelText("标题"), "一次函数图像与坐标综合题");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存到错题本" })).toBeEnabled();
    });
    await user.click(screen.getByRole("button", { name: "保存到错题本" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "一次函数图像与坐标综合题" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "错题本" }));
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
  });

  it("loads preexisting records from localStorage after startup", async () => {
    const record = createRecordFromDraft(createMockRecognition(), {
      id: "wq-preloaded",
      now: "2026-05-17T08:00:00.000Z",
      title: "预加载错题",
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([record]));
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题本" }));

    await waitFor(() => {
      expect(screen.getByText("共 1 条")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /预加载错题.*打开/ })).toBeInTheDocument();
  });

  it("loads records from the desktop bridge without reading localStorage", async () => {
    const desktopRecord = createRecordFromDraft(createMockRecognition(), {
      id: "wq-desktop",
      now: "2026-05-24T08:00:00.000Z",
      title: "桌面错题",
    });
    const browserRecord = createRecordFromDraft(createMockRecognition(), {
      id: "wq-browser",
      now: "2026-05-24T07:00:00.000Z",
      title: "浏览器错题",
    });
    const localStorageGetItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const desktopApi = installDesktopBridge({
      loadRecords: vi.fn().mockResolvedValue([desktopRecord]),
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([browserRecord]));
    const user = userEvent.setup();

    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题本" }));

    await waitFor(() => {
      expect(desktopApi.loadRecords).toHaveBeenCalledTimes(1);
    });
    expect(localStorageGetItemSpy).not.toHaveBeenCalled();
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /桌面错题.*打开/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /浏览器错题.*打开/ })).not.toBeInTheDocument();
  });

  it("blocks early save until delayed hydration finishes so preexisting records survive", async () => {
    const existingRecord = createRecordFromDraft(createMockRecognition(), {
      id: "wq-existing",
      now: "2026-05-17T08:00:00.000Z",
      title: "已存在错题",
    });
    const loadDeferred = createDeferred<WrongQuestionRecord[]>();
    const recordStore = createDeferredRecordStore(loadDeferred.promise);
    const user = userEvent.setup();

    render(<App recordStore={recordStore} />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));

    const file = new File(["fake-image"], "question.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("选择错题照片"), file);
    await waitFor(() => {
      expect(screen.getByAltText("已上传的错题原图预览")).toHaveAttribute(
        "src",
        expect.stringMatching(/^data:image\/png;base64,/),
      );
    });
    await user.click(screen.getByRole("checkbox", { name: /本地隐私确认/ }));
    await user.click(screen.getByRole("button", { name: "下一步：选择题目区域" }));
    await user.click(screen.getByRole("button", { name: "确认此区域并识别" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "识别复核" })).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", { name: "保存到错题本" });
    expect(saveButton).toBeDisabled();
    await user.click(saveButton);
    expect(recordStore.save).not.toHaveBeenCalled();

    loadDeferred.resolve([existingRecord]);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存到错题本" })).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "保存到错题本" }));

    await waitFor(() => {
      expect(recordStore.save).toHaveBeenCalledTimes(1);
    });

    const [savedRecords] = recordStore.save.mock.calls[0] ?? [];
    expect(savedRecords.map((record) => record.id)).toEqual([
      savedRecords[0]?.id,
      "wq-existing",
    ]);
    expect(savedRecords[0]?.title).toBe("一次函数图像与坐标综合题");

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "一次函数图像与坐标综合题" })).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: "错题本" }));

    await waitFor(() => {
      expect(screen.getByText("共 2 条")).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /已存在错题.*打开/ })).toBeInTheDocument();
  });

  it("lets users delete region candidates and recover with a manual region", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    const file = new File(["fake-image"], "question.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("选择错题照片"), file);
    await waitFor(() => {
      expect(screen.getByAltText("已上传的错题原图预览")).toHaveAttribute(
        "src",
        expect.stringMatching(/^data:image\/png;base64,/),
      );
    });
    await user.click(screen.getByRole("checkbox", { name: /本地隐私确认/ }));
    await user.click(screen.getByRole("button", { name: "下一步：选择题目区域" }));

    expect(screen.getByText("当前选择：候选 2")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除候选 2" }));

    expect(screen.getByText("当前选择：候选 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除候选 1" }));
    await user.click(screen.getByRole("button", { name: "删除候选 3" }));

    expect(screen.getByText("候选框已清空")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认此区域并识别" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "手动画框" }));

    expect(screen.getByText("当前选择：手动画框")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确认此区域并识别" })).toBeEnabled();
  });

  it("previews the real browser-selected image in the upload area", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    await user.upload(screen.getByLabelText("选择错题照片"), new File(["real-image"], "real.png", {
      type: "image/png",
    }));

    await waitFor(() => {
      expect(screen.getByAltText("已上传的错题原图预览")).toHaveAttribute(
        "src",
        "data:image/png;base64,cmVhbC1pbWFnZQ==",
      );
    });
    expect(screen.getByText("real.png")).toBeInTheDocument();
  });

  it("loads an image through the desktop bridge and continues into region selection", async () => {
    const desktopApi = installDesktopBridge({
      selectImage: vi.fn().mockResolvedValue("/Users/zha/Desktop/question.png"),
      readImageAsDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,desktop-image"),
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    const desktopPicker = screen.getByRole("button", { name: "从电脑选择图片" });
    expect(desktopPicker).toHaveClass("upload-dropzone");
    await user.click(desktopPicker);

    expect(desktopApi.selectImage).toHaveBeenCalledTimes(1);
    expect(desktopApi.readImageAsDataUrl).toHaveBeenCalledWith("/Users/zha/Desktop/question.png");
    expect(screen.getByText("question.png")).toBeInTheDocument();
    expect(within(desktopPicker).getByAltText("已上传的错题原图预览")).toHaveAttribute(
      "src",
      "data:image/png;base64,desktop-image",
    );

    await user.click(screen.getByRole("checkbox", { name: /本地隐私确认/ }));
    await user.click(screen.getByRole("button", { name: "下一步：选择题目区域" }));

    expect(screen.getByRole("heading", { name: "选择题目区域" })).toBeInTheDocument();
  });

  it("keeps the upload screen unchanged when desktop image selection is cancelled", async () => {
    const desktopApi = installDesktopBridge({
      selectImage: vi.fn().mockResolvedValue(null),
      readImageAsDataUrl: vi.fn(),
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    await user.click(screen.getByRole("button", { name: "从电脑选择图片" }));

    expect(desktopApi.selectImage).toHaveBeenCalledTimes(1);
    expect(desktopApi.readImageAsDataUrl).not.toHaveBeenCalled();
    expect(screen.queryByAltText("已上传的错题原图预览")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "下一步：选择题目区域" })).toBeDisabled();
  });

  it("shows a recoverable message when desktop image reading fails", async () => {
    installDesktopBridge({
      selectImage: vi.fn().mockResolvedValue("/Users/zha/Desktop/question.png"),
      readImageAsDataUrl: vi.fn().mockRejectedValue(new Error("read failed")),
    });
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    await user.click(screen.getByRole("button", { name: "从电脑选择图片" }));

    expect(screen.getByRole("alert")).toHaveTextContent("桌面图片读取失败，请重新选择图片。");
    expect(screen.getByRole("button", { name: "下一步：选择题目区域" })).toBeDisabled();
  });
});

function installDesktopBridge(overrides: Partial<EvoCraftDesktopApi>) {
  const desktopApi = {
    selectImage: vi.fn().mockResolvedValue(null),
    readImageAsDataUrl: vi.fn(),
    loadRecords: vi.fn().mockResolvedValue([]),
    saveRecords: vi.fn().mockResolvedValue({ ok: true }),
    clearRecords: vi.fn().mockResolvedValue({ ok: true }),
    ...overrides,
  } satisfies EvoCraftDesktopApi;

  Object.defineProperty(window, "evocraft", {
    configurable: true,
    value: desktopApi,
  });

  return desktopApi;
}

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
}

function createDeferredRecordStore(loadPromise: Promise<WrongQuestionRecord[]>): RecordStore & {
  save: ReturnType<typeof vi.fn<(records: WrongQuestionRecord[]) => Promise<{ ok: true }>>>;
} {
  return {
    load: vi.fn().mockImplementation(() => loadPromise),
    save: vi.fn().mockResolvedValue({ ok: true }),
    clear: vi.fn().mockResolvedValue({ ok: true }),
  };
}
