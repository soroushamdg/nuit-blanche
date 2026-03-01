import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

export interface ExtractedEvent {
  title: string;
  description: string;
  address: string;
  nearestMetro: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  timeDetails?: string;
  locationName?: string;
  sourceUrl?: string;
}

const extractedEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  address: z.string(),
  nearestMetro: z.string(),
  timeDetails: z.string(),
  locationName: z.string(),
});

type ExtractedEventFields = z.infer<typeof extractedEventSchema>;

interface NominatimResult {
  lat: string;
  lon: string;
}

/**
 * Geocode an address string using OpenStreetMap Nominatim API.
 * Returns lat/lng for Montreal-area addresses.
 */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  console.log("[Geocode] Attempting to geocode address:", address);
  
  // Try Mapbox first if API key is available
  const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN;
  if (mapboxToken) {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?proximity=-73.5673,45.5017&country=CA&limit=1&access_token=${mapboxToken}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        console.log("[Geocode] Mapbox API request failed:", response.status);
      } else {
        const data = await response.json();
        console.log("[Geocode] Mapbox API response:", data);
        
        if (data.features && data.features.length > 0) {
          const [lng, lat] = data.features[0].center;
          const coords = { lat, lng };
          console.log("[Geocode] Mapbox successfully geocoded to:", coords);
          return coords;
        }
      }
    } catch (error) {
      console.log("[Geocode] Mapbox error:", error);
    }
  }
  
  // Fallback to Nominatim
  try {
    const encodedAddress = encodeURIComponent(address);
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&city=Montreal`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "NuitBlanchePlanner/1.0 (https://github.com/nuit-blanche)",
      },
    });

    if (!response.ok) {
      console.log("[Geocode] Nominatim API request failed:", response.status, response.statusText);
      return null;
    }

    const results: NominatimResult[] = await response.json();
    console.log("[Geocode] Nominatim API response:", results);
    
    const first = results[0];
    if (!first?.lat || !first?.lon) {
      console.log("[Geocode] No valid coordinates found in Nominatim response");
      return null;
    }

    const coords = {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
    };
    console.log("[Geocode] Nominatim successfully geocoded to:", coords);
    return coords;
  } catch (error) {
    console.log("[Geocode] Nominatim error during geocoding:", error);
    return null;
  }
}

const SYSTEM_PROMPT =
  "You are a helpful assistant parsing event pages for Montreal Nuit Blanche. Extract the event title, a 2-sentence description, the exact street address in Montreal, the name of the nearest Montreal Metro station, the event time or date/time details (e.g. 'Saturday 7pm – midnight' — use empty string if not found), and the venue or location name (e.g. 'Place des Festivals' — use empty string if not found). Always return all six fields.";

/**
 * Pass cleaned page text to an LLM to extract event fields (title, description, address, nearestMetro).
 */
async function extractWithLLM(cleanedText: string): Promise<ExtractedEventFields> {
  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT,
    prompt: cleanedText,
    schema: extractedEventSchema,
  });
  return object;
}

function cleanHtmlToText(html: string): string {
  const $ = cheerio.load(html);
  const $body = $("body").clone();

  $body.find("script").remove();
  $body.find("style").remove();
  $body.find("nav").remove();
  $body.find("header").remove();
  $body.find("footer").remove();
  $body.find('[role="navigation"]').remove();

  return $body.text().replace(/\s+/g, " ").trim();
}

/** Extract cover/OG image URL from HTML. */
function extractCoverImageUrl(html: string, pageUrl: string): string | undefined {
  const $ = cheerio.load(html);
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) return ogImage.startsWith("http") ? ogImage : new URL(ogImage, pageUrl).href;
  const firstImg = $("article img, main img, .event img, [class*='hero'] img, img").first().attr("src");
  if (firstImg) return firstImg.startsWith("http") ? firstImg : new URL(firstImg, pageUrl).href;
  return undefined;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const url = body?.url;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'url' in request body" },
        { status: 400 }
      );
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; NuitBlanchePlanner/1.0; +https://github.com/nuit-blanche)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const html = await response.text();
    const cleanedText = cleanHtmlToText(html);
    const extracted = await extractWithLLM(cleanedText);
    const imageUrl = extractCoverImageUrl(html, url);

    const coords = await geocodeAddress(extracted.address);
    const event: ExtractedEvent = {
      title: extracted.title,
      description: extracted.description,
      address: extracted.address,
      nearestMetro: extracted.nearestMetro,
      lat: coords?.lat ?? 45.5017,
      lng: coords?.lng ?? -73.5673,
      imageUrl: imageUrl || undefined,
      timeDetails: extracted.timeDetails.trim() || undefined,
      locationName: extracted.locationName.trim() || undefined,
      sourceUrl: url,
    };

    console.log("[Extract API] Event added with coordinates:", {
      title: event.title,
      address: event.address,
      lat: event.lat,
      lng: event.lng,
      usedFallback: coords === null
    });

    return NextResponse.json(event);
  } catch (err) {
    console.error("Extract API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
