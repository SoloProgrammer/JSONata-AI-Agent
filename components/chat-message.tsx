"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, User, Bot } from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus, oneLight, dracula } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { useTheme } from "next-themes";
import Markdown from "react-markdown";
import { AgentThinkingId } from "./chat-interface";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  jsonContext?: any;
}

interface ChatMessageProps {
  message: Message;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { theme } = useTheme();

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const renderContent = (content: string) => {
    if (!content) return null;

    // Split content by code blocks
    const parts = content.split(/(```[\s\S]*?```)/g);

    // console.log("parts--", parts)

    return parts
      .map((part, index) => {
        if (part.startsWith("```") && part.endsWith("```")) {
          // Extract language and code
          const lines = part.slice(3, -3).split(" ");
          const language = lines[0] || "javascript";
          const code = lines.slice(1).join("");

          return (
            <div key={index} className="my-4 relative group">
              <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2 rounded-t-lg border border-gray-700">
                <Badge variant="secondary" className="text-xs bg-gray-700 dark:bg-gray-800 text-gray-300 dark:text-gray-400">
                  {language}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(code, index)}
                  className="h-8 w-8 p-0 hover:bg-gray-600 dark:hover:bg-gray-700 text-gray-400 hover:text-white dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <SyntaxHighlighter
                  language={language}
                  style={theme === "dark" ? dracula : oneLight}
                  className="rounded-b-lg !mt-0 border border-t-0 border-gray-700 dark:border-gray-600"
                  customStyle={{
                    margin: 0,
                    borderTopLeftRadius: 0,
                    borderTopRightRadius: 0,
                    maxWidth: "100%",
                    backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa",
                  }}
                  wrapLongLines={true}
                  // PreTag={true}
                  // CodeTag={true}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            </div>
          );
        } else if (part) {
          // Regular text - only render if not empty
          return (
            <div key={index} className="whitespace-pre-wrap break-words">
              <Markdown>{part}</Markdown>
            </div>
          );
        }
        return null;
      })
      .filter(Boolean);
  };

  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`flex max-w-[90%] ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 ${isUser ? "ml-3" : "mr-3"}`}>
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg ${
              isUser
                ? "bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-purple-500 dark:to-purple-700"
                : "bg-gradient-to-br from-emerald-500 to-green-600 dark:from-purple-600 dark:to-pink-600"
            }`}
          >
            {isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
          </div>
        </div>

        {/* Message */}
        <Card
          className={`${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-purple-500 dark:to-purple-700 text-white border-blue-400 dark:border-purple-400"
              : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          } shadow-sm overflow-hidden`}
        >
          <div className="p-4">
            {message.content && (
              <div className={`text-sm ${isUser ? "text-white" : "text-gray-900 dark:text-gray-100"} overflow-hidden`}>
                {message.id !== AgentThinkingId && renderContent(message.content)}
                <span className="flex items-center gap-1">
                  {message.id === AgentThinkingId && renderContent(message.content)}
                  {message.id === AgentThinkingId && (
                    <img width={30} src="https://cdn.pixabay.com/animation/2024/04/02/07/57/07-57-40-974_512.gif" alt="thinking..." />
                  )}
                </span>
                {isStreaming && <span className="inline-block w-2 h-4 bg-emerald-500 dark:bg-purple-500 ml-1 animate-pulse rounded-sm" />}
              </div>
            )}

            {message.jsonContext && (
              <div className="mt-3 pt-3 border-t border-blue-400/20 dark:border-purple-400/20">
                <Badge variant="secondary" className="text-xs bg-blue-100 dark:bg-purple-900/30 text-blue-700 dark:text-purple-300">
                  JSON Context Included
                </Badge>
              </div>
            )}

            <div className={`text-xs mt-2 ${isUser ? "text-blue-100 dark:text-purple-200" : "text-gray-500 dark:text-gray-400"}`}>
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}