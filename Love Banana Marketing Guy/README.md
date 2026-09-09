# 🍌 BandSpot — Love Banana PR & Radio Outreach Engine

A bespoke music industry CRM and email outreach engine built specifically for **Love Banana** and Henry Collins. Designed to run the single release campaign (*"Seagull"* out September 16, lead single from debut album *Any Direction* mastered by Mikey Young on Ragnar Records) and target European indie radio stations, music blogs, magazines, and curators.

---

## ⚡️ Key Highlights

1. **Strict Human-in-the-Loop Approval Queue ("Check Me Before You Send")**:
   - Outbox staging drawer where every email is reviewed before sending.
   - Batch **[Send All Approved via Gmail]** with natural anti-spam spacing delays.
   - **[Push All to Gmail Drafts]** so you can view and send from your phone or desktop Gmail app.
   - Zero auto-blasts without your explicit sign-off.
2. **HubSpot & CSV Importer**:
   - Drag and drop your HubSpot CSV export directly.
   - Automatically maps `First Name`, `Last Name`, `Associated Company`, `Email`, and notes.
3. **European Outreach Targeting**:
   - Preloaded with curated European indie radio stations (BBC 6 Music, Radio X, FIP Radio France, Radio Eins Berlin, Radio Elance Spain, Subcity Glasgow, ByteFM Germany) and music blogs/press (Clash, Line of Best Fit, Louder Than War, Jenesaispop).
4. **Inbound Reply Watchdog**:
   - Automatically checks active Gmail threads for responses.
   - Alerts you the moment a station DJ or editor writes back and advances them to *"Replied / In Discussion"*.
5. **Love Banana Campaign Assets Hub**:
   - Synced with your live EPK (`https://love-banana-epk.vercel.app/epk.html`), album promo player, high-res WAV master download, and artwork.

---

## 🚀 How to Run

From this directory:

```bash
# 1. Start the local server
npm run dev

# 2. Open in your browser
http://localhost:3000
```

---

## 📬 Gmail Connection Guide

BandSpot runs in **Safe Sandbox Mode** by default so you can test generating pitches, reviewing drafts, and simulating incoming replies without needing any credentials.

When you are ready to link your real Gmail account:
1. Go to [Google Cloud Console](https://console.cloud.google.com) and create a free project.
2. Under **APIs & Services &rarr; Library**, enable the **Gmail API**.
3. Under **Credentials &rarr; Create Credentials &rarr; OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback`
4. Copy your **Client ID** and **Client Secret** into BandSpot's **Settings** tab.
5. Click **Authorize Gmail Account via Google**!
