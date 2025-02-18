import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { link } = await req.json();

  if (!link) {
    return NextResponse.json({ error: "Missing link parameter." }, { status: 400 });
  }

  try {
    const response = await axios.get(link);
    const html: string = response.data;
    const $ = cheerio.load(html);
    const documentLinks: string[] = [];

    $('a[href$=".pdf"], a[href$=".doc"], a[href$=".docx"]').each((_, element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, link).href;
          documentLinks.push(absoluteUrl);
        } catch {
          throw new Error("Invalid URL found in the webpage.");
        }
      }
    });

    return NextResponse.json({ documentLinks }, { status: 200 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "Invalid URL found in the webpage.") {
      return NextResponse.json({ error: "Invalid URL found in the webpage." }, { status: 400 });
    }
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json({ error: "The page was not found." }, { status: 404 });
    }
    return NextResponse.json(
      { error: "An error occurred while processing your request.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
