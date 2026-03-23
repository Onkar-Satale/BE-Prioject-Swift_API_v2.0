import express from "express";
import axios from "axios";
import jwt from "jsonwebtoken";

const router = express.Router();
const SECRET = process.env.JWT_SECRET || "MY_SECRET_KEY";

// Optional auth middleware if you want to secure AI routes
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, SECRET);
      req.userId = decoded.userId || decoded.id;
    }
    next(); // Pass anyway, even if guest, or restrict it if needed
  } catch (err) {
    next();
  }
};

// Use middleware
router.use(authenticate);

// Helper to reliably get AI URL
const getAiBaseUrl = () => process.env.AI_SERVICE_URL || "http://127.0.0.1:8001";

// POST → Proxy chatbot request to GenAI
router.post("/bot", async (req, res) => {
  try {
    const aiRes = await axios.post(`${getAiBaseUrl()}/bot`, {
      userId: req.userId || req.body.userId || "guest",
      message: req.body.message,
      currentApiContext: req.body.currentApiContext,
      requestHistory: req.body.requestHistory || []
    });

    res.json(aiRes.data);
  } catch (err) {
    console.error("GenAI /bot error:", err.message);
    res.status(500).json({ text: "⚠️ Expected error connecting to AI backend. Ensure Python service is running." });
  }
});

// POST → Proxy analysis feature to GenAI
router.post("/analyze", async (req, res) => {
  try {
    const aiRes = await axios.post(`${getAiBaseUrl()}/analyze`, req.body);
    // BotSidebar expects `data.text` or similar. We should return raw aiRes.data so frontend handles it normally
    res.json(aiRes.data);
  } catch (err) {
    console.error("GenAI /analyze error:", err.message);
    res.status(500).json({ text: "⚠️ Error running analysis. Ensure Python AI service is running." });
  }
});

export default router;
