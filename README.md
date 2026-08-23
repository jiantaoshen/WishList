# Price Watch

A personal product price tracker built with React, TypeScript, Python, Playwright, and Google Cloud.

It checks product prices weekly, compares them with target prices, stores historical data, and displays price trends on a website.

## Architecture

```text
Windows Task Scheduler
        ↓
Python + Playwright
        ↓
Product Websites
        ↓
Google Cloud Storage
   ├── latest.json
   └── history/
        ↓
React + TypeScript
        ↓
Google Cloud Run
```

The price checker runs locally because some monitored websites use Cloudflare and block requests from cloud data centers.

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

**Price Checker**
- Python
- Playwright
- Firefox

**Cloud**
- Google Cloud Run
- Google Cloud Storage
- Artifact Registry

**Automation**
- Windows Task Scheduler

## Project Structure

```text
WishList/
├── src/                  # React frontend
├── python/
│   ├── webscraping.py
│   ├── products.json
│   └── requirements.txt
├── Dockerfile
├── nginx.conf
└── package.json
```

## Products

Products are configured in:

```text
python/products.json
```

Example:

```json
[
  {
    "name": "Example Product",
    "url": "https://example.com/product",
    "target_price": 100
  }
]
```

## Run the Frontend

```bash
npm install
npm run dev
```

Local website:

```text
http://localhost:5173
```

## Run the Price Checker

```bash
cd python
python -m pip install -r requirements.txt
playwright install firefox
python webscraping.py
```

The script:

1. Reads `products.json`
2. Scrapes current prices
3. Compares them with target prices
4. Updates price history
5. Uploads JSON data to Google Cloud Storage

## Automatic Price Checks

Windows Task Scheduler runs the scraper:

```text
Every Monday at 08:00
```

The task is configured to run as soon as possible if the scheduled time was missed.

Therefore, the computer does not need to be running exactly at 08:00.

## Data

Price data is stored in:

```text
gs://wishlist-example-price-data/
├── latest.json
└── history/
    ├── index.json
    ├── 2026-08-17.json
    └── 2026-08-24.json
```

If a price check completely fails, existing cloud data is not overwritten.

## Status

✅ React price dashboard  
✅ Target price tracking  
✅ Historical price charts  
✅ Python + Playwright scraper  
✅ Google Cloud Storage  
✅ Google Cloud Run  
✅ Weekly automatic price checks