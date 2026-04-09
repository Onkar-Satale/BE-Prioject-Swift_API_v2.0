import { executeProxyRequest } from '../services/request.service.js';
import { pushHistoryItem } from '../services/history.service.js';

export const proxyRequestHandler = async (req, res, next) => {
  try {
    const { url, method, headers, params, body } = req.body;
    
    // Execute External Request
    const proxyResult = await executeProxyRequest({ url, method, headers, params, body });

    let historyId = null;
    const historyEntry = {
      method,
      url,
      status: proxyResult.status,
      duration: proxyResult.duration,
      responseBody: proxyResult.body,
    };

    // If userId exists (thanks to authOptional middleware that decodes token if present)
    if (req.userId) {
      const savedEntry = await pushHistoryItem(req.userId, historyEntry);
      historyId = savedEntry._id;
    }

    res.json({
      success: true,
      ...proxyResult,
      historyId, // May be null if guest
    });
  } catch (error) {
    next(error);
  }
};
