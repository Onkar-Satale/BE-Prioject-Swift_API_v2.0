import { apiClient } from '../utils/apiClient.js';
import { config } from '../config/env.js';

export const callBot = async (userId, message, currentApiContext, requestHistory) => {
  const aiRes = await apiClient.post(`${config.aiServiceUrl}/bot`, {
    userId: userId || 'guest',
    message,
    currentApiContext,
    requestHistory: requestHistory || []
  }, {
    headers: { 'x-ai-service-token': config.aiServiceSecret }
  });
  return aiRes.data;
};

export const callAnalyze = async (analyzeData) => {
  const aiRes = await apiClient.post(`${config.aiServiceUrl}/analyze`, analyzeData, {
    headers: { 'x-ai-service-token': config.aiServiceSecret }
  });
  return aiRes.data;
};
