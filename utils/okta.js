const okta = require('@okta/okta-sdk-nodejs');
const axios = require('axios');
const OktaJwtVerifier = require('@okta/jwt-verifier');

// Initialize Okta Client
const oktaClient = new okta.Client({
  orgUrl: `https://${process.env.OKTA_DOMAIN}`,
  token: process.env.OKTA_API_TOKEN // Optional: for management API calls
});

// Initialize JWT Verifier for backchannel logout tokens
const jwtVerifier = new OktaJwtVerifier({
  issuer: `https://${process.env.OKTA_DOMAIN}/oauth2/default`,
  clientId: process.env.OKTA_CLIENT_ID
});

/**
 * Make authenticated API call to Okta
 */
async function oktaApiCall(accessToken, endpoint, method = 'GET', data = null) {
  const url = `https://${process.env.OKTA_DOMAIN}${endpoint}`;

  try {
    const response = await axios({
      method,
      url,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get user's applications
 * Note: Uses API token for Management API access
 */
async function getUserApps(accessToken, userId) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/appLinks`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get user profile
 * Note: Uses API token for Management API access
 */
async function getUserProfile(accessToken, userId) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update user profile
 * Note: Uses API token instead of access token for write permissions
 */
async function updateUserProfile(accessToken, userId, profileData) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}`;

  try {
    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: {
        profile: profileData
      }
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get user's enrolled factors (authenticators)
 * Note: Uses API token for Management API access
 */
async function getUserFactors(accessToken, userId) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/factors`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Enroll a new factor
 * Note: Uses API token for write permissions
 */
async function enrollFactor(accessToken, userId, factorData) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/factors`;

  try {
    const response = await axios({
      method: 'POST',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      data: factorData
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Remove a factor
 * Note: Uses API token for write permissions
 */
async function removeFactor(accessToken, userId, factorId) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/factors/${factorId}`;

  try {
    const response = await axios({
      method: 'DELETE',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Get available factor types for enrollment
 * Note: Uses API token for Management API access
 */
async function getAvailableFactors(accessToken, userId) {
  const url = `https://${process.env.OKTA_DOMAIN}/api/v1/users/${userId}/factors/catalog`;

  try {
    const response = await axios({
      method: 'GET',
      url,
      headers: {
        'Authorization': `SSWS ${process.env.OKTA_API_TOKEN}`,
        'Accept': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Okta API Error:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Revoke access and refresh tokens (Universal Logout)
 * Globally revokes user tokens on Okta's authorization server
 */
async function revokeTokens(accessToken, refreshToken) {
  const revokeUrl = `https://${process.env.OKTA_DOMAIN}/oauth2/default/v1/revoke`;
  const clientAuth = Buffer.from(`${process.env.OKTA_CLIENT_ID}:${process.env.OKTA_CLIENT_SECRET}`).toString('base64');

  try {
    // Revoke access token
    if (accessToken) {
      await axios({
        method: 'POST',
        url: revokeUrl,
        headers: {
          'Authorization': `Basic ${clientAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        data: `token=${accessToken}&token_type_hint=access_token`
      });
      console.log('Access token revoked successfully');
    }

    // Revoke refresh token
    if (refreshToken) {
      await axios({
        method: 'POST',
        url: revokeUrl,
        headers: {
          'Authorization': `Basic ${clientAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        data: `token=${refreshToken}&token_type_hint=refresh_token`
      });
      console.log('Refresh token revoked successfully');
    }

    return { success: true };
  } catch (error) {
    // Log error but don't throw - we still want to destroy local session
    console.error('Token revocation error:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify and decode logout token from Okta backchannel logout
 * Returns the user subject (ID) from the token
 */
async function verifyLogoutToken(logoutToken) {
  try {
    // Verify the JWT signature and decode
    const jwt = await jwtVerifier.verifyAccessToken(logoutToken, 'api://default');

    // Extract subject (user ID) from the token
    const userId = jwt.claims.sub;
    console.log('Verified logout token for user:', userId);

    return {
      success: true,
      userId,
      claims: jwt.claims
    };
  } catch (error) {
    console.error('Logout token verification error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  oktaClient,
  oktaApiCall,
  getUserApps,
  getUserProfile,
  updateUserProfile,
  getUserFactors,
  enrollFactor,
  removeFactor,
  getAvailableFactors,
  revokeTokens,
  verifyLogoutToken
};
