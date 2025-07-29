const EnvKeys = {
  azureAiProjectConnectionString: process.env.NEXT_PUBLIC_AZURE_AI_PROJECT_CONNECTION_STRING,
  azureAiAgentId: process.env.NEXT_PUBLIC_AZURE_AI_AGENT_ID,
  azureStorageConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING,
  azureAiApiKey: process.env.NEXT_PUBLIC_AZURE_AI_API_KEY,
  fileUploadFolderName: process.env.NEXT_PUBLIC_FILE_UPLOAD_FOLDER_NAME || "data",
}

const Api_endpoints = {
  testConnection: "/api/test-connection",
  streamChat: "/api/stream-chat",
}

export { EnvKeys, Api_endpoints }