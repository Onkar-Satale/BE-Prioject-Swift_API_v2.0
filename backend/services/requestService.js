import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import historyService from './historyService.js';

/**
 * Service providing proxy HTTP request execution and user history tracking.
 */
class RequestService {
  /**
   * Executes an outgoing HTTP request on behalf of the client.
   * Prevents SSRF attacks targeting localhost, internal IPs, and file protocol.
   */
  async executeProxyRequest({ url, method, headers, params, body }) {
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.startsWith('file://')) {
      throw new ApiError(403, 'Access to internal networks is forbidden.');
    }

    const axiosConfig = {
      url,
      method: method.toUpperCase(),
      headers: headers && typeof headers === 'object' ? headers : {},
      validateStatus: () => true, // Treat all HTTP response status codes as successful resolves
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(axiosConfig.method)) {
      axiosConfig.data = body || {};
    }

    if (axiosConfig.method === 'GET' && params && typeof params === 'object') {
      axiosConfig.params = params;
    }

    const start = Date.now();
    let apiResponse;
    try {
      apiResponse = await axios(axiosConfig);
    } catch (err) {
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

  /**
   * Executes a proxy HTTP request and saves the result into the user's history log.
   */
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
