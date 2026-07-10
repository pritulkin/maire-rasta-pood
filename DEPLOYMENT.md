# Deployment Guide

## Setup Steps

### 1. Create GitHub Repository for Orders
```bash
# Create a new repo on GitHub called "mairepood-backend"
# This is where your orders and products will be saved
```

### 2. Get GitHub Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it these scopes:
   - `repo` (full control of private repositories)
   - `workflow` (update GitHub Action workflows)
4. Copy the token and save it safely

### 3. Update Frontend API Endpoint

In `index.html`, add your backend URL before the script tags:
```html
<script>
  window.API_URL = 'https://your-backend-url.com';
</script>
```

Then in `app.js` and `admin.js`, the code will use `window.API_URL` or fallback to `http://localhost:3000`.

### 4. Deploy Backend (Choose One)

#### Option A: Vercel (Recommended for JavaScript)
1. Push this repo to GitHub
2. Go to https://vercel.com
3. Click "New Project" → select this repo
4. Add environment variables:
   - `GITHUB_REPO` = `your-username/mairepood-backend`
   - `GITHUB_TOKEN` = your token from step 2
5. Deploy
6. Use the Vercel URL as your `API_URL`

#### Option B: Render
1. Go to https://render.com
2. Create new Web Service from GitHub repo
3. Set runtime to Node
4. Add environment variables:
   - `GITHUB_REPO`
   - `GITHUB_TOKEN`
5. Deploy

#### Option C: Railway
1. Go to https://railway.app
2. Create new project from GitHub
3. Add environment variables in the dashboard
4. Deploy

### 5. Update Frontend Configuration

Update `index.html` to set the API URL:
```html
<script>
  window.API_URL = 'https://your-deployed-url.vercel.app'; // or your deployed backend URL
</script>
```

### 6. Test It

**For Products:**
1. Go to admin.html
2. Add or edit a product
3. Check your GitHub repo - you should see `products.json` committed

**For Orders:**
1. Go to index.html
2. Add items to cart
3. Submit an order
4. Check your GitHub repo - the order should appear as a JSON file in the `orders/` folder

## Environment Variables Summary

```
GITHUB_REPO=your-username/mairepood-backend
GITHUB_TOKEN=ghp_xxxxxxxxxxxx
PORT=3000
```

## Local Testing

```bash
npm install
GITHUB_REPO=your-username/mairepood-backend GITHUB_TOKEN=your_token npm run dev
```

The server will run on `http://localhost:3000`

## File Structure in GitHub

Your GitHub repo will contain:
```
orders/
  order-xxx.json
  order-yyy.json
products.json
```

## Features

✅ Orders saved to GitHub as individual JSON files
✅ Products saved to `products.json` in GitHub
✅ Admin can create/edit/delete products - all changes sync to GitHub
✅ Customers can place orders - all saved to GitHub
✅ Local fallback if backend is unavailable
