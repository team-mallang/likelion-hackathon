import { DirectionsViewShared } from "./DirectionsView.shared";
import type { DirectionsViewProps } from "./DirectionsView.types";

export function DirectionsView(props: DirectionsViewProps) {
  return <DirectionsViewShared {...props} />;
}
