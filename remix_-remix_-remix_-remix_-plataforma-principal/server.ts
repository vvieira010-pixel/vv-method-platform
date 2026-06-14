import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/generate-exercise", async (req, res) => {
    try {
      const { studentName, mode, context } = req.body;
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured. Please configure it in Settings > Secrets.");
      }

      const ai = new GoogleGenAI({ 
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `Create an English language learning exercise for a student named ${studentName}. 
The exercise type should be: ${mode}.
Additional context about the student: ${context}

Generate an English learning exercise prioritizing B1/B2 level. Make it engaging. The exercise type should match the request or be a mix if requested.
Use the following JSON schema:
{
  "title": "string",
  "description": "string",
  "items": [
    {
      "type": "multiple_choice",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctIndex": 0,
      "explanation": "string"
    },
    {
      "type": "fill_in_the_blank",
      "textBefore": "string",
      "textAfter": "string",
      "answer": "string",
      "explanation": "string"
    },
    {
      "type": "match_pairs",
      "instruction": "string",
      "pairs": [{"left": "string", "right": "string"}],
      "explanation": "string"
    },
    {
      "type": "true_false",
      "statement": "string",
      "isTrue": true,
      "explanation": "string"
    },
    {
      "type": "error_correction",
      "sentenceWithMistake": "string",
      "correctSentence": "string",
      "explanation": "string"
    }
  ]
}`;

      let rText: string | undefined;
      try {
        console.log("Generating with gemini-3.5-flash...");
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            responseMimeType: "application/json",
          }
        });
        rText = response.text;
      } catch (err: any) {
        console.warn("Primary call fails or is overloaded. Attempting fallback...", err);
        try {
          console.log("Generating with fallback model gemini-3.1-flash-lite...");
          const fallbackResponse = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            }
          });
          rText = fallbackResponse.text;
        } catch (fbErr: any) {
          console.error("Fallback call also failed:", fbErr);
          throw new Error(`AI generation failed: ${err.message || err}. Fallback error: ${fbErr.message || fbErr}`);
        }
      }

      // Robustly clean JSON strings from Gemini response (remove markdown backtick wrap if present)
      if (rText) {
        let cleaned = rText.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
        }
        rText = cleaned;
      }

      res.json({ content: rText });
    } catch (error: any) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate exercise" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
