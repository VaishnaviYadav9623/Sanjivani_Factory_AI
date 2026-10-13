import "dotenv/config";
import OpenAI from "openai";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const mcp = new Client({
    name: "sanjivani-farmer-client",
    version: "1.0.0",
  });

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["node_modules/tsx/dist/cli.mjs", "server.ts"],
    cwd: process.cwd(),
    env: process.env as Record<string, string>,
  });

  const rl = readline.createInterface({ input, output });

  try {
    await mcp.connect(transport);
    console.log("\n🌱 SANJIVANI AI FARMER ASSISTANT");
    console.log("Connected to MongoDB through the MCP server.");
    console.log("Ask any farmer-related question. Type 'exit' to quit.\n");

    const { tools } = await mcp.listTools();
    const farmerTool = tools.find(
      (tool) => tool.name === "get_farmers",
    );

    if (!farmerTool) {
      throw new Error("The get_farmers MCP tool was not found.");
    }

    while (true) {
      const question = (
        await rl.question("You: ")
      ).trim();

      if (!question) continue;

      if (["exit", "quit"].includes(question.toLowerCase())) {
        console.log("\nThank you for using Sanjivani AI!");
        break;
      }

      try {
        console.log("\nFetching farmer records and generating an answer...\n");

        // Get current farmer records using the MCP tool.
        const toolResult = await mcp.callTool({
          name: "get_farmers",
          arguments: {},
        });

        
const farmerData = Array.isArray(toolResult.content)
  ? toolResult.content
      .filter(
        (item): item is { type: "text"; text: string } =>
          typeof item === "object" &&
          item !== null &&
          "type" in item &&
          item.type === "text" &&
          "text" in item &&
          typeof item.text === "string"
      )
      .map((item) => item.text)
      .join("\n")
  : "";


        if (toolResult.isError) {
          throw new Error("The farmer-data tool returned an error.");
        }

        // Let AI answer the user's actual question.
        const response = await openai.responses.create({
          model: "gpt-4.1-mini",
          instructions: `
You are Sanjivani AI, an assistant for a sugar factory.

Answer the user's question using only the supplied farmer database records.
The records are fictional sample data for this demonstration.

Available fields:
- name: farmer's name
- village: farmer's village
- sugarcane_supplied_tons: sugarcane supplied in tons
- payment_pending: unpaid amount in rupees
- amount_paid: amount already paid in rupees

You can answer questions about:
- Highest or lowest sugarcane supplier
- Total or average sugarcane supplied
- Farmer details by village
- Highest or lowest pending payment
- Total pending payments or total amount paid
- Comparisons, rankings, and counts of farmers

For calculations, use the provided records and calculate carefully.
Use Indian rupee formatting for money and tons for sugarcane.
If the records do not contain enough information, say so.
Never invent farmer records or values.
Be clear, concise, and helpful.
          `,
          input:
            `Farmer database records:\n${farmerData}\n\n` +
            `User's question: ${question}`,
        });

        console.log("Sanjivani AI:", response.output_text, "\n");
      } catch (error) {
        console.error(
          "Could not answer this question:",
          error instanceof Error ? error.message : error,
          "\n",
        );
      }
    }
  } finally {
    rl.close();
    await mcp.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Application error:", error);
  process.exitCode = 1;
});