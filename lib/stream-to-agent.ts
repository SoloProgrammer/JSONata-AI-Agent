export async function streamToAgent({
  message,
  jsonContext,
  history,
  onChunk,
  onComplete,
  onResponse,
}: {
  message: string;
  jsonContext: any;
  history: any[];
  onChunk: (chunk: string) => void;
  onComplete: () => void;
  onResponse?: () => void;
}) {
  const response = await fetch("/api/stream-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      jsonContext,
      history,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to connect: ${response.status} - ${errorText}`);
  } else onResponse?.();

  if (!response.body) {
    throw new Error("No response stream");
  }

  const decoder = new TextDecoder("utf-8");
  const reader = response.body.getReader();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines ending with \n\n
      const lines = buffer.split("\n\n");
      
      // Keep the last incomplete line in buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          // Handle both "data: " and "\ndata: " prefixes
          const cleanLine = line.replace(/^\n?data:\s*/, "");
          
          if (cleanLine === "[DONE]") {
            onComplete();
            return;
          }
          
          // Only process non-empty content
          if (cleanLine.trim()) {
            onChunk(cleanLine);
          }
        }
      }
    }

    // Process any remaining content in buffer
    if (buffer.trim()) {
      const cleanBuffer = buffer.replace(/^\n?data:\s*/, "");
      if (cleanBuffer.trim() && cleanBuffer !== "[DONE]") {
        onChunk(cleanBuffer);
      }
    }

    onComplete();
  } catch (err) {
    console.error("Stream read error:", err);
    throw err;
  }
}