const express = require("express");
const cors = require("cors");
const axios = require("axios");
const dotenv = require("dotenv");
const { OpenAI } = require("openai");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/summarize", async (req, res) => {
  const { url } = req.body;
  const repoPath = url.split("github.com/")[1];

  try {
    const repoContents = await axios.get(`https://api.github.com/repos/${repoPath}/contents`);
    const files = repoContents.data.filter(f => f.type === "file" && f.name.match(/\.(js|py|ts|jsx)$/i)).slice(0, 3);

    let code = "";
    for (const file of files) {
      const content = await axios.get(file.download_url);
      code += `\nFile: ${file.name}\n${content.data}\n`;
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a developer assistant that explains what a GitHub project does in simple terms.",
        },
        {
          role: "user",
          content: `Summarize this project's purpose:\n${code}`,
        },
      ],
    });

    res.json({ summary: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Failed to fetch and summarize the repository." });
  }
});

app.listen(5000, () => console.log("Server running at http://localhost:5000"));
