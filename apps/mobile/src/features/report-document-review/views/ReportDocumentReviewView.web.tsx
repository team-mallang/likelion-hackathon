import { View } from "react-native";

import { ReportDocumentReviewViewShared } from "./ReportDocumentReviewView.shared";
import type { ReportDocumentReviewViewProps } from "./ReportDocumentReviewView.types";

export function ReportDocumentReviewView(props: ReportDocumentReviewViewProps) {
  return <View style={{ flex: 1, width: "100%", maxWidth: 480, alignSelf: "center" }}><ReportDocumentReviewViewShared {...props} /></View>;
}
