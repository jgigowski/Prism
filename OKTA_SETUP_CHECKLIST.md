# Okta Setup Checklist

Use this checklist to configure your Okta organization for the Prism application.

## Prerequisites
- [ ] Okta Developer account created at [https://developer.okta.com](https://developer.okta.com)
- [ ] Admin access to your Okta organization

---

## Step 1: Create OIDC Application

### Navigate to Applications
- [ ] Log into Okta Admin Console
- [ ] Go to **Applications** > **Applications**
- [ ] Click **Create App Integration**

### Configure Application Type
- [ ] Select **OIDC - OpenID Connect**
- [ ] Select **Web Application**
- [ ] Click **Next**

### General Settings
- [ ] **App integration name**: `Prism` (or your preferred name)
- [ ] **Logo**: Upload company logo (optional)

### Application Settings

#### Grant Types
- [ ] Check **Authorization Code** (required)
- [ ] Uncheck **Implicit (hybrid)** (not needed)
- [ ] Uncheck **Refresh Token** (optional, can enable if needed)

#### Sign-in Redirect URIs
Add the following:
- [ ] `http://localhost:3000/authorization-code/callback` (for local development)
- [ ] Add production URL when deploying (e.g., `https://portal.yourcompany.com/authorization-code/callback`)

#### Sign-out Redirect URIs
Add the following:
- [ ] `http://localhost:3000` (for local development)
- [ ] Add production URL when deploying (e.g., `https://portal.yourcompany.com`)

#### Controlled Access
- [ ] Select **Allow everyone in your organization to access** (or)
- [ ] Select **Limit access to selected groups** and choose specific groups

### Save and Copy Credentials
- [ ] Click **Save**
- [ ] Copy **Client ID** (you'll need this for `.env`)
- [ ] Copy **Client secret** (click to reveal, you'll need this for `.env`)
- [ ] Note your **Okta domain** (e.g., `dev-xxxxx.okta.com`)

---

## Step 2: Configure Trusted Origins (Optional but Recommended)

This prevents CORS issues:

- [ ] Go to **Security** > **API** > **Trusted Origins**
- [ ] Click **Add Origin**

### For Local Development
- [ ] **Name**: `Local Development`
- [ ] **Origin URL**: `http://localhost:3000`
- [ ] Check **CORS**
- [ ] Check **Redirect**
- [ ] Click **Save**

### For Production (when deploying)
- [ ] **Name**: `Production`
- [ ] **Origin URL**: Your production URL (e.g., `https://portal.yourcompany.com`)
- [ ] Check **CORS**
- [ ] Check **Redirect**
- [ ] Click **Save**

---

## Step 3: Configure Authorization Server

- [ ] Go to **Security** > **API** > **Authorization Servers**
- [ ] Click on **default** authorization server (or your custom authorization server)
- [ ] **Note the Authorization Server ID** from the URL or settings (e.g., `default` or a custom ID like `aus1234567890`)

### Verify Scopes
Ensure these scopes exist and are enabled:
- [ ] `openid` - Basic OpenID Connect
- [ ] `profile` - User profile information
- [ ] `email` - Email address

If any are missing, add them:
- [ ] Click **Scopes** tab
- [ ] Click **Add Scope**
- [ ] Fill in required fields and save

---

## Step 4: Assign Users to Application

### Option A: Assign Everyone
- [ ] Go to **Applications** > **Applications**
- [ ] Click on your **Prism** app
- [ ] Go to **Assignments** tab
- [ ] The app should already allow everyone (if configured in Step 1)

### Option B: Assign Specific Users/Groups
- [ ] Go to **Assignments** tab
- [ ] Click **Assign** dropdown
- [ ] Select **Assign to People** or **Assign to Groups**
- [ ] Select users/groups and click **Assign**
- [ ] Repeat for all users who need access

---

## Step 5: (Optional) Assign Applications to Users

For the **Applications Dashboard** to show apps:

- [ ] Go to **Applications** > **Applications**
- [ ] Click on any application you want users to see
- [ ] Go to **Assignments** tab
- [ ] Click **Assign** > **Assign to People**
- [ ] Assign the test users
- [ ] Click **Save and Go Back**
- [ ] Repeat for each application

---

## Step 6: (Optional) Configure Authentication Policies

For enhanced security:

- [ ] Go to **Security** > **Authentication Policies**
- [ ] Review or create policies for your application
- [ ] Configure MFA requirements if desired

---

## Step 7: (Optional) Create API Token

For advanced features (like factor management that requires elevated privileges):

- [ ] Go to **Security** > **API** > **Tokens**
- [ ] Click **Create Token**
- [ ] **Name**: `Prism API Token`
- [ ] Click **Create Token**
- [ ] **Copy the token immediately** (you won't be able to see it again)
- [ ] Add to `.env` as `OKTA_API_TOKEN=your_token_here`

**Note**: The current implementation uses access tokens for API calls, so this is optional.

---

## Step 8: Test Users (For Development)

Create test users if needed:

- [ ] Go to **Directory** > **People**
- [ ] Click **Add Person**
- [ ] Fill in user details:
  - [ ] First name
  - [ ] Last name
  - [ ] Username (email format)
  - [ ] Password (set by admin)
- [ ] **Activation**: Send activation email or activate immediately
- [ ] Click **Save**
- [ ] Assign user to **Prism** application (see Step 4)

---

## Step 9: Update .env File

Back in your application directory:

- [ ] Copy `.env.example` to `.env`
- [ ] Update `.env` with values from Okta:

```env
OKTA_DOMAIN=dev-xxxxx.okta.com              # From Step 1
OKTA_CLIENT_ID=0oa...                       # From Step 1
OKTA_CLIENT_SECRET=abc123...                 # From Step 1
OKTA_REDIRECT_URI=http://localhost:3000/authorization-code/callback
OKTA_AUTH_SERVER_ID=default                  # From Step 3 (use 'default' or custom auth server ID)
SESSION_SECRET=generate_random_string        # Run: openssl rand -base64 32
PORT=3000
NODE_ENV=development
```

- [ ] Generate strong SESSION_SECRET: `openssl rand -base64 32`

---

## Step 10: Verify Configuration

### Test in Okta Admin Console
- [ ] Go to **Applications** > **Applications** > **Prism**
- [ ] Click **General** tab
- [ ] Verify all settings are correct
- [ ] Check **Client Credentials** section shows Client ID

### Test Application Login
- [ ] Start the application: `npm start`
- [ ] Navigate to `http://localhost:3000`
- [ ] Click **Login**
- [ ] Should redirect to Okta login page
- [ ] Login with test user credentials
- [ ] Should redirect back to application home page

---

## Troubleshooting

### "Invalid client" error
- [ ] Verify Client ID in `.env` matches Okta
- [ ] Verify Client Secret in `.env` matches Okta
- [ ] Check that client credentials haven't expired

### "Redirect URI mismatch" error
- [ ] Verify redirect URI in `.env` exactly matches Okta configuration
- [ ] Check for trailing slashes or http vs https mismatches
- [ ] Ensure redirect URI is added to Okta app settings

### "Access denied" error
- [ ] Verify user is assigned to the application
- [ ] Check authentication policies aren't blocking access
- [ ] Verify authorization server is active

### CORS errors
- [ ] Add Trusted Origin in Okta (Step 2)
- [ ] Verify origin URL matches exactly (including port)
- [ ] Check both CORS and Redirect are enabled

### No applications showing on home page
- [ ] This is normal if no apps are assigned to the user
- [ ] Assign applications to test user (Step 5)
- [ ] Refresh the page after assigning apps

---

## Security Best Practices

- [ ] Use strong, unique SESSION_SECRET (never reuse)
- [ ] Never commit `.env` file to version control
- [ ] Rotate Client Secret periodically
- [ ] Enable MFA for admin accounts
- [ ] Review and limit API token permissions
- [ ] Use HTTPS in production (required)
- [ ] Set up IP allowlisting if needed
- [ ] Monitor Okta System Log for suspicious activity

---

## Production Deployment Checklist

When deploying to production:

- [ ] Create new Okta application or update existing one
- [ ] Update redirect URIs with production URLs
- [ ] Add production Trusted Origin
- [ ] Update `.env` with production values
- [ ] Set `NODE_ENV=production`
- [ ] Generate new SESSION_SECRET for production
- [ ] Enable HTTPS
- [ ] Test authentication flow
- [ ] Monitor logs for errors

---

## Quick Reference

### Okta Admin URLs
- **Admin Console**: `https://your-domain-admin.okta.com`
- **Applications**: `/admin/apps/active`
- **Users**: `/admin/users`
- **API Tokens**: `/admin/access/api/tokens`
- **Authorization Servers**: `/admin/oauth2/as`

### Application Endpoints
- **Login**: `http://localhost:3000/login`
- **Callback**: `http://localhost:3000/authorization-code/callback`
- **Home**: `http://localhost:3000/home`
- **Profile**: `http://localhost:3000/profile`
- **Settings**: `http://localhost:3000/settings`
- **Logout**: `http://localhost:3000/logout`

---

## Resources

- **Okta Developer Docs**: https://developer.okta.com/docs/
- **OIDC Documentation**: https://developer.okta.com/docs/concepts/oauth-openid/
- **Okta SDK Documentation**: https://github.com/okta/okta-sdk-nodejs
- **Prism README**: See [README.md](./README.md)

---

**Setup Complete!** ✅

Once all checkboxes are complete, your Okta configuration is ready and you can start using the Prism.
