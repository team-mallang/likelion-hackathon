const app = require("./app.json");

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
  plugins: [...app.expo.plugins, "react-native-maps"],
});
