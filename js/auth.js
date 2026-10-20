/**
 * Authentication Module
 * Handles user login, session management, and access control
 */

const Auth = {
  /**
   * Performs user login
   * @param {string} username 
   * @param {string} pin 
   * @returns {Promise<boolean>}
   */
  async login(username, pin) {
    try {
      const userData = await API.login(username, pin);
      
      // Store user data in session storage
      sessionStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(userData));
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
   * Checks if user is logged in
   * @returns {boolean}
   */
  isAuthenticated() {
    return sessionStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) === 'authenticated';
  },

  /**
   * Gets current user data
   * @returns {Object|null}
   */
  getCurrentUser() {
    const userJson = sessionStorage.getItem(CONFIG.STORAGE_KEYS.USER);
    return userJson ? JSON.parse(userJson) : null;
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
