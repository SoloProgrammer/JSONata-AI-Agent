
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
import { VectorStore } from "@/types/types";
import { EnvKeys } from "@/static/keys";

class AzureAIAgentsService {
  private client: AgentsClient | null = null;
  private currentVectorStore: VectorStore | null = null;
  private uploadedFiles: Map<string, string> = new Map();

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    try {
      console.log(":inside step 1", EnvKeys.azureAiProjectConnectionString);
      if (EnvKeys.azureAiProjectConnectionString) {
        this.client = new AgentsClient(EnvKeys.azureAiProjectConnectionString, new DefaultAzureCredential());
      }
    } catch (error) {
      console.error("Failed to initialize Azure AI Agents clients:", error);
    }
  }

  // Test connection to Azure AI Agents
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      if (!this.client || !EnvKeys.azureAiAgentId) {
        return {
          success: false,
          message: "Azure AI Agents not configured. Please check your connection string and agent ID.",
        };
      }

      // Try to get agent information
      const agent = await this.client.getAgent(EnvKeys.azureAiAgentId);

      console.log(`Connected to agent: ${agent.name || "JSONata Helper"}`);

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

      const folderpath = path.join(process.cwd(), EnvKeys.fileUploadFolderName);

      if (fs.existsSync(folderpath)) {
        fs.rmdirSync(folderpath, { recursive: true })
        console.log("folder deleted")
      }
      fs.mkdirSync(folderpath);

      await fsPromises.writeFile(`${EnvKeys.fileUploadFolderName}/${filename}`, jsonContent);

      console.log("file uploaded");

      const fileData = await fsPromises.readFile(`${EnvKeys.fileUploadFolderName}/${filename}`);

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
        name: "Jsonata Context Store",
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
      return error as string;
    }
  }

  // Update agent with vector store for file search
  async updateAgentWithVectorStore(vectorStoreId: string): Promise<boolean> {
    try {
      if (!this.client || !EnvKeys.azureAiAgentId) {
        throw new Error("Azure AI Agents client or agent ID not configured");
      }

      // Update agent to use the vector store for file search
      await this.client.updateAgent(EnvKeys.azureAiAgentId, {
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
    onChunk: (chunk: string) => void,
    onComplete: () => void
  ): Promise<void> {
    try {
        if (!this.client || !EnvKeys.azureAiAgentId) {
        throw new Error("Azure AI Agents not configured");
      }

      // Upload JSON file to Azure Storage and create file for vector store
      if (jsonContext) {
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

      const streamEventMessages = await this.client.runs.create(thread.id, EnvKeys.azureAiAgentId).stream();

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
                  console.log(`Text delta received:: ${textValue} - ${textValue.length}`);
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
}

// Export singleton instance
const azureAIAgentsService = new AzureAIAgentsService();

// Export functions for backward compatibility
export async function streamChatResponse(
  userMessage: string,
  jsonContext: any,
  onChunk: (chunk: string) => void,
  onComplete: () => void
): Promise<void> {
  return azureAIAgentsService.streamChatResponse(userMessage, jsonContext, onChunk, onComplete);
}

async function testAzureAIConnection(): Promise<{ success: boolean; message: string }> {
  return azureAIAgentsService.testConnection();
}

export { azureAIAgentsService, testAzureAIConnection };
