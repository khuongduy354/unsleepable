import { pipeline } from "@xenova/transformers";

let summarizer: any; 
// Dùng top-level await (Node 18+)

async function getSummarizer() {
  if (!summarizer) {
    summarizer = await pipeline(
      "summarization",
      "Xenova/distilbart-cnn-6-6"
    );
  }
  return summarizer;
}

export async function POST(req: Request) {
  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing 'content' string" }),
        { status: 400 }
      );
    }

    const summarize = await getSummarizer();

    const result = await summarize(content, {
      max_length: 100,
      min_length: 30,
    });

    const summary = result[0].summary_text;

    return new Response(JSON.stringify({ summary }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Summarize error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to summarize" }),
      { status: 500 }
    );
  }
}