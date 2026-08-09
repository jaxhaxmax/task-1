import { cyrb53 } from "./hash";
import type { Rarity } from "./types";

export const TITLES: Record<Rarity, string[]> = {
  common: [
    "Terminal Native",
    "Commit Machine",
    "Stack Wrangler",
    "Ship Cycle",
    "Late Night Push",
    "Prompt Smith",
    "Merge Conflict",
    "Localhost Loyalist",
    "Rubber Duck",
    "Green Squares",
    "Cache Warmer",
    "Off By One",
    "Hot Reload",
    "Draft PR",
    "Rebase Enjoyer",
  ],
  rare: [
    "Latency Hunter",
    "Schema Whisperer",
    "Rollup Regular",
    "Context Window",
    "Zero Knowledge",
    "Gas Optimizer",
    "Edge Runtime",
    "Token Bender",
    "Consensus Builder",
    "Inference Runner",
  ],
  epic: [
    "Protocol Pioneer",
    "Mainnet Survivor",
    "Silent Refactor",
    "Chain Reorg",
    "Model Collapse",
    "Bytecode Poet",
    "Liquidity Ghost",
    "Signal Over Noise",
  ],
  legendary: [
    "The 247th",
    "Genesis Block",
    "First Commit",
    "Founder Class",
    "Ships On Fridays",
  ],
};

export type TitleResult = {
  title: string;
  rarity: Rarity;
    serial: string;
    seed: number;
};

export function builderTitle(name: string, role: string, salt = 0): TitleResult {
  const key = `${name.trim().toLowerCase()}|${role.trim().toLowerCase()}|${salt}`;
  const h = cyrb53(key);
  const roll = h % 100;

  const rarity: Rarity =
    roll < 3 ? "legendary" : roll < 15 ? "epic" : roll < 40 ? "rare" : "common";

  const pool = TITLES[rarity];

  return {
    title: pool[Math.floor(h / 100) % pool.length],
    rarity,
    serial: String((h % 247) + 1).padStart(3, "0"),
    seed: h % 2147483647 || 1,
  };
}
