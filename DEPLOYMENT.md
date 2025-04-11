# Kronos Planetary Rituals - Mobile Web App Deployment Guide

This guide provides instructions for deploying the Kronos Planetary Rituals app as a mobile web application. The app has been enhanced with Progressive Web App (PWA) capabilities to provide a native-like experience on mobile browsers.

## Prerequisites

- Node.js (v18 or later)
- Yarn or npm
- An account on one of the following deployment platforms:
  - Netlify
  - Vercel
  - GitHub Pages
  - Firebase Hosting

## Local Development

To test the mobile web app locally:

```bash
# Install dependencies
npm install

# Start the web development server
npx expo start --web

# Or use the development version with more debugging
DEBUG=expo* npx expo start --web
```

Then open your browser at http://localhost:19006

## Building for Production

To build the app for production deployment:

```bash
# Build the web version
npx expo export
```

This will create a production-ready build in the `dist/web` directory.

## Deployment Options

### Option 1: Netlify (Recommended)

The project includes a `netlify.toml` configuration file for easy deployment to Netlify.

1. Sign up or log in to [Netlify](https://www.netlify.com/)
2. Click "New site from Git"
3. Connect to your Git provider (GitHub, GitLab, or Bitbucket)
4. Select the repository
5. Netlify will automatically detect the build settings from the `netlify.toml` file
6. Click "Deploy site"

Netlify will automatically build and deploy your site. Once deployed, you can set up a custom domain in the Netlify dashboard.

### Option 2: Vercel

1. Sign up or log in to [Vercel](https://vercel.com/)
2. Click "New Project"
3. Import your repository
4. Configure the project:
   - Framework Preset: Other
   - Build Command: `npx expo export`
   - Output Directory: `dist/web`
5. Click "Deploy"

### Option 3: GitHub Pages

1. Add the following to your `package.json`:

```json
"scripts": {
  "deploy-gh-pages": "npx expo export && gh-pages -d dist/web"
},
"devDependencies": {
  "gh-pages": "^6.0.0"
}
```

2. Install the gh-pages package:

```bash
yarn add --dev gh-pages
```

3. Deploy to GitHub Pages:

```bash
yarn deploy-gh-pages
```

### Option 4: Firebase Hosting

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Initialize Firebase:

```bash
firebase login
firebase init hosting
```

3. When prompted, select:
   - Public directory: `dist/web`
   - Configure as a single-page app: Yes
   - Set up automatic builds and deploys with GitHub: Optional

4. Deploy to Firebase:

```bash
npx expo export
firebase deploy --only hosting
```

## Mobile Web App Features

The app has been enhanced with the following mobile web features:

1. **Progressive Web App (PWA) Support**:
   - Installable on home screen
   - Works offline
   - App-like experience

2. **Responsive Design**:
   - Optimized for various screen sizes
   - Touch-friendly UI elements
   - Improved tap targets

3. **Performance Optimizations**:
   - Fast loading times
   - Smooth animations
   - Efficient resource usage

## Testing on Mobile Devices

To test the app on a mobile device:

1. Deploy the app using one of the methods above
2. Open the deployed URL on your mobile device
3. For local testing, ensure your computer and mobile device are on the same network, then:
   - Run `yarn start-web`
   - Find your computer's local IP address
   - On your mobile device, navigate to `http://[YOUR_IP_ADDRESS]:19006`

## PWA Installation

To install the app on a mobile device:

### iOS (Safari):
1. Open the app in Safari
2. Tap the Share button
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add"

### Android (Chrome):
1. Open the app in Chrome
2. Tap the menu button (three dots)
3. Tap "Add to Home Screen"
4. Tap "Add"

## Troubleshooting

### Common Issues:

1. **App not working offline**:
   - Ensure the service worker is properly registered
   - Check that all necessary assets are cached

2. **PWA not installable**:
   - Verify that the web manifest is properly configured
   - Ensure the app is served over HTTPS

3. **Touch events not working properly**:
   - Check for proper touch event handling in components
   - Ensure proper viewport meta tags

For additional help, refer to the Expo documentation on web deployment: https://docs.expo.dev/distribution/publishing-websites/
