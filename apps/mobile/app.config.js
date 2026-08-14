const path = require("node:path");

const app = require("./app.json");

// Workspace commands run from apps/mobile, while the documented shared env file
// lives at the repository root. Expo already loads app-local env first, so this
// only fills variables that were not provided there or by EAS.
if (typeof process.loadEnvFile === "function") {
  try {
    process.loadEnvFile(path.resolve(__dirname, "../../.env"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
}

// app.json cannot read local environment variables. Keep all existing static
// Expo configuration there and inject only restricted, client-side Maps SDK keys.
module.exports = () => ({
  ...app.expo,
  android: {
    ...app.expo.android,
    config: { ...(app.expo.android?.config ?? {}), googleMaps: { apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY ?? "" } },
  },
  ios: {
    ...app.expo.ios,
    config: { ...(app.expo.ios?.config ?? {}), googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY ?? "" },
  },
  plugins: app.expo.plugins,
});
