import { EVENT } from "./brand";
import type { FormatId } from "./types";

export function caption(
  format: FormatId,
  d: { name: string; title: string; serial: string; team: string; members: number },
): string {
  switch (format) {
    case "idcard":
      return [
        "Builder pass secured. \u2708\uFE0F",
        "",
        `${d.name || "Builder"} \u00B7 ${d.title}`,
        `Seat #${d.serial}/${EVENT.cohort} \u00B7 Boarding ${EVENT.boarding}`,
        "",
        "Grab yours \u2193",
        EVENT.hashtag,
      ].join("\n");

    case "team":
      return [
        `${d.team || "Our team"} is boarding. \u2708\uFE0F`,
        "",
        `${d.members} passengers \u00B7 ${EVENT.datesPretty} \u00B7 Goa`,
        "",
        "Make your team's pass \u2193",
        EVENT.hashtag,
      ].join("\n");

    default:
      return [
        "Got my Hacker House Goa 2026 frame. \uD83C\uDF34",
        "",
        `Class: ${d.title}`,
        `${EVENT.datesPretty} \u00B7 Goa \u00B7 ${EVENT.cohort} builders`,
        "",
        "Make yours in 5 seconds \u2193",
        EVENT.hashtag,
      ].join("\n");
  }
}
