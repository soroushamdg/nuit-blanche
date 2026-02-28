import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

export interface ExtractedEvent {
  title: string;
  description: string;
  address: string;
  nearestMetro: string;
}

/**
 * Placeholder: pass cleaned page text to an LLM to extract event fields.
 * Prompt should ask for: title, description (shortened), address, nearestMetro.
 */
async function extractWithLLM(_cleanedText: string): Promise<ExtractedEvent> {
  // TODO: Call your LLM with a prompt like:
  // "From the following webpage text, extract event information as JSON with these exact keys:
  //  title (string), description (string, shortened to 1-2 sentences), address (string), nearestMetro (string, Montreal metro station name)."
  // Parse the LLM response and return as ExtractedEvent.

  // Mock response for development
  return {
    title: "Luminothérapie – Place des Festivals",
    description:
      "Interactive light installation transforming the square into a luminous landscape.",
    address: "305 Rue Jeanne-Mance, Montreal, QC H2X 3Y2",
    nearestMetro: "Place-des-Arts",
  };
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

    return NextResponse.json(extracted);
  } catch (err) {
    console.error("Extract API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Extraction failed" },
      { status: 500 }
    );
  }
}
