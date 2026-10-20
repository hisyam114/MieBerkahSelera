/**
 * API Configuration
 * 
 * IMPORTANT: Replace the API_URL with your deployed Google Apps Script Web App URL
 * 
 * To get your Web App URL:
 * 1. Open Apps Script editor (Extensions → Apps Script in Google Sheets)
 * 2. Click Deploy → New deployment
 * 3. Select "Web app" type
 * 4. Deploy and copy the URL
 * 5. Paste it below
 * AKfycbwsoIWf_GPexrNd-zuNhlSC3SJGZVaC98_g0OmN1dDfbh8NtWv23hvjuRormU_Vg75A
 */



const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const CONFIG = {
  // Automatically uses local dev server API when on localhost, and Google Apps Script Web App in production/GitHub Pages
  API_URL: isLocal 
    ? '/api' 
    : 'https://script.google.com/macros/s/AKfycbxbYy0hIC0Z59wc0E7zjB2CyHLH8APjAWdwqeOyYVM8lLCHhPRJ-dsCzxVUJ48ZsxpU/exec',

  // Google Apps Script Web App URL
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxbYy0hIC0Z59wc0E7zjB2CyHLH8APjAWdwqeOyYVM8lLCHhPRJ-dsCzxVUJ48ZsxpU/exec',
  
  // App Settings
  APP_NAME: 'Mie Ayam Financial Recording',
  VERSION: '1.0.0',
  
  // Session Storage Keys
  STORAGE_KEYS: {
    USER: 'mie_ayam_user',
    TOKEN: 'mie_ayam_token'
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
