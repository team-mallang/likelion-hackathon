import {
  getRecordingPermissionsAsync,
  requestRecordingPermissionsAsync,
} from "expo-audio";

import type { DevicePermissionResult } from "@/services/device/audioRecorder";

function toPermissionResult(
  result: Awaited<ReturnType<typeof getRecordingPermissionsAsync>>,
): DevicePermissionResult {
  return {
    status:
      result.status === "granted"
        ? "granted"
        : result.status === "denied"
          ? "denied"
          : "undetermined",
    canAskAgain: result.canAskAgain,
  };
}

export const microphonePermission = {
  async getStatus(): Promise<DevicePermissionResult> {
    return toPermissionResult(await getRecordingPermissionsAsync());
  },

  async request(): Promise<DevicePermissionResult> {
    return toPermissionResult(await requestRecordingPermissionsAsync());
  },
};
