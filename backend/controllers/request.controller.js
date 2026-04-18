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

    // req.userId exists since authMiddleware strictly checks for it
    const savedEntry = await pushHistoryItem(req.userId, historyEntry);
    historyId = savedEntry._id;

    res.json({
      success: true,
      ...proxyResult,
      historyId,
    });
  } catch (error) {
    next(error);
  }
};
