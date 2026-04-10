import { callBot, callAnalyze } from '../services/genai.service.js';

export const botHandler = async (req, res, next) => {
  try {
    const aiRes = await callBot(
      req.userId || req.body.userId, 
      req.body.message, 
      req.body.currentApiContext, 
      req.body.requestHistory
    );
    res.status(aiRes.status || 200).json(aiRes.data);
  } catch (error) {
    res.status(500).json({ text: '⚠️ Expected error connecting to AI backend. Ensure Python service is running.' });
  }
};

export const analyzeHandler = async (req, res, next) => {
  try {
    const aiRes = await callAnalyze(req.body);
    res.status(aiRes.status || 200).json(aiRes.data);
  } catch (error) {
    res.status(500).json({ text: '⚠️ Error running analysis. Ensure Python AI service is running.' });
  }
};
