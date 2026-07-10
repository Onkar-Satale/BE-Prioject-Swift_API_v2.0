const axios = require('axios');

class AIService {
  async callBot(userId, message, currentApiContext, requestHistory) {
    const aiRes = await axios.post(`${process.env.GENAI_SERVICE_URL}/bot`, {
      userId: userId || 'guest',
      message,
      currentApiContext,
      requestHistory: requestHistory || []
    }, {
      headers: { 'x-api-key': process.env.GENAI_API_SECRET }
    });
    return aiRes;
  }

  async callAnalyze(analyzeData) {
    const aiRes = await axios.post(`${process.env.GENAI_SERVICE_URL}/analyze`, analyzeData, {
      headers: { 'x-api-key': process.env.GENAI_API_SECRET }
    });
    return aiRes;
  }
}

module.exports = new AIService();
