import { pipeline } from "@xenova/transformers";

let summarizer: any;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

// Initialize model with better error handling and caching
async function getSummarizer() {
  if (summarizer) {
    return summarizer;
  }

  // Prevent multiple simultaneous initializations
  if (isInitializing && initPromise) {
    return initPromise;
  }

  isInitializing = true;
  initPromise = (async () => {
    try {
      console.log("[AI] Initializing summarization model...");
      const start = Date.now();

      summarizer = await pipeline(
        "summarization",
        "Xenova/distilbart-cnn-6-6",
        {
          // Suppress ONNX warnings
          progress_callback: null,
        }
      );

      const duration = Date.now() - start;
      console.log(`[AI] Model loaded in ${duration}ms`);
      return summarizer;
    } finally {
      isInitializing = false;
      initPromise = null;
    }
  })();

  return initPromise;
}

// Warm up the model on server start (optional)
if (process.env.NODE_ENV === "production") {
  getSummarizer().catch(console.error);
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

    // Truncate very long content to avoid excessive processing time
    const maxLength = 5000;
    const truncatedContent =
      content.length > maxLength
        ? content.substring(0, maxLength) + "..."
        : content;

    console.log(`[AI] Summarizing ${truncatedContent.length} characters...`);
    const start = Date.now();

    const summarize = await getSummarizer();

    const result = await summarize(truncatedContent, {
      max_length: 300,
      min_length: 0,
      do_sample: false, // Deterministic output
    });

    const summary = result[0].summary_text;
    const duration = Date.now() - start;
    console.log(`[AI] Summarization completed in ${duration}ms`);

    return new Response(JSON.stringify({ summary }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[AI] Summarize error:", err);
    return new Response(
      JSON.stringify({
        error: "Failed to summarize",
        details: err.message,
      }),
      { status: 500 }
    );
  }
}
