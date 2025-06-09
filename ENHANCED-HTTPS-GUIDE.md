# Complete HTTPS Guide for FamRun Camera Functionality

## Why HTTPS is Required

Modern browsers restrict camera access to secure contexts (HTTPS) for security reasons. The Kit Distribution Scanner relies on camera access to scan QR codes, which requires HTTPS to function properly.

## Setting Up HTTPS for Development

### Method 1: Using Local Certificates (Recommended)

We've provided a script to generate local development certificates:

```bash
# Make the script executable
chmod +x ./scripts/generate-local-certs.sh

# Run the script to generate certificates
./scripts/generate-local-certs.sh
```

This script uses [mkcert](https://github.com/FiloSottile/mkcert) to create locally-trusted certificates. If you don't have mkcert installed:

- macOS: `brew install mkcert`
- Windows: `choco install mkcert` or `scoop install mkcert`
- Linux: Use your package manager or see the [mkcert GitHub page](https://github.com/FiloSottile/mkcert)

After generating the certificates, the vite.config.ts should already be configured to use them:

```typescript
import fs from 'fs';

export default defineConfig({
  server: {
    https: {
      key: fs.readFileSync('./localhost-key.pem'),
      cert: fs.readFileSync('./localhost.pem'),
    },
    host: 'localhost', // Using 'localhost' improves camera permission handling
    port: 8080,
  },
  // ...other config
});
```

### Method 2: Using localhost (Easier but Less Secure)

Modern browsers consider `localhost` to be a secure context even without HTTPS:

```bash
npm run dev
```

This will run on localhost using HTTP, which browsers treat as a secure context. However, this method is less secure and may not work for all browser features.

## Setting Up HTTPS for Production

For a production environment, HTTPS is essential:

### Option 1: Using a Hosting Provider with Built-in HTTPS

Many hosting providers offer built-in HTTPS support:

- **Vercel**: Automatically provides HTTPS for all deployments
- **Netlify**: Automatically provides HTTPS for all deployments
- **Firebase Hosting**: Automatically provides HTTPS for all deployments
- **GitHub Pages**: Supports HTTPS for custom domains

### Option 2: Setting Up HTTPS with Let's Encrypt

If you're running your own server, use [Let's Encrypt](https://letsencrypt.org/) for free SSL certificates:

1. Install Certbot: `sudo apt-get install certbot`
2. Get a certificate: `sudo certbot certonly --standalone -d yourdomain.com`
3. Configure your web server to use the certificates:

**For Nginx:**
```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # Other SSL configurations
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    # Your application configuration
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

**For Apache:**
```apache
<VirtualHost *:443>
    ServerName yourdomain.com
    
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Your application configuration
    ProxyPass / http://localhost:3000/
    ProxyPassReverse / http://localhost:3000/
</VirtualHost>

# Redirect HTTP to HTTPS
<VirtualHost *:80>
    ServerName yourdomain.com
    Redirect permanent / https://yourdomain.com/
</VirtualHost>
```

### Option 3: Using a Reverse Proxy

For simpler setups, use [Caddy](https://caddyserver.com/), which automatically handles HTTPS:

```caddyfile
yourdomain.com {
    reverse_proxy localhost:3000
}
```

Caddy automatically obtains and renews Let's Encrypt certificates.

## Troubleshooting HTTPS Issues

### Camera Doesn't Work Despite HTTPS

1. Check if you're truly on HTTPS - the URL should start with `https://`
2. Look for browser warnings about mixed content
3. Verify that your certificates are valid and not expired
4. On macOS, check camera permissions in System Preferences

### Certificate Errors

If you see certificate errors in development:

1. Make sure you've installed the local root CA using mkcert
2. Try running `mkcert -install` again
3. Restart your browser completely

For production certificates:

1. Verify that your certificates haven't expired
2. Check that the domain name matches your certificate
3. Ensure your certificate chain is complete

## Manual Entry Fallback

If camera access cannot be established, the application provides a manual entry mode. Users can switch to manual mode by clicking the "Manual QR Entry" button on the scanner page.
