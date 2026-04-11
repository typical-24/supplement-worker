import { runEngineV2 } from "./engine/engine_v2_2.js";
import fs from "fs";

function parseBody(raw) {
  if (!raw) return {};
  if (typeof raw === "object") return raw;

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function buildPayload(body) {
  if (body.plan && body.context) return body;

  if (Array.isArray(body.supplements)) {
    return {
      context: {
        phase: "AMPK",
        dayType: "rest",
        week: "B"
      },
      plan: {
        portion_1: body.supplements
      }
    };
  }

  return {
    context: {
      phase: "AMPK",
      dayType: "rest",
      week: "B"
    },
    plan: {}
  };
}

const raw = fs.readFileSync("./test/test_input.json", "utf-8");
const rawBody = JSON.parse(raw);

const body = parseBody(rawBody);
const payload = buildPayload(body);
const result = runEngineV2(payload);

const response = {
  success: true,
  status: result.shortcutPayload?.status || "ok",
  mobileSummary: result.mobileSummary || "",
  shortcutPayload: result.shortcutPayload || {},
  result
};

console.log("===== ENTRY_V2 RESPONSE =====");
console.dir(response, { depth: null });
