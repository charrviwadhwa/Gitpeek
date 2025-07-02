const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
console.log("🔑 Gemini API key starts with:", process.env.GEMINI_API_KEY?.slice(0, 10));

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const MAX_FILES = 3;
const SUPPORTED_EXTENSIONS = /\.(js|ts|py|jsx|tsx)$/i;

// 🔁 Recursively fetch code files from nested folders
async function collectCodeFiles(path = "", repoPath, collected = []) {
  if (collected.length >= MAX_FILES) return collected;

  try {
    const url = `https://api.github.com/repos/${repoPath}/contents/${path}`;
    const response = await axios.get(url);
    const items = response.data;

    for (const item of items) {
      if (collected.length >= MAX_FILES) break;

      if (item.type === "file" && SUPPORTED_EXTENSIONS.test(item.name)) {
        console.log("📄 Found file:", item.path);
        collected.push(item);
      } else if (item.type === "dir") {
        await collectCodeFiles(item.path, repoPath, collected);
      }
    }
  } catch (err) {
    console.warn("⚠️ Skipping path:", path, "| Error:", err.message);
  }

  return collected;
}

app.post("/api/summarize", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.includes("github.com")) {
    return res.status(400).json({ error: "Invalid GitHub URL." });
  }

  const repoPath = url.split("github.com/")[1];

  try {
    // 🌐 Get root files of the repo
    const rootContents = await axios.get(`https://api.github.com/repos/${repoPath}/contents`);
    const files = rootContents.data;

    // 📝 Check for README.md
    const readme = files.find(f => /^readme\.md$/i.test(f.name));

    let input = "";
    let source = "";

    if (readme) {
      const readmeContent = await axios.get(readme.download_url);
      input = readmeContent.data;
      source = "README.md";
    } else {
      // 🧠 Recursively find top 3 code files
      const codeFiles = await collectCodeFiles("", repoPath);

      for (const file of codeFiles) {
        const content = await axios.get(file.download_url);
        input += `\nFile: ${file.path}\n${content.data}\n`;
      }

      source = "code";
    }

    if (!input.trim()) {
      return res.json({ summary: "No README or usable code found in this repo." });
    }

    // 🤖 Call Gemini with prompt
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      source === "README.md"
        ? `Summarize this GitHub project based on its README:\n${input}`
        : `This GitHub repo doesn't have a README. Based on the following code files, explain what the project does:\n${input}`;

    const result = await model.generateContent(prompt);
    const summary = result.response.text();

    res.json({ summary: summary || "No summary generated." });
  } catch (err) {
    console.error("Gemini Error:", err.message);
    res.status(500).json({ error: "Failed to generate summary." });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ GitPeek backend running at http://localhost:${PORT}`));
