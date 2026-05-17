import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "./App";

describe("App", () => {
  it("renders the EvoCraft desktop app shell", () => {
    render(<App />);

    expect(screen.getByRole("heading", { name: "应用集合" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "错题收集" })).toBeInTheDocument();
    expect(screen.getByText("AI 学习助手应用集合")).toBeInTheDocument();
  });
});
