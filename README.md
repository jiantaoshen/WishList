# Price Watch

A personal product price tracking system built with **React, TypeScript, Python, Playwright, and Google Cloud**.

It automatically checks product prices, compares them with target prices, stores historical data, detects suspicious price changes, sends email alerts, and displays price trends on a web dashboard.

The scraper runs locally because some monitored websites may block traffic from cloud data centers.

The scraper is intended for low-frequency personal price monitoring of publicly accessible product information and should respect website access policies and terms.

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

## Products

Products are configured in:

```text
python/products.json
```

Example:

```json
[
  {
    "id": "example-product",
    "name": "Example Product",
    "url": "https://example.com/product",
    "target_price": 100,
    "currency": "SEK"
  }
]
```

## Environment Variables

Create a `.env` file in the project root:

```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=
EMAIL_TO=
```

`SMTP_PASSWORD` can use an email provider App Password.

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

**Scraper**
- Python
- Playwright
- Firefox
- Pydantic

**Testing**
- pytest

**Cloud**
- Google Cloud Run
- Google Cloud Storage
- Artifact Registry

**Automation**
- Windows Task Scheduler

## Architecture & Features

```text
Windows Task Scheduler
        ↓
┌──────────────────────────────┐
│     Python Price Checker     │
│                              │
│  Playwright + Firefox        │
│          ↕                   │
│   Product Websites           │
│          ↓                   │
│   Site Adapter               │
│          ↓                   │
│   Extraction Strategy        │
│          ↓                   │
│   Price Parser               │
│          ↓                   │
│   Previous Price Lookup      │
│          ↓                   │
│   Price Validation           │
└─────────────┬────────────────┘
              │
       ┌──────┴─────────────┐
       ▼                    ▼
     Valid          Failed / Suspicious
       │                    │
       ▼                    ▼
Google Cloud Storage    Local Debug
├─ latest.json          ├─ screenshot.png
├─ history/             ├─ page.html
└─ runs/                ├─ error.json
       │                └─ trace.zip
       ▼
React + TypeScript
       ↓
Google Cloud Run

Run Metadata
     ↓
Scraper Health

Notification Events
     ↓
Single Summary Email
```

### Current Features

- Automatic weekly price checks
- Target price tracking
- Historical price charts
- Site adapter architecture
- JSON-LD price extraction
- Centralized price parsing and validation
- Previous-price comparison
- Suspicious price detection
- Structured scrape results and error handling
- Run metadata and scraper health status
- Safe Google Cloud Storage writes
- Generation-based overwrite protection
- Email alerts for target prices, suspicious prices, and failed runs
- Notification deduplication and summary emails
- Playwright screenshots, HTML snapshots, and traces for failed or suspicious checks
- Automated tests with pytest
- React dashboard deployed on Google Cloud Run

## Future Work

- Additional site-specific scraper adapters when needed
- Improved dashboard statistics
- Scraper health indicators in the frontend
- Product filtering and sorting
- Price-change and historical statistics
- Improved notification preferences
