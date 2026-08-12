import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

export type DocumentCaptureErrorCode =
  | "PERMISSION_DENIED"
  | "CAMERA_NOT_SUPPORTED"
  | "CAPTURE_CANCELLED"
  | "CAPTURE_FAILED";

export class DocumentCaptureError extends Error {
  constructor(public readonly code: DocumentCaptureErrorCode, message: string) {
    super(message);
    this.name = "DocumentCaptureError";
  }
}

export type CapturedDocument = {
  /** Kept only while the caller starts an approved analysis request. */
  uri: string;
  mimeType?: string | null;
  fileSize?: number | null;
};

export type DocumentCaptureService = {
  isCameraSupported: boolean;
  capture(): Promise<CapturedDocument>;
};

function toCapturedDocument(result: ImagePicker.ImagePickerResult): CapturedDocument {
  if (result.canceled || !result.assets[0]) {
    throw new DocumentCaptureError("CAPTURE_CANCELLED", "신고서 촬영이 취소되었습니다.");
  }
  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType, fileSize: asset.fileSize };
}

export function createExpoDocumentCaptureService(): DocumentCaptureService {
  const isCameraSupported = Platform.OS !== "web";

  return {
    isCameraSupported,
    async capture() {
      try {
        if (Platform.OS === "web") {
          return toCapturedDocument(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 }));
        }

        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          throw new DocumentCaptureError("PERMISSION_DENIED", "신고서를 촬영하려면 카메라 권한이 필요합니다.");
        }
        return toCapturedDocument(await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 }));
      } catch (error) {
        if (error instanceof DocumentCaptureError) throw error;
        throw new DocumentCaptureError("CAPTURE_FAILED", "신고서를 촬영하지 못했습니다.");
      }
    },
  };
}
