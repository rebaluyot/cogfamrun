# HTTPS Deployment Guide for Kit Distribution System

## Why HTTPS is Required

Modern web browsers restrict access to sensitive hardware like cameras to secure contexts (HTTPS) only. This is a security feature to protect users from potential privacy violations. The Kit Distribution system in this application uses the device camera to scan QR codes, which requires HTTPS to function properly.

## Options for Enabling Camera Access

### Option 1: Deploy with HTTPS (Recommended for Production)

For a production environment, you should deploy your application with HTTPS enabled. There are several ways to do this:

#### Using a Hosting Provider with Built-in HTTPS

Many hosting providers offer built-in HTTPS support:

- **Vercel**: Automatically provides HTTPS for all deployments
- **Netlify**: Automatically provides HTTPS for all deployments
- **Firebase Hosting**: Automatically provides HTTPS for all deployments
- **GitHub Pages**: Supports HTTPS for custom domains

#### Setting Up Your Own HTTPS with Let's Encrypt

If you're running your own server, you can use [Let's Encrypt](https://letsencrypt.org/) to get free SSL certificates:

1. Install Certbot: `sudo apt-get install certbot`
2. Get a certificate: `sudo certbot certonly --standalone -d yourdomain.com`
3. Configure your web server (Apache/Nginx) to use the certificates

#### Using a Reverse Proxy

If you're running a local server, you can use a reverse proxy like [Caddy](https://caddyserver.com/) which automatically handles HTTPS configuration:

```caddyfile
yourdomain.com {
  reverse_proxy localhost:3000
}
```

### Option 2: Development Environment Solutions

For development purposes, you have these options:

#### Use localhost (Easiest)

Modern browsers consider `localhost` to be a secure context, so camera access works without HTTPS:

```bash
npm run dev  # This will run on localhost
```

#### Create a Self-Signed Certificate for Local Development

1. Generate self-signed certificates:

```bash
mkdir -p certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout certificates/key.pem -out certificates/cert.pem
```

2. Configure your Vite development server to use HTTPS:

```javascript
// vite.config.ts
import { defineConfig } from 'vite'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  // other config...
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'certificates/key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'certificates/cert.pem')),
    },
  },
})
```

3. Run your development server:

```bash
npm run dev
```

Note: You will need to accept the self-signed certificate warning in your browser.

### Option 3: Use Manual QR Entry as Fallback

If you cannot deploy with HTTPS, the application includes a manual QR entry mode which works in all environments. This can be used as a fallback option:

1. Navigate to the Kit Distribution page
2. Select the "Manual Entry" tab
3. Enter the QR code value manually

## Troubleshooting Camera Access on Mac

If you're on macOS and having camera issues even with HTTPS:

1. Open System Preferences (or System Settings)
2. Go to Security & Privacy (or Privacy & Security) > Camera
3. Ensure your browser (Chrome/Safari/Firefox) is checked/enabled
4. Restart your browser after enabling permissions
5. Try using Safari which has better integration with macOS permissions

## Verifying Secure Context

You can check if your application is running in a secure context by opening the browser console and running:

```javascript
console.log(window.isSecureContext);
```

This will return `true` if you're on HTTPS or localhost, and `false` otherwise.
