const EXAMINE_SLUGS = {
  "magnesium": "magnesium",
  "vitamin d3": "vitamin-d",
  "vitamin d3+k2": "vitamin-d",
  "curcumin": "curcumin",
  "kreatin": "creatine",
  "omega-3": "fish-oil",
  "omega-3 dha": "dha",
  "zink": "zinc",
  "eisen": "iron",
  "selen": "selenium",
  "jod": "iodine",
  "ashwagandha": "ashwagandha",
  "rhodiola": "rhodiola-rosea",
  "rosenwurz": "rhodiola-rosea",
  "nac": "n-acetyl-cysteine",
  "coq10": "coenzyme-q10",
  "egcg": "epigallocatechin-gallate",
  "quercetin": "quercetin",
  "nmn": "nicotinamide-mononucleotide"
};

const EVIDENZ_MAP = {
  "magnesium": "★★★ Stark",
  "kreatin": "★★★ Stark",
  "omega-3": "★★★ Stark",
  "omega-3 dha": "★★★ Stark",
  "vitamin d3": "★★★ Stark",
  "vitamin d3+k2": "★★★ Stark",
  "zink": "★★★ Stark",
  "eisen": "★★★ Stark",
  "selen": "★★★ Stark",
  "jod": "★★★ Stark",
  "ashwagandha": "★★★ Stark",
  "rhodiola": "★★★ Stark",
  "rosenwurz": "★★★ Stark",
  "curcumin": "★★☆ Mittel",
  "egcg": "★★☆ Mittel",
  "quercetin": "★★☆ Mittel",
  "coq10": "★★☆ Mittel",
  "nac": "★★☆ Mittel",
  "nmn": "★☆☆ Schwach"
};

export default {
  async fetch(request, env) {
    if (request.method === "GET") {
      return new Response("Telegram Supplement Worker Running");
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let update;

    try {
      update = await request.json();
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    const message = update?.message;

    if (!message?.text || !message?.chat?.id) {
      return new Response("OK");
    }

    const chatId = message.chat.id;
    const text = message.text.trim();
    const parsed = parseSupplementInput(text);

    if (!parsed) {
      await sendTelegramMessage(
        env,
        chatId,
`Format nicht erkannt.

Beispiel:
Magnesium 400 mg`
      );
      return new Response("OK");
    }

    try {
      const portion = await createNotionEntry(env, parsed);
      const quelle = getExamineLink(parsed.name);
      const evidenz = getEvidenz(parsed.name);
      const todaySupplements = await getTodaySupplements(env);
      const konflikt = getConflictText(parsed.name, todaySupplements);

      let confirmMsg =
`Eingetragen
${parsed.name} — ${parsed.amount} ${parsed.unit}`;

      if (portion > 1) confirmMsg += `\nPortion ${portion}`;
      if (evidenz) confirmMsg += `\n${evidenz}`;
      if (quelle) confirmMsg += `\n${quelle}`;
      if (konflikt) {
        confirmMsg += "\n\n⚠️ Konflikt:\n" + konflikt;
      }

      await sendTelegramMessage(env, chatId, confirmMsg);
    } catch (err) {
      console.error("NOTION ERROR:", err.message);

      await sendTelegramMessage(
        env,
        chatId,
`Notion Fehler
${err.message}`
      );
    }

    return new Response("OK");
  }
};

function parseSupplementInput(text) {
  const regex = /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*([a-zA-Zµ]+)$/i;
  const match = text.match(regex);

  if (!match) return null;

  return {
    name: match[1].trim(),
    amount: parseFloat(match[2].replace(",", ".")),
    unit: match[3].trim()
  };
}

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\u00fc/g, "ue")
    .replace(/\u00e4/g, "ae")
    .replace(/\u00f6/g, "oe")
    .replace(/\u00df/g, "ss");
}

function getExamineLink(name) {
  const input = normalizeKey(name);
  const keys = Object.keys(EXAMINE_SLUGS);

  for (let i = 0; i < keys.length; i++) {
    const key = normalizeKey(keys[i]);
    if (input.indexOf(key) !== -1 || key.indexOf(input) !== -1) {
      return "https://examine.com/supplements/" + EXAMINE_SLUGS[keys[i]] + "/";
    }
  }

  return null;
}

function getEvidenz(name) {
  const input = normalizeKey(name);
  const keys = Object.keys(EVIDENZ_MAP);

  for (let i = 0; i < keys.length; i++) {
    const key = normalizeKey(keys[i]);
    if (input.indexOf(key) !== -1 || key.indexOf(input) !== -1) {
      return EVIDENZ_MAP[keys[i]];
    }
  }

  return null;
}

