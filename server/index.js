const express = require("express");
const axios = require("axios");
const cors = require("cors");
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json());

const MAX_FILES = 10;
const SUPPORTED_EXTENSIONS = /\.(js|jsx|ts|tsx|py|java|cpp|c|cs|go|rs|rb|php|kt|swift|scala|sh|bash|bat|pl|r|lua|html|css|scss|sass|json|yml|yaml|xml|md|txt|ini|env|conf|config|lock|dockerfile|makefile|gradle|gitignore)$/i;

app.post("/api/summarize", async (req, res) => {
  const { url } = req.body;
  if (!url || !url.includes("github.com")) {
    return res.status(400).json({ error: "Invalid GitHub URL." });
  }

  const repoPath = url.split("github.com/")[1].replace(/\/$/, "");
  const [owner, repo] = repoPath.split("/");

  const headers = {
    Authorization: `token ${process.env.GITHUB_TOKEN}`,
  };

  try {
    const repoMeta = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    const repoLanguages = await axios.get(`https://api.github.com/repos/${repoPath}/languages`, { headers });

    const {
      name,
      description,
      stargazers_count,
      forks_count,
      language,
      owner: { login: ownerLogin, avatar_url },
      html_url
    } = repoMeta.data;

    let input = "";

    const readme = await getReadme(repoPath, headers);
    if (readme) {
      const readmeContent = await axios.get(readme.download_url);
      input = readmeContent.data.trim();
    }

    if (!input || input.length < 30) {
      const files = await collectCodeFiles("", repoPath, [], headers);
      if (files.length === 0) {
        return res.json({
          summary: "No files were found in the repository. Make sure the repo is public and contains valid source files.",
          metadata: {
            name,
            description,
            stargazers: stargazers_count,
            forks: forks_count,
            language,
            languages: repoLanguages.data,
            html_url,
            owner: {
              login: ownerLogin,
              avatar_url
            }
          }
        });
      }

      for (const file of files) {
        const content = await axios.get(file.download_url);
        input += `\n\n// FILE: ${file.path}\n${content.data}`;
      }
    }

    if (input.length > 20000) {
      input = input.slice(0, 20000);
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
You are an assistant that summarizes GitHub repositories.

Here are several files from a repository. Your task is to understand the overall structure and purpose of the project by analyzing all the files collectively.

Please provide a clear and concise overall summary of this project:
- What the project does
- What technologies or frameworks it uses
- Any likely features or purpose

Do NOT list files one-by-one. Focus on the overall architecture and goal.
Don't just explain files. Infer what the project **does**, what **problem** it solves, and who might use it.

--- START OF FILES ---
${input}
--- END OF FILES ---
`;

    const result = await model.generateContent([prompt]);
    const summary = result.response.text();

    if (!summary || summary.length < 20) {
      return res.json({
        summary: "Summary could not be generated from available files.",
        metadata: {
          name,
          description,
          stargazers: stargazers_count,
          forks: forks_count,
          language,
          languages: repoLanguages.data,
          html_url,
          owner: {
            login: ownerLogin,
            avatar_url
          }
        }
      });
    }

    res.json({
      summary,
      metadata: {
        name,
        description,
        stargazers: stargazers_count,
        forks: forks_count,
        language,
        languages: repoLanguages.data,
        html_url,
        owner: {
          login: ownerLogin,
          avatar_url
        }
      }
    });

  } catch (err) {
    console.error("❌ Error:", err.message);
    res.status(500).json({ error: "Failed to fetch metadata or generate summary." });
  }
});

async function getReadme(repoPath, headers) {
  try {
    const response = await axios.get(`https://api.github.com/repos/${repoPath}/readme`, { headers });
    return response.data;
  } catch (err) {
    return null;
  }
}

async function collectCodeFiles(path = "", repoPath, collected = [], headers) {
  if (collected.length >= MAX_FILES) return collected;

  try {
    const url = `https://api.github.com/repos/${repoPath}/contents/${path}`;
    const response = await axios.get(url, { headers });
    const items = response.data;

    for (const item of items) {
      if (collected.length >= MAX_FILES) break;

      if (
        item.type === "file" &&
        SUPPORTED_EXTENSIONS.test(item.name) &&
        item.size < 100_000
      ) {
        collected.push(item);
      } else if (
        item.type === "dir" &&
        !["node_modules", "dist", ".git", ".next", "build"].includes(item.name)
      ) {
        await collectCodeFiles(item.path, repoPath, collected, headers);
      }
    }
  } catch (err) {
    console.warn("⚠️ Skipping path:", path, "|", err.message);
  }

  return collected;
}

const PORT = 5000;
app.listen(PORT, () => console.log(`✅ GitPeek backend running at http://localhost:${PORT}`));
