export function runEngineV2(payload = {}) {
  const context = {
    phase: String(payload.context?.phase || "AMPK"),
    dayType: String(payload.context?.dayType || "rest"),
    week: String(payload.context?.week || "B"),
  };

  let plan = JSON.parse(JSON.stringify(payload.plan || {}));

  function removeEverywhere(name) {
    for (const key in plan) {
      plan[key] = plan[key].filter((x) => x !== name);
    }
  }

  // RULE 1: Phase Filter
  if (context.phase === "AMPK") {
    removeEverywhere("Cordyceps");
  }

  // RULE 2: Training Filter
  if (context.dayType === "rest") {
    removeEverywhere("EAAs");
  }

  // RULE 3: Substitution
  const flat = Object.values(plan).flat();
  if (flat.includes("Okra")) {
    removeEverywhere("Pleurotus");
  }

  const finalFlat = Object.values(plan).flat();

  const conflicts = [];
  const timing = [];
  const stacks = [];

  // CONFLICTS
  if (finalFlat.includes("Nattokinase") && finalFlat.includes("Flavozym")) {
    conflicts.push("Nattokinase und Flavozym nicht kombinieren");
  }

  // TIMING
  if (finalFlat.includes("Eisen") && finalFlat.includes("Magnesium")) {
    timing.push("Eisen und Magnesium zeitlich trennen");
  }

  if (finalFlat.includes("Eisen") && finalFlat.includes("Zink")) {
    timing.push("Eisen und Zink zeitlich trennen");
  }

  if (finalFlat.includes("Curcumin") && finalFlat.includes("EGCG")) {
    timing.push("Curcumin und EGCG zeitlich trennen");
  }

  // STACKS
  if (finalFlat.includes("Vitamin D3") && finalFlat.includes("Vitamin K2")) {
    stacks.push("Vitamin D3 + K2 sinnvoll kombiniert");
  }

  if (finalFlat.includes("Eisen") && finalFlat.includes("Vitamin C")) {
    stacks.push("Eisen + Vitamin C verbessert Aufnahme");
  }

  if (finalFlat.includes("Glycin") && finalFlat.includes("Tryptophan")) {
    stacks.push("Glycin + Tryptophan foerdert Schlaf");
  }

  return {
    context,
    finalPlan: plan,
    conflicts,
    timing,
    stacks,
    summary: {
      totalPortions: Object.keys(plan).length,
      activeSupplements: finalFlat.length,
      conflictsCount: conflicts.length,
      timingCount: timing.length,
      stacksCount: stacks.length,
    },
  };
}