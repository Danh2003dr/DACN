const axios = require('axios');

function createBackendClient({ backendApiUrl, authorization }) {
  return axios.create({
    baseURL: backendApiUrl,
    timeout: 60000,
    headers: {
      'Content-Type': 'application/json',
      ...(authorization ? { Authorization: authorization } : {})
    }
  });
}

module.exports = {
  createBackendClient
};


