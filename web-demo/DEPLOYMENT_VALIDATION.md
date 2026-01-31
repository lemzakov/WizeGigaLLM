# Deployment Validation Guide

This document provides instructions for validating that the WizeGigaLLM web demo is properly deployed and the test page is accessible.

## Pre-Deployment Checklist

Before deploying to Vercel, ensure:

1. ✅ **Build succeeds locally**
   ```bash
   npm run build
   ```
   The build output should show the `/test` route:
   ```
   └ ○ /test                                2.87 kB         108 kB
   ```

2. ✅ **Production mode works locally**
   ```bash
   npm start
   ```
   Navigate to `http://localhost:3000/test` and verify the page loads.

3. ✅ **All routes are generated**
   Check that the build includes:
   - `/` (Home page)
   - `/test` (Test suite page)
   - `/chat` (Chat demo)
   - `/settings` (Settings page)
   - `/api/chat` (Chat API route)
   - `/api/config` (Config API route)

## Vercel Deployment Validation

### 1. Deploy to Vercel

Using the deployment script:
```bash
cd web-demo
./deploy.sh
```

Or manually:
```bash
cd web-demo
npm install
npm run build
vercel --prod
```

### 2. Configure Environment Variables

In the Vercel Dashboard, add these environment variables:
- `GIGACHAT_CREDENTIALS` - Your GigaChat API credentials
- `GIGACHAT_BASE_URL` - `https://gigachat.devices.sberbank.ru/api/v1`
- `GIGACHAT_VERIFY_SSL_CERTS` - `false` (or `true` for production)

### 3. Verify Test Page Accessibility

After deployment, verify the test page is accessible:

**URL Pattern:** `https://your-deployment-url.vercel.app/test`

**Expected Behavior:**
1. ✅ Page loads without errors
2. ✅ Navigation menu shows "Test" link
3. ✅ "Run All Tests" button is visible
4. ✅ All four test sections are displayed:
   - API Configuration
   - API Connection
   - Chat Endpoint
   - Error Handling
5. ✅ Feature checklist is visible
6. ✅ Manual testing instructions are displayed
7. ✅ Deployment verification section is present

### 4. Run Automated Tests

Click the "🚀 Run All Tests" button and verify:

1. **API Configuration Test**
   - Should pass if environment variables are configured
   - Status: ✅ Success - "Configuration loaded successfully"

2. **API Connection Test**
   - Should pass if credentials are valid
   - Status: ✅ Success - "Successfully connected to GigaChat API"
   - Note: May fail if credentials are not set (expected during initial deployment)

3. **Chat Endpoint Test**
   - Tests the `/api/chat` endpoint
   - Sends a test message to GigaChat
   - Status: ✅ Success - "Chat endpoint working correctly"

4. **Error Handling Test**
   - Tests validation and error responses
   - Status: ✅ Success - "Error handling works correctly"

### 5. Manual Verification

Navigate through all pages to ensure routing works:

1. **Home Page** (`/`)
   - Click "Run Tests" button → Should go to `/test`
   - Click "Try Chat Demo" button → Should go to `/chat`
   - Click "Check Settings" button → Should go to `/settings`

2. **Test Page** (`/test`)
   - Click "Test Chat" → Should go to `/chat`
   - Click "Test Settings" → Should go to `/settings`
   - Click navigation links → Should work correctly

3. **Chat Page** (`/chat`)
   - Should load without errors
   - Input field should be visible
   - Send button should be present

4. **Settings Page** (`/settings`)
   - Configuration should be displayed
   - Test Connection button should work

## Common Issues and Solutions

### Issue: Test page returns 404

**Cause:** Next.js routing not configured properly or build failed.

**Solution:**
1. Check build output for `/test` route
2. Verify file exists at `src/app/test/page.tsx`
3. Rebuild and redeploy:
   ```bash
   npm run build
   vercel --prod
   ```

### Issue: Tests fail with "GIGACHAT_CREDENTIALS not set"

**Cause:** Environment variables not configured in Vercel.

**Solution:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add required variables (see section 2 above)
3. Redeploy the application

### Issue: API tests timeout

**Cause:** GigaChat API not reachable or credentials invalid.

**Solution:**
1. Verify credentials are correct and base64 encoded
2. Check `GIGACHAT_BASE_URL` is set correctly
3. Try setting `GIGACHAT_VERIFY_SSL_CERTS=false` for testing

### Issue: Page loads but automated tests don't run

**Cause:** Client-side JavaScript not loading or API routes not working.

**Solution:**
1. Check browser console for errors (F12)
2. Verify API routes are deployed:
   - `https://your-url.vercel.app/api/config`
   - `https://your-url.vercel.app/api/chat`
3. Check Vercel function logs for errors

## Deployment Verification Screenshot

After deployment, the test page should look like this:

![Test Page](https://github.com/user-attachments/assets/c6834a65-7ac5-4194-86d3-d4383ee80866)

## Quick Validation Commands

```bash
# Check if build includes test page
npm run build | grep "/test"

# Expected output:
# └ ○ /test                                2.87 kB         108 kB

# Start production server locally
npm start

# In another terminal, test the endpoint
curl http://localhost:3000/test
# Should return HTML content
```

## Vercel-Specific Configuration

The `vercel.json` file includes:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "regions": ["iad1"]
}
```

This ensures:
- ✅ Next.js framework is recognized
- ✅ Build command is correct
- ✅ Output directory is properly set
- ✅ Deployment region is specified

## Success Criteria

Deployment is successful when:

1. ✅ `https://your-url.vercel.app/test` loads without errors
2. ✅ All navigation links work correctly
3. ✅ Automated tests can be triggered
4. ✅ No console errors in browser
5. ✅ Page matches the expected design (see screenshot above)
6. ✅ All sections are visible and properly formatted

## Support

If issues persist:
1. Check Vercel deployment logs
2. Review Next.js build output
3. Verify all environment variables are set
4. Test locally with `npm run build && npm start` first

---

**Last Updated:** 2026-01-31

**Version:** 1.0.0
