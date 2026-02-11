const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { getUserProfile, updateUserProfile } = require('../utils/okta');
const { getUserSetting, updateUserSetting } = require('../utils/userSettings');

/**
 * GET profile page
 */
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const accessToken = req.userContext.tokens.access_token;

    // Fetch full user profile from Okta
    const profile = await getUserProfile(accessToken, userInfo.sub);

    // Load security image from local settings
    const securityImage = await getUserSetting(userInfo.sub, 'securityImage');

    // Merge local settings with Okta profile
    const fullProfile = {
      ...profile.profile,
      securityImage
    };

    res.render('profile', {
      title: 'My Profile',
      user: userInfo,
      isAuthenticated: true,
      profile: fullProfile,
      success: req.query.success === 'true',
      error: req.query.error,
      darkMode: req.session.darkMode || false
    });
  } catch (error) {
    console.error('Profile page error:', error);
    res.status(500).render('error', {
      message: 'Unable to load profile',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

/**
 * POST update profile
 */
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const userInfo = req.userContext.userinfo;
    const accessToken = req.userContext.tokens.access_token;

    // Extract security image for local storage
    const securityImage = req.body.securityImage;

    // Extract profile fields for Okta (excluding securityImage)
    const profileData = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      mobilePhone: req.body.mobilePhone,
      secondEmail: req.body.secondEmail
    };

    // Update profile via Okta API
    await updateUserProfile(accessToken, userInfo.sub, profileData);

    // Save security image to local settings
    if (securityImage) {
      await updateUserSetting(userInfo.sub, 'securityImage', securityImage);
    }

    res.redirect('/profile?success=true');
  } catch (error) {
    console.error('Profile update error:', error);

    // Handle specific error cases
    let errorMessage = 'Failed to update profile';
    if (error.response?.data?.errorCode === 'E0000023') {
      errorMessage = 'Profile cannot be updated because it is managed by your organization\'s directory system. Please contact your IT administrator to make changes.';
    } else if (error.response?.data?.errorSummary) {
      errorMessage = error.response.data.errorSummary;
    }

    res.redirect('/profile?error=' + encodeURIComponent(errorMessage));
  }
});

/**
 * POST toggle dark mode
 */
router.post('/dark-mode', ensureAuthenticated, (req, res) => {
  try {
    req.session.darkMode = req.body.darkMode || false;
    res.json({ success: true });
  } catch (error) {
    console.error('Dark mode toggle error:', error);
    res.status(500).json({ success: false, error: 'Failed to save preference' });
  }
});

module.exports = router;
