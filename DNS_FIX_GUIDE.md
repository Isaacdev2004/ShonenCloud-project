# Fix Cloudflare Error 1001 - DNS Resolution Error

## The Problem
Cloudflare Error 1001 means Cloudflare can't resolve your domain's DNS. This is a DNS configuration issue, not a file upload issue.

## Solution: Configure DNS in Cloudflare

### Step 1: Log in to Cloudflare
1. Go to https://dash.cloudflare.com
2. Log in with your Cloudflare account
3. Select your domain: `shonencloud.com`

### Step 2: Check DNS Records
1. Click on **DNS** in the left sidebar
2. You should see DNS records (A, CNAME, etc.)

### Step 3: Add/Update DNS Records

You need to point your domain to Hostinger's servers. Add these records:

**Option A: If using Hostinger's IP (Recommended)**
```
Type: A
Name: @ (or shonencloud.com)
Content: [Hostinger's IP address]
Proxy: Proxied (orange cloud) or DNS only (gray cloud)
TTL: Auto
```

**Option B: If using CNAME**
```
Type: CNAME
Name: @ (or shonencloud.com)
Target: [your-hostinger-domain].hostinger.com
Proxy: Proxied (orange cloud) or DNS only (gray cloud)
TTL: Auto
```

### Step 4: Get Hostinger's IP Address

1. **Log in to Hostinger hPanel**: https://hpanel.hostinger.com
2. Go to **Hosting** → **Manage**
3. Look for **IP Address** or **Server IP**
4. Copy the IP address

OR

1. In Hostinger hPanel → **Domains**
2. Check your domain's DNS settings
3. Look for the A record pointing to an IP address

### Step 5: Update Nameservers (If Needed)

If Cloudflare is managing your DNS:
- Cloudflare nameservers should already be set
- Verify in Cloudflare dashboard → Overview → Nameservers

If Hostinger is managing your DNS:
- You need to either:
  - **Option 1**: Use Hostinger's nameservers (remove from Cloudflare)
  - **Option 2**: Use Cloudflare's nameservers (update at your domain registrar)

### Step 6: Wait for Propagation
- DNS changes can take 5 minutes to 48 hours
- Usually takes 10-30 minutes
- Use https://www.whatsmydns.net to check propagation

---

## Alternative: Remove Cloudflare (If Not Needed)

If you don't need Cloudflare features:

1. **In Cloudflare Dashboard**:
   - Go to your domain
   - Scroll down to find "Remove Site from Cloudflare"
   - Follow the process

2. **Update Nameservers at Domain Registrar**:
   - Go to where you bought the domain
   - Update nameservers to Hostinger's nameservers
   - Get Hostinger nameservers from hPanel → Domains

---

## Quick Check: Verify Hostinger Setup

1. **In Hostinger hPanel**:
   - Go to **Domains**
   - Verify `shonencloud.com` is added
   - Check DNS records are configured

2. **Test Direct IP Access** (if you have Hostinger IP):
   - Try accessing via IP (if Hostinger allows)
   - This confirms files are uploaded correctly

---

## Common DNS Record Types

### A Record (Points to IP)
```
Type: A
Name: @
Content: 123.456.789.0 (Hostinger IP)
```

### CNAME Record (Points to another domain)
```
Type: CNAME
Name: @
Target: yourdomain.hostinger.com
```

### For www subdomain
```
Type: CNAME
Name: www
Target: shonencloud.com
```

---

## Still Having Issues?

1. **Check Cloudflare Status**: https://www.cloudflarestatus.com
2. **Contact Cloudflare Support**: If DNS is configured correctly but still not working
3. **Contact Hostinger Support**: To get the correct IP/nameservers
4. **Check Domain Registrar**: Ensure domain is active and nameservers are correct

---

## Important Notes

- **DNS Propagation**: Changes can take time to propagate globally
- **Cloudflare Proxy**: If using "Proxied" (orange cloud), Cloudflare will cache your site
- **SSL**: Cloudflare provides free SSL, but you may need to configure it
- **Hostinger + Cloudflare**: Both services need to be configured correctly

---

**Once DNS is fixed, your site should load! The files are already uploaded correctly.**

