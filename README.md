# Price Watch

A local-first product price monitoring application built with React, TypeScript, ASP.NET Core and Python.

Price Watch automatically checks e-commerce product pages, tracks current and historical prices, compares them with target prices, detects suspicious changes, and supports scheduled runs and email notifications.

## Features

- Product management with backend-generated IDs
- Automatic price monitoring with Playwright
- Target price and price-drop tracking
- Historical price data
- Suspicious price change detection
- Manual **Run Now** execution
- Email notifications with duplicate-alert protection
- Windows Task Scheduler integration
- Local JSON persistence

## Architecture

```text
React + TypeScript + Vite + shadcn UI
        ↓ /api
ASP.NET Core (.NET 10)
        ↓
Scraper + Windows Task Scheduler + Email Notifications
        ↓
Local JSON
```

The frontend handles the UI and CRUD operation, ASP.NET Core provides the local REST API, and Python handles browser automation and price extraction.

The scraper prioritizes structured Schema.org JSON-LD data. DOM extraction is only used when structured product data is unavailable or unusable.

Suspicious price changes are separated from normal results to reduce the risk of incorrect prices being accepted.

shadcn UI was used for fast development without design UI. 

## Tech Stack

**Frontend**
- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn UI

**Backend**
- ASP.NET Core
- .NET 10

**Scraping**
- Python
- Playwright
- Pydantic

**Storage & Automation**
- Local JSON
- Windows Task Scheduler
- PowerShell

## Getting Started

Clone the repository and run:

```powershell
.\start.ps1
```

The startup script automatically:

- checks Node.js, npm, Python, and .NET
- installs frontend dependencies when needed
- creates the Python virtual environment when missing
- installs Python dependencies when `requirements.txt` changes
- installs Playwright Firefox when required
- restores .NET dependencies when needed
- starts the ASP.NET Core API
- starts the Vite frontend

Dependencies are skipped on later runs unless the relevant dependency files change.

To run the scraper once before starting the application:

```powershell
.\start.ps1 -RunScraper
```

If PowerShell blocks local scripts, enable them once with:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

The project is currently under active development, with the main application architecture and core price-monitoring workflow implemented.
