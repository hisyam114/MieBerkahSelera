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
    const url = `${CONFIG.API_URL}?action=login&username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`;
    return await this._fetch(url);
  },

  /**
   * Fetches all items from Master_Barang
   * @returns {Promise<Array>} Array of items
   */
  async getMasterItems() {
    const url = `${CONFIG.API_URL}?action=master-items`;
    const response = await this._fetch(url);
    return response.items || [];
  },

  /**
   * Fetches dashboard data for a specific period
   * @param {string} period - 'today', 'week', 'month', or 'year'
   * @returns {Promise<Object>} Dashboard data
   */
  async getDashboard(period = 'today') {
    const url = `${CONFIG.API_URL}?action=dashboard&period=${period}`;
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
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
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
   * Generic POST request handler
   * @param {string} action 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async _post(action, data) {
    try {
      const url = `${CONFIG.API_URL}?action=${action}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
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
