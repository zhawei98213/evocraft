export interface EvoCraftDesktopApi {
  selectImage(): Promise<string | null>;
  readImageAsDataUrl(filePath: string): Promise<string>;
}

declare global {
  interface Window {
    evocraft?: EvoCraftDesktopApi;
  }
}

export function getDesktopBridge() {
  if (typeof window === "undefined") return null;

  return window.evocraft ?? null;
}
