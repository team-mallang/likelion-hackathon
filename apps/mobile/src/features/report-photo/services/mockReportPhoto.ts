import type { CapturedReportPhoto } from "@/features/report-photo/types/reportPhoto";

import {
  ReportPhotoCaptureError,
  type ReportPhotoCaptureService,
} from "./reportPhotoCapture";
import {
  ReportPhotoExportError,
  type ReportPhotoExportService,
} from "./reportPhotoExport";

export type MockReportPhotoOptions = {
  failCapture?: boolean;
  failExport?: boolean;
};

const mockPhoto: CapturedReportPhoto = {
  uri: "mock://report-photo/session-only",
  mimeType: "image/jpeg",
  fileSize: 120_000,
};

export function createMockReportPhotoCaptureService(
  options: MockReportPhotoOptions = {},
): ReportPhotoCaptureService {
  return {
    isCameraSupported: true,
    isFileSelectionSupported: true,
    async capture() {
      if (options.failCapture) {
        throw new ReportPhotoCaptureError("CAPTURE_FAILED", "신고서 사진을 준비하지 못했습니다.");
      }
      return { ...mockPhoto };
    },
    async selectFile() {
      if (options.failCapture) {
        throw new ReportPhotoCaptureError("INVALID_FILE_TYPE", "지원하지 않는 사진 형식입니다.");
      }
      return { ...mockPhoto };
    },
  };
}

export function createMockReportPhotoExportService(
  options: MockReportPhotoOptions = {},
): ReportPhotoExportService {
  return {
    async saveOrShare() {
      if (options.failExport) {
        throw new ReportPhotoExportError("EXPORT_NOT_SUPPORTED", "기기 저장 기능을 사용할 수 없습니다.");
      }
      // No filesystem or server write occurs in the stage-1 mock.
      throw new ReportPhotoExportError("EXPORT_NOT_SUPPORTED", "OS 저장/공유 adapter 연결 전입니다.");
    },
  };
}
