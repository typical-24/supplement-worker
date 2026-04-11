export function runEngineV2(payload = {}) {
  const context = {
    phase: String(payload.context?.phase || "AMPK").toUpperCase(),
    dayType: String(payload.context?.dayType || "rest").toLowerCase(),
    week: String(payload.context?.week || "B").toUpperCase(),
  };

  let plan = JSON.parse(JSON.stringify(payload.plan || {}));

  function removeEverywhere(name) {
    for (const key in plan) {
      plan[key] = (plan[key] || []).filter((x) => x !== name);
    }
  }

  function has(name) {
    return Object.values(plan).flat().includes(name);
  }

  // Base rules
  if (context.phase === "AMPK") removeEverywhere("Cordyceps");
  if (context.dayType === "rest") removeEverywhere("EAAs");
  if (has("Okra")) removeEverywhere("Pleurotus");

  const finalFlat = Object.values(plan).flat();

  const conflicts = [];
  const timing = [];
  const stacks = [];
  const suggestions = [];
  const autoFixes = [];

  // Conflicts
  if (has("Nattokinase") && has("Flavozym")) {
    conflicts.push("Nattokinase und Flavozym nicht kombinieren");
    suggestions.push("Flavozym oder Nattokinase zeitlich trennen oder alternierend einnehmen");
    autoFixes.push("Trenne Flavozym und Nattokinase in unterschiedliche Einnahmefenster");
  }

  // Timing
  if (has("Eisen") && has("Magnesium")) {
    timing.push("Eisen und Magnesium zeitlich trennen");
    suggestions.push("Eisen morgens nuechtern, Magnesium abends einnehmen");
    autoFixes.push("Belasse Eisen in portion_4b und Magnesium in portion_7");
  }

  if (has("Eisen") && has("Zink")) {
    timing.push("Eisen und Zink zeitlich trennen");
    suggestions.push("Zink abends, Eisen separat einnehmen");
    autoFixes.push("Belasse Eisen in portion_4b und Zink in portion_8");
  }

  if (has("Curcumin") && has("EGCG")) {
    timing.push("Curcumin und EGCG zeitlich trennen");
    suggestions.push("Curcumin 20-30 Minuten nach EGCG einnehmen");
    autoFixes.push("Plane Curcumin nach EGCG mit Abstand");
  }

  // Stacks
  if (has("Vitamin D3") && has("Vitamin K2")) {
    stacks.push("Vitamin D3 + K2 sinnvoll kombiniert");
  }

  if (has("Eisen") && has("Vitamin C")) {
    stacks.push("Eisen + Vitamin C verbessert Aufnahme");
  }

  if (has("Glycin") && has("Tryptophan")) {
    stacks.push("Glycin + Tryptophan foerdert Schlaf");
  }

  const status =
    conflicts.length > 0 ? "conflict" :
    timing.length > 0 ? "warning" :
    "ok";

  const mobileSummary =
    "Status: " + status +
    " | Konflikte: " + conflicts.length +
    " | Timing: " + timing.length +
    " | Stacks: " + stacks.length;

  const shortcutPayload = {
    status,
    phase: context.phase,
    dayType: context.dayType,
    week: context.week,
    activeSupplements: finalFlat.length,
    conflictsCount: conflicts.length,
    timingCount: timing.length,
    stacksCount: stacks.length,
    suggestionsCount: suggestions.length,
    topConflict: conflicts[0] || "",
    topTiming: timing[0] || "",
    topStack: stacks[0] || "",
    topSuggestion: suggestions[0] || "",
    mobileSummary,
  };

  return {
    context,
    finalPlan: plan,
    conflicts,
    timing,
    stacks,
    suggestions,
    autoFixes,
    mobileSummary,
    shortcutPayload,
    summary: {
      totalPortions: Object.keys(plan).length,
      activeSupplements: finalFlat.length,
      conflictsCount: conflicts.length,
      timingCount: timing.length,
      stacksCount: stacks.length,
      suggestionsCount: suggestions.length,
      autoFixCount: autoFixes.length,
    },
  };
}