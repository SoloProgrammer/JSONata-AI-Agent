import { azureAIAgentsService } from "@/services/azure-ai-agents-service.service";
import { NextRequest, NextResponse } from "next/server";

async function testAzureAIConnection(): Promise<{ success: boolean; message: string }> {
  return azureAIAgentsService.testConnection();
}

export async function GET(req: NextRequest, res: NextResponse) {
  if (req.method !== "GET") {
    return NextResponse.json({ message: "Method not allowed" }, { status: 500 });
  }
  const response = await testAzureAIConnection();
  return NextResponse.json(response, { status: 200 });
}
