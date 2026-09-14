# Memomes.space — Official Coming Soon & Details Website

Production-grade, high-performance, Zero-Knowledge product showcase and early-access waitlist landing page for **memomes.space**.

---

## 🚀 Quick Deploy to Vercel

### Method 1: Using Vercel CLI (Fastest — 1 Minute)

From inside this directory (`d:\memomes\memomes-space-web`):

```bash
# 1. Login to Vercel (if not already logged in)
npx vercel login

# 2. Deploy directly to production
npx vercel --prod
```

When prompted:
- **Set up and deploy?**: `y`
- **Which scope?**: Select your Vercel account
- **Link to existing project?**: `N`
- **Project name**: `memomes-space` (or press Enter)
- **Directory located**: `./` (press Enter)

Vercel will output a live deployment URL (e.g., `https://memomes-space.vercel.app`).

---

### Method 2: Via GitHub + Vercel Dashboard

1. Push this folder or repository to GitHub.
2. Open [vercel.com/new](https://vercel.com/new).
3. Import your GitHub repository.
4. If this repo contains the whole monorepo, set **Root Directory** to `memomes-space-web`.
5. Click **Deploy**.

---

## 🌐 Linking Domain `memomes.space` (Registered in Namecheap)

Follow these exact steps to connect `memomes.space` to your Vercel project:

### Step 1: Add the Domain in Vercel
1. In your [Vercel Dashboard](https://vercel.com), click on your deployed project (`memomes-space`).
2. Navigate to **Settings** → **Domains**.
3. Type: `memomes.space` and click **Add**.
4. Vercel will recommend adding both `memomes.space` and `www.memomes.space` (select the recommended redirect `www.memomes.space` → `memomes.space`).

---

### Step 2: Configure DNS in Namecheap

1. Log into your [Namecheap Account](https://www.namecheap.com).
2. Go to **Domain List** on the left sidebar.
3. Find **memomes.space** and click **Manage**.
4. Click on the **Advanced DNS** tab.
5. In the **Host Records** section:
   - Delete any default parking records (e.g. `URL Redirect` or default `CNAME parkingpage.namecheap.com`).
   - Click **Add New Record**:
     - **Type**: `A Record`
     - **Host**: `@`
     - **Value**: `76.76.21.21`
     - **TTL**: `Automatic` (or `1 min`)
   - Click the green checkmark to save.
   - Click **Add New Record** again:
     - **Type**: `CNAME Record`
     - **Host**: `www`
     - **Value**: `cname.vercel-dns.com.` *(with the trailing dot)*
     - **TTL**: `Automatic` (or `1 min`)
   - Click the green checkmark to save.

---

### Step 3: SSL Certificate Verification
- Vercel will automatically detect the DNS propagation (usually takes between 2 to 15 minutes).
- Once detected, Vercel automatically generates a free **Let's Encrypt SSL/TLS Certificate** with automatic renewal.
- Your site will be live securely at **`https://memomes.space`**!

---

## 🛠️ Local Preview & Testing

To test this landing page locally:

```bash
# Run local static server on port 6530
npm run dev
```
Open `http://localhost:6530` in your browser.
