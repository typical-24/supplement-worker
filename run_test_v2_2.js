import { runEngineV2 } from "./engine/engine_v2_2.js";
import fs from "fs";

const raw = fs.readFileSync("./test/test_input.json", "utf-8");
const input = JSON.parse(raw);

const result = runEngineV2(input);

console.log("===== RESULT V2_2 =====");
console.dir(result, { depth: null });
