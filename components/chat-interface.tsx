"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Upload, Code, Send, FileText, Sparkles, AlertCircle, CheckCircle, Database } from "lucide-react";
import { ChatMessage } from "./chat-message";
import { JsonUpload } from "./json-upload";
import { ThemeToggle } from "./theme-toggle";
import axios from "axios";
import { streamToAgent } from "@/lib/stream-to-agent";
import TextareaAutosize from "react-textarea-autosize";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  jsonContext?: any;
}

type ConnectionResponse = {
  success: boolean;
  message: string;
};

export const AgentThinkingId = "agent-think-01";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [jsonContext, setJsonContext] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStreamingMessage, setCurrentStreamingMessage] = useState("");
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "testing" | "connected" | "error">("unknown");
  const [vectorStoreStatus, setVectorStoreStatus] = useState<"none" | "creating" | "ready" | "error">("none");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const JSONcontextInputRef = useRef<null | HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentStreamingMessage]);

  // Test Azure AI Agents connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        setConnectionStatus("testing");
        const { data: result } = await axios.get<ConnectionResponse>("api/test-connection");
        setConnectionStatus("connected");
        if (!result.success) {
          console.warn("Azure AI Agents connection test failed:", result.message);
        }
      } catch (error) {
        console.warn("Azure AI Agents connection test failed:", (error as Error).message);
        setConnectionStatus("error");
      }
    };

    checkConnection();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
      jsonContext: jsonContext,
    };

    const AgentThinkingMesssage: Message = {
      id: AgentThinkingId,
      role: "assistant",
      content: "Agent is Thinking",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, AgentThinkingMesssage]);
    setInput("");
    setIsLoading(true);
    if (JSONcontextInputRef.current) {
      JSONcontextInputRef.current.value = "";
    }
    setCurrentStreamingMessage("");

    try {
      const assistantMessageId = (Date.now() + 1).toString();
      let fullResponse = "";

      await streamToAgent({
        message: input,
        jsonContext,
        history: messages,
        onResponse: () => {
          setMessages((prev) => prev.filter((m) => m.id !== AgentThinkingId));
          setJsonContext(null)
        },
        onChunk: (chunk: string) => {
          fullResponse += chunk;
          setCurrentStreamingMessage(fullResponse);
        },
        onComplete: () => {
          // On complete, add the final message to the messages array
          const finalMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: fullResponse,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, finalMessage]);
          setCurrentStreamingMessage("");
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== AgentThinkingId),
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content:
            "Sorry, I encountered an error while connecting to the Azure AI Agents service. Please check your configuration and try again.",
          timestamp: new Date(),
        },
      ]);
      setIsLoading(false);
      setCurrentStreamingMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case "testing":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-700/50"
          >
            <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-yellow-600 border-t-transparent" />
            Testing Connection
          </Badge>
        );
      case "connected":
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50"
          >
            <CheckCircle className="w-3 h-3 mr-1" />
            Azure AI Agents Connected
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/50"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Connection Error
          </Badge>
        );
      default:
        return (
          <Badge
            variant="secondary"
            className="bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/50"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            Azure AI Agents Powered
          </Badge>
        );
    }
  };

  const getVectorStoreStatusBadge = () => {
    if (vectorStoreStatus === "none") return null;

    switch (vectorStoreStatus) {
      case "creating":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/50"
          >
            <div className="w-3 h-3 mr-1 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Creating Vector Store
          </Badge>
        );
      case "ready":
        return (
          <Badge
            variant="secondary"
            className="bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-700/50"
          >
            <Database className="w-3 h-3 mr-1" />
            Vector Store Ready
          </Badge>
        );
      case "error":
        return (
          <Badge
            variant="secondary"
            className="bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700/50"
          >
            <AlertCircle className="w-3 h-3 mr-1" />
            Vector Store Error
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200/50 dark:border-gray-700/50 flex-shrink-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-purple-500 dark:to-purple-700 rounded-xl flex items-center justify-center shadow-lg">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">JSONata Helper</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">AI-powered JSONata expression generator with file search</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getConnectionStatusBadge()}
              {getVectorStoreStatusBadge()}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full">
          {/* Sidebar */}
          <div className="lg:col-span-1 overflow-hidden">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                  <FileText className="w-5 h-5 mr-2" />
                  JSON Context
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden">
                <Tabs defaultValue="upload" className="w-full h-full flex flex-col">
                  <TabsList className="grid w-full grid-cols-2 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                    <TabsTrigger value="upload" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                      Upload
                    </TabsTrigger>
                    <TabsTrigger value="paste" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
                      Paste
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="space-y-4 flex-1 overflow-auto">
                    <JsonUpload onJsonLoaded={setJsonContext} />
                  </TabsContent>
                  <TabsContent value="paste" className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    <Textarea
                      ref={JSONcontextInputRef}
                      placeholder="Paste your JSON here..."
                      className="flex-1 font-mono text-sm resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setJsonContext(parsed);
                        } catch {
                          // Invalid JSON, don't update context
                        }
                      }}
                      // value={JSON.stringify(jsonContext)}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Chat Area */}
          <div className="lg:col-span-3 overflow-hidden">
            <Card className="bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-lg h-full flex flex-col">
              <CardHeader className="pb-3 flex-shrink-0">
                <CardTitle className="text-lg flex items-center text-gray-900 dark:text-white">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Chat with JSONata Helper
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col overflow-hidden p-6">
                {/* Messages - Scrollable Area */}
                <div className="flex-1 overflow-hidden mb-4">
                  <ScrollArea className="h-full">
                    <div className="space-y-4 pr-4">
                      {messages.length === 0 && !currentStreamingMessage && (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-purple-500 dark:to-purple-700 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <Code className="w-8 h-8 text-white" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            Welcome to JSONata Helper with File Search!
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                            Ask me to help you create JSONata expressions. Upload or paste JSON data to enable file search capabilities for
                            more accurate, context-aware suggestions.
                          </p>
                          {connectionStatus === "error" && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 rounded-lg max-w-md mx-auto">
                              <p className="text-sm text-red-700 dark:text-red-400 font-medium">⚠️ Azure AI Agents Connection Issue</p>
                              <p className="text-xs text-red-600 dark:text-red-500 mt-1">Please check your Azure AI Agents configuration</p>
                            </div>
                          )}
                        </div>
                      )}

                      {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} isStreaming={false} />
                      ))}

                      {currentStreamingMessage && (
                        <ChatMessage
                          message={{
                            id: "streaming",
                            role: "assistant",
                            content: currentStreamingMessage,
                            timestamp: new Date(),
                          }}
                          isStreaming={true}
                        />
                      )}

                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                </div>

                <Separator className="mb-4 flex-shrink-0 bg-gray-200 dark:bg-gray-700" />

                {/* Input Area - Fixed at bottom */}
                <div className="flex-shrink-0">
                  <div className="flex gap-3 items-end">
                    <TextareaAutosize
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Ask me to create a JSONata expression..."
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex-1 border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-purple-500 focus:ring-blue-500 dark:focus:ring-purple-500 bg-white dark:bg-gray-800 resize-none"
                      disabled={isLoading || connectionStatus !== "connected"}
                      minRows={2}
                      maxRows={5}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!input.trim() || isLoading || connectionStatus !== "connected"}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-purple-500 dark:to-purple-700 hover:from-blue-600 hover:to-indigo-700 dark:hover:from-purple-600 dark:hover:to-purple-800 flex-shrink-0 px-4 shadow-lg"
                      size="default"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
