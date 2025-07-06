import { azureAIAgentsService } from "@/services/azure-ai-agents-service.service";
import { NextApiRequest, NextApiResponse } from "next";
import { NextResponse } from "next/server";

async function testAzureAIConnection(): Promise<{ success: boolean; message: string }> {
  return azureAIAgentsService.testConnection();
}

export async function GET(req: NextApiRequest, res: NextApiResponse) {
  console.log("-------", req.method);
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }
  const response = await testAzureAIConnection();
  return NextResponse.json(response, { status: 200 });
}
