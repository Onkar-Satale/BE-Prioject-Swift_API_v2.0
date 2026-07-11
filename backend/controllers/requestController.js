import requestService from '../services/requestService.js';

export const proxyRequestHandler = async (req, res, next) => {
  try {
    const { url, method, headers, params, body } = req.body;
    
    // Execute External Request and Save to history
    const result = await requestService.executeAndSaveRequest(req.userId, { url, method, headers, params, body });

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};
