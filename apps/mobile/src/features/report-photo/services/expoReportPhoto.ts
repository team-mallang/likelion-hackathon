import * as ImagePicker from "expo-image-picker";
import { Platform, Share } from "react-native";

import {
  ReportPhotoCaptureError,
  type ReportPhotoCaptureService,
} from "@/features/report-photo/services/reportPhotoCapture";
import {
  ReportPhotoExportError,
  type ReportPhotoExportService,
} from "@/features/report-photo/services/reportPhotoExport";
import type { CapturedReportPhoto } from "@/features/report-photo/types/reportPhoto";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function toPhoto(result: ImagePicker.ImagePickerResult): CapturedReportPhoto {
  if (result.canceled || !result.assets[0]) {
    throw new ReportPhotoCaptureError("CAPTURE_CANCELLED", "사진 선택이 취소되었습니다.");
  }
  const asset = result.assets[0];
  if (asset.mimeType && !asset.mimeType.startsWith("image/")) {
    throw new ReportPhotoCaptureError("INVALID_FILE_TYPE", "이미지 파일만 등록할 수 있습니다.");
  }
  if (asset.fileSize && asset.fileSize > MAX_FILE_SIZE) {
    throw new ReportPhotoCaptureError("FILE_TOO_LARGE", "사진 파일이 너무 큽니다. 20MB 이하로 선택해 주세요.");
  }
  return { uri: asset.uri, mimeType: asset.mimeType, fileSize: asset.fileSize };
}

async function pick(options: ImagePicker.ImagePickerOptions) {
  try {
    return toPhoto(await ImagePicker.launchImageLibraryAsync(options));
  } catch (error) {
    if (error instanceof ReportPhotoCaptureError) throw error;
    throw new ReportPhotoCaptureError("CAPTURE_FAILED", "사진을 불러오지 못했습니다.");
  }
}

export function createExpoReportPhotoCaptureService(): ReportPhotoCaptureService {
  return {
    isCameraSupported: Platform.OS !== "web",
    isFileSelectionSupported: true,
    async capture() {
      if (Platform.OS === "web") {
        throw new ReportPhotoCaptureError("CAMERA_NOT_SUPPORTED", "웹에서는 카메라 촬영 대신 파일을 선택해 주세요.");
      }
      try {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new ReportPhotoCaptureError("PERMISSION_DENIED", "사진 촬영 권한이 필요합니다.");
        }
        return toPhoto(await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 }));
      } catch (error) {
        if (error instanceof ReportPhotoCaptureError) throw error;
        throw new ReportPhotoCaptureError("CAPTURE_FAILED", "사진을 촬영하지 못했습니다.");
      }
    },
    selectFile() {
      return pick({ mediaTypes: ["images"], allowsEditing: false, quality: 1 });
    },
  };
}

export function createExpoReportPhotoExportService(): ReportPhotoExportService {
  return {
    async saveOrShare(photo) {
      if (Platform.OS === "web" && typeof navigator !== "undefined" && !navigator.share) {
        throw new ReportPhotoExportError("EXPORT_NOT_SUPPORTED", "이 브라우저에서는 저장·공유를 지원하지 않습니다.");
      }
      try {
        const result = await Share.share({ url: photo.uri, message: "신고서 사진" });
        if (result.action === Share.dismissedAction) {
          throw new ReportPhotoExportError("EXPORT_CANCELLED", "저장·공유가 취소되었습니다.");
        }
        return "COMPLETED";
      } catch (error) {
        if (error instanceof ReportPhotoExportError) throw error;
        throw new ReportPhotoExportError("EXPORT_FAILED", "사진을 저장하거나 공유하지 못했습니다.");
      }
    },
  };
}
