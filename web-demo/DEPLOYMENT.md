# Deployment Guide for WizeGigaLLM Web Demo

This guide provides detailed instructions for deploying the WizeGigaLLM Web Demo to Vercel.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployment Methods](#deployment-methods)
- [Environment Variables](#environment-variables)
- [Post-Deployment](#post-deployment)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

1. **A Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **GigaChat API Credentials** - Obtain from [GigaChat Developer Portal](https://developers.sber.ru/docs/ru/gigachat/quickstart/ind-using-api)
3. **Vercel CLI** (for CLI deployment) - Install with `npm install -g vercel`

## Deployment Methods

### Method 1: Using Deployment Script (Recommended)

We've provided a deployment script that automates the entire process.

```bash
# Navigate to web-demo directory
cd web-demo

# Run the deployment script
./deploy.sh
```

The script will:
1. Check for required dependencies
2. Install Vercel CLI if needed
3. Install project dependencies
4. Run linting
5. Build the project
6. Deploy to Vercel

**Note**: You'll need to configure environment variables in Vercel Dashboard after the first deployment.

### Method 2: GitHub Integration (Easiest)

This is the easiest method for continuous deployment.

#### Step 1: Push to GitHub

```bash
# From the repository root
git add .
git commit -m "Add web demo application"
git push origin main
```

#### Step 2: Import to Vercel

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository
4. **IMPORTANT**: Configure project settings:
   - **Framework Preset**: Next.js (should auto-detect)
   - **Root Directory**: `web-demo` (REQUIRED - must be set manually)
   - **Build Command**: `npm run build` (default is fine)
   - **Output Directory**: `.next` (default is fine)

**Critical**: You MUST set the Root Directory to `web-demo` because the Next.js application is in a subdirectory of the monorepo. Vercel needs to know where to find the `package.json` file.

#### Step 3: Configure Environment Variables

In the project settings, add these environment variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `GIGACHAT_CLIENT_ID` | Your GigaChat Client ID (UUID format) | Unique identifier for your GigaChat application |
| `GIGACHAT_CLIENT_SECRET` | Your GigaChat Client Secret (Authorization Key) | Secret key for authentication |
| `GIGACHAT_BASE_URL` | `https://gigachat.devices.sberbank.ru/api/v1` | Base URL for GigaChat API (chat completions) |
| `GIGACHAT_VERIFY_SSL_CERTS` | `false` | **REQUIRED**: Must be `false` to bypass SSL verification |

**Important**: 
- The authentication endpoint `https://ngw.devices.sberbank.ru:9443/api/v2/oauth` is hardcoded and uses the credentials above
- SSL verification **must** be disabled (`false`) for the GigaChat API to work in serverless environments

#### Step 4: Deploy

Click "Deploy" and wait for the build to complete.

### Method 3: Vercel CLI

For manual deployments using the command line.

#### Step 1: Login

```bash
vercel login
```

#### Step 2: Navigate to Project

```bash
cd web-demo
```

#### Step 3: Deploy

For the first deployment:

```bash
vercel
```

For production deployment:

```bash
vercel --prod
```

#### Step 4: Configure Environment Variables

After first deployment, add environment variables:

```bash
# Set environment variables
vercel env add GIGACHAT_CLIENT_ID
vercel env add GIGACHAT_CLIENT_SECRET
vercel env add GIGACHAT_BASE_URL
vercel env add GIGACHAT_VERIFY_SSL_CERTS

# Redeploy with new environment variables
vercel --prod
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `GIGACHAT_CLIENT_ID` | Client ID (UUID format) | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` |
| `GIGACHAT_CLIENT_SECRET` | Client Secret / Authorization Key | `your_auth_key_here` |
| `GIGACHAT_BASE_URL` | GigaChat API base URL | `https://gigachat.devices.sberbank.ru/api/v1` |
| `GIGACHAT_VERIFY_SSL_CERTS` | Whether to verify SSL certificates | `false` or `true` |

### How to Get GigaChat Credentials

1. Visit [GigaChat Developer Portal](https://developers.sber.ru/docs/ru/gigachat/individuals-quickstart)
2. Follow the registration process
3. Generate API credentials (you'll receive Client ID and Client Secret)
4. Encode credentials in Base64 format

### Setting Environment Variables in Vercel

#### Via Dashboard:

1. Go to your project in Vercel Dashboard
2. Navigate to "Settings" → "Environment Variables"
3. Add each variable with appropriate value
4. Select environment (Production, Preview, Development)
5. Click "Save"

#### Via CLI:

```bash
# Add a single variable
vercel env add VARIABLE_NAME

# Pull environment variables to local
vercel env pull

# Remove a variable
vercel env rm VARIABLE_NAME
```

## Post-Deployment

### 1. Verify Deployment

After deployment, your application will be available at a URL like:
```
https://your-project-name.vercel.app
```

### 2. Test the Application

**IMPORTANT:** Always verify the test page is accessible after deployment.

1. **Visit Test Page**: Navigate to `/test` and run automated tests
   ```
   https://your-project-name.vercel.app/test
   ```
   - Click "🚀 Run All Tests" button
   - Verify all 4 tests pass (API Configuration, Connection, Chat Endpoint, Error Handling)
   - Check that the page matches the expected layout (see screenshot in PR)

2. **Visit Home Page**: Verify the landing page loads correctly
   - Confirm "Run Tests" button navigates to `/test`

3. **Check Settings**: Go to `/settings` and test the connection
   - Click "Test Connection" button
   - Verify successful connection message appears

4. **Try Chat**: Navigate to `/chat` and send a test message
   - Send a simple message like "Hello"
   - Verify you receive a response from GigaChat

5. **Test API Routes**: Ensure API endpoints are responding
   - `/api/config` should return configuration
   - `/api/chat` should handle chat requests

**Validation Checklist:**
- ✅ `/test` page loads and displays all sections
- ✅ Automated tests can be executed
- ✅ All navigation links work correctly
- ✅ No 404 errors on any route
- ✅ No console errors in browser (check F12 developer tools)

For detailed deployment validation instructions, see [DEPLOYMENT_VALIDATION.md](./DEPLOYMENT_VALIDATION.md).

### 3. Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your custom domain
4. Follow DNS configuration instructions

### 4. Enable Production Features

For production deployments, consider:

- **SSL Verification**: Set `GIGACHAT_VERIFY_SSL_CERTS=true`
- **Analytics**: Enable Vercel Analytics in project settings
- **Performance Monitoring**: Configure Vercel Speed Insights
- **Custom Domain**: Set up your own domain name

## Vercel Configuration

The project includes a `vercel.json` configuration file with optimized settings:

```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "outputDirectory": ".next",
  "regions": ["iad1"]
}
```

### Key Configuration Options

- **regions**: Specify deployment regions (default: `iad1` - Washington, D.C.)
- **framework**: Automatically detected as Next.js
- **outputDirectory**: Build output directory

### Customizing Deployment Region

Edit `vercel.json` to change the deployment region:

```json
{
  "regions": ["sfo1"]  // San Francisco
}
```

Available regions:
- `iad1` - Washington, D.C., USA
- `sfo1` - San Francisco, USA
- `cdg1` - Paris, France
- `hnd1` - Tokyo, Japan
- And more...

## Troubleshooting

### Build Failures

**Problem**: Build fails with dependency errors

**Solution**:
```bash
# Clear build cache
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

**Problem**: API credentials not found in production

**Solution**:
1. Verify variables are set in Vercel Dashboard
2. Check variable names (case-sensitive)
3. Redeploy after adding variables
4. Use `vercel env pull` to verify locally

### Connection Timeouts

**Problem**: API requests timeout in production

**Solution**:
1. Check if `GIGACHAT_BASE_URL` is correct
2. Verify SSL settings: try `GIGACHAT_VERIFY_SSL_CERTS=false`
3. Check Vercel function timeout limits (max 10s for Hobby, 60s for Pro)

### 404 Errors on Page Routes

**Problem**: Direct URL access returns 404

**Solution**:
- Ensure you're using Next.js App Router (not Pages Router)
- Verify page files are in `src/app/` directory
- Check Vercel build logs for errors

### API Route Errors

**Problem**: `/api/*` routes return errors

**Solution**:
1. Check API route files are in `src/app/api/` directory
2. Verify `route.ts` files export correct HTTP methods
3. Check server logs in Vercel Dashboard

## Monitoring and Maintenance

### View Deployment Logs

```bash
# View recent deployments
vercel ls

# View logs for specific deployment
vercel logs [deployment-url]
```

### Monitor Performance

1. Enable Vercel Analytics in project settings
2. Check "Analytics" tab in Dashboard
3. Monitor Core Web Vitals scores

### Rollback Deployment

```bash
# List deployments
vercel ls

# Promote a specific deployment to production
vercel promote [deployment-url]
```

## Best Practices

1. **Environment Variables**: Never commit `.env.local` to version control
2. **Testing**: Always test in preview environment before production
3. **SSL**: Use SSL verification in production (`GIGACHAT_VERIFY_SSL_CERTS=true`)
4. **Monitoring**: Enable analytics and monitoring
5. **Updates**: Keep dependencies up to date
6. **Secrets**: Use Vercel's secret management for sensitive data

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel CLI Reference](https://vercel.com/docs/cli)
- [GigaChat API Docs](https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/gigachat-api)

## Support

If you encounter issues:

1. Check the [troubleshooting section](#troubleshooting)
2. Review Vercel deployment logs
3. Consult Next.js documentation
4. Open an issue in the repository

---

**Happy Deploying! 🚀**
