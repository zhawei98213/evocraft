import { afterEach, describe, expect, it, vi } from "vitest";

import { rotateImageDataUrl } from "./imageTransforms";

class FailingImage {
  private listeners = new Map<string, EventListenerOrEventListenerObject>();

  naturalWidth = 0;
  naturalHeight = 0;
  width = 0;
  height = 0;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    _options?: AddEventListenerOptions,
  ) {
    this.listeners.set(type, listener);
  }

  set src(_value: string) {
    const listener = this.listeners.get("error");
    if (typeof listener === "function") {
      listener(new Event("error"));
    } else if (listener) {
      listener.handleEvent(new Event("error"));
    }
  }
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("rotateImageDataUrl", () => {
  it("rejects when the uploaded image cannot be decoded", async () => {
    vi.stubGlobal("Image", FailingImage);
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      {} as CanvasRenderingContext2D,
    );

    await expect(rotateImageDataUrl("data:image/png;base64,broken", "right")).rejects.toThrow(
      "image_rotation_failed",
    );
  });
});
