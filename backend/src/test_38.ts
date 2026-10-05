import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

const apiKey = "AIzaSyDAcB5A4waF6PKH4K6vEE8IuE2Jiktd67g";
const ai = new GoogleGenAI({ apiKey });

async function testAll() {
  const files = [
    {
      name: "Invoice",
      file: "Commercial Invoice on Wooden Desk.png",
      prompt: `Analyze this invoice and return JSON: {"invoiceNumber": string, "quantity": number, "sellerName": string}`
    },
    {
      name: "Ticket 1",
      file: "Industrial Weighbridge Ticket on Metal Surface.png",
      prompt: `Analyze this weighbridge ticket and return JSON: {"weight": number, "unit": string}`
    },
    {
      name: "Ticket 2",
      file: "Industrial Weighbridge Receipt on Steel.png",
      prompt: `Analyze this weighbridge ticket and return JSON: {"weight": number, "unit": string}`
    },
    {
      name: "Ticket 3",
      file: "Industrial Weighbridge Ticket on Desk.png",
      prompt: `Analyze this weighbridge ticket and return JSON: {"weight": number, "unit": string}`
    },
    {
      name: "Certificate",
      file: "Certificate of Analysis on Dark Desk.png",
      prompt: `Analyze this certificate and return JSON: {"certificateNumber": string, "issuerName": string}`
    }
  ];

  for (const item of files) {
    const fullPath = path.resolve(__dirname, "../../frontend/public/demo", item.file);
    const buf = fs.readFileSync(fullPath);
    console.log(`Sending ${item.name} to gemini-3.8-flash...`);
    const start = Date.now();
    try {
      const res = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: [{
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/png", data: buf.toString("base64") } },
            { text: item.prompt }
          ]
        }],
        config: { responseMimeType: "application/json" }
      });
      console.log(`[${item.name}] (${Date.now() - start}ms):`, res.text?.trim());
    } catch (e: any) {
      console.error(`[${item.name}] ERROR (${Date.now() - start}ms):`, e.message || e);
    }
  }
}

testAll().catch(console.error);
