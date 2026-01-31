# Vercel Deployment Configuration

This repository contains a Next.js application in the `web-demo` subdirectory. To deploy to Vercel, you MUST configure the Root Directory setting.

## CRITICAL: Root Directory Setting

When deploying to Vercel, you **MUST** set the Root Directory to `web-demo` in the project settings. This is because:
- The Next.js application lives in the `web-demo` subdirectory
- Vercel needs to find `package.json` to detect Next.js
- Without this setting, the build will fail with "No Next.js version detected"

## Deployment Methods

### Option 1: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Go to [Vercel Dashboard](https://vercel.com/dashboard)
3. Click "Add New..." → "Project"
4. Import your GitHub repository
5. **CRITICAL STEP**: In project settings, set:
   - **Root Directory**: `web-demo` (type this manually)
   - Framework Preset: Next.js (auto-detected after setting root)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)
6. Add environment variables:
   - `GIGACHAT_CREDENTIALS`
   - `GIGACHAT_BASE_URL`
   - `GIGACHAT_VERIFY_SSL_CERTS`
7. Deploy

### Option 2: Vercel CLI

From the `web-demo` directory:

```bash
cd web-demo
npm install -g vercel
vercel --prod
```

The CLI will automatically detect the Next.js app when run from the web-demo directory.

### Option 3: Using Deployment Script

From the `web-demo` directory:

```bash
cd web-demo
./deploy.sh
```

## Why Root Directory Must Be Set

Vercel's build process:
1. Looks for `package.json` in the root directory
2. Checks for "next" in dependencies
3. If not found, fails with "No Next.js version detected"

By setting Root Directory to `web-demo`:
1. Vercel looks for `package.json` in `web-demo/`
2. Finds Next.js dependency
3. Builds successfully

## Verifying Deployment

After deployment, verify the test page is accessible:

```
https://your-deployment-url.vercel.app/test
```

All routes should be available:
- `/` - Home page
- `/test` - Test suite page ✅
- `/chat` - Chat demo
- `/settings` - Settings page
- `/api/chat` - Chat API endpoint
- `/api/config` - Configuration API endpoint

## Troubleshooting

### Error: "No Next.js version detected"

**Cause**: Root Directory not set to `web-demo`

**Solution**:
1. Go to Vercel Dashboard → Your Project → Settings
2. Under "Build & Development Settings"
3. Set Root Directory to `web-demo`
4. Redeploy

### Error: "Build fails on Vercel"

**Cause**: Missing dependencies or environment variables

**Solution**:
1. Verify `web-demo/package.json` has all dependencies
2. Check environment variables are set in Vercel
3. Review Vercel build logs for specific errors

### Test page returns 404

**Cause**: Build didn't complete successfully

**Solution**:
1. Check Vercel build logs
2. Verify Root Directory is set to `web-demo`
3. Test build locally: `cd web-demo && npm run build`

For detailed deployment instructions, see:
- [`web-demo/DEPLOYMENT.md`](./web-demo/DEPLOYMENT.md)
- [`web-demo/DEPLOYMENT_VALIDATION.md`](./web-demo/DEPLOYMENT_VALIDATION.md)
