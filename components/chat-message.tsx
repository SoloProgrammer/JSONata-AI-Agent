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

    // Enhanced regex to better detect code blocks with proper language detection
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts: Array<{ type: 'text' | 'code'; content: string; language?: string }> = [];
    let lastIndex = 0;
    let match;

    // Extract code blocks and text parts
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index).trim();
        if (textContent) {
          parts.push({ type: 'text', content: textContent });
        }
      }

      // Add code block
      const language = match[1] || 'text';
      const code = match[2].trim();
      if (code) {
        parts.push({ type: 'code', content: code, language });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (lastIndex < content.length) {
      const remainingText = content.slice(lastIndex).trim();
      if (remainingText) {
        parts.push({ type: 'text', content: remainingText });
      }
    }

    // If no code blocks found, treat entire content as text
    if (parts.length === 0) {
      parts.push({ type: 'text', content: content });
    }

    return parts.map((part, index) => {
      if (part.type === 'code') {
        return (
          <div key={index} className="my-4 relative group">
            <div className="flex items-center justify-between bg-gray-800 dark:bg-gray-900 px-4 py-2 rounded-t-lg border border-gray-700">
              <Badge variant="secondary" className="text-xs bg-gray-700 dark:bg-gray-800 text-gray-300 dark:text-gray-400">
                {part.language}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(part.content, index)}
                className="h-8 w-8 p-0 hover:bg-gray-600 dark:hover:bg-gray-700 text-gray-400 hover:text-white dark:hover:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copiedIndex === index ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <div className="overflow-x-auto">
              <SyntaxHighlighter
                language={part.language}
                style={theme === "dark" ? dracula : oneLight}
                className="rounded-b-lg !mt-0 border border-t-0 border-gray-700 dark:border-gray-600"
                customStyle={{
                  margin: 0,
                  borderTopLeftRadius: 0,
                  borderTopRightRadius: 0,
                  maxWidth: "100%",
                  backgroundColor: theme === "dark" ? "#1a1a1a" : "#f8f9fa",
                  fontSize: "14px",
                  lineHeight: "1.5",
                }}
                wrapLines={true}
                wrapLongLines={true}
                showLineNumbers={part.content.split('\n').length > 5}
                lineNumberStyle={{
                  minWidth: "3em",
                  paddingRight: "1em",
                  color: theme === "dark" ? "#6b7280" : "#9ca3af",
                  borderRight: `1px solid ${theme === "dark" ? "#374151" : "#e5e7eb"}`,
                  marginRight: "1em",
                }}
              >
                {part.content}
              </SyntaxHighlighter>
            </div>
          </div>
        );
      } else {
        // Regular text with proper markdown rendering
        return (
          <div key={index} className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown
              components={{
                // Custom rendering for inline code
                code: ({ node, inline, className, children, ...props }) => {
                  if (inline) {
                    return (
                      <code
                        className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border border-gray-200 dark:border-gray-700"
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                  return <code {...props}>{children}</code>;
                },
                // Ensure proper paragraph spacing
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 leading-relaxed whitespace-pre-wrap break-words">
                    {children}
                  </p>
                ),
                // Style lists properly
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3 space-y-1">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3 space-y-1">
                    {children}
                  </ol>
                ),
                // Style headings
                h1: ({ children }) => (
                  <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-base font-medium mb-2 mt-3 first:mt-0">
                    {children}
                  </h3>
                ),
                // Style blockquotes
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic my-3">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {part.content}
            </Markdown>
          </div>
        );
      }
    });
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