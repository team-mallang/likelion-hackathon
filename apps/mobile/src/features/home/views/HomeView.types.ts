export type HomeQuickStartType = "passport" | "card" | "phone";

export type HomeViewProps = {
  onStartCase: () => void;
  onQuickStart: (type: HomeQuickStartType) => void;
  onPreviousCase: () => void;
  onDocuments: () => void;
  onGuide: () => void;
  onMap: () => void;
};
