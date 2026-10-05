import { NextRequest, NextResponse } from 'next/server';

interface AiListingRequest {
  productTitle: string;
  materials?: string;
}

interface AiListingResponse {
  primaryTitle: string;
  alternativeTitles: string[];
  tags: string[];
  metaDescription: string;
  bulletPoints: string[];
  fullDescription: string;
  personalizationInstructions: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: AiListingRequest = await req.json();
    const {
      productTitle,
      materials = '',
    } = body;

    if (!productTitle || !productTitle.trim()) {
      return NextResponse.json(
        { success: false, error: 'Product title or concept is required to generate SEO tags.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          missingKey: true,
          error:
            'GEMINI_API_KEY is not configured in .env.local. Please add your Gemini API Key in .env.local to activate AI generation.',
        },
        { status: 400 }
      );
    }

    const systemPrompt = `You are a world-class Etsy SEO Specialist and Master Copywriter.
You optimize listings across all Etsy handmade, artisan, and vintage categories (Leather goods, Woodworking, Jewelry, Home Decor, Personalized Gifts, Apparel, Ceramics, Accessories, etc.).

CRITICAL ETSY ALGORITHM RULES TO OBEY WITHOUT EXCEPTION:

1. TITLE OPTIMIZATION:
   - Maximum 140 characters total.
   - The first 40-45 characters MUST be the high-traffic primary search phrase that mobile shoppers see before clicking (mobile buyers only see the start of the title).
   - Include high-intent buyer keywords separated by natural commas.
   - Provide 2 distinct alternative titles:
     * Alternative 1: Recipient & Gift-Focused angle (Anniversary, Birthday, For Him/Her)
     * Alternative 2: Material & Craft-Focused angle (Handmade, Quality, Utility)

2. THE 13 SEARCH TAGS (STRICT ETSY ENGINE RULES):
   - You MUST generate EXACTLY 13 tags.
   - ABSOLUTE HARD LIMIT: EACH TAG MUST BE 20 CHARACTERS OR FEWER (including spaces). Etsy strictly rejects any tag with 21+ characters!
   - Multi-word long-tail keywords (2-3 words) beat single words (e.g. "gift for husband" [16 chars], "personalized gift" [17 chars], "handmade wallet" [15 chars]).
   - Cover recipient, material, style, and occasion relevant to the product.
   - All tags must be lowercase without punctuation, slashes, or hashtags (#).

3. PROFESSIONAL ETSY DESCRIPTION (HIGH CONVERSION FORMAT):
   - metaDescription: 120-155 characters engaging hook for Google & Etsy search snippets.
   - bulletPoints: 4 concise bullet points detailing materials, craftsmanship, packaging, and versatility.
   - fullDescription: A complete, structured, ready-to-paste Etsy listing description containing:
     * Catchy Headline & Story Hook (celebrating handmade craftsmanship and quality materials).
     * ✍️ PERSONALIZATION GUIDE (if applicable: clear instructions on what the buyer should enter in Etsy's personalization box, character limits, and examples).
     * 📐 SPECIFICATIONS & DIMENSIONS (provide both inches and cm for global US/EU/UK buyers, features, capacity).
     * 🌿 MATERIALS & CRAFTSMANSHIP (why this material is durable, how it is made/finished).
     * 🎁 GIFT READY & PACKAGING (packaging details, gift note option).
     * 📦 PROCESSING & SHIPPING TIMELINES.
     * 🧼 CARE & MAINTENANCE INSTRUCTIONS.
   - personalizationInstructions: 1-2 sentence instruction text that the seller can paste directly into Etsy's "Personalization Instructions" field for buyers (e.g. "Please enter your custom text/name (max 12 characters). Specify font style or placement if desired.").

Respond ONLY with valid JSON matching this exact schema:
{
  "primaryTitle": "string under 140 chars",
  "alternativeTitles": [
    "string under 140 chars",
    "string under 140 chars"
  ],
  "tags": [
    "tag1 (<= 20 chars)",
    "tag2 (<= 20 chars)",
    "tag3 (<= 20 chars)",
    "tag4 (<= 20 chars)",
    "tag5 (<= 20 chars)",
    "tag6 (<= 20 chars)",
    "tag7 (<= 20 chars)",
    "tag8 (<= 20 chars)",
    "tag9 (<= 20 chars)",
    "tag10 (<= 20 chars)",
    "tag11 (<= 20 chars)",
    "tag12 (<= 20 chars)",
    "tag13 (<= 20 chars)"
  ],
  "metaDescription": "string under 160 chars",
  "bulletPoints": [
    "highlight 1",
    "highlight 2",
    "highlight 3",
    "highlight 4"
  ],
  "fullDescription": "string with formatted sections, headers, and bullet points",
  "personalizationInstructions": "string for Etsy personalization field instructions"
}`;

