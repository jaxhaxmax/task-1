import { EVENT } from "./brand";
import type { FormatId } from "./types";

export function caption(
  format: FormatId,
  d: { name: string; title: string; serial: string; team: string; members: number },
): string {
  switch (format) {
    case "idcard":
      return [
        `✈️ I just got my Hacker House Goa 2026 Builder Pass!`,
        ``,
        `🌴 ${d.name || "Builder"} · ${d.title}`,
        `🎫 Seat #${d.serial}/${EVENT.cohort} · Boarding ${EVENT.boarding}`,
        `📍 Goa, India`,
        ``,
        `Building in paradise, shipping from the beach 🏄`,
        ``,
        `Grab yours 👇`,
        EVENT.hashtag,
        `#BuildInGoa #Hackathon #ShipFromParadise`,
      ].join("\n");

    case "team":
      return [
        `🌴 ${d.team || "Our team"} is heading to Hacker House Goa 2026!`,
        ``,
        `👥 ${d.members} builders · ${EVENT.datesPretty} · Goa, India`,
        ``,
        `We're building something big — see you on the beach 🏄‍♂️`,
        ``,
        `Make your crew's pass 👇`,
        EVENT.hashtag,
        `#BuildInGoa #HackerHouseGoa`,
      ].join("\n");

    default:
      return [
        `🌴 Just generated my Hacker House Goa 2026 PFP!`,
        ``,
        `🏷️ Builder Class: ${d.title}`,
        `📍 ${EVENT.datesPretty} · Goa, India · ${EVENT.cohort} builders`,
        ``,
        `Building in paradise. Shipping from the beach. 🚀`,
        ``,
        `Make yours in 5 sec 👇`,
        EVENT.hashtag,
        `#BuildInGoa #HackerHouseGoa #ShipFromParadise`,
      ].join("\n");
  }
}
