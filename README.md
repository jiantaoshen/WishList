# Price Watch

A personal product price tracking system built with **React, TypeScript, Python, Playwright, and Google Cloud**.

It automatically checks product prices, compares them with target prices, stores historical data, detects suspicious price changes, and displays price trends on a web dashboard.

The scraper runs locally because some monitored websites may block traffic from cloud data centers.

## Run the Frontend

Install dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

Local website: 
```text
http://localhost:5173
```

## Run the Price Checker

From the Python directory:
```bash
cd python
```
Install Python dependencies:
```bash
python -m pip install -r requirements.txt
```
Install Firefox for Playwright:
```bash
playwright install firefox
```
Run the price checker:
```bash
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
    "name": "Example Product",
    "url": "https://example.com/product",
    "target_price": 100
  }
]
```

## Tech Stack

**Frontend**

* React
* TypeScript
* Vite
* Tailwind CSS
* Recharts

**Scraper**

* Python
* Playwright
* Firefox
* Pydantic

**Testing**

* pytest

**Cloud**

* Google Cloud Run
* Google Cloud Storage
* Artifact Registry

**Automation**

* Windows Task Scheduler

## Architecture
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
       ┌──────┴───────┐
       ▼              ▼
     Valid      Failed / Suspicious
       │              │
       ▼              ▼
Google Cloud      Local Debug
Storage           Artifacts
├─ latest.json    ├─ screenshot
└─ history/       ├─ HTML
       │          ├─ error.json
       │          └─ trace.zip
       ▼
React + TypeScript
       ↓
Google Cloud Run
```

## Current Features

* Automatic weekly price checks
* Target price tracking
* Historical price charts
* Site adapter architecture
* JSON-LD price extraction
* Price parsing and validation
* Previous-price comparison
* Suspicious price detection
* Structured error handling
* Playwright screenshots, HTML snapshots, and traces for failed checks
* Automated tests with pytest
* Google Cloud Storage integration
* React dashboard deployed on Cloud Run

## Future Work

* Run metadata and scraper health monitoring
* Safer Google Cloud Storage writes
* Price-drop and failure notifications
* Additional site-specific scraper adapters when needed
* Improved dashboard statistics, filters, and health indicators
