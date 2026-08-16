import OpenAI from "openai";
import { NextResponse } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const topic = body.topic?.trim();

    if (!topic) {
      return NextResponse.json(
        { error: "Please provide a topic." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "The server is missing its OpenAI API key." },
        { status: 500 }
      );
    }

    const response = await openai.responses.create({
      model: "gpt-5.6",
      input: `
You are a helpful social-media writing assistant.

Write one concise LinkedIn post based on this topic:
"${topic}"

Requirements:
- Use a practical, curious, honest tone.
- Start with a strong first sentence.
- Keep the post under 150 words.
- Include three short takeaways using bullet points.
- End with one thoughtful question.
- Do not invent personal achievements, facts, statistics, or sources.
- Return only the post text, with no title or explanation.
`,
    });

    return NextResponse.json({
      draft: response.output_text,
    });
  } catch (error) {
    console.error("Draft generation failed:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the draft." },
      { status: 500 }
    );
  }
}