require('dotenv').config();
const express = require('express');
const session = require('express-session');
const { ExpressOIDC } = require('@okta/oidc-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Session tracking for backchannel logout
// Maps user IDs to session IDs
const userSessions = new Map();

// Helper function to track user sessions
function trackUserSession(userId, sessionId) {
  if (!userSessions.has(userId)) {
    userSessions.set(userId, new Set());
  }
  userSessions.get(userId).add(sessionId);
  console.log(`Tracking session ${sessionId} for user ${userId}`);
}

// Helper function to get sessions for a user
function getUserSessionIds(userId) {
  return userSessions.get(userId) || new Set();
}

// Helper function to remove session tracking
function untrackUserSession(userId, sessionId) {
  if (userSessions.has(userId)) {
    userSessions.get(userId).delete(sessionId);
    if (userSessions.get(userId).size === 0) {
      userSessions.delete(userId);
    }
  }
}

// Export session tracking functions for use in routes
app.locals.trackUserSession = trackUserSession;
app.locals.getUserSessionIds = getUserSessionIds;
app.locals.untrackUserSession = untrackUserSession;

// Okta OIDC Configuration
const OKTA_AUTH_SERVER = process.env.OKTA_AUTH_SERVER_ID || 'default';

console.log('Configuring OIDC with:');
console.log('  Domain:', process.env.OKTA_DOMAIN);
console.log('  Auth Server:', OKTA_AUTH_SERVER);
console.log('  Issuer:', `https://${process.env.OKTA_DOMAIN}/oauth2/${OKTA_AUTH_SERVER}`);
console.log('  Client ID:', process.env.OKTA_CLIENT_ID);
console.log('  Redirect URI:', process.env.OKTA_REDIRECT_URI);

const oidc = new ExpressOIDC({
  issuer: `https://${process.env.OKTA_DOMAIN}/oauth2/${OKTA_AUTH_SERVER}`,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  appBaseUrl: process.env.OKTA_REDIRECT_URI.replace('/authorization-code/callback', ''),
  redirect_uri: process.env.OKTA_REDIRECT_URI,
  scope: 'openid profile email',
  routes: {
    login: {
      path: '/login'
    },
    loginCallback: {
      path: '/authorization-code/callback',
      afterCallback: '/home'
    }
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Step-up MFA login route - must be before OIDC router
// This route forces re-authentication with MFA requirement
app.get('/login/step-up', (req, res) => {
  const crypto = require('crypto');

  // Generate state and nonce for OIDC security
  const state = crypto.randomBytes(16).toString('hex');
  const nonce = crypto.randomBytes(16).toString('hex');

  // Store in session for verification on callback
  req.session.stepUpState = state;
  req.session.stepUpNonce = nonce;
  req.session.stepUpPending = true;

  // Build the authorization URL with ACR values for MFA
  const authorizationUrl = new URL(`https://${process.env.OKTA_DOMAIN}/oauth2/${OKTA_AUTH_SERVER}/v1/authorize`);
  authorizationUrl.searchParams.set('client_id', process.env.OKTA_CLIENT_ID);
  authorizationUrl.searchParams.set('response_type', 'code');
  authorizationUrl.searchParams.set('scope', 'openid profile email');
  authorizationUrl.searchParams.set('redirect_uri', process.env.OKTA_REDIRECT_URI);
  authorizationUrl.searchParams.set('state', state);
  authorizationUrl.searchParams.set('nonce', nonce);
  authorizationUrl.searchParams.set('acr_values', 'urn:okta:loa:1fa:any');// since this is step up use any 1 authenticator
  authorizationUrl.searchParams.set('max_age', '0'); // Force re-authentication

  res.redirect(authorizationUrl.toString());
});

// Step-up callback handler - intercepts before OIDC middleware when step-up is pending
app.get('/authorization-code/callback', async (req, res, next) => {
  // Only handle if this is a step-up callback
  if (!req.session.stepUpPending) {
    return next(); // Let OIDC middleware handle normal login
  }

  const axios = require('axios');

  try {
    const { code, state, error, error_description } = req.query;

    // Check for errors from Okta
    if (error) {
      console.error('Step-up auth error:', error, error_description);
      req.session.stepUpPending = false;
      return res.redirect('/settings?error=' + encodeURIComponent(error_description || 'MFA verification failed'));
    }

    // Verify state matches
    if (state !== req.session.stepUpState) {
      console.error('State mismatch in step-up callback');
      req.session.stepUpPending = false;
      return res.redirect('/settings?error=' + encodeURIComponent('Invalid state - please try again'));
    }

    // Exchange code for tokens
    await axios.post(
      `https://${process.env.OKTA_DOMAIN}/oauth2/${OKTA_AUTH_SERVER}/v1/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: process.env.OKTA_REDIRECT_URI,
        client_id: process.env.OKTA_CLIENT_ID,
        client_secret: process.env.OKTA_CLIENT_SECRET
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    // Mark step-up as verified
    req.session.stepUpVerified = Date.now();

    // Clean up step-up session data
    delete req.session.stepUpState;
    delete req.session.stepUpNonce;
    req.session.stepUpPending = false;

    // Redirect to the original destination
    const returnTo = req.session.stepUpReturnTo || '/settings';
    delete req.session.stepUpReturnTo;

    res.redirect(returnTo);
  } catch (err) {
    console.error('Step-up callback error:', err.response?.data || err.message);
    req.session.stepUpPending = false;
    res.redirect('/settings?error=' + encodeURIComponent('MFA verification failed'));
  }
});

// Okta middleware
app.use(oidc.router);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Make user info available to all templates and track sessions
app.use((req, res, next) => {
  res.locals.user = req.userContext ? req.userContext.userinfo : null;
  res.locals.isAuthenticated = req.isAuthenticated();

  // Track authenticated user sessions for backchannel logout
  if (req.isAuthenticated() && req.userContext?.userinfo?.sub && req.sessionID) {
    const userId = req.userContext.userinfo.sub;
    const sessionId = req.sessionID;

    // Track this session if not already tracked
    if (!req.session.tracked) {
      trackUserSession(userId, sessionId);
      req.session.tracked = true;
    }
  }

  next();
});

// Routes
const authRoutes = require('./routes/auth');
const indexRoutes = require('./routes/index');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const tokensRoutes = require('./routes/tokens');

// Root route - public landing page (must be before authRoutes to avoid conflicts)
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    res.redirect('/home');
  } else {
    res.render('landing', {
      title: 'User Portal - Home'
    });
  }
});

app.use('/', authRoutes);
app.use('/home', indexRoutes);
app.use('/profile', profileRoutes);
app.use('/settings', settingsRoutes);
app.use('/tokens', tokensRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500);
  res.render('error', {
    message: err.message || 'An error occurred',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Start server
oidc.on('ready', () => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});

oidc.on('error', (err) => {
  console.error('OIDC Error:', err);
});
