/**
 * Authentication Module
 * Handles user login, session management, and access control
 */

const Auth = {
  /**
   * Session timeout (8 hours in milliseconds)
   */
  SESSION_TIMEOUT: 8 * 60 * 60 * 1000,

  /**
   * Performs user login
   * @param {string} username 
   * @param {string} pin 
   * @returns {Promise<boolean>}
   */
  async login(username, pin) {
    try {
      const userData = await API.login(username, pin);
      
      // Store user data and login timestamp
      const loginData = {
        user: userData,
        timestamp: new Date().getTime()
      };
      
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(loginData));
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, 'authenticated');
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  /**
   * Logs out the current user
   */
  logout() {
    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
    sessionStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
    window.location.href = 'index.html';
  },

  /**
   * Checks if user is logged in and session is valid
   * @returns {boolean}
   */
  isAuthenticated() {
    if (sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) !== 'authenticated') {
      return false;
    }
    
    // Check session timeout
    const loginDataJson = sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (!loginDataJson) {
      return false;
    }
    
    try {
      const loginData = JSON.parse(loginDataJson);
      const now = new Date().getTime();
      const elapsed = now - (loginData.timestamp || 0);
      
      // If session expired, clear and return false
      if (elapsed > this.SESSION_TIMEOUT) {
        this.logout();
        return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  },

  /**
   * Gets current user data
   * @returns {Object|null}
   */
  getCurrentUser() {
    const loginDataJson = sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    if (!loginDataJson) return null;
    
    try {
      const loginData = JSON.parse(loginDataJson);
      return loginData.user || loginData; // Support both old and new format
    } catch (e) {
      return null;
    }
  },

  /**
   * Checks if current user is admin
   * @returns {boolean}
   */
  isAdmin() {
    const user = this.getCurrentUser();
    return user && user.role === 'Admin';
  },

  /**
   * Checks if current user is staff
   * @returns {boolean}
   */
  isStaff() {
    const user = this.getCurrentUser();
    return user && user.role === 'Staff';
  },

  /**
   * Redirects to login page if not authenticated
   */
  requireAuth() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
    }
  },

  /**
   * Redirects to appropriate page based on role
   */
  redirectByRole() {
    if (!this.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }

    if (this.isAdmin()) {
      window.location.href = 'dashboard.html';
    } else if (this.isStaff()) {
      window.location.href = 'income.html';
    }
  },

  /**
   * Blocks access for non-admin users
   */
  requireAdmin() {
    this.requireAuth();
    if (!this.isAdmin()) {
      alert('Akses ditolak! Halaman ini hanya untuk Admin.');
      window.location.href = 'income.html';
    }
  }
};
