import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  isStepCount,
  streamText,
  type UIMessage,
} from "ai";
import { SYSTEM_PROMPT } from "@/lib/prompt";
import { concertTools } from "@/lib/tools";

export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return Response.json(
      { error: "OPENROUTER_API_KEY is not configured." },
      { status: 500 },
    );
  }

  if (!process.env.TICKETMASTER_API_KEY) {
    return Response.json(
      { error: "TICKETMASTER_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const openrouter = createOpenRouter({
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const result = streamText({
    model: openrouter("openrouter/free"),
    system: SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
    tools: concertTools,
    // Cap ReAct-style tool loops (similar to lab recursion_limit)
    stopWhen: isStepCount(8),
  });

  return result.toUIMessageStreamResponse();
}
