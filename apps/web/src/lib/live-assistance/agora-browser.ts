import type { IAgoraRTCClient, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng";

export type AgoraBrowserSession = {
  leave(): Promise<void>;
};

export async function joinAgoraAudioChannel(credentials: {
  appId: string;
  channel: string;
  token: string;
  uid: number;
}, onConnectionState: (state: string) => void): Promise<AgoraBrowserSession> {
  const AgoraRTC = (await import("agora-rtc-sdk-ng")).default;
  const client: IAgoraRTCClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
  let microphone: IMicrophoneAudioTrack | null = null;
  client.on("connection-state-change", (current) => onConnectionState(current));

  try {
    await client.join(credentials.appId, credentials.channel, credentials.token, credentials.uid);
    microphone = await AgoraRTC.createMicrophoneAudioTrack();
    await client.publish([microphone]);
    return {
      async leave() {
        if (microphone) {
          microphone.close();
          microphone = null;
        }
        await client.leave();
      },
    };
  } catch (error) {
    microphone?.close();
    await client.leave().catch(() => undefined);
    throw error;
  }
}
