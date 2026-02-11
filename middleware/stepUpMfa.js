/**
 * Step-Up MFA Middleware
 * Requires additional MFA verification for sensitive routes
 */

const STEP_UP_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

/**
 * Middleware that ensures the user has completed step-up MFA recently.
 * If not, redirects to the step-up authentication flow.
 */
function ensureStepUpMfa(req, res, next) {
  const stepUpVerified = req.session.stepUpVerified;

  // Check if step-up was completed recently
  if (stepUpVerified && (Date.now() - stepUpVerified) < STEP_UP_TIMEOUT_MS) {
    return next();
  }

  // Store the return URL for after step-up completion
  req.session.stepUpReturnTo = req.originalUrl;

  // Redirect to step-up authentication
  res.redirect('/login/step-up');
}

module.exports = {
  ensureStepUpMfa,
  STEP_UP_TIMEOUT_MS
};
