import { runEngineV2 } from "../engine/engine_v2.js";

export default defineComponent({
  async run({ steps, $ }) {
    const rawBody = steps.trigger?.event?.body || {};
    const body = parseBody(rawBody);
    const payload = buildPayload(body);

    const context = {
      phase: String(payload.context?.phase || "AMPK").toUpperCase(),
      dayType: String(payload.context?.dayType || "rest").toLowerCase(),
      week: String(payload.context?.week || "B").toUpperCase(),
    };

    const result = runEngineV2(payload);

    return {
      success: true,
      context,
      result,
    };
  },
});

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
        phase: body.context?.phase || "AMPK",
        dayType: body.context?.dayType || "rest",
        week: body.context?.week || "B",
      },
      plan: {
        portion_1: body.supplements,
      },
    };
  }

  return {
    context: {
      phase: body.context?.phase || "AMPK",
      dayType: body.context?.dayType || "rest",
      week: body.context?.week || "B",
    },
    plan: body.plan || {},
  };
}