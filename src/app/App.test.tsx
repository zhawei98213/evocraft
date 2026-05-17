import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("runs the desktop MVP flow through upload, region selection, review, save, and notebook", async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole("button", { name: "错题收集" }));
    expect(screen.getByRole("heading", { name: "错题收集" })).toBeInTheDocument();

    const file = new File(["fake-image"], "question.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("选择错题照片"), file);
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
    await user.click(screen.getByRole("button", { name: "保存到错题本" }));

    expect(screen.getByRole("heading", { name: "一次函数图像与坐标综合题" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "错题本" }));
    expect(screen.getByText("共 1 条")).toBeInTheDocument();
  });
});
