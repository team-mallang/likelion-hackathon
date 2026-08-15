const { withAndroidManifest } = require("expo/config-plugins");

const META_DATA_NAME = "com.google.android.geo.API_KEY";

module.exports = function withGoogleMapsAndroidKey(config) {
  return withAndroidManifest(config, (nextConfig) => {
    const apiKey = nextConfig.android?.config?.googleMaps?.apiKey?.trim();

    if (!apiKey) {
      throw new Error(
        "EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY is required for Android builds.",
      );
    }

    const application = nextConfig.modResults.manifest.application?.[0];

    if (!application) {
      throw new Error("AndroidManifest application element was not found.");
    }

    const metadata = application["meta-data"] ?? [];
    const existing = metadata.find(
      (item) => item.$?.["android:name"] === META_DATA_NAME,
    );

    if (existing) {
      existing.$["android:value"] = apiKey;
    } else {
      metadata.push({
        $: {
          "android:name": META_DATA_NAME,
          "android:value": apiKey,
        },
      });
    }

    application["meta-data"] = metadata;
    return nextConfig;
  });
};
