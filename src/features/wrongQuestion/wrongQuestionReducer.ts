import type {
  RegionCandidate,
  Subject,
  WrongQuestionDraft,
  WrongQuestionRecord,
} from "../../domain/wrongQuestion";
import { deleteRegionCandidate } from "../../domain/wrongQuestion";

export type Screen = "hub" | "upload" | "select-region" | "review" | "records" | "detail";

export interface WrongQuestionState {
  screen: Screen;
  selectedSubject: "auto" | Subject;
  privacyAcknowledged: boolean;
  uploadedImageUri: string;
  uploadedFileName: string;
  uploadedFileMeta: string;
  uploadError: string;
  regionCandidates: RegionCandidate[];
  selectedRegionId: string | null;
  regionZoom: number;
  regionError: string;
  draft: WrongQuestionDraft | null;
  records: WrongQuestionRecord[];
  selectedRecordId: string | null;
  saveError: string;
  storageStatus: string;
  detailImageMode: "clean" | "region" | "original";
}

export type WrongQuestionAction =
  | { type: "GO_TO_SCREEN"; screen: Screen }
  | { type: "IMAGE_SELECTED"; imageUri: string; fileName: string; fileMeta: string }
  | { type: "PRIVACY_ACKNOWLEDGED"; acknowledged: boolean }
  | { type: "START_REGION_SELECTION" }
  | { type: "REGION_CANDIDATES_READY"; candidates: RegionCandidate[] }
  | { type: "REGION_SELECTION_FAILED"; message: string }
  | { type: "REGION_SELECTED"; regionId: string }
  | { type: "REGION_DELETED"; regionId: string }
  | { type: "MANUAL_REGION_ADDED"; region: RegionCandidate }
  | { type: "REGION_UPDATED"; region: RegionCandidate }
  | { type: "REGION_ZOOM_CHANGED"; zoom: number }
  | { type: "DRAFT_READY"; draft: WrongQuestionDraft }
  | { type: "RECORD_SAVED"; record: WrongQuestionRecord }
  | { type: "SAVE_FAILED"; message: string };

export function createInitialWrongQuestionState(records: WrongQuestionRecord[]): WrongQuestionState {
  return {
    screen: "hub",
    selectedSubject: "auto",
    privacyAcknowledged: false,
    uploadedImageUri: "",
    uploadedFileName: "",
    uploadedFileMeta: "",
    uploadError: "",
    regionCandidates: [],
    selectedRegionId: null,
    regionZoom: 1,
    regionError: "",
    draft: null,
    records,
    selectedRecordId: records[0]?.id ?? null,
    saveError: "",
    storageStatus: "",
    detailImageMode: "clean",
  };
}

export function wrongQuestionReducer(
  state: WrongQuestionState,
  action: WrongQuestionAction,
): WrongQuestionState {
  switch (action.type) {
    case "GO_TO_SCREEN":
      return {
        ...state,
        screen: action.screen,
      };

    case "IMAGE_SELECTED":
      return {
        ...state,
        uploadedImageUri: action.imageUri,
        uploadedFileName: action.fileName,
        uploadedFileMeta: action.fileMeta,
        uploadError: "",
        regionError: "",
        regionCandidates: [],
        selectedRegionId: null,
        draft: null,
      };

    case "PRIVACY_ACKNOWLEDGED":
      return {
        ...state,
        privacyAcknowledged: action.acknowledged,
        uploadError: action.acknowledged ? "" : state.uploadError,
      };

    case "START_REGION_SELECTION":
      if (!state.uploadedImageUri) {
        return {
          ...state,
          uploadError: "请先选择一张错题照片。",
        };
      }

      if (!state.privacyAcknowledged) {
        return {
          ...state,
          uploadError: "请先确认本地隐私说明。",
        };
      }

      return {
        ...state,
        uploadError: "",
        regionError: "",
      };

    case "REGION_CANDIDATES_READY": {
      const selectedRegionId = action.candidates[1]?.id ?? action.candidates[0]?.id ?? null;
      return {
        ...state,
        screen: "select-region",
        regionCandidates: action.candidates,
        selectedRegionId,
        regionError: "",
      };
    }

    case "REGION_SELECTION_FAILED":
      return {
        ...state,
        regionError: action.message,
      };

    case "REGION_SELECTED":
      return {
        ...state,
        selectedRegionId: action.regionId,
        regionError: "",
      };

    case "REGION_DELETED": {
      const result = deleteRegionCandidate(
        state.regionCandidates,
        action.regionId,
        state.selectedRegionId,
      );
      return {
        ...state,
        regionCandidates: result.regionCandidates,
        selectedRegionId: result.selectedRegionId,
        regionError: result.selectedRegionId
          ? ""
          : "候选框已清空，请手动画框或重新自动找题。",
      };
    }

    case "MANUAL_REGION_ADDED":
      return {
        ...state,
        regionCandidates: [
          action.region,
          ...state.regionCandidates.filter((region) => region.source !== "manual"),
        ],
        selectedRegionId: action.region.id,
        regionError: "",
      };

    case "REGION_UPDATED":
      return {
        ...state,
        regionCandidates: state.regionCandidates.map((region) =>
          region.id === action.region.id ? action.region : region,
        ),
      };

    case "REGION_ZOOM_CHANGED":
      return {
        ...state,
        regionZoom: action.zoom,
      };

    case "DRAFT_READY":
      return {
        ...state,
        screen: "review",
        draft: action.draft,
        saveError: "",
      };

    case "RECORD_SAVED":
      return {
        ...state,
        screen: "detail",
        records: [action.record, ...state.records.filter((record) => record.id !== action.record.id)],
        selectedRecordId: action.record.id,
        saveError: "",
        storageStatus: "saved",
        detailImageMode: "clean",
      };

    case "SAVE_FAILED":
      return {
        ...state,
        saveError: action.message,
      };

    default:
      return state;
  }
}
