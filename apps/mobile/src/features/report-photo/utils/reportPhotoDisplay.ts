import type { ReportPhotoStatus } from "@/features/report-photo/types/reportPhoto";

export function getReportPhotoStatusLabel(status: ReportPhotoStatus) {
  switch (status) {
    case "READY": return "사진 등록 준비";
    case "REQUESTING_PERMISSION": return "카메라 권한 확인 중";
    case "CAPTURING": return "사진 촬영 중";
    case "SELECTING": return "사진 선택 중";
    case "PREVIEW": return "사진 확인 필요";
    case "EXPORTING": return "기기에 저장/공유 중";
    case "COMPLETED": return "사진 저장/공유 완료";
    case "FAILED": return "사진 등록을 다시 확인해 주세요";
  }
}

export function getReportPhotoErrorMessage(code: string) {
  switch (code) {
    case "PERMISSION_DENIED": return "사진을 촬영하려면 카메라 권한이 필요합니다.";
    case "CAMERA_NOT_SUPPORTED": return "이 기기에서는 갤러리 또는 파일 선택을 이용해 주세요.";
    case "INVALID_FILE_TYPE": return "지원하는 이미지 파일을 선택해 주세요.";
    case "FILE_TOO_LARGE": return "파일 크기가 너무 큽니다. 다른 사진을 선택해 주세요.";
    case "CAPTURE_CANCELLED": return "사진 촬영이 취소되었습니다.";
    case "EXPORT_NOT_SUPPORTED": return "기기의 사진·파일 저장 또는 공유 기능을 사용할 수 없습니다.";
    case "EXPORT_CANCELLED": return "저장/공유가 취소되었습니다.";
    default: return "사진을 등록하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
