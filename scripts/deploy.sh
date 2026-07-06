#!/bin/bash
set -e

echo "Building contracts..."
make build

echo "Generating deployer key (if not exists)..."
stellar keys generate deployer || true

echo "Funding deployer..."
stellar keys fund deployer --network testnet || true

echo "Deploying..."
make deploy STELLAR_SECRET_KEY=deployer

echo "Deployment complete."
