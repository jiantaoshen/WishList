# Price Watch

A personal product price tracking system built with **React, TypeScript, ASP.NET Core, Python, and Playwright**.

It automatically checks product prices, compares them with target prices, stores historical data, detects suspicious price changes, sends email alerts, and displays price trends on a local web dashboard.

The scraper runs locally because some monitored websites may block traffic from cloud data centers.

The scraper is intended for low-frequency personal price monitoring of publicly accessible product information and should respect website access policies and terms.

## Getting Started

### 1. Install dependencies

Frontend:

```bash
npm install
```

Python:

```bash
cd python
python -m pip install -r requirements.txt
python -m playwright install firefox
cd ..
```

ASP.NET Core:

```bash
cd backend/PriceWatch.Api
dotnet restore
cd ../..
```

### 2. Run the application

Start the ASP.NET Core API:

```bash
cd backend/PriceWatch.Api
dotnet run
```

In another terminal, start the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

Vite proxies `/api` requests to the local ASP.NET Core backend.

### 3. Set up Price Watch

Use the UI to:

- Add products in **Product Management**
- Configure email notifications in **Email Settings**
- Configure automatic checks in **Automation**
- Run the first price check with **Run Now**

Local configuration files are created when settings are saved.

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- Recharts

**Backend**
- C#
- ASP.NET Core
- .NET 10

**Scraper**
- Python
- Playwright
- Firefox
- Pydantic

**Testing**
- pytest

**Automation**
- Windows Task Scheduler

## Architecture
```text
                    Windows Task Scheduler
                             │
                             ▼
React + TypeScript ───► ASP.NET Core
        │                    │
        │                    ├─ Product Management
        │                    ├─ Run Now
        │                    ├─ Email Settings
        │                    └─ Schedule Management
        │                    │
        │                    ▼
        └────────────► Python + Playwright
                             │
                             ├─ Scraper adapters
                             ├─ Price extraction
                             ├─ Price validation
                             └─ Run diagnostics
                             │
                             ▼
                         Local data/
                    ├─ latest.json
                    ├─ history/
                    └─ runs/
```

ASP.NET Core acts as the local application layer between the React UI and the Python scraper. It manages product configuration, scraper execution, email settings, and Windows scheduling.

The Python scraper handles page loading, price extraction, validation, history generation, and diagnostics.

Runtime data is stored locally under `data/`.

## Current Features

- Manual and scheduled price checks
- Target price tracking and price history
- Product management from the UI
- Search, filtering, sorting, and price statistics
- JSON-LD extraction with scraper adapters
- Suspicious-price and failed-run detection
- Scraper health and run metadata
- Email alerts with notification deduplication
- Local debug artifacts for failed or suspicious checks
- Cross-process protection against overlapping scraper runs
- Automated tests with pytest

## Future Work

- Continue improving the dashboard and overall UI
- Improve the first-run and setup experience
- Add site-specific scraper adapters when needed
- Refine notification preferences and controls
- Add useful price analytics without overcomplicating the dashboard
- Prepare Windows packaging and distribution when the application is ready