function getConflictText(newName, todayList) {
  const name = String(newName || "").toLowerCase().trim();
  const hasIron = todayList.some((n) => n.includes("iron"));
  const hasCurcumin = todayList.some((n) => n.includes("curcumin"));

  if (name.includes("iron") && hasCurcumin) {
    return "Curcumin kann Eisenaufnahme blockieren (Chelatbildung). Abstand empfohlen.";
  }

  if (name.includes("curcumin") && hasIron) {
    return "Curcumin kann Eisenaufnahme blockieren (Chelatbildung). Abstand empfohlen.";
  }

  return null;
}

async function createNotionEntry(env, parsed) {
  const quelle = getExamineLink(parsed.name);
  const evidenz = getEvidenz(parsed.name);
  const maxPortion = await getTodayMaxPortion(env, parsed.name);
  const portion = maxPortion + 1;
  const todaySupplements = await getTodaySupplements(env);
  console.log("NEW NAME:", parsed.name);
  console.log("TODAY SUPPLEMENTS:", todaySupplements);
  const konflikt = getConflictText(parsed.name, todaySupplements);
  console.log("KONFLIKT:", konflikt);

  const properties = {
    Name: {
      title: [{ text: { content: parsed.name } }]
    },
    Menge: {
      number: parsed.amount
    },
    Unit: {
      select: {
        name: parsed.unit
      }
    },
    Portion: {
      select: { name: String(portion) }
    },
    Source: {
      select: {
        name: "Telegram"
      }
    },
    Done: {
      checkbox: false
    }
  };

  if (konflikt) {
    properties["⚠️ Konflikt"] = {
      rich_text: [{ text: { content: konflikt } }]
    };
  }

  if (quelle) {
    properties["🌐 Quelle"] = { url: quelle };
  }

  if (evidenz) {
    properties["📊 Evidenz"] = {
      select: { name: evidenz }
    };
  }

  const payload = {
    parent: {
      type: "data_source_id",
      data_source_id: env.NOTION_CLAUDE_DB_ID
    },
    properties: properties
  };

  console.log("NOTION PAYLOAD:", JSON.stringify(payload));

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.NOTION_TOKEN}`,
      "Content-Type": "application/json",
      "Notion-Version": "2025-09-03"
    },
    body: JSON.stringify(payload)
  });

  const body = await res.text();

  console.log("NOTION STATUS:", res.status);
  console.log("NOTION BODY:", body);

  if (!res.ok) {
    throw new Error(`Notion ${res.status}: ${body}`);
  }

  return portion;
}

async function getTodayMaxPortion(env, supplementName) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const query = {
    filter: {
      and: [
        {
          property: "Name",
          title: {
            equals: supplementName
          }
        },
        {
          timestamp: "created_time",
          created_time: {
            on_or_after: startOfDay.toISOString()
          }
        },
        {
          timestamp: "created_time",
          created_time: {
            before: endOfDay.toISOString()
          }
        }
      ]
    },
    page_size: 100
  };

  const res = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_CLAUDE_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03"
      },
      body: JSON.stringify(query)
    }
  );

  const body = await res.text();

  console.log("NOTION QUERY STATUS:", res.status);
  console.log("NOTION QUERY BODY:", body);

  if (!res.ok) {
    throw new Error(`Notion query ${res.status}: ${body}`);
  }

  const data = JSON.parse(body);
  const results = Array.isArray(data.results) ? data.results : [];

  return results.reduce((currentMax, page) => {
    const portionName = page?.properties?.Portion?.select?.name;
    const existingPortion = parseInt(portionName, 10);
    return !isNaN(existingPortion) && existingPortion > currentMax ? existingPortion : currentMax;
  }, 0);
}

async function getTodaySupplements(env) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  const query = {
    filter: {
      and: [
        {
          timestamp: "created_time",
          created_time: {
            on_or_after: startOfDay.toISOString()
          }
        },
        {
          timestamp: "created_time",
          created_time: {
            before: endOfDay.toISOString()
          }
        }
      ]
    },
    page_size: 100
  };

  const res = await fetch(
    `https://api.notion.com/v1/data_sources/${env.NOTION_CLAUDE_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Content-Type": "application/json",
        "Notion-Version": "2025-09-03"
      },
      body: JSON.stringify(query)
    }
  );

  const body = await res.text();

  console.log("TODAY QUERY STATUS:", res.status);
  console.log("TODAY QUERY BODY:", body);

  if (!res.ok) {
    throw new Error(`Notion query ${res.status}: ${body}`);
  }

  const data = JSON.parse(body);
  const results = Array.isArray(data.results) ? data.results : [];
  const todaySupplements = results
    .map((page) => {
      const raw = page.properties?.Name?.title?.[0]?.text?.content || "";
      const clean = raw.toLowerCase().trim();
      return clean || null;
    })
    .filter(Boolean);

  return todaySupplements;
}

async function sendTelegramMessage(env, chatId, text) {
  await fetch(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text
      })
    }
  );
}
