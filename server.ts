import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { MongoClient } from "mongodb";
import { z } from "zod";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI is missing. Set it in PowerShell first.");
}

const mongoClient = new MongoClient(uri);

const server = new McpServer({
  name: "sanjivani-farmer-server",
  version: "1.0.0",
});

async function main() {
  await mongoClient.connect();

  const db = mongoClient.db("Sanjivani_Sugar");
  const farmers = db.collection("Farmers");

  // Insert fictional sample records only if the collection is empty.
  if ((await farmers.countDocuments()) === 0) {
    await farmers.insertMany([
      { name: "Ramesh Patil", village: "Kopargaon", sugarcane_supplied_tons: 120.5, payment_pending: 25000, amount_paid: 85000 },
      { name: "Suresh Shinde", village: "Yeola", sugarcane_supplied_tons: 95, payment_pending: 18000, amount_paid: 62000 },
      { name: "Anil Jadhav", village: "Rahata", sugarcane_supplied_tons: 150.75, payment_pending: 42000, amount_paid: 108000 },
      { name: "Sunil Pawar", village: "Shirdi", sugarcane_supplied_tons: 80.25, payment_pending: 12000, amount_paid: 48000 },
      { name: "Mahesh More", village: "Niphad", sugarcane_supplied_tons: 200, payment_pending: 55000, amount_paid: 145000 },
      { name: "Vijay Deshmukh", village: "Sinnar", sugarcane_supplied_tons: 110, payment_pending: 22000, amount_paid: 78000 },
      { name: "Prakash Wagh", village: "Kopargaon", sugarcane_supplied_tons: 75.5, payment_pending: 9000, amount_paid: 51000 },
      { name: "Dinesh Gaikwad", village: "Rahata", sugarcane_supplied_tons: 180, payment_pending: 48000, amount_paid: 132000 },
      { name: "Ganesh Kadam", village: "Yeola", sugarcane_supplied_tons: 135.25, payment_pending: 30000, amount_paid: 95000 },
      { name: "Ashok Bhosale", village: "Shirdi", sugarcane_supplied_tons: 100, payment_pending: 15000, amount_paid: 70000 },
    ]);
    console.error("Inserted 10 sample farmer records.");
  }

  server.registerTool(
    "get_farmers",
    {
      description:
        "Retrieve farmer records from the Sanjivani Sugar Factory database, including village, sugarcane supplied in tons, pending payment, and amount already paid.",
      inputSchema: {},
    },
    async () => {
      const records = await farmers
        .find(
          {},
          {
            projection: {
              _id: 0,
              name: 1,
              village: 1,
              sugarcane_supplied_tons: 1,
              payment_pending: 1,
              amount_paid: 1,
            },
          },
        )
        .sort({ payment_pending: -1 })
        .toArray();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(records),
          },
        ],
      };
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Sanjivani MCP server is running.");
}

main().catch(async (error) => {
  console.error("Server error:", error);
  await mongoClient.close().catch(() => {});
  process.exitCode = 1;
});