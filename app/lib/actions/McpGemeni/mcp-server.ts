import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Example tool: getPolls
const server = new McpServer({
  name: "alx-polly-mcp",
  version: "1.0.0",
  capabilities: {
    tools: {
      listChanged: true,
    },
  }
});

server.registerTool({
  name: "getPolls",
  description: "Fetch all polls from the database",
  inputSchema: z.object({}),
  handler: async () => {
    // Integrate with your Next.js backend or database here
    return { polls: [] }; // Replace with actual logic
  },
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("alx-polly MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});