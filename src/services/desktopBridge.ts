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
  return window.evocraft ?? null;
}
