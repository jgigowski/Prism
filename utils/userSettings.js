const fs = require('fs').promises;
const path = require('path');

// Directory to store user settings
const SETTINGS_DIR = path.join(__dirname, '..', 'data', 'user-settings');

/**
 * Get the file path for a user's settings
 * @param {string} userId - The Okta user ID
 * @returns {string} Path to the user's settings file
 */
function getUserSettingsPath(userId) {
  // Sanitize userId to prevent directory traversal
  const sanitizedId = userId.replace(/[^a-zA-Z0-9-_]/g, '_');
  return path.join(SETTINGS_DIR, `${sanitizedId}.json`);
}

/**
 * Load user settings from JSON file
 * @param {string} userId - The Okta user ID
 * @returns {Promise<Object>} User settings object
 */
async function loadUserSettings(userId) {
  try {
    const filePath = getUserSettingsPath(userId);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist or is invalid, return empty settings
    if (error.code === 'ENOENT') {
      return {};
    }
    console.error(`Error loading settings for user ${userId}:`, error);
    return {};
  }
}

/**
 * Save user settings to JSON file
 * @param {string} userId - The Okta user ID
 * @param {Object} settings - Settings object to save
 * @returns {Promise<void>}
 */
async function saveUserSettings(userId, settings) {
  try {
    // Ensure settings directory exists
    await fs.mkdir(SETTINGS_DIR, { recursive: true });

    const filePath = getUserSettingsPath(userId);
    const data = JSON.stringify(settings, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
  } catch (error) {
    console.error(`Error saving settings for user ${userId}:`, error);
    throw error;
  }
}

/**
 * Update specific setting for a user
 * @param {string} userId - The Okta user ID
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @returns {Promise<void>}
 */
async function updateUserSetting(userId, key, value) {
  const settings = await loadUserSettings(userId);
  settings[key] = value;
  settings.lastUpdated = new Date().toISOString();
  await saveUserSettings(userId, settings);
}

/**
 * Get specific setting for a user
 * @param {string} userId - The Okta user ID
 * @param {string} key - Setting key
 * @param {*} defaultValue - Default value if setting doesn't exist
 * @returns {Promise<*>} Setting value
 */
async function getUserSetting(userId, key, defaultValue = null) {
  const settings = await loadUserSettings(userId);
  return settings[key] !== undefined ? settings[key] : defaultValue;
}

module.exports = {
  loadUserSettings,
  saveUserSettings,
  updateUserSetting,
  getUserSetting
};
