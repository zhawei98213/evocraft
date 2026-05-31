import type { EvoCraftDesktopApi } from "./desktopBridge";
import type { RecordStore } from "./storage";

export function createDesktopRecordStore(desktop: EvoCraftDesktopApi): RecordStore {
  return {
    load: () => desktop.loadRecords(),
    save: (records) => desktop.saveRecords(records),
    clear: () => desktop.clearRecords(),
  };
}
