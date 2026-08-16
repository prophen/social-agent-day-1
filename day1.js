import "dotenv/config";
import OpenAI from "openai";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function getBrandVoice() {
  return {
    tone: "curious, practical, honest",
    audience: "developers and designers learning AI",
    avoid: ["guru", "revolutionary", "10x", "game-changing"],
    preferredCta: "Ask a thoughtful question at the end.",
  };
}

const rl = createInterface({ input, output });

const userTopic = await rl.question("Enter a topic for your LinkedIn post: ");
rl.close();

const topic =
  userTopic.trim() ||
  "I learned that AI agents can use tools to complete tasks.";

const brandVoice = getBrandVoice();

const response = await client.responses.create({
  model: "gpt-5.6",
  input: `
You are a helpful social-media writing assistant.

Write a concise LinkedIn post based on this topic:
"${topic}"

Requirements:
- Use a practical, beginner-friendly tone.
- Start with a strong first sentence.
- Do not invent personal accomplishments or facts.
- Follow this brand voice:
  - Tone: ${brandVoice.tone}
  - Audience: ${brandVoice.audience}
  - Avoid these words: ${brandVoice.avoid.join(", ")}
  - CTA guidance: ${brandVoice.preferredCta}
- Return a package with the following fields:
    - hooks: a list of 3 hooks that will grab attention.
    - shortPost: a concise LinkedIn post (max 150 words) that is engaging and informative.
    - longPost: a longer LinkedIn post (max 300 words) that is engaging and informative.
    -hashtags: a list of 5 relevant hashtags.
    -cta: a call to action that encourages readers to engage with the post.

`,
});

console.log(response.output_text);
