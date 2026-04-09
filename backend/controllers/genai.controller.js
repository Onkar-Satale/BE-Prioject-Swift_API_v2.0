import { callBot, callAnalyze } from '../services/genai.service.js';

export const botHandler = async (req, res, next) => {
  try {
    const botResponse = await callBot(
      req.userId || req.body.userId, 
      req.body.message, 
      req.body.currentApiContext, 
      req.body.requestHistory
    );
    res.json(botResponse);
  } catch (error) {
    res.status(500).json({ text: '⚠️ Expected error connecting to AI backend. Ensure Python service is running.' });
  }
};

export const analyzeHandler = async (req, res, next) => {
  try {
    const analyzeResponse = await callAnalyze(req.body);
    res.json(analyzeResponse);
  } catch (error) {
    res.status(500).json({ text: '⚠️ Error running analysis. Ensure Python AI service is running.' });
  }
};
