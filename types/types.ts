type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  jsonContext?: any;
}

type VectorStore = {
  id: string;
  name: string;
  fileIds: string[];
}

type ConnectionResponse = {
  success: boolean;
  message: string;
};

export type { Message, VectorStore, ConnectionResponse }