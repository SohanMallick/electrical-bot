const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const envPath = path.join(__dirname, ".env");

if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, "utf8");
  const envLines = envFile.split(/\r?\n/);

  for (const line of envLines) {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();

    if (key && !process.env[key]) {
      process.env[key] = value.replace(/^"(.*)"$/, "$1");
    }
  }
}

const apiKey = process.env.GEMINI_API_KEY;
const MODEL_NAMES = ["gemini-2.5-flash", "gemini-2.0-flash"];
const MAX_RETRIES = 3;
const frontendPath = path.join(__dirname, "../frontend");
const knowledgePath = path.join(__dirname, "../knowledge/training.json");

if (!apiKey) {
  throw new Error("Missing GEMINI_API_KEY environment variable.");
}

const genAI = new GoogleGenerativeAI(apiKey);

const knowledge = fs.readFileSync(knowledgePath, "utf8");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(frontendPath));

const PORT = Number(process.env.PORT) || 5000;

async function askAI(question) {
  const prompt = `
You are an assistant helping electrical distribution workers with safety training.

Use this knowledge base when answering:

${knowledge}

Worker question:
${question}

Give a clear safety focused answer.
`;

  let lastError;

  for (const modelName of MODEL_NAMES) {
    const model = genAI.getGenerativeModel({
      model: modelName,
    });

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        lastError = error;

        if (error.status !== 503 || attempt === MAX_RETRIES) {
          break;
        }

        const delayMs = attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

app.post("/chat", async (req, res) => {
  try {
    const question = req.body.message;

    if (!question) {
      return res.status(400).json({
        reply: "A message is required.",
      });
    }

    const reply = await askAI(question);

    return res.json({ reply });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      reply: "Sorry, something went wrong.",
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
