import type { AiAdapter } from "./aiAdapter";
import type { EvoCraftDesktopApi } from "./desktopBridge";

type EvoCraftDesktopAiApi = Required<
  Pick<EvoCraftDesktopApi, "detectRegions" | "recognizeQuestion">
> &
  EvoCraftDesktopApi;

export function createDesktopAiAdapter(desktop: EvoCraftDesktopAiApi): AiAdapter {
  return {
    detectRegions: (input) => desktop.detectRegions(input),
    recognizeQuestion: (input) => desktop.recognizeQuestion(input),
  };
}
