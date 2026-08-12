import { View } from "react-native";
import { InsuranceProductsViewShared } from "./InsuranceProductsView.shared";
import type { InsuranceProductsViewProps } from "./InsuranceProductsView.types";
export function InsuranceProductsView(props: InsuranceProductsViewProps) { return <View style={{ flex: 1, width: "100%", maxWidth: 480, alignSelf: "center" }}><InsuranceProductsViewShared {...props} /></View>; }
