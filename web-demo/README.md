# WizeGigaLLM Web Demo

A modern, interactive web-based demonstration application for WizeGigaLLM with GigaChat API integration using **LangChain**. Built with Next.js 15, TypeScript, and optimized for Vercel deployment.

![WizeGigaLLM Demo](../static/img/logo-with-backgroung.png)

## 🌟 Features

- **Interactive Chat Interface** - Real-time chat with GigaChat API via LangChain
- **LangChain Integration** - Uses `langchain-gigachat` package for robust model interaction
- **Settings Management** - View and test API configuration
- **Connection Testing** - Verify API credentials and connectivity
- **Modern UI/UX** - Clean, responsive design with gradient backgrounds
- **TypeScript** - Fully typed for better development experience
- **Vercel Ready** - Optimized configuration for seamless deployment
- **Security First** - Server-side API key management, never exposed to client
- **Error Handling** - Comprehensive error handling and user feedback
- **Test Suite** - Comprehensive test page at `/test` for validating deployment

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **npm** or **yarn** package manager
- **GigaChat API Credentials** - Get them from [GigaChat Developer Portal](https://developers.sber.ru/docs/ru/gigachat/quickstart/ind-using-api)

## 🚀 Quick Start

### 1. Installation

Navigate to the web-demo directory and install dependencies:

```bash
cd web-demo
npm install
```

This will install Next.js, React, and the `langchain-gigachat` package along with other dependencies.

### 2. Configuration

Create a `.env.local` file by copying the example:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your GigaChat API credentials:

```env
GIGACHAT_CLIENT_ID=your_client_id_here
GIGACHAT_CLIENT_SECRET=your_client_secret_here
GIGACHAT_MODEL=GigaChat
GIGACHAT_BASE_URL=https://gigachat.devices.sberbank.ru/api/v1
GIGACHAT_VERIFY_SSL_CERTS=false
```

**Important Notes:**
- **LangChain Integration**: The app uses `langchain-gigachat` package which handles authentication internally
- Credentials are automatically encoded to Base64 by the LangChain package
- `GIGACHAT_MODEL` can be: `GigaChat`, `GigaChat-Max`, or `GigaChat-Pro`
- `GIGACHAT_VERIFY_SSL_CERTS=false` is required to bypass SSL certificate verification
- Never commit `.env.local` to version control (it's already in `.gitignore`)

### 3. Run Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## 🏗️ Project Structure

```
web-demo/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   ├── chat/          # Chat completions endpoint (uses LangChain)
│   │   │   └── config/        # Configuration management endpoint
│   │   ├── chat/              # Chat demo page
│   │   ├── settings/          # Settings page
│   │   ├── test/              # Test suite page
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   └── Header.tsx         # Navigation header
│   ├── lib/                   # Utility libraries
│   │   ├── langchain-gigachat.ts  # LangChain GigaChat integration
│   │   └── gigaapi.ts         # Legacy GigaAPI client (deprecated)
│   ├── styles/                # Global styles
│   │   └── globals.css        # Global CSS
│   └── types/                 # TypeScript type definitions
│       └── gigachat.ts        # GigaChat API types
├── public/                    # Static files
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── next.config.js            # Next.js configuration
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vercel.json               # Vercel deployment configuration
└── README.md                 # This file
```

## 📖 Usage Guide

### Home Page (`/`)

The landing page provides:
- Overview of the demo application
- Feature highlights
- Quick start guide
- Links to documentation

### Test Suite (`/test`)

**NEW:** Comprehensive testing interface for deployment validation.

The test page provides:
- **Automated Tests**: One-click testing of API configuration, connection, chat endpoint, and error handling
- **Feature Checklist**: Quick access to test all features individually
- **Manual Testing Guide**: Step-by-step instructions for thorough testing
- **Deployment Verification**: Checklist to ensure successful deployment

**How to use:**
1. Navigate to `http://localhost:3000/test` (or `https://your-deployment.vercel.app/test` in production)
2. Click "🚀 Run All Tests" to execute automated tests
3. Review test results for each feature
4. Use the feature checklist to test individual components
5. Follow manual testing instructions for comprehensive validation

**Important for Deployment:**
- Verify the test page is accessible at `/test` after deploying to Vercel
- All automated tests should pass if environment variables are configured correctly
- See [DEPLOYMENT_VALIDATION.md](./DEPLOYMENT_VALIDATION.md) for detailed deployment verification steps

### Chat Demo (`/chat`)

Interactive chat interface where you can:
- Send messages to GigaChat API
- View conversation history
- Clear chat history
- See real-time responses

**Tips:**
- Press `Enter` to send a message
- Press `Shift+Enter` for a new line
- The chat maintains context across messages
- GigaChat is optimized for Russian but supports English

### Settings (`/settings`)

Configuration and testing page featuring:
- Current API configuration display
- Connection test functionality
- Setup instructions
- Security notes

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server

# Production
npm run build        # Build for production
npm start            # Start production server

# Code Quality
npm run lint         # Run ESLint

# Deployment
npm run deploy       # Deploy to Vercel
```

## 🚀 Deployment to Vercel

This application is optimized for Vercel deployment.

### Option 1: Automatic Deployment (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   cd web-demo
   vercel --prod
   ```

4. **Configure Environment Variables** in Vercel Dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     - `GIGACHAT_CLIENT_ID`
     - `GIGACHAT_CLIENT_SECRET`
     - `GIGACHAT_BASE_URL`
     - `GIGACHAT_VERIFY_SSL_CERTS`

### Option 2: GitHub Integration

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "Add web demo application"
   git push origin main
   ```

2. **Import to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your repository
   - Set the root directory to `web-demo`
   - Add environment variables
   - Deploy!

### Option 3: Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Deploy using Vercel CLI:
   ```bash
   vercel --prod
   ```

## 🔐 Security Considerations

- **API Credentials**: Never commit `.env.local` or expose credentials in client-side code
- **Server-Side API Calls**: All GigaChat API calls are made server-side via Next.js API routes
- **Environment Variables**: Use Vercel's environment variable management for production
- **SSL Verification**: Set `GIGACHAT_VERIFY_SSL_CERTS=true` in production environments
- **CORS**: API routes include appropriate CORS headers

## 🛠️ Customization

### Modifying API Settings

Edit environment variables in `.env.local`:

```env
# Change the base URL if using a different endpoint
GIGACHAT_BASE_URL=https://your-custom-endpoint.com/api/v1

# Enable SSL verification for production
GIGACHAT_VERIFY_SSL_CERTS=true
```

### Changing Model Parameters

Edit `/src/lib/gigaapi.ts` to modify default parameters:

```typescript
this.config = {
  model: 'GigaChat',
  temperature: 0.7,    // Adjust randomness (0.0 - 2.0)
  maxTokens: 1024,     // Adjust response length
  ...config,
};
```

### Styling

Modify `/src/styles/globals.css` to customize the look and feel:

```css
/* Change gradient background */
body {
  background: linear-gradient(135deg, #your-color1 0%, #your-color2 100%);
}

/* Customize button colors */
.btn-primary {
  background: #your-color;
}
```

## 🐛 Troubleshooting

### Connection Issues

**Problem**: "Failed to authenticate with GigaChat API"

**Solutions**:
1. Verify your `GIGACHAT_CLIENT_ID` and `GIGACHAT_CLIENT_SECRET` are correctly set
2. Ensure you have the correct Client ID (UUID format) and Client Secret
3. Ensure you have network access to GigaChat API endpoints
4. Try setting `GIGACHAT_VERIFY_SSL_CERTS=false` for development

**Problem**: "fetch failed" errors on Vercel/production

**Symptoms**:
- Error: `Failed to authenticate with GigaChat API: fetch failed`
- Network connectivity errors in logs
- API calls timeout or fail

**Solutions**:
1. **SSL Certificate Issues**:
   - Set `GIGACHAT_VERIFY_SSL_CERTS=false` in Vercel environment variables
   - Redeploy after changing environment variables

2. **Network/Firewall Issues**:
   - Verify GigaChat API is accessible from your deployment region
   - Check if there are network restrictions between Vercel and GigaChat
   - Consider alternative deployment platforms (AWS, VPS) if connectivity persists

3. **Debug**:
   - Check Vercel function logs for detailed error diagnostics
   - Look for `[GigaAPI Auth Debug]` messages with suggested solutions
   - Test locally first: `npm run dev` to verify credentials work

### Build Errors

**Problem**: TypeScript or build errors

**Solutions**:
1. Delete `.next` directory: `rm -rf .next`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be 18+)

### Environment Variables Not Loading

**Problem**: API credentials not found

**Solutions**:
1. Ensure `.env.local` exists in the `web-demo` directory
2. Restart the development server after changing environment variables
3. Verify variable names match exactly (case-sensitive)

## 📚 Additional Resources

- [GigaChat API Documentation](https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/gigachat-api)
- [GigaChain SDK Overview](https://developers.sber.ru/docs/ru/gigachat/sdk/overview)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test thoroughly
5. Commit: `git commit -m "Add your feature"`
6. Push: `git push origin feature/your-feature`
7. Create a Pull Request

## 📄 License

This project is part of the WizeGigaLLM repository. See the main LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Powered by [GigaChat API](https://developers.sber.ru/)
- Deployed on [Vercel](https://vercel.com/)

---

**Need Help?** Check the [troubleshooting section](#-troubleshooting) or open an issue in the repository.
