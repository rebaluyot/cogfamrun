#!/bin/bash
# Script to generate local HTTPS certificates for development
# This script uses mkcert which is a simple tool to create locally-trusted development certificates

# Check if mkcert is installed
if ! command -v mkcert &> /dev/null
then
    echo "mkcert is not installed. Please install it first."
    echo "For macOS: brew install mkcert"
    echo "For Linux: Use your package manager or see https://github.com/FiloSottile/mkcert"
    echo "For Windows: Use Scoop or Chocolatey or see https://github.com/FiloSottile/mkcert"
    exit 1
fi

# Check if nss is installed (for Firefox)
if ! command -v certutil &> /dev/null
then
    echo "Installing nss for Firefox support..."
    if command -v brew &> /dev/null; then
        brew install nss
    else
        echo "Please install nss manually for Firefox support"
        echo "For macOS: brew install nss"
    fi
fi

# Create a root CA if it doesn't exist
echo "Setting up local certificate authority..."
mkcert -install

# Create the certificates for localhost and the local server
echo "Generating certificates for localhost..."
mkcert localhost 127.0.0.1 ::1

# Move and rename the certificates
echo "Moving certificates to the right location..."
mv localhost+2-key.pem localhost-key.pem
mv localhost+2.pem localhost.pem

echo "Done! Certificates are ready:"
echo "  localhost-key.pem"
echo "  localhost.pem"
echo ""
echo "Add these to your vite.config.ts file:"
echo "server: {"
echo "  https: {"
echo "    key: fs.readFileSync('./localhost-key.pem'),"
echo "    cert: fs.readFileSync('./localhost.pem'),"
echo "  },"
echo "  host: 'localhost',"
echo "  port: 8080,"
echo "},"
