import { tool } from "ai";
import { z } from "zod";

type TicketmasterEvent = {
  name?: string;
  url?: string;
  dates?: {
    start?: {
      localDate?: string;
      localTime?: string;
    };
  };
  _embedded?: {
    venues?: Array<{ name?: string }>;
  };
};

type TicketmasterResponse = {
  _embedded?: {
    events?: TicketmasterEvent[];
  };
};

type ZipLookupResponse = {
  places?: Array<{
    latitude?: string;
    longitude?: string;
  }>;
};

const DEFAULT_RADIUS_MILES = 25;
const MAX_RADIUS_MILES = 100;

export function getCurrentTime(): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    dateStyle: "long",
    timeStyle: "long",
  }).format(new Date());
}

export async function searchConcerts(
  city: string,
  postalCode: string,
  date = "",
  radiusMiles = DEFAULT_RADIUS_MILES,
): Promise<string> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) {
    return "Ticketmaster API error: TICKETMASTER_API_KEY is not configured.";
  }

  const safeRadius = Math.min(
    MAX_RADIUS_MILES,
    Math.max(1, Math.round(radiusMiles)),
  );
  const params = new URLSearchParams({
    apikey: apiKey,
    classificationName: "music",
    radius: String(safeRadius),
    unit: "miles",
    size: "5",
    sort: "date,asc",
  });

  // Ticketmaster's postalCode parameter is a text filter. Resolve US ZIP codes
  // to coordinates so radius searches include venues in neighboring ZIPs/cities.
  try {
    const zipResponse = await fetch(
      `https://api.zippopotam.us/us/${encodeURIComponent(postalCode)}`,
      { signal: AbortSignal.timeout(5_000) },
    );

    if (zipResponse.ok) {
      const zipData = (await zipResponse.json()) as ZipLookupResponse;
      const place = zipData.places?.[0];
      if (place?.latitude && place.longitude) {
        params.set("latlong", `${place.latitude},${place.longitude}`);
      }
    }
  } catch {
    // Ticketmaster can still attempt the search using postalCode + radius.
  }

  if (!params.has("latlong")) {
    params.set("postalCode", postalCode);
  }

  if (date) {
    params.set("startDateTime", `${date}T00:00:00Z`);
    params.set("endDateTime", `${date}T23:59:59Z`);
  }

  try {
    const resp = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`,
      { signal: AbortSignal.timeout(20_000) },
    );

    if (!resp.ok) {
      return `Ticketmaster API error: ${resp.status} ${resp.statusText}`;
    }

    const data = (await resp.json()) as TicketmasterResponse;
    const events = data._embedded?.events ?? [];

    if (events.length === 0) {
      return `No concerts found within ${safeRadius} miles of ${postalCode}.`;
    }

    const eventLines = events
      .map((ev) => {
        const name = ev.name ?? "Unknown event";
        const when = ev.dates?.start?.localDate ?? "unknown date";
        const localTime = ev.dates?.start?.localTime ?? "";
        const venue = ev._embedded?.venues?.[0]?.name ?? "Unknown venue";
        const url = ev.url ?? "";
        const whenStr = `${when} ${localTime}`.trim();
        return `- ${name} @ ${venue} on ${whenStr} | ${url}`;
      })
      .join("\n");

    return `Concerts within ${safeRadius} miles of ${city} ${postalCode}:\n${eventLines}`;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return `Ticketmaster API error: ${message}`;
  }
}

export const concertTools = {
  getCurrentTime: tool({
    description: "Returns the current date and time in Eastern Time.",
    inputSchema: z.object({
      dummy: z
        .string()
        .optional()
        .describe("Unused placeholder; pass an empty string."),
    }),
    execute: async () => getCurrentTime(),
  }),

  searchConcerts: tool({
    description:
      "Search Ticketmaster for music concerts within a radius of a city and zip/postal code. Defaults to 25 miles and optionally filters to one calendar day. Extract the location from the user prompt — never invent it.",
    inputSchema: z.object({
      city: z.string().describe("City name, e.g. Boston"),
      postalCode: z.string().describe("ZIP or postal code, e.g. 02115"),
      date: z
        .string()
        .optional()
        .describe("Optional calendar day in YYYY-MM-DD format"),
      radiusMiles: z
        .number()
        .min(1)
        .max(MAX_RADIUS_MILES)
        .optional()
        .describe("Search radius in miles. Defaults to 25 and cannot exceed 100."),
    }),
    execute: async ({ city, postalCode, date, radiusMiles }) =>
      searchConcerts(
        city,
        postalCode,
        date ?? "",
        radiusMiles ?? DEFAULT_RADIUS_MILES,
      ),
  }),
};
