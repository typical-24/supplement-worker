import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { generateHealthScores, mapScoreTagToCategory } from "../src/index.js";

const SOURCE_URL_PROPERTY = "\ud83c\udf10 Quelle";
const EVIDENCE_PROPERTY = "\ud83d\udcca Evidenz";

const SUPPORTED_SUPPLEMENTS = [
  {
    input: "Magnesium 400 mg",
    expectedName: "Magnesium",
    expectedLink: "https://examine.com/supplements/magnesium/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark",
    expectedSuggestedStack: "Vitamin D3 + Zinc"
  },
  {
    input: "Omega-3 1000 mg",
    expectedName: "Omega-3",
    expectedLink: "https://examine.com/supplements/fish-oil/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark"
  },
  {
    input: "Vitamin D3 2000 IU",
    expectedName: "Vitamin D3",
    expectedLink: "https://examine.com/supplements/vitamin-d/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark"
  },
  {
    input: "Zink 25 mg",
    expectedName: "Zink",
    expectedLink: "https://examine.com/supplements/zinc/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark"
  },
  {
    input: "Kreatin 5 g",
    expectedName: "Kreatin",
    expectedLink: "https://examine.com/supplements/creatine/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark"
  },
  {
    input: "Curcumin 500 mg",
    expectedName: "Curcumin",
    expectedLink: "https://examine.com/supplements/curcumin/",
    expectedEvidence: "\u2605\u2605\u2606 Mittel",
    expectedDisplayEvidence: "Mittel"
  },
  {
    input: "Ashwagandha 600 mg",
    expectedName: "Ashwagandha",
    expectedLink: "https://examine.com/supplements/ashwagandha/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark"
  },
  {
    input: "Rhodiola 300 mg",
    expectedName: "Rhodiola",
    expectedLink: "https://examine.com/supplements/rhodiola-rosea/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark"
  },
  {
    input: "NMN 250 mg",
    expectedName: "NMN",
    expectedLink: "https://examine.com/supplements/nicotinamide-mononucleotide/",
    expectedEvidence: "\u2605\u2606\u2606 Schwach",
    expectedDisplayEvidence: "Schwach"
  },
  {
    input: "NAC 600 mg",
    expectedName: "NAC",
    expectedLink: "https://examine.com/supplements/n-acetyl-cysteine/",
    expectedEvidence: "\u2605\u2605\u2606 Mittel",
    expectedDisplayEvidence: "Mittel"
  }
];

const ADDED_REGISTRY_SUPPLEMENTS = [
  {
    input: "Resveratrol 250 mg",
    expectedName: "Resveratrol",
    expectedLink: "https://examine.com/supplements/resveratrol/",
    expectedEvidence: "\u2605\u2605\u2606 Mittel",
    expectedDisplayEvidence: "Mittel"
  },
  {
    input: "Citrulline 6 g",
    expectedName: "Citrulline",
    expectedLink: "https://examine.com/supplements/citrulline/",
    expectedEvidence: "\u2605\u2605\u2606 Mittel",
    expectedDisplayEvidence: "Mittel",
    expectedSuggestedStack: "Creatine + Beta-Alanine"
  },
  {
    input: "Beta-Alanine 3 g",
    expectedName: "Beta-Alanine",
    expectedLink: "https://examine.com/supplements/beta-alanine/",
    expectedEvidence: "\u2605\u2605\u2605 Stark",
    expectedDisplayEvidence: "Stark",
    expectedSuggestedStack: "Creatine + Citrulline"
  },
  {
    input: "L-Theanine 200 mg",
    expectedName: "L-Theanine",
    expectedLink: "https://examine.com/supplements/l-theanine/",
    expectedEvidence: "\u2605\u2605\u2606 Mittel",
    expectedDisplayEvidence: "Mittel"
  },
  {
    input: "Vitamin C 1000 mg",
    expectedName: "Vitamin C",
    expectedLink: "https://examine.com/supplements/vitamin-c/",
    expectedEvidence: "\u2605\u2605\u2606 Mittel",
    expectedDisplayEvidence: "Mittel"
  }
];

