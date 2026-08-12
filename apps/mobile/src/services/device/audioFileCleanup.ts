export type DeletableAudioFile = {
  exists: boolean;
  delete: () => void;
};

export function deleteAudioFileIfPresent(
  uri: string,
  createFile: (uri: string) => DeletableAudioFile,
) {
  if (!uri.trim()) {
    return;
  }

  const file = createFile(uri);
  if (file.exists) {
    file.delete();
  }
}
