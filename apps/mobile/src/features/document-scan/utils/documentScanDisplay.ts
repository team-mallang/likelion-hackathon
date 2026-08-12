import type { ScanStatus } from "@/features/document-scan/types/documentScan";

export function getScanStatusLabel(status: ScanStatus) {
  switch (status) {
    case "READY": return "신고서 스캔 준비";
    case "REQUESTING_PERMISSION": return "카메라 권한 확인 중";
    case "CAPTURING": return "신고서 촬영 중";
    case "ANALYZING": return "신고서 분석 중";
    case "SUCCESS": return "경위서 초안 준비 완료";
    case "FAILED": return "스캔을 다시 확인해 주세요";
  }
}

export function getDocumentScanErrorMessage(code: string) {
  switch (code) {
    case "PERMISSION_DENIED": return "신고서를 촬영하려면 카메라 권한이 필요합니다.";
    case "CAMERA_NOT_SUPPORTED": return "이 기기에서는 파일을 선택해 신고서를 올려 주세요.";
    case "CAPTURE_CANCELLED": return "신고서 촬영이 취소되었습니다. 다시 시도해 주세요.";
    case "CAPTURE_FAILED": return "신고서를 촬영하지 못했습니다. 잠시 후 다시 시도해 주세요.";
    case "DOCUMENT_NOT_DETECTED": return "신고서가 잘 보이도록 다시 촬영해 주세요.";
    case "IMAGE_QUALITY_TOO_LOW": return "글자가 선명하게 보이도록 다시 촬영해 주세요.";
    case "ANALYSIS_NOT_CONFIGURED": return "문서 분석 기능을 준비하고 있습니다.";
    default: return "신고서를 분석하지 못했습니다. 잠시 후 다시 시도해 주세요.";
  }
}
