import { runEngineV3 } from "../engine/engine_v3.js";

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
        phase: String(body.context?.phase || "AMPK").toUpperCase(),
        dayType: String(body.context?.dayType || "rest").toLowerCase(),
        week: String(body.context?.week || "B").toUpperCase(),
      },
      plan: {
        portion_1: body.supplements,
      },
    };
  }

  return {
    context: {
      phase: "AMPK",
      dayType: "rest",
      week: "B",
    },
    plan: {},
  };
}

export default defineComponent({
  async run({ steps, $ }) {
    const rawBody = parseBody(steps.trigger?.event?.body);
    const payload = buildPayload(rawBody);
    const result = runEngineV3(payload);

    return {
      success: true,
      inputReceived: rawBody,
      payloadUsed: payload,
      result,
    };
  },
});
