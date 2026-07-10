const aiService = require('../services/aiService');

exports.botHandler = async (req, res, next) => {
  try {
    const aiRes = await aiService.callBot(
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

exports.analyzeHandler = async (req, res, next) => {
  try {
    const aiRes = await aiService.callAnalyze(req.body);
    res.status(aiRes.status || 200).json(aiRes.data);
  } catch (error) {
    res.status(500).json({ text: '⚠️ Error running analysis. Ensure Python AI service is running.' });
  }
};
