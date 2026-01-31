
function obtenerBaseURL() {
  
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  return `http://${window.location.hostname}:3000`;
}

const API_BASE_URL = obtenerBaseURL();

console.log('API Base URL:', API_BASE_URL);
