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
  } else onResponse?.()

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

      console.log("------Buffer-------", buffer)

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      console.log("------lines-------", lines)
      for (const line of lines) {
        if (line.startsWith("data: ") || line.startsWith("\ndata")) {
          const content = line.slice(6); // removes "data: " prefix and whitespace
          // console.log(content, "---------content---------")
          if (content === "[DONE]") {
            onComplete();
            return;
          }
          onChunk(content);
        }
      }
    }
  } catch (err) {
    console.error("Stream read error:", err);
    throw err;
  }
}
