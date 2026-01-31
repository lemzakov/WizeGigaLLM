# Vercel Deployment Configuration

This repository contains a Next.js application in the `web-demo` subdirectory. The deployment is configured to work seamlessly with Vercel.

## Configuration Files

### Root Level Configuration

- **`vercel.json`** - Configures Vercel to build from the `web-demo` subdirectory
  ```json
  {
    "buildCommand": "cd web-demo && npm install && npm run build",
    "devCommand": "cd web-demo && npm run dev",
    "installCommand": "cd web-demo && npm install",
    "framework": "nextjs",
    "outputDirectory": "web-demo/.next"
  }
  ```

- **`.vercelignore`** - Ensures only the `web-demo` directory is deployed, excluding other monorepo contents

### Web Demo Configuration

- **`web-demo/vercel.json`** - Basic Next.js framework configuration
- **`web-demo/next.config.js`** - Next.js application configuration

## Deployment Methods

### Option 1: Vercel CLI (from web-demo directory)

```bash
cd web-demo
./deploy.sh
```

or manually:

```bash
cd web-demo
npm install
npm run build
vercel --prod
```

### Option 2: GitHub Integration (Recommended)

1. Push your code to GitHub
2. Import the repository to Vercel
3. Vercel will automatically detect the configuration from `vercel.json`
4. Configure environment variables in Vercel Dashboard:
   - `GIGACHAT_CREDENTIALS`
   - `GIGACHAT_BASE_URL`
   - `GIGACHAT_VERIFY_SSL_CERTS`

### Option 3: Deploy from Repository Root

If deploying from the root directory:

```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy (from repository root)
vercel --prod
```

The root `vercel.json` will handle the subdirectory configuration automatically.

## Verifying Deployment

After deployment, verify the test page is accessible:

```
https://your-deployment-url.vercel.app/test
```

All routes should be available:
- `/` - Home page
- `/test` - Test suite page
- `/chat` - Chat demo
- `/settings` - Settings page
- `/api/chat` - Chat API endpoint
- `/api/config` - Configuration API endpoint

## Troubleshooting

### Test page returns 404

**Cause**: Build configuration issue or Next.js routing problem.

**Solution**:
1. Verify `vercel.json` exists in repository root
2. Check Vercel build logs for errors
3. Ensure `web-demo/.next` directory is generated during build
4. Run local build test: `cd web-demo && npm run build`

### Build fails on Vercel

**Cause**: Missing dependencies or incorrect build command.

**Solution**:
1. Check Vercel build logs
2. Verify `package.json` has all required dependencies
3. Test build locally: `cd web-demo && npm install && npm run build`
4. Ensure Node.js version >=18.0.0

For detailed deployment instructions, see:
- [`web-demo/DEPLOYMENT.md`](./web-demo/DEPLOYMENT.md)
- [`web-demo/DEPLOYMENT_VALIDATION.md`](./web-demo/DEPLOYMENT_VALIDATION.md)
