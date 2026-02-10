# Quick Start Guide

Get your Okta Prism running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Okta

### Create Okta Application
1. Go to [https://developer.okta.com](https://developer.okta.com) and sign up/login
2. Navigate to **Applications** > **Create App Integration**
3. Choose **OIDC** and **Web Application**
4. Configure:
   - Name: "Prism"
   - Sign-in redirect URI: `http://localhost:3000/authorization-code/callback`
   - Sign-out redirect URI: `http://localhost:3000`
5. Save and copy:
   - Client ID
   - Client Secret
   - Okta Domain (e.g., dev-xxxxx.okta.com)

## Step 3: Create .env File

```bash
cp .env.example .env
```

Edit `.env` with your Okta credentials:

```env
OKTA_DOMAIN=dev-xxxxx.okta.com
OKTA_CLIENT_ID=your_client_id
OKTA_CLIENT_SECRET=your_client_secret
OKTA_REDIRECT_URI=http://localhost:3000/authorization-code/callback
SESSION_SECRET=your_random_secret_change_this
PORT=3000
NODE_ENV=development
```

**Generate a strong SESSION_SECRET:**
```bash
openssl rand -base64 32
```

## Step 4: Run the Application

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

## Step 5: Test It Out

1. Open browser to `http://localhost:3000`
2. Click **Login**
3. Enter your Okta credentials
4. Explore the portal:
   - View your applications
   - Edit your profile
   - Manage authenticators

## Troubleshooting

### "Cannot find module" errors
Run `npm install` again

### OIDC configuration errors
- Double-check your `.env` file
- Verify Okta domain doesn't include `https://`
- Ensure redirect URI matches exactly

### No applications showing
- This is normal if you haven't assigned any apps to your user in Okta
- Go to Okta Dashboard > Applications > Assign users to apps

### Need help?
Check the full [README.md](./README.md) for detailed documentation.
