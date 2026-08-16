import {
  NativeEventEmitter,
  NativeModules,
  type EmitterSubscription,
} from "react-native";

import type { AgoraRtmNativeClient } from "@/features/police-support/services/agoraRtmTranscriptTransport";

type AgoraRtmNativeModule = {
  addListener(eventName: string): void;
  removeListeners(count: number): void;
  initialize(appId: string, userId: string): Promise<void>;
  login(token: string): Promise<void>;
  subscribe(channelName: string): Promise<void>;
  unsubscribe(channelName: string): Promise<void>;
  renewToken(token: string): Promise<void>;
  logout(): Promise<void>;
  destroy(): Promise<void>;
};

type AgoraRtmMessage = { channelName?: unknown; message?: unknown };
type AgoraRtmError = { operation?: unknown; code?: unknown; message?: unknown };

const nativeModule = NativeModules.AgoraRtm as AgoraRtmNativeModule | undefined;

function requireNativeModule() {
  if (!nativeModule) {
    throw new Error(
      "Agora RTM Android native module is unavailable. Rebuild the Expo Development Build after prebuild.",
    );
  }
  return nativeModule;
}

export function createAgoraRtmNativeClient(): AgoraRtmNativeClient {
  let eventEmitter: NativeEventEmitter | null = null;
  let subscriptions: EmitterSubscription[] = [];

  return {
    async login({ appId, userId, token }) {
      const module = requireNativeModule();
      console.info("[LiveAssistance][RTM native] initialize begin", { userId });
      await module.initialize(appId, userId);
      console.info("[LiveAssistance][RTM native] initialize success", { userId });
      console.info("[LiveAssistance][RTM native] login begin", { userId });
      await module.login(token);
      console.info("[LiveAssistance][RTM native] login success", { userId });
    },
    subscribe(channelName) {
      console.info("[LiveAssistance][RTM native] subscribe", { channelName });
      return requireNativeModule().subscribe(channelName);
    },
    unsubscribe(channelName) {
      return requireNativeModule().unsubscribe(channelName);
    },
    renewToken(token) {
      return requireNativeModule().renewToken(token);
    },
    async logout() {
      const module = requireNativeModule();
      console.info("[LiveAssistance][RTM native] logout begin");
      try {
        await module.logout();
      } finally {
        subscriptions.forEach((subscription) => subscription.remove());
        subscriptions = [];
        eventEmitter = null;
        await module.destroy();
        console.info("[LiveAssistance][RTM native] logout/destroy complete");
      }
    },
    onMessage(listener) {
      const module = requireNativeModule();
      eventEmitter ??= new NativeEventEmitter(module);
      const subscription = eventEmitter.addListener("AgoraRtmMessage", (event: AgoraRtmMessage) => {
        if (typeof event?.channelName !== "string" || typeof event?.message !== "string") return;
        listener({ channelName: event.channelName, message: event.message });
      });
      subscriptions.push(subscription);
      return () => {
        subscription.remove();
        subscriptions = subscriptions.filter((item) => item !== subscription);
      };
    },
    onError(listener) {
      const module = requireNativeModule();
      eventEmitter ??= new NativeEventEmitter(module);
      const subscription = eventEmitter.addListener("AgoraRtmError", (event: AgoraRtmError) => {
        if (typeof event?.operation !== "string" || typeof event?.code !== "string" || typeof event?.message !== "string") return;
        listener({ operation: event.operation, code: event.code, message: event.message });
      });
      subscriptions.push(subscription);
      return () => {
        subscription.remove();
        subscriptions = subscriptions.filter((item) => item !== subscription);
      };
    },
  };
}
