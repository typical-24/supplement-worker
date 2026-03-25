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

const HELP_MESSAGE = `Willkommen bei SuppPowerBot

Sende Supplements im Format:
Magnesium 400 mg
Iron 20 mg
Curcumin 500 mg`;

const DEFAULT_REGISTRY_DATABASE_ID = "ea5b8880046e4684b469a07cec46cb63";

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

    if (text === "/start") {
      await sendTelegramMessage(
        env,
        chatId,
        HELP_MESSAGE
      );
      return new Response("OK");
    }

    if (text === "/help") {
      await sendTelegramMessage(
        env,
        chatId,
        HELP_MESSAGE
      );
      return new Response("OK");
    }

    console.log("INPUT TEXT:", text);

    const freeParsed = parseSupplementInput(text);
    let registryEntry = null;
    let registryParsed = null;
    let parsed = freeParsed;

    console.log("PARSED FREE INPUT:", freeParsed);

    if (!parsed) {
      console.log("REGISTRY LOOKUP INPUT:", text);

      try {
        registryEntry = await findRegistryEntry(env, text);
      } catch (err) {
        console.error("REGISTRY LOOKUP ERROR:", err.message);
      }

      registryParsed = buildParsedFromRegistry(text, registryEntry);
      parsed = registryParsed;
    }

    console.log("REGISTRY MATCH:", registryEntry);
    console.log("REGISTRY PARSED:", registryParsed);

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
      const result = {
        portion: await createNotionEntry(env, parsed)
      };
      const displayPortion = parsed?.requestedPortion ?? result.portion;
      const isRegistryPortion = parsed?.requestedPortion != null;
      console.log("RESULT PORTION:", result?.portion);
      console.log("REQUESTED PORTION:", parsed?.requestedPortion);
      console.log("DISPLAY PORTION:", displayPortion);
      const quelle = getExamineLink(parsed.name);
      const evidenz = getEvidenz(parsed.name);
      const todaySupplements = await getTodaySupplements(env);
      const konflikt = getConflictText(parsed.name, todaySupplements);

      let confirmMsg =
`Eingetragen
${parsed.name} — ${parsed.amount} ${parsed.unit}`;

      if (isRegistryPortion) {
        confirmMsg += `\nPortion ${displayPortion}`;
      } else if (displayPortion > 1) {
        confirmMsg += `\nPortion ${displayPortion}`;
      }
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

