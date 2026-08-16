import assert from "node:assert/strict";
import test from "node:test";

import { createApiPoliceReportService } from "./apiPoliceReport";

const responseBody = {
  success: true,
  data: {
    documentType: "POLICE_REPORT" as const,
    caseType: "LOST" as const,
    language: { primary: "ja" as const, support: "ko" as const },
    sections: [
      {
        key: "reporter" as const,
        titleKo: "신고인",
        titleJa: "申告人",
        fields: [
          {
            key: "reporter_name",
            labelKo: "성명",
            labelJa: "氏名",
            valueKo: "홍길동",
            valueJa: "ホン・ギルドン",
            source: "CASE" as const,
            editable: false,
          },
        ],
      },
      {
        key: "incident" as const,
        titleKo: "사건 정보",
        titleJa: "事件情報",
        fields: [
          {
            key: "last_seen_place",
            labelKo: "마지막 확인 장소",
            labelJa: "最後に確認した場所",
            valueKo: "시부야역",
            valueJa: "渋谷駅",
            source: "CASE" as const,
            editable: false,
          },
          {
            key: "discovered_at",
            labelKo: "발견 시간",
            labelJa: "発見時刻",
            valueKo: null,
            valueJa: null,
            source: "USER_REQUIRED" as const,
            editable: true,
          },
        ],
      },
      {
        key: "items" as const,
        titleKo: "분실 물품",
        titleJa: "紛失物",
        fields: [
          {
            key: "item_1_name",
            labelKo: "물품명",
            labelJa: "品目",
            valueKo: "iPhone 15 Pro",
            valueJa: "iPhone 15 Pro",
            source: "CASE" as const,
            editable: false,
          },
          {
            key: "item_1_color",
            labelKo: "색상",
            labelJa: "色",
            valueKo: "검정",
            valueJa: "黒",
            source: "CASE" as const,
            editable: false,
          },
        ],
      },
      {
        key: "statement" as const,
        titleKo: "사건 경위",
        titleJa: "被害状況",
        fields: [
          {
            key: "statement",
            labelKo: "사건 경위",
            labelJa: "被害状況",
            valueKo: "시부야역에서 휴대전화를 분실했습니다.",
            valueJa: "渋谷駅で携帯電話を紛失しました。",
            source: "AI_DRAFT" as const,
            editable: true,
          },
        ],
      },
    ],
  },
  meta: { provider: "openai" as const, model: "test-model", fallback: false as const },
};

test("S09 uses the case report-draft API response without example values", async () => {
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;
  let requestedUrl = "";
  let authorization = "";
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {},
  });
  globalThis.fetch = (async (url, init) => {
    requestedUrl = String(url);
    authorization = String((init?.headers as Record<string, string> | undefined)?.authorization ?? "");
    return new Response(JSON.stringify(responseBody), { status: 200 });
  }) as typeof fetch;

  try {
    const draft = await createApiPoliceReportService().getOrCreateDraft({
      caseId: "case-real-data",
      accessToken: "case-token",
    });

    assert.match(requestedUrl, /\/api\/cases\/case-real-data\/report-draft$/);
    assert.equal(authorization, "Bearer case-token");
    assert.equal(draft.incidentFields[0]?.value.ko, "시부야역");
    assert.deepEqual(draft.missingFieldIds, ["discovered_at"]);
    assert.equal(draft.items[0]?.title.ko, "iPhone 15 Pro");
    assert.equal(draft.caseType, "LOST");
    assert.equal(draft.items[0]?.details[0]?.text.ko, "색상: 검정");
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: originalDocument,
    });
  }
});

test("S09 preserves LOST, STOLEN, and UNKNOWN case types from the draft API", async () => {
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;
  Object.defineProperty(globalThis, "document", { configurable: true, value: {} });

  try {
    for (const caseType of ["LOST", "STOLEN", "UNKNOWN"] as const) {
      globalThis.fetch = (async () => new Response(JSON.stringify({
        ...responseBody,
        data: { ...responseBody.data, caseType },
      }), { status: 200 })) as typeof fetch;

      const draft = await createApiPoliceReportService().getOrCreateDraft({
        caseId: `case-${caseType.toLowerCase()}`,
      });
      assert.equal(draft.caseType, caseType);
    }
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
  }
});

test("S09 reopens the initially generated draft without requesting a new one", async () => {
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;
  let requestCount = 0;
  Object.defineProperty(globalThis, "document", { configurable: true, value: {} });
  globalThis.fetch = (async () => {
    requestCount += 1;
    return new Response(JSON.stringify(responseBody), { status: 200 });
  }) as typeof fetch;

  try {
    const caseId = "case-reopen-draft";
    const firstDraft = await createApiPoliceReportService().getOrCreateDraft({ caseId });
    const reopenedDraft = await createApiPoliceReportService().getOrCreateDraft({ caseId });

    assert.equal(requestCount, 1);
    assert.equal(reopenedDraft, firstDraft);
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
  }
});

test("S09 sends draft edits only through PATCH", async () => {
  const originalFetch = globalThis.fetch;
  const originalDocument = globalThis.document;
  let method = "";
  let requestBody = "";
  Object.defineProperty(globalThis, "document", { configurable: true, value: {} });
  globalThis.fetch = (async (_url, init) => {
    method = String(init?.method);
    requestBody = String(init?.body);
    return new Response(JSON.stringify(responseBody), { status: 200 });
  }) as typeof fetch;

  try {
    await createApiPoliceReportService().updateDraft({
      caseId: "case-edit",
      edits: [{ key: "last_seen_place", valueKo: "카페" }],
    });
    assert.equal(method, "PATCH");
    assert.deepEqual(JSON.parse(requestBody), {
      edits: [{ key: "last_seen_place", valueKo: "카페" }],
    });
  } finally {
    globalThis.fetch = originalFetch;
    Object.defineProperty(globalThis, "document", { configurable: true, value: originalDocument });
  }
});
