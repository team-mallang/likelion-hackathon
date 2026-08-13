const fs = require("fs");
const path = require("path");
const {
  withAppBuildGradle,
  withMainApplication,
  withDangerousMod,
} = require("expo/config-plugins");

const RTM_VERSION = "2.2.6";
const PACKAGE_NAME = "com.likelion.travelguard.agorartm";
const PACKAGE_IMPORT = "com.likelion.travelguard.agorartm.AgoraRtmPackage";

const MODULE_SOURCE = `package ${PACKAGE_NAME};

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import io.agora.rtm.ErrorInfo;
import io.agora.rtm.LinkStateEvent;
import io.agora.rtm.LockEvent;
import io.agora.rtm.MessageEvent;
import io.agora.rtm.PresenceEvent;
import io.agora.rtm.ResultCallback;
import io.agora.rtm.RtmClient;
import io.agora.rtm.RtmConfig;
import io.agora.rtm.RtmEventListener;
import io.agora.rtm.StorageEvent;
import io.agora.rtm.SubscribeOptions;
import io.agora.rtm.TokenEvent;
import io.agora.rtm.TopicEvent;

public final class AgoraRtmModule extends ReactContextBaseJavaModule {
  private RtmClient client;
  private String subscribedChannel;

  public AgoraRtmModule(ReactApplicationContext context) { super(context); }
  @Override public String getName() { return "AgoraRtm"; }

  private void emit(String eventName, WritableMap payload) {
    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit(eventName, payload);
  }

  private void emitError(String operation, ErrorInfo error) {
    WritableMap payload = Arguments.createMap();
    payload.putString("operation", operation);
    payload.putString("code", error.getErrorCode().toString());
    payload.putString("message", error.getErrorReason());
    emit("AgoraRtmError", payload);
  }

  @ReactMethod
  public void initialize(String appId, String userId, Promise promise) {
    try {
      destroyInternal();
      RtmConfig config = new RtmConfig.Builder(appId, userId).eventListener(new RtmEventListener() {
        @Override public void onMessageEvent(MessageEvent event) {
          WritableMap payload = Arguments.createMap();
          payload.putString("channelName", event.getChannelName());
          payload.putString("message", String.valueOf(event.getMessage().getData()));
          emit("AgoraRtmMessage", payload);
        }
        @Override public void onLinkStateEvent(LinkStateEvent event) { emitConnection(event.toString()); }
        @Override public void onConnectionStateChanged(String channel, io.agora.rtm.RtmConstants.RtmConnectionState state, io.agora.rtm.RtmConstants.RtmConnectionChangeReason reason) {
          WritableMap payload = Arguments.createMap();
          payload.putString("channelName", channel);
          payload.putString("state", state.toString());
          payload.putString("reason", reason.toString());
          emit("AgoraRtmConnectionStateChanged", payload);
        }
        @Override public void onTokenPrivilegeWillExpire(String channel) {
          WritableMap payload = Arguments.createMap(); payload.putString("channelName", channel);
          emit("AgoraRtmTokenWillExpire", payload);
        }
        @Override public void onTokenEvent(TokenEvent event) { emitConnection(event.toString()); }
        @Override public void onPresenceEvent(PresenceEvent event) {}
        @Override public void onTopicEvent(TopicEvent event) {}
        @Override public void onLockEvent(LockEvent event) {}
        @Override public void onStorageEvent(StorageEvent event) {}
      }).build();
      client = RtmClient.create(config);
      promise.resolve(null);
    } catch (Exception exception) { promise.reject("RTM_INITIALIZE_FAILED", exception); }
  }

  private void emitConnection(String detail) {
    WritableMap payload = Arguments.createMap(); payload.putString("detail", detail);
    emit("AgoraRtmConnectionStateChanged", payload);
  }

  @ReactMethod public void login(String token, Promise promise) {
    if (client == null) { promise.reject("RTM_NOT_INITIALIZED", "Initialize RTM first."); return; }
    client.login(token, callback("login", promise));
  }

  @ReactMethod public void subscribe(String channelName, Promise promise) {
    if (client == null) { promise.reject("RTM_NOT_INITIALIZED", "Initialize RTM first."); return; }
    SubscribeOptions options = new SubscribeOptions(); options.setWithMessage(true);
    client.subscribe(channelName, options, new ResultCallback<Void>() {
      @Override public void onSuccess(Void ignored) { subscribedChannel = channelName; promise.resolve(null); }
      @Override public void onFailure(ErrorInfo error) { emitError("subscribe", error); promise.reject("RTM_SUBSCRIBE_FAILED", error.toString()); }
    });
  }

  @ReactMethod public void unsubscribe(String channelName, Promise promise) {
    if (client == null) { promise.resolve(null); return; }
    client.unsubscribe(channelName, new ResultCallback<Void>() {
      @Override public void onSuccess(Void ignored) { if (channelName.equals(subscribedChannel)) subscribedChannel = null; promise.resolve(null); }
      @Override public void onFailure(ErrorInfo error) { emitError("unsubscribe", error); promise.reject("RTM_UNSUBSCRIBE_FAILED", error.toString()); }
    });
  }

  @ReactMethod public void renewToken(String token, Promise promise) {
    if (client == null) { promise.reject("RTM_NOT_INITIALIZED", "Initialize RTM first."); return; }
    client.renewToken(token, callback("renewToken", promise));
  }

  @ReactMethod public void logout(Promise promise) {
    if (client == null) { promise.resolve(null); return; }
    client.logout(new ResultCallback<Void>() {
      @Override public void onSuccess(Void ignored) { subscribedChannel = null; promise.resolve(null); }
      @Override public void onFailure(ErrorInfo error) { emitError("logout", error); promise.reject("RTM_LOGOUT_FAILED", error.toString()); }
    });
  }

  private ResultCallback<Void> callback(String operation, Promise promise) {
    return new ResultCallback<Void>() {
      @Override public void onSuccess(Void ignored) { promise.resolve(null); }
      @Override public void onFailure(ErrorInfo error) { emitError(operation, error); promise.reject("RTM_" + operation.toUpperCase() + "_FAILED", error.toString()); }
    };
  }

  @ReactMethod public void destroy(Promise promise) { destroyInternal(); promise.resolve(null); }
  @ReactMethod public void addListener(String eventName) { /* NativeEventEmitter contract. */ }
  @ReactMethod public void removeListeners(double count) { /* NativeEventEmitter contract. */ }
  private void destroyInternal() { subscribedChannel = null; if (client != null) { RtmClient.release(); client = null; } }
  @Override public void invalidate() { destroyInternal(); super.invalidate(); }
}
`;

