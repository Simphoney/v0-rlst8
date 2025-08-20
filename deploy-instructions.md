# RLST8 Deployment Instructions (No Git Required)

## Method 1: Vercel CLI (Recommended)

### Step 1: Install Vercel CLI
\`\`\`bash
npm i -g vercel
\`\`\`

### Step 2: Login to Vercel
\`\`\`bash
vercel login
\`\`\`

### Step 3: Deploy from your project directory
\`\`\`bash
vercel
\`\`\`

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? **Your personal account**
- Link to existing project? **N**
- Project name? **rlst8-platform** (or your preferred name)
- In which directory is your code located? **./** 
- Want to override settings? **N**

### Step 4: Add Supabase Integration
After deployment:
1. Go to your Vercel dashboard
2. Find your deployed project
3. Go to **Integrations** tab
4. Add **Supabase** integration
5. Connect your existing Supabase project: `cexecmlvjvhpeamdiopq`

## Method 2: Drag & Drop (Alternative)

### Step 1: Build your project locally
\`\`\`bash
npm run build
\`\`\`

### Step 2: Create deployment package
1. Create a new folder called `rlst8-deploy`
2. Copy these files/folders to it:
   - `.next/` folder (after build)
   - `public/` folder
   - `package.json`
   - `next.config.js` (if exists)

### Step 3: Deploy via Vercel Dashboard
1. Go to https://vercel.com/new
2. Drag and drop the `rlst8-deploy` folder
3. Deploy

## Method 3: GitHub Import (If you change your mind)

### Step 1: Create GitHub repo
\`\`\`bash
git init
git add .
git commit -m "Initial RLST8 commit"
git branch -M main
git remote add origin https://github.com/yourusername/rlst8-platform.git
git push -u origin main
\`\`\`

### Step 2: Import to Vercel
1. Go to https://vercel.com/new
2. Import from GitHub
3. Select your repository
4. Deploy

## After Deployment: Add Supabase Integration

1. **Go to your Vercel project dashboard**
2. **Click "Integrations"**
3. **Search for "Supabase"**
4. **Click "Add Integration"**
5. **Connect your existing project**: `cexecmlvjvhpeamdiopq`
6. **Grant permissions**

This will automatically inject these environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Verification Steps

After deployment with Supabase integration:
1. Visit your deployed URL
2. Go to `/debug-env` to verify environment variables
3. Go to `/test-connection` to test database connection
4. Go to `/auth/signin` to test authentication

## Troubleshooting

If environment variables still don't work:
1. Check Vercel project settings → Environment Variables
2. Manually add the NEXT_PUBLIC_ variables if needed
3. Redeploy the project
