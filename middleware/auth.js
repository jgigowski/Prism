/**
 * Authentication Middleware
 * Protects routes and ensures user is authenticated
 */

function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    // Store the original URL for redirect after login
    req.session.returnTo = req.originalUrl;
    return res.redirect('/login');
  }
  next();
}

function ensureAuthenticatedApi(req, res, next) {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = {
  ensureAuthenticated,
  ensureAuthenticatedApi
};
