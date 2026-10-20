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
 */

const CONFIG = {
  // TODO: Replace this with your actual Web App URL after deployment
  API_URL: 'YOUR_DEPLOYED_WEB_APP_URL_HERE',
  
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
