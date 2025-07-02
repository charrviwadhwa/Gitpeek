// server/index.js
const express = require("express");
const cors = require("cors");
const summarizeRouter = require("./summarize");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/summarize", summarizeRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
