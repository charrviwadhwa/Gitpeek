// api/summarize.js
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MAX_FILES = 10;
const SUPPORTED_EXTENSIONS = /\.(js|ts|jsx|tsx|py|java|cpp|c|cs|go|rs|rb|php|kt|swift|scala|sh|bash|bat|pl|r|lua|html|css|scss|json|yml|xml|md|txt|env|conf|lock|dockerfile|makefile|gradle|gitignore)$/i;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Only POST requests allowed" });
  }

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
    const repoMeta = await axios.get(`https://api.github.com/repos/${repoPath}`, { headers });
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
        return res.json({ summary: "Repo is empty or private.", metadata: null });
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
--- START OF FILES ---
${input}
--- END OF FILES ---
`;

    const result = await model.generateContent([prompt]);
    const summary = result.response.text();

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
    console.error("❌ API Error:", err.message);
    return res.status(500).json({ error: "Failed to generate summary. Possibly a private or invalid repo." });
  }
}

// Helper: Fetch README
async function getReadme(repoPath, headers) {
  try {
    const res = await axios.get(`https://api.github.com/repos/${repoPath}/readme`, { headers });
    return res.data;
  } catch {
    return null;
  }
}

// Helper: Recursively collect files
async function collectCodeFiles(path = "", repoPath, collected = [], headers) {
  if (collected.length >= MAX_FILES) return collected;
  try {
    const url = `https://api.github.com/repos/${repoPath}/contents/${path}`;
    const res = await axios.get(url, { headers });
    const items = res.data;

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
        !["node_modules", "dist", ".git", "build", ".next"].includes(item.name)
      ) {
        await collectCodeFiles(item.path, repoPath, collected, headers);
      }
    }
  } catch (err) {
    console.warn("⚠️ Skipping", path, "|", err.message);
  }
  return collected;
}
