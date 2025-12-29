#!/bin/bash

# Automated Web Deployment Script for Franchise Flutter App
# This script builds the Flutter web app and deploys it to GitHub Pages

set -e  # Exit on error

echo "🚀 Starting automated web deployment..."

# Step 1: Build Flutter web app
echo "📦 Building Flutter web app..."
flutter build web --release

# Step 2: Navigate to GitHub repo
REPO_DIR=~/Desktop/franchiseflutterwebapp
BUILD_DIR=$(pwd)/build/web

if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Repository not found at $REPO_DIR"
    echo "Please clone the repository first: git clone https://github.com/amal-chd/franchiseflutterwebapp.git $REPO_DIR"
    exit 1
fi

cd "$REPO_DIR"

# Step 3: Pull latest changes
echo "🔄 Pulling latest changes from GitHub..."
git pull

# Step 4: Remove old files (except .git)
echo "🗑️  Removing old build files..."
find . -maxdepth 1 ! -name '.git' ! -name '.' ! -name '..' -exec rm -rf {} +

# Step 5: Copy new build files
echo "📋 Copying new build files..."
cp -r "$BUILD_DIR"/* .

# Step 6: Commit and push
echo "📤 Committing and pushing changes..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "ℹ️  No changes to deploy"
else
    COMMIT_MSG="Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$COMMIT_MSG"
    git push
    echo "✅ Deployment successful!"
fi

echo "🎉 Done! Your app is live at: https://amal-chd.github.io/franchiseflutterwebapp"