function formatNotionId(id) {
  if (!id) return id;

  const clean = id.replace(/-/g, "");

  if (clean.length !== 32) return id;

  return [
    clean.slice(0, 8),
    clean.slice(8, 12),
    clean.slice(12, 16),
    clean.slice(16, 20),
    clean.slice(20)
  ].join("-");
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

function extractTextValue(property) {
  if (!property) return "";
  if (Array.isArray(property.title)) {
    return property.title.map((item) => item?.plain_text || item?.text?.content || "").join("").trim();
  }
  if (Array.isArray(property.rich_text)) {
    return property.rich_text.map((item) => item?.plain_text || item?.text?.content || "").join("").trim();
  }
  if (property.select?.name) {
    return String(property.select.name).trim();
  }
  if (Array.isArray(property.multi_select)) {
    return property.multi_select.map((item) => item?.name || "").filter(Boolean).join(", ").trim();
  }
  if (typeof property.number === "number") {
    return String(property.number);
  }
  if (typeof property.checkbox === "boolean") {
    return property.checkbox ? "true" : "false";
  }
  if (property.formula) {
    if (typeof property.formula.string === "string") return property.formula.string.trim();
    if (typeof property.formula.number === "number") return String(property.formula.number);
    if (typeof property.formula.boolean === "boolean") return property.formula.boolean ? "true" : "false";
  }
  return "";
}

function extractNumberValue(property) {
  if (!property) return null;
  if (typeof property.number === "number") {
    return property.number;
  }
  if (property.formula && typeof property.formula.number === "number") {
    return property.formula.number;
  }

  const text = extractTextValue(property).replace(",", ".");
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? parseFloat(match[0]) : null;
}

function extractCheckboxValue(property) {
  if (!property) return false;
  if (typeof property.checkbox === "boolean") {
    return property.checkbox;
  }
  if (property.formula && typeof property.formula.boolean === "boolean") {
    return property.formula.boolean;
  }
  return false;
}

function extractAliases(property) {
  if (!property) return [];
  if (Array.isArray(property.multi_select)) {
    return property.multi_select.map((item) => String(item?.name || "").trim()).filter(Boolean);
  }

  const text = extractTextValue(property);
  if (!text) return [];

  return text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getPropertyByNameOrType(properties, propertyName, propertyType) {
  if (properties?.[propertyName]) {
    return properties[propertyName];
  }

  const values = Object.values(properties || {});

  for (let i = 0; i < values.length; i++) {
    if (values[i]?.type === propertyType) {
      return values[i];
    }
  }

  return null;
}

function buildRegistryEntryFromPage(page) {
  const properties = page?.properties || {};
  const nameProperty = getPropertyByNameOrType(properties, "Name", "title");
  const aliasesProperty = getPropertyByNameOrType(properties, "Aliases", "rich_text");
  const activeProperty = getPropertyByNameOrType(properties, "Aktiv", "checkbox");
  const formProperty = getPropertyByNameOrType(properties, "Form", "multi_select");
  const hauptwirkstoffProperty = getPropertyByNameOrType(properties, "Hauptwirkstoff", "rich_text");
  const hinweiseProperty = getPropertyByNameOrType(properties, "Hinweise", "rich_text");
  const konflikteProperty = getPropertyByNameOrType(properties, "Konflikte", "rich_text");
  const inhaltsstoffeProperty = getPropertyByNameOrType(properties, "Inhaltsstoffe", "rich_text");
  const standardPortionProperty = getPropertyByNameOrType(properties, "Standard Portion", "number");
  const mgProPortionProperty = getPropertyByNameOrType(properties, "mg pro Portion", "number");
  const mgProKapselProperty = getPropertyByNameOrType(properties, "mg pro Kapsel", "number");
  const kapselnProPortionProperty = getPropertyByNameOrType(properties, "Kapseln pro Portion", "number");

  return {
    name: extractTextValue(nameProperty),
    typ: extractTextValue(properties.Typ),
    hauptwirkstoff: extractTextValue(hauptwirkstoffProperty),
    portionEinheit: extractTextValue(properties["Portion Einheit"]),
    standardPortion: extractNumberValue(standardPortionProperty),
    mgProPortion: extractNumberValue(mgProPortionProperty),
    mgProKapsel: extractNumberValue(mgProKapselProperty),
    kapselnProPortion: extractNumberValue(kapselnProPortionProperty),
    form: Array.isArray(formProperty?.multi_select)
      ? formProperty.multi_select.map((item) => item?.name || "").filter(Boolean).join(", ").trim()
      : extractTextValue(formProperty),
    hinweise: extractTextValue(hinweiseProperty),
    konflikte: extractTextValue(konflikteProperty),
    inhaltsstoffe: extractTextValue(inhaltsstoffeProperty),
    aliases: extractAliases(aliasesProperty),
    active: extractCheckboxValue(activeProperty)
  };
}

function scoreRegistryMatch(entry, inputText) {
  const input = normalizeKey(String(inputText || "").replace(/\bportion\s+\d+(?:[.,]\d+)?\b/gi, ""));
  const entryName = normalizeKey(entry.name);
  const aliases = entry.aliases.map((alias) => normalizeKey(alias)).filter(Boolean);
  const normalizedInput = input.trim();

  if (entryName && normalizedInput === entryName) {
    return 400 + (entry.active ? 100 : 0);
  }

  if (aliases.includes(normalizedInput)) {
    return 300 + (entry.active ? 100 : 0);
  }

  if (entryName && normalizedInput.includes(entryName)) {
    return 200 + entryName.length + (entry.active ? 100 : 0);
  }

  const aliasMatch = aliases.reduce((best, alias) => {
    if (alias && normalizedInput.includes(alias)) {
      return Math.max(best, alias.length);
    }
    return best;
  }, 0);

  if (aliasMatch > 0) {
    return 100 + aliasMatch + (entry.active ? 100 : 0);
  }

  return 0;
}

async function findRegistryEntry(env, inputText) {
  const rawId = env.REGISTRY_DATABASE_ID || DEFAULT_REGISTRY_DATABASE_ID;
  const databaseId = formatNotionId(rawId);

  console.log("REGISTRY DATABASE ID RAW:", rawId);
  console.log("REGISTRY DATABASE ID FORMATTED:", databaseId);

  const res = await fetch(
    `https://api.notion.com/v1/databases/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({})
    }
  );

  const body = await res.text();

  console.log("REGISTRY QUERY STATUS:", res.status);
  console.log("REGISTRY QUERY BODY:", body.slice(0, 500));

  if (!res.ok) {
    throw new Error(`Registry query ${res.status}: ${body}`);
  }

  const data = JSON.parse(body);
  const results = Array.isArray(data.results) ? data.results : [];

  let bestEntry = null;
  let bestScore = 0;

  for (let i = 0; i < results.length; i++) {
    const entry = buildRegistryEntryFromPage(results[i]);
    const score = scoreRegistryMatch(entry, inputText);

    if (score > bestScore) {
      bestScore = score;
      bestEntry = entry;
    }
  }

  return bestScore > 0 ? bestEntry : null;
}

function buildParsedFromRegistry(inputText, registryEntry) {
  if (!registryEntry) {
    return null;
  }

  const portionMatch = String(inputText || "").match(/portion\s+(\d+(?:[.,]\d+)?)/i);
  const requestedPortion = portionMatch
    ? parseFloat(portionMatch[1].replace(",", "."))
    : 1;

  if (typeof registryEntry.mgProPortion === "number") {
    return {
      name: registryEntry.name,
      amount: registryEntry.mgProPortion * requestedPortion,
      unit: "mg",
      requestedPortion,
      registryEntry
    };
  }

  if (
    typeof registryEntry.mgProKapsel === "number" &&
    typeof registryEntry.kapselnProPortion === "number"
  ) {
    return {
      name: registryEntry.name,
      amount: registryEntry.mgProKapsel * registryEntry.kapselnProPortion * requestedPortion,
      unit: "mg",
      requestedPortion,
      registryEntry
    };
  }

  if (typeof registryEntry.standardPortion === "number" && registryEntry.portionEinheit) {
    return {
      name: registryEntry.name,
      amount: registryEntry.standardPortion * requestedPortion,
      unit: registryEntry.portionEinheit,
      requestedPortion,
      registryEntry
    };
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
