import { File } from "expo-file-system";

import { deleteAudioFileIfPresent } from "./audioFileCleanup";

/** Deletes a completed cache recording. Clearing a URI reference alone does not
 * remove its underlying audio bytes from the device. */
export async function deleteRecordedAudio(uri: string): Promise<void> {
  deleteAudioFileIfPresent(uri, (fileUri) => new File(fileUri));
}
