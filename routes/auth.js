const express = require('express');
const router = express.Router();
const { revokeTokens, verifyLogoutToken } = require('../utils/okta');

/**
 * Logout route with Universal Logout
 * Revokes tokens globally at Okta, destroys session, clears cookies
 */
router.get('/logout', async (req, res) => {
  // Extract tokens and user info from session before destroying
  const accessToken = req.userContext?.tokens?.access_token;
  const refreshToken = req.userContext?.tokens?.refresh_token;
  const userId = req.userContext?.userinfo?.sub;
  const sessionId = req.sessionID;

  try {
    // Revoke tokens at Okta (Universal Logout)
    if (accessToken || refreshToken) {
      console.log('Revoking tokens for universal logout...');
      await revokeTokens(accessToken, refreshToken);
    }
  } catch (error) {
    // Log error but continue with logout
    console.error('Error during token revocation:', error);
  }

  // Untrack session before destroying
  if (userId && sessionId) {
    const untrackUserSession = req.app.locals.untrackUserSession;
    untrackUserSession(userId, sessionId);
  }

  // Proceed with local session cleanup
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.redirect('/logged-out');
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }

      // Clear all cookies
      res.clearCookie('connect.sid');
      res.clearCookie('okta-oauth-nonce');
      res.clearCookie('okta-oauth-state');

      // Redirect directly to logged-out page
      res.redirect('/logged-out');
    });
  });
});

/**
 * Logged out landing page
 */
router.get('/logged-out', (req, res) => {
  // Make sure we're not showing as authenticated
  res.locals.isAuthenticated = false;
  res.locals.user = null;

  res.render('logged-out', {
    title: 'Logged Out',
    isAuthenticated: false,
    user: null
  });
});

/**
 * Backchannel Logout Endpoint
 * Receives logout notifications from Okta when user logs out elsewhere
 * Okta sends a signed JWT (logout_token) in the request body
 */
router.post('/logout/callback', express.json(), async (req, res) => {
  try {
    console.log('Received backchannel logout request from Okta');

    // Extract logout token from request body
    const logoutToken = req.body.logout_token;

    if (!logoutToken) {
      console.error('No logout_token in request body');
      return res.status(400).json({ error: 'Missing logout_token' });
    }

    // Verify the JWT and extract user ID
    const verification = await verifyLogoutToken(logoutToken);

    if (!verification.success) {
      console.error('Logout token verification failed:', verification.error);
      return res.status(400).json({ error: 'Invalid logout token' });
    }

    const userId = verification.userId;
    console.log(`Processing backchannel logout for user: ${userId}`);

    // Get session store and tracking functions from app
    const sessionStore = req.sessionStore;
    const getUserSessionIds = req.app.locals.getUserSessionIds;
    const untrackUserSession = req.app.locals.untrackUserSession;

    // Get all session IDs for this user
    const sessionIds = getUserSessionIds(userId);

    if (sessionIds.size === 0) {
      console.log(`No active sessions found for user ${userId}`);
      return res.status(200).send('OK');
    }

    // Destroy all sessions for this user
    let destroyedCount = 0;
    const destroyPromises = [];

    for (const sessionId of sessionIds) {
      destroyPromises.push(
        new Promise((resolve) => {
          sessionStore.destroy(sessionId, (err) => {
            if (err) {
              console.error(`Error destroying session ${sessionId}:`, err);
            } else {
              destroyedCount++;
              console.log(`Destroyed session ${sessionId} for user ${userId}`);
            }
            untrackUserSession(userId, sessionId);
            resolve();
          });
        })
      );
    }

    // Wait for all sessions to be destroyed
    await Promise.all(destroyPromises);

    console.log(`Backchannel logout complete: destroyed ${destroyedCount} session(s) for user ${userId}`);

    // Return 200 OK to Okta
    res.status(200).send('OK');

  } catch (error) {
    console.error('Backchannel logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
