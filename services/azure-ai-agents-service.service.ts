import { BlobServiceClient } from "@azure/storage-blob";
import { DefaultAzureCredential } from "@azure/identity";
import fsPromises from "fs/promises";
import fs from "fs";
import {
  AgentsClient,
  MessageDeltaChunk,
  MessageDeltaTextContent,
  RunStreamEvent,
  MessageStreamEvent,
  ErrorEvent,
  DoneEvent,
} from "@azure/ai-agents";
import { Readable } from "stream";
import path from "path";

// Environment variables for Azure AI Agents
const AZURE_AI_PROJECT_CONNECTION_STRING = process.env.NEXT_PUBLIC_AZURE_AI_PROJECT_CONNECTION_STRING;
const AZURE_AI_AGENT_ID = process.env.NEXT_PUBLIC_AZURE_AI_AGENT_ID;
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const AZURE_AI_API_KEY = process.env.NEXT_PUBLIC_AZURE_AI_API_KEY; // TODO: Will use this key in future

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  jsonContext?: any;
}

interface VectorStore {
  id: string;
  name: string;
  fileIds: string[];
}

class AzureAIAgentsService {
  private client: AgentsClient | null = null;
  private blobServiceClient: BlobServiceClient | null = null;
  private currentVectorStore: VectorStore | null = null;
  private uploadedFiles: Map<string, string> = new Map(); // filename -> fileId mapping

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    try {
      console.log(":inside step 1", AZURE_AI_PROJECT_CONNECTION_STRING);
      if (AZURE_AI_PROJECT_CONNECTION_STRING) {
        this.client = new AgentsClient(AZURE_AI_PROJECT_CONNECTION_STRING, new DefaultAzureCredential());
      }
      if (AZURE_STORAGE_CONNECTION_STRING) {
        this.blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
      }
    } catch (error) {
      console.error("Failed to initialize Azure AI Agents clients:", error);
    }
  }

  // Test connection to Azure AI Agents
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.client || !AZURE_AI_AGENT_ID) {
        return {
          success: false,
          message: "Azure AI Agents not configured. Please check your connection string and agent ID.",
        };
      }

      // Try to get agent information
      const agent = await this.client.getAgent(AZURE_AI_AGENT_ID);

      console.log(`Connected to agent: ${agent.name || "JSONata Helper"}`);

      // const userMessage =
      //   "Create a varialble AgencyName & assign it a value from Agency Name from Agency name or fro Wholessaler name but with the below condition \n if agenct partytype is Wholesale the read the name from Wholesaler else from Agency node";

      // Test the streamChatResponse here....
      // this.streamChatResponse(
      //   userMessage,
      //   {},
      //   [],
      //   () => {},
      //   () => {}
      // );

      return {
        success: true,
        message: `Connected to agent: ${agent.name || "JSONata Helper"}`,
      };
    } catch (error) {
      return {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  // Upload JSON file to Azure Storage and create file for vector store
  async uploadJsonFile(jsonData: any, filename: string = "context.json"): Promise<string | null> {
    try {
      if (!this.client) {
        throw new Error("Azure AI Agents client not initialized");
      }

      // Convert JSON to file content
      const jsonContent = JSON.stringify(jsonData, null, 2);

      const folderpath = path.join(process.cwd(), "data");

      if (fs.existsSync(folderpath)) {
        fs.rmdirSync(folderpath, { recursive: true })
        console.log("folder deleted")
      }
      fs.mkdirSync(folderpath);

      await fsPromises.writeFile(`data/${filename}`, jsonContent);

      console.log("file uploaded");

      const fileData = await fsPromises.readFile(`data/${filename}`);

      // Convert Buffer to a Readable Stream
      const stream = Readable.from(fileData);

      // Upload file to Azure AI Agents
      const uploadedFile = await this.client.files.upload(stream, "assistants", { fileName: filename });

      console.log("File uploaded successfully:", uploadedFile.id);
      this.uploadedFiles.set(filename, uploadedFile.id);
      return uploadedFile.id;
    } catch (error) {
      console.error("Failed to upload JSON file:", error);
      return null;
    }
  }

  // Create or update vector store with uploaded files
  async createVectorStore(name: string = "JSONata Context Store"): Promise<string | null> {
    try {
      if (!this.client) {
        throw new Error("Azure AI Agents client not initialized");
      }

      const fileIds = Array.from(this.uploadedFiles.values());

      if (fileIds.length === 0) {
        console.warn("No files uploaded to create vector store");
        return null;
      }

      // Create vector store with file search capability
      const vectorStore = await this.client.vectorStores.create({
        name: name,
        fileIds: fileIds,
        expiresAfter: {
          anchor: "last_active_at",
          days: 7, // Store expires after 7 days of inactivity
        },
      });

      this.currentVectorStore = {
        id: vectorStore.id,
        name: vectorStore.name || name,
        fileIds: fileIds,
      };

      console.log("Vector store created:", vectorStore.id);
      return vectorStore.id;
    } catch (error) {
      console.error("Failed to create vector store:", error);
      return null;
    }
  }

  // Update agent with vector store for file search
  async updateAgentWithVectorStore(vectorStoreId: string): Promise<boolean> {
    try {
      if (!this.client || !AZURE_AI_AGENT_ID) {
        throw new Error("Azure AI Agents client or agent ID not configured");
      }

      // Update agent to use the vector store for file search
      await this.client.updateAgent(AZURE_AI_AGENT_ID, {
        toolResources: {
          fileSearch: {
            vectorStoreIds: [vectorStoreId],
          },
        },
      });

      console.log("Agent updated with vector store:", vectorStoreId);
      return true;
    } catch (error) {
      console.error("Failed to update agent with vector store:", error);
      return false;
    }
  }

  // Stream chat response using Azure AI Agents with file search
  async streamChatResponse(
    userMessage: string = "",
    jsonContext: any = {},
    messageHistory: Message[] = [],
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
      if (!this.client || !AZURE_AI_AGENT_ID) {
        throw new Error("Azure AI Agents not configured");
      }

      // If we have JSON context and no current vector store, create one
      if (jsonContext && !this.currentVectorStore) {
        const fileId = await this.uploadJsonFile(jsonContext, `context-${Date.now()}.json`);
        if (fileId) {
          const vectorStoreId = await this.createVectorStore();
          if (vectorStoreId) {
            await this.updateAgentWithVectorStore(vectorStoreId);
          }
        }
      }

      // Create a thread for the conversation
      const thread = await this.client.threads.create({
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      });

      console.log("After Thread created------------");

      const streamEventMessages = await this.client.runs.create(thread.id, AZURE_AI_AGENT_ID).stream();

      for await (const eventMessage of streamEventMessages) {
        switch (eventMessage.event) {
          case RunStreamEvent.ThreadRunCreated:
            console.log(`ThreadRun status: Created`);
            break;
          case MessageStreamEvent.ThreadMessageDelta:
            {
              const messageDelta = eventMessage.data as MessageDeltaChunk;
              messageDelta.delta.content.forEach((contentPart) => {
                if (contentPart.type === "text") {
                  const textContent = contentPart;
                  const textValue = (textContent as MessageDeltaTextContent).text?.value || "No text";
                  console.log(`Text delta received:: ${textValue}`);
                  onChunk(textValue);
                }
              });
            }
            break;
          case RunStreamEvent.ThreadRunCompleted:
            console.log("Thread Run Completed");
            onComplete();
            break;
          case ErrorEvent.Error:
            console.log(`An error occurred. Data ${eventMessage.data}`);
            break;
          case DoneEvent.Done:
            console.log("Stream completed.");
            break;
        }
      }
    } catch (error) {
      console.error("Error in streamChatResponse:", error);

      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

      if (errorMessage.includes("not configured")) {
        onChunk(
          "❌ **Configuration Error**\n\nAzure AI Agents are not properly configured. Please check your environment variables:\n\n- `AZURE_AI_PROJECT_CONNECTION_STRING`\n- `AZURE_AI_AGENT_ID`\n\nSee the setup instructions for more details."
        );
      } else {
        onChunk(
          "❌ **Agent Error**\n\nSorry, I encountered an error while connecting to the Azure AI Agent. Please try again in a moment.\n\nError details: " +
            errorMessage
        );
      }

      onComplete();
    }
  }

  // Clean up resources
  async cleanup(): Promise<void> {
    try {
      if (this.currentVectorStore && this.client) {
        // Delete vector store when done
        await this.client.vectorStores.delete(this.currentVectorStore.id);
        console.log("Vector store cleaned up:", this.currentVectorStore.id);
      }

      // Delete uploaded files
      // for (const fileId of this.uploadedFiles.values()) {
      //   if (this.client) {
      //     await this.client.deleteFile(fileId);
      //   }
      // }

      this.uploadedFiles.clear();
      this.currentVectorStore = null;
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }

  // Get current vector store info
  getCurrentVectorStore(): VectorStore | null {
    return this.currentVectorStore;
  }

  // Get uploaded files info
  getUploadedFiles(): Map<string, string> {
    return this.uploadedFiles;
  }
}

// Export singleton instance
const azureAIAgentsService = new AzureAIAgentsService();

// Export functions for backward compatibility
export async function streamChatResponse(
  userMessage: string,
  jsonContext: any,
  messageHistory: Message[],
  onChunk: (chunk: string) => void,
  onComplete: () => void
): Promise<void> {
  return azureAIAgentsService.streamChatResponse(userMessage, jsonContext, messageHistory, onChunk, onComplete);
}

async function testAzureAIConnection(): Promise<{ success: boolean; message: string }> {
  return azureAIAgentsService.testConnection();
}

export { azureAIAgentsService, testAzureAIConnection };
