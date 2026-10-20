/**
 * API Communication Layer
 * Handles all HTTP requests to Google Apps Script backend
 */

const API = {
  /**
   * Authenticates user with username and PIN
   * @param {string} username 
   * @param {string} pin 
   * @returns {Promise<Object>} User data
   */
  async login(username, pin) {
    const timestamp = new Date().getTime();
    const url = `${CONFIG.API_URL}?action=login&username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}&_t=${timestamp}`;
    return await this._fetch(url);
  },

  /**
   * Fetches all items from Master_Barang
   * @returns {Promise<Array>} Array of items
   */
  async getMasterItems() {
    const timestamp = new Date().getTime();
    const url = `${CONFIG.API_URL}?action=master-items&_t=${timestamp}`;
    const response = await this._fetch(url);
    return response.items || [];
  },

  /**
   * Fetches dashboard data for a specific period
   * @param {string} period - 'today', 'week', 'month', or 'year'
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard(period = 'today') {
    // Add cache busting parameter
    const timestamp = new Date().getTime();
    const url = `${CONFIG.API_URL}?action=dashboard&period=${period}&_t=${timestamp}`;
    return await this._fetch(url);
  },

  /**
   * Submits daily income record
   * @param {Object} incomeData 
   * @returns {Promise<Object>} Response data
   */
  async submitIncome(incomeData) {
    return await this._post('income', incomeData);
  },

  /**
   * Submits expense record
   * @param {Object} expenseData 
   * @returns {Promise<Object>} Response data
   */
  async submitExpense(expenseData) {
    return await this._post('expense', expenseData);
  },

  /**
   * Generic GET request handler
   * @param {string} url 
   * @returns {Promise<Object>}
   */
  async _fetch(url) {
    try {
      // Simple GET without custom headers to avoid CORS preflight
      const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Request failed');
      }

      return data.data;
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error;
    }
  },

  /**
   * Generic POST request handler using URLSearchParams to avoid CORS preflight
   * @param {string} action 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async _post(action, data) {
    try {
      // Use URLSearchParams with form encoding to avoid CORS preflight
      const formData = new URLSearchParams();
      formData.append('action', action);
      
      // Add all data fields to form
      for (const [key, value] of Object.entries(data)) {
        formData.append(key, value);
      }
      
      const response = await fetch(CONFIG.API_URL, {
        method: 'POST',
        body: formData,
        redirect: 'follow'
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Request failed');
      }

      return result.data;
    } catch (error) {
      console.error('API Post Error:', error);
      throw error;
    }
  }
};
