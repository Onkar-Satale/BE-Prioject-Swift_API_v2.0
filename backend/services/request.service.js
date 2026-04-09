import { apiClient } from '../utils/apiClient.js';
import { ApiError } from '../utils/ApiError.js';

export const executeProxyRequest = async ({ url, method, headers, params, body }) => {
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
    apiResponse = await apiClient(axiosConfig);
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
};