const PACKAGE_SOURCE = `package ${PACKAGE_NAME};

import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.Collections;
import java.util.List;

public final class AgoraRtmPackage implements ReactPackage {
  @Override public List<NativeModule> createNativeModules(ReactApplicationContext context) {
    return Collections.<NativeModule>singletonList(new AgoraRtmModule(context));
  }
  @Override public List<ViewManager> createViewManagers(ReactApplicationContext context) { return Collections.emptyList(); }
}
`;

function withAgoraRtmAndroid(config) {
  config = withAppBuildGradle(config, (nextConfig) => {
    const marker = "// @generated by withAgoraRtmAndroid";
    if (!nextConfig.modResults.contents.includes(marker)) {
      nextConfig.modResults.contents += `\n${marker}\ndependencies { implementation "io.agora:agora-rtm:${RTM_VERSION}" }\n`;
    }
    return nextConfig;
  });

  config = withMainApplication(config, (nextConfig) => {
    let source = nextConfig.modResults.contents;
    if (!source.includes(PACKAGE_IMPORT)) {
      source = source.replace(/(package [^\n]+\n)/, `$1\nimport ${PACKAGE_IMPORT}\n`);
      source = source.replace(/(PackageList\(this\)\.packages\.apply \{)/, `$1\n              add(AgoraRtmPackage())`);
      if (!source.includes("add(AgoraRtmPackage())")) throw new Error("Unable to register AgoraRtmPackage in MainApplication.");
      nextConfig.modResults.contents = source;
    }
    return nextConfig;
  });

  return withDangerousMod(config, ["android", async (nextConfig) => {
    const projectRoot = nextConfig.modRequest.platformProjectRoot;
    const javaDir = path.join(projectRoot, "app", "src", "main", "java", ...PACKAGE_NAME.split("."));
    fs.mkdirSync(javaDir, { recursive: true });
    fs.writeFileSync(path.join(javaDir, "AgoraRtmModule.java"), MODULE_SOURCE);
    fs.writeFileSync(path.join(javaDir, "AgoraRtmPackage.java"), PACKAGE_SOURCE);
    return nextConfig;
  }]);
}

module.exports = withAgoraRtmAndroid;
