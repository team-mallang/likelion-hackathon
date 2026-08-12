import assert from "node:assert/strict";
import test from "node:test";

import {
  getDocumentScanErrorMessage,
  getScanStatusLabel,
} from "./documentScanDisplay";

test("S10 shows explicit text for capture and analysis states", () => {
  assert.equal(getScanStatusLabel("REQUESTING_PERMISSION"), "카메라 권한 확인 중");
  assert.equal(getScanStatusLabel("ANALYZING"), "신고서 분석 중");
  assert.equal(getScanStatusLabel("SUCCESS"), "경위서 초안 준비 완료");
});

test("S10 maps capture failures to safe user messages", () => {
  assert.equal(getDocumentScanErrorMessage("PERMISSION_DENIED"), "신고서를 촬영하려면 카메라 권한이 필요합니다.");
  assert.equal(getDocumentScanErrorMessage("CAPTURE_CANCELLED"), "신고서 촬영이 취소되었습니다. 다시 시도해 주세요.");
  assert.equal(getDocumentScanErrorMessage("ANALYSIS_NOT_CONFIGURED"), "문서 분석 기능을 준비하고 있습니다.");
});