function createEntryFlowFetchMock({ todayResults = [], maxPortionResults = [] } = {}) {
  return vi
    .fn()
    .mockResolvedValueOnce(new Response(JSON.stringify({ results: maxPortionResults }), { status: 200 }))
    .mockResolvedValueOnce(new Response("{}", { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          results: todayResults
        }),
        { status: 200 }
      )
    )
    .mockResolvedValueOnce(new Response("{}", { status: 200 }));
}

describe("supplement worker", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("health score helpers", () => {
    it("maps supported score tags to categories", () => {
      expect(mapScoreTagToCategory("sleep")).toBe("recovery");
      expect(mapScoreTagToCategory("muscle_recovery")).toBe("recovery");
      expect(mapScoreTagToCategory("stress_support")).toBe("stress");
      expect(mapScoreTagToCategory("hormone_support")).toBe("hormones");
      expect(mapScoreTagToCategory("strength")).toBe("performance");
      expect(mapScoreTagToCategory("power")).toBe("performance");
      expect(mapScoreTagToCategory("performance")).toBe("performance");
      expect(mapScoreTagToCategory("mitochondrial_support")).toBe("longevity");
      expect(mapScoreTagToCategory("energy")).toBe("longevity");
      expect(mapScoreTagToCategory("focus")).toBe("cognition");
      expect(mapScoreTagToCategory("pump")).toBe("performance");
      expect(mapScoreTagToCategory("libido_support")).toBe("libido");
      expect(mapScoreTagToCategory("circulation")).toBe("libido");
      expect(mapScoreTagToCategory("unknown_tag")).toBeNull();
    });

    it("generates cumulative health scores from supplement ids", () => {
      expect(generateHealthScores(["magnesium", "ashwagandha", "creatine"])).toEqual({
        recovery: 20,
        stress: 20,
        performance: 30,
        longevity: 0,
        hormones: 0,
        cognition: 0,
        libido: 0
      });
    });

    it("caps health score categories at 100", () => {
      const repeatedCreatine = new Array(5).fill("creatine");

      expect(generateHealthScores(repeatedCreatine)).toEqual({
        recovery: 0,
        stress: 0,
        performance: 100,
        longevity: 0,
        hormones: 0,
        cognition: 0,
        libido: 0
      });
    });
  });

  it("responds to GET requests", async () => {
    const response = await worker.fetch(new Request("http://example.com"), {});

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("Telegram Supplement Worker Running");
  });

  it.each(SUPPORTED_SUPPLEMENTS)("keeps the Telegram entry flow working for $expectedName", async (supplement) => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: supplement.expectedName }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: supplement.input
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");

    const notionPayload = JSON.parse(fetchMock.mock.calls[1][1].body);

    expect(notionPayload.properties[SOURCE_URL_PROPERTY].url).toBe(supplement.expectedLink);
    expect(notionPayload.properties[EVIDENCE_PROPERTY].select.name).toBe(supplement.expectedEvidence);
    expect(notionPayload.properties.Portion).toBeUndefined();

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).toContain(`Eingetragen\n${supplement.expectedName} \u2014`);
    expect(telegramPayload.text).toContain("\n\nPortion 1");
    expect(telegramPayload.text).toContain(`\n\n${supplement.expectedDisplayEvidence}`);
    expect(telegramPayload.text).toContain(supplement.expectedLink);

    if (supplement.expectedSuggestedStack) {
      expect(telegramPayload.text).toContain(`Suggested stack\n${supplement.expectedSuggestedStack}`);
    } else {
      expect(telegramPayload.text).not.toContain("Suggested stack");
    }
  });

  it.each(ADDED_REGISTRY_SUPPLEMENTS)("supports added registry supplement $expectedName", async (supplement) => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: supplement.expectedName }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: supplement.input
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const notionPayload = JSON.parse(fetchMock.mock.calls[1][1].body);
    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(notionPayload.properties[SOURCE_URL_PROPERTY].url).toBe(supplement.expectedLink);
    expect(notionPayload.properties[EVIDENCE_PROPERTY].select.name).toBe(supplement.expectedEvidence);
    expect(telegramPayload.text).toContain(`Eingetragen\n${supplement.expectedName} \u2014`);
    expect(telegramPayload.text).toContain(supplement.expectedLink);

    if (supplement.expectedSuggestedStack) {
      expect(telegramPayload.text).toContain(`Suggested stack\n${supplement.expectedSuggestedStack}`);
    } else {
      expect(telegramPayload.text).not.toContain("Suggested stack");
    }
  });

  it("keeps omega 3 dha mapped to the dha examine link", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Omega 3 DHA" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    const response = await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "Omega 3 DHA 500 mg"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");

    const notionPayload = JSON.parse(fetchMock.mock.calls[1][1].body);

    expect(notionPayload.properties[SOURCE_URL_PROPERTY].url).toBe("https://examine.com/supplements/dha/");
    expect(notionPayload.properties[EVIDENCE_PROPERTY].select.name).toBe("\u2605\u2605\u2605 Stark");
  });

  it("appends a recovery stack message when the full stack exists today", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Vitamin D3" }]
            }
          }
        },
        {
          properties: {
            Name: {
              title: [{ plain_text: "Zink" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "Magnesium 400 mg"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).toContain("Eingetragen\nMagnesium \u2014 400 mg");
    expect(telegramPayload.text).toContain("Suggested stack\nVitamin D3 + Zinc");
    expect(telegramPayload.text).toContain("Stack erkannt");
    expect(telegramPayload.text).toContain("Recovery Stack");
    expect(telegramPayload.text).toContain("Synergy Score +3");
    expect(telegramPayload.text).toContain("Supports:\nSleep support\nHormone balance\nMuscle recovery");
    expect(telegramPayload.text).toContain("Health Scores");
    expect(telegramPayload.text).toContain("Recovery: 20");
    expect(telegramPayload.text).toContain("Stress: 10");
    expect(telegramPayload.text).toContain("Hormones: 10");
  });

  it("does not append a stack message for an incomplete stack", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Vitamin D3" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "Magnesium 400 mg"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).not.toContain("Stack erkannt");
    expect(telegramPayload.text).not.toContain("Synergy Score");
    expect(telegramPayload.text).toContain("Health Scores");
  });

  it("detects the performance stack with registry supplements", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Citrulline" }]
            }
          }
        },
        {
          properties: {
            Name: {
              title: [{ plain_text: "Beta-Alanine" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "Creatine 5 g"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).toContain("Stack erkannt");
    expect(telegramPayload.text).toContain("Performance Stack");
    expect(telegramPayload.text).toContain("Synergy Score +3");
    expect(telegramPayload.text).toContain("Health Scores");
    expect(telegramPayload.text).toContain("Performance: 50");
  });

  it("detects the longevity stack with added registry supplements", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Resveratrol" }]
            }
          }
        },
        {
          properties: {
            Name: {
              title: [{ plain_text: "Curcumin" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "NMN 250 mg"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).toContain("Stack erkannt");
    expect(telegramPayload.text).toContain("Longevity Stack");
    expect(telegramPayload.text).toContain("Synergy Score +2");
    expect(telegramPayload.text).toContain("Health Scores");
    expect(telegramPayload.text).toContain("Longevity: 20");
  });

  it("appends health scores below the existing confirmation output", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Ashwagandha" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "Magnesium 400 mg"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).toContain("Health Scores\nRecovery: 20\nStress: 20\nPerformance: 0\nLongevity: 0\nHormones: 0\nCognition: 0\nLibido: 0");
    expect(telegramPayload.text.indexOf("Health Scores")).toBeGreaterThan(telegramPayload.text.indexOf("https://examine.com/supplements/magnesium/"));
  });

  it("does not append a health score block when all scores are zero", async () => {
    const fetchMock = createEntryFlowFetchMock({
      todayResults: [
        {
          properties: {
            Name: {
              title: [{ plain_text: "Curcumin" }]
            }
          }
        }
      ]
    });

    vi.stubGlobal("fetch", fetchMock);

    await worker.fetch(
      new Request("http://example.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: {
            chat: { id: 123 },
            text: "Curcumin 500 mg"
          }
        })
      }),
      {
        NOTION_TOKEN: "test-notion-token",
        NOTION_CLAUDE_DB_ID: "test-db-id",
        TELEGRAM_BOT_TOKEN: "test-telegram-token"
      }
    );

    const telegramPayload = JSON.parse(fetchMock.mock.calls[3][1].body);

    expect(telegramPayload.text).not.toContain("Health Scores");
  });
});
