# 🌋 AshWatch Web — Darwin VAAC Volcanic Ash Viewer & Technical SEO

AshWatch Web is the production-ready Next.js web application for monitoring, parsing, and visualizing volcanic ash advisories (VAA) across Indonesia, ingested directly from the Australian Bureau of Meteorology (BoM) Darwin VAAC.

---

## 🚀 Key Features

- **🌐 100% Serverless & CORS-Free Ingestion**: Built-in Next.js Serverless route handler (`/api/advisories`) ingesting live BoM feeds with resilient fallback caching.
- **🗺️ Interactive Multi-Altitude Map**: OpenStreetMap Leaflet integration with accurate polygon opacities (Observed: 55%, +6h: 40%, +12h: 28%, +18h: 18%), radar pulsing markers, flight level tooltips, and GPS user location.
- **⚡ Technical SEO & Crawlability**: 100% crawlable initial HTML DOM, single H1 per route, rich semantic HTML5 landmarks, dynamic Open Graph images (`1200x630`), Twitter summary cards, and canonical links.
- **📄 Structured Data (JSON-LD)**: Full Schema.org compliance with `SoftwareApplication`, `WebSite`, `FAQPage`, and `BreadcrumbList`.
- **🗺️ Dynamic XML Sitemap & Robots.txt**: Automated canonical URL discovery for home, map, directory, and volcano profile slugs.
- **📱 Responsive & Accessible**: Mobile-first layout with high contrast, ARIA landmarks, and keyboard navigable controls.

---

## 📋 Public Routes Architecture

| Route | Purpose | SEO / Rendering |
|---|---|---|
| `/` | Primary landing page with crawlable text, active volcano ticker, and FAQ | SSG / ISR (300s) |
| `/map` | Fullscreen interactive map with layers, geolocation, and filters | CSR / Dynamic |
| `/volcanoes` | Directory of Indonesian volcanoes monitored by Darwin VAAC | SSG |
| `/volcanoes/[slug]` | Individual volcano profile (e.g. Krakatau, Semeru, Lewotolok) | SSG (generateStaticParams) |
| `/advisories` | Feed of recent Darwin VAAC bulletins with DTG and flight levels | SSG / ISR |
| `/advisories/[id]` | Full bulletin inspector with parsed coordinates and raw attributes | SSG / ISR |
| `/data-sources` | Explanation of Darwin VAAC, Himawari-9 satellite, and MAGMA | SSG |
| `/faq` | Aviation meteorological FAQs with `FAQPage` JSON-LD schema | SSG |
| `/about` | Project engineering mission, author, and safety disclaimer | SSG |
| `/api/advisories` | Serverless REST API returning parsed advisory JSON | Edge / Serverless |
| `/sitemap.xml` | XML sitemap containing all canonical indexable URLs | Dynamic |
| `/robots.txt` | Robots crawler instructions | Dynamic |

---

## ⚙️ Environment Variables

Create `.env.local` based on `.env.example`:

```env
# Single source of truth for canonical URLs, Open Graph, Sitemap & JSON-LD
NEXT_PUBLIC_SITE_URL=https://ashwatch.vercel.app
```

---

## 🛠️ Local Development & Testing

### 1. Install Dependencies
```bash
cd ashwatch-web
npm install
```

### 2. Run Unit Tests (VAA Parser, Coordinates, Dates)
```bash
npm test
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build Verification
```bash
npm run build
```

---

## ☁️ Vercel Deployment Instructions

### Method A: Deploy via Vercel CLI (Recommended)

1. Install Vercel CLI globally:
   ```bash
   npm i -g vercel
   ```

2. Navigate into the web folder:
   ```bash
   cd ashwatch-web
   ```

3. Deploy to preview:
   ```bash
   vercel
   ```

4. Deploy to production:
   ```bash
   vercel --prod
   ```

### Method B: Deploy via Vercel Git Integration

1. Push your repository to GitHub: `https://github.com/IlhamGhaza/ashwatch`.
2. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New Project**.
3. Import the `ashwatch` repository.
4. **Important**: In the configuration modal, set the **Root Directory** to:
   ```
   ashwatch-web
   ```
5. Set Environment Variable:
   - `NEXT_PUBLIC_SITE_URL` = `https://your-custom-domain.vercel.app`
6. Click **Deploy**.

---

## 🔍 Google Search Console Setup

Follow these exact steps to index AshWatch:

1. **Add Property**: Open [Google Search Console](https://search.google.com/search-console), select **URL Prefix**, and enter your production URL (e.g. `https://ashwatch.vercel.app`).
2. **Verify Ownership**: Use the HTML tag method or Vercel DNS CNAME record.
3. **Submit Sitemap**: Go to **Sitemaps** in the left menu, submit `sitemap.xml`, and click **Submit**.
4. **URL Inspection**: Enter the homepage URL into the top search bar and click **Test Live URL**. Verify that Googlebot renders the `<h1>` and content without errors.
5. **Request Indexing**: Click **Request Indexing** on the inspected homepage.
6. **Core Web Vitals**: Monitor the **Page Experience** and **Core Web Vitals** tab to track real-world LCP, INP, and CLS scores.

---

## ⚖️ Safety & Data Disclaimer

AshWatch is an independent visualization and research tool. It is **not** an official civil aviation authority, air navigation service provider (ANSP), or government meteorological agency. The information provided must not be used as the primary source for flight planning or safety-critical decisions. Always refer to official NOTAMs, ASHTAMs, and direct BoM/AirNav Indonesia bulletins.