    const userPrompt = `Product: "${productTitle}"
Materials / Specifications: ${materials || 'High quality materials / Handcrafted'}

Generate an Etsy-compliant, top-ranking listing title, exactly 13 strict search tags under 20 characters each, and a professional Etsy description.`;

    const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
    let geminiResponse = null;
    let lastError = null;

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                },
              ],
              generationConfig: {
                temperature: 0.7,
                responseMimeType: 'application/json',
              },
            }),
          }
        );

        if (res.ok) {
          geminiResponse = await res.json();
          break;
        } else {
          const errText = await res.text();
          lastError = `Model ${model} failed (${res.status}): ${errText}`;
        }
      } catch (err) {
        lastError = String(err);
      }
    }

    if (!geminiResponse) {
      throw new Error(lastError || 'Could not communicate with Google Gemini API.');
    }

    const candidate = geminiResponse.candidates?.[0];
    const textPart = candidate?.content?.parts?.[0]?.text;

    if (!textPart) {
      throw new Error('Gemini API returned an empty response.');
    }

    const parsedData: AiListingResponse = JSON.parse(textPart);

    // Strict validation & sanitization of 13 tags
    const rawTags = Array.isArray(parsedData.tags) ? parsedData.tags : [];

    // Filter and sanitize tags: <= 20 chars, lowercase, no symbols
    const sanitizedTags = rawTags
      .map((t) =>
        t
          .replace(/[#,/\\.'"]/g, '')
          .trim()
          .toLowerCase()
      )
      .filter((t) => t.length > 0 && t.length <= 20);

    // Deduplicate
    let uniqueTags = Array.from(new Set(sanitizedTags));

    // High-performing backup keywords (strictly <= 20 chars)
    const backupKeywords = [
      'handmade gift',
      'personalized gift',
      'custom gift idea',
      'gift for him',
      'gift for her',
      'unique gifts',
      'etsy best seller',
      'anniversary gift',
      'birthday present',
      'artisan crafted',
      'custom made to order',
      'handcrafted item',
      'holiday gift idea',
    ];

    for (const backup of backupKeywords) {
      if (uniqueTags.length >= 13) break;
      if (!uniqueTags.includes(backup) && backup.length <= 20) {
        uniqueTags.push(backup);
      }
    }

    uniqueTags = uniqueTags.slice(0, 13);

    // Sanitize Title (ensure <= 140 chars)
    let safeTitle = parsedData.primaryTitle || productTitle;
    if (safeTitle.length > 140) {
      safeTitle = safeTitle.substring(0, 137).trim() + '...';
    }

    return NextResponse.json({
      success: true,
      data: {
        primaryTitle: safeTitle,
        alternativeTitles: (parsedData.alternativeTitles || []).map((t) =>
          t.length > 140 ? t.substring(0, 137).trim() + '...' : t
        ),
        tags: uniqueTags,
        metaDescription: parsedData.metaDescription || '',
        bulletPoints: parsedData.bulletPoints || [],
        fullDescription: parsedData.fullDescription || '',
        personalizationInstructions: parsedData.personalizationInstructions || '',
      },
    });
  } catch (error: unknown) {
    console.error('AI Listing Generation Error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to generate AI listing tags';
    return NextResponse.json(
      {
        success: false,
        error: msg,
      },
      { status: 500 }
    );
  }
}
