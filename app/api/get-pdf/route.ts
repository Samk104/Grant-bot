/**
 * @swagger
 * /api/getPDF:
 *   get:
 *     description: Returns all the PDF documents found on a web page
 *     responses:
 *       200:
 *         description: List of links to PDF documents
 *       400:
 *         description: Link not found
 */

import axios from "axios";
import * as cheerio from "cheerio";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { link } = await req.json();

  if (!link) {
    return NextResponse.json(
      { error: "Missing link parameter." },
      { status: 400 }
    );
  }

  try {
    const response = await axios.get(link);
    const html: string = response.data;
    const $ = cheerio.load(html);
    const pdfLinks: string[] = [];

    $('a[href$=".pdf"]').each((_: number, element: cheerio.Element) => {
      const href = $(element).attr("href");
      if (href) {
        try {
          const absoluteUrl = new URL(href, link).href;
          pdfLinks.push(absoluteUrl);
        } catch {
          return NextResponse.json(
            { error: "Invalid URL found in the webpage." },
            { status: 400 }
          );
        }
      }
    });

    return NextResponse.json({ pdfLinks }, { status: 200 });
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return NextResponse.json(
        { error: "The page was not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        error: "An error occurred while processing your request.",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
