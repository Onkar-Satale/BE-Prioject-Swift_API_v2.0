import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import historyService from './historyService.js';

class RequestService {
  async executeProxyRequest({ url, method, headers, params, body }) {
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
      throw new ApiError(403, 'Access to internal networks is forbidden.');
    }

    const axiosConfig = {
      url,
      method: method.toUpperCase(),
      headers: headers && typeof headers === 'object' ? headers : {},
      validateStatus: () => true, // resolve to standard Axios behavior but catch internal errs
    };

    // Only attach body for appropriate methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(axiosConfig.method)) {
      axiosConfig.data = body || {};
    }

    // Only attach query params if present and valid
    if (axiosConfig.method === 'GET' && params && typeof params === 'object') {
      axiosConfig.params = params;
    }

    const start = Date.now();
    let apiResponse;
    try {
      apiResponse = await axios(axiosConfig);
    } catch (err) {
      // Falls here if network error (e.g. timeout / no host found)
      apiResponse = err.response || { status: 'ERR', data: { error: err.message }, headers: {} };
    }
    const duration = Date.now() - start;

    return {
      status: apiResponse.status || 'ERR',
      headers: apiResponse.headers || {},
      body: apiResponse.data || {},
      duration
    };
  }

  async executeAndSaveRequest(userId, { url, method, headers, params, body }) {
    const proxyResult = await this.executeProxyRequest({ url, method, headers, params, body });

    const historyEntry = {
      method,
      url,
      status: proxyResult.status,
      duration: proxyResult.duration,
      responseBody: proxyResult.body,
    };

    const savedEntry = await historyService.pushHistoryItem(userId, historyEntry);
    
    return {
      ...proxyResult,
      historyId: savedEntry._id,
    };
  }
}

export default new RequestService();
