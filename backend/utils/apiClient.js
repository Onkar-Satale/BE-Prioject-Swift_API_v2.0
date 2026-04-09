import axios from 'axios';

// Centralised Axios Client for internal routing features (like Request Proxy and GenAI)
export const apiClient = axios.create({
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Return error response so that it isn't thrown as exception 
    // unless there isn't a response (like network timeouts).
    if (error.response) {
      return Promise.resolve(error.response);
    }
    return Promise.reject(error);
  }
);
