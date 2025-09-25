#!/bin/bash

# Create SSL directory
mkdir -p ssl

# Generate private key
openssl genrsa -out ssl/privkey.pem 2048

# Generate certificate
openssl req -new -x509 -key ssl/privkey.pem -out ssl/fullchain.pem -days 365 \
  -subj "/C=US/ST=CA/L=San Francisco/O=Dasibom/CN=ec2-54-193-170-230.us-west-1.compute.amazonaws.com"

# Set permissions
chmod 644 ssl/fullchain.pem
chmod 600 ssl/privkey.pem

echo "SSL certificates generated in ssl/ directory"