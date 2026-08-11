import { Redirect, type Href } from "expo-router";

export function CaseAccessScreen() {
  return <Redirect href={"/case/password" as Href} />;
}
