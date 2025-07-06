// app/api/stream-chat/route.ts
import { azureAIAgentsService } from "@/services/azure-ai-agents-service.service";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { message, jsonContext, history } = await req.json();

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const push = (text: string) => {
        controller.enqueue(encoder.encode(`data: ${text}\n\n`));
      };

      const end = () => {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      };

      await azureAIAgentsService.streamChatResponse(message, jsonContext, history, push, end);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
