# JSONata Helper Chat App with Azure AI Agents

A beautiful web application that provides a chat interface to interact with a JSONata Helper AI Agent deployed on Azure AI Foundry, featuring **file search capabilities** with vector stores.

## 🚀 Features

- **Real-time Chat Interface**: Stream responses from your Azure AI Agents
- **File Search Integration**: Upload JSON files that become searchable knowledge for the agent
- **Vector Store Management**: Automatic creation and management of vector stores
- **JSON Context Support**: Upload JSON files or paste JSON data for context-aware suggestions
- **Dark/Light Mode**: Beautiful purple-themed dark mode with smooth transitions
- **Syntax Highlighting**: Proper JSONata code formatting with syntax highlighting
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Azure AI Agents Integration**: Direct connection to your Azure AI Foundry agent with file search

## 🔧 Setup Instructions

### 1. Azure AI Foundry Agent Configuration

You'll need the following from your Azure AI Foundry setup:

#### Required Environment Variables:

Create a `.env.local` file in the root directory with:

```env
# Your Azure AI Project Connection String
NEXT_PUBLIC_AZURE_AI_PROJECT_CONNECTION_STRING=Endpoint=https://your-project.cognitiveservices.azure.com/;ApiKey=your-api-key

# Your Azure AI Agent ID
NEXT_PUBLIC_AZURE_AI_AGENT_ID=your-agent-id-here

# Optional: Azure Storage Connection String
NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING=your-storage-connection-string-here
```

### 2. How to Get Your Azure AI Agents Credentials

#### **Step 1: Get Project Connection String**
1. Go to [Azure AI Foundry](https://ai.azure.com)
2. Navigate to your project
3. Go to **"Settings"** → **"Properties"**
4. Copy the **Connection String** (format: `Endpoint=https://...;ApiKey=...`)

#### **Step 2: Get Agent ID**
1. In your Azure AI Foundry project
2. Go to **"Agents"** section
3. Find your JSONata Helper agent
4. Copy the **Agent ID** (usually starts with `asst_`)

#### **Step 3: Optional - Storage Account**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to your Storage Account (or create one)
3. Go to **"Access keys"** section
4. Copy the **Connection string**

### 3. Environment Variable Examples

```env
# Example Azure AI Foundry Configuration
NEXT_PUBLIC_AZURE_AI_PROJECT_CONNECTION_STRING=Endpoint=https://my-project.cognitiveservices.azure.com/;ApiKey=1234567890abcdef1234567890abcdef

# Example Agent ID
NEXT_PUBLIC_AZURE_AI_AGENT_ID=asst_abc123def456ghi789

# Example Storage Connection String (Optional)
NEXT_PUBLIC_AZURE_STORAGE_CONNECTION_STRING=DefaultEndpointsProtocol=https;AccountName=mystorageaccount;AccountKey=...;EndpointSuffix=core.windows.net
```

### 4. Installation & Running

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build
```

### 5. Testing Your Connection

The app will automatically test your Azure AI Agents connection when it loads. Look for the connection status badges in the header:

- 🟡 **Testing Connection**: Checking your Azure AI Agents setup
- 🟢 **Azure AI Agents Connected**: Successfully connected
- 🔴 **Connection Error**: Check your credentials
- 🟦 **Creating Vector Store**: Processing uploaded JSON for file search
- 🟣 **Vector Store Ready**: File search is enabled
- 🟠 **Vector Store Error**: Issue with file search setup

## 🎨 Key Features Overview

### File Search Integration
- **Automatic Vector Store Creation**: When you upload JSON, it's automatically converted to a searchable vector store
- **Agent Knowledge Enhancement**: Your agent can now search through uploaded JSON data
- **Real-time Processing**: Vector stores are created and attached to your agent in real-time
- **Context-Aware Responses**: Agent responses are enhanced with knowledge from your uploaded files

### Chat Interface
- **Streaming Responses**: Real-time streaming from Azure AI Agents
- **Message History**: Conversation context maintained
- **Error Handling**: Comprehensive error handling with helpful messages
- **File Search Status**: Visual indicators for vector store status

### JSON Context Management
- **File Upload**: Drag & drop JSON files
- **Direct Paste**: Paste JSON directly into the interface
- **Vector Store Integration**: Uploaded JSON becomes searchable knowledge
- **Visual Feedback**: Clear status indicators for file processing

## 🔍 How File Search Works

1. **Upload JSON**: When you upload or paste JSON data
2. **File Creation**: The JSON is converted to a file and uploaded to Azure AI
3. **Vector Store**: A vector store is created containing your JSON data
4. **Agent Update**: Your agent is updated to use the vector store for file search
5. **Enhanced Responses**: The agent can now search through your JSON when answering questions

## 🛠️ Technical Implementation

### Azure AI Agents SDK Integration
- **@azure/ai-agents**: Official Azure AI Agents SDK
- **File Upload**: Direct file upload to Azure AI service
- **Vector Store Management**: Automatic creation and cleanup
- **Streaming Support**: Real-time response streaming
- **Error Handling**: Comprehensive error handling and recovery

### Supported Features
- **Thread Management**: Conversation threads for context
- **File Search Tool**: Automatic file search capability
- **Vector Store Lifecycle**: Creation, usage, and cleanup
- **Multiple File Support**: Support for multiple JSON files
- **Automatic Cleanup**: Resources are cleaned up when no longer needed

## 🔍 Troubleshooting

### Common Issues:

1. **Connection Error**: Check your project connection string and agent ID
2. **Agent Not Found**: Verify your agent ID is correct
3. **File Upload Failed**: Check your storage configuration (if using custom storage)
4. **Vector Store Error**: Ensure your agent has file search capabilities enabled

### Debug Steps:

1. Check browser console for detailed error messages
2. Verify all environment variables are set correctly
3. Test your Azure AI Foundry agent directly in the portal
4. Check Azure AI service status and quota
5. Verify your agent has file search tools enabled

## 📝 Usage Examples

### Basic JSONata Queries:
- "Help me filter an array of products by price"
- "How do I transform this JSON structure?"
- "Create an expression to sum all values"

### With File Search:
1. Upload your JSON file or paste JSON data
2. Wait for "Vector Store Ready" status
3. Ask specific questions about your data
4. Get context-aware JSONata expressions that reference your actual data structure

### Example Queries with File Search:
- "Create a JSONata expression to get all products with price > 100 from my uploaded data"
- "How do I extract customer names from the JSON I uploaded?"
- "Generate an expression to calculate the total revenue from my sales data"

## 🛠️ Technical Stack

- **Framework**: Next.js 13+ with App Router
- **Azure Integration**: @azure/ai-agents SDK
- **Storage**: @azure/storage-blob (optional)
- **Styling**: Tailwind CSS + shadcn/ui
- **Language**: TypeScript
- **Theme**: next-themes
- **Syntax Highlighting**: react-syntax-highlighter
- **Icons**: Lucide React

## 📄 License

This project is licensed under the MIT License.