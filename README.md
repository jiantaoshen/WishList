# Price Watch

A local-first product price monitoring application built with React, TypeScript, ASP.NET Core, and Python.

Price Watch monitors product prices across multiple stores, supports both automatic scraping and manual prices, normalizes different package sizes for fair price comparison, tracks price history, and provides scheduled runs and email notifications.

## Features

- Multi-store price tracking
- Automatic price scraping with Playwright
- Manual prices for websites that cannot be scraped
- Product-level and store-level scraper switches
- Mixed scraped and manual sources within the same product
- Package quantity and unit price tracking
- Comparable total price calculation across different package sizes
- Target total price and target unit price tracking
- Historical price data
- Suspicious price change detection
- Manual **Run Now** execution
- Email notifications with duplicate-alert protection
- Windows Task Scheduler integration
- Local JSON persistence
- Dashboard-based product management
- **Not run yet**, **Success**, **Failed**, and **Suspicious** product states
- Product detail pages with Edit and Delete
- Store offer comparison with actual, unit, and normalized prices

## Price Comparison

Stores may sell the same product in different package sizes.

For example:

```text
Apotea
54 SEK for 2 pcs

Amazon
27 SEK for 1 pc
```

Comparing the raw prices directly would incorrectly make Amazon appear cheaper for the same quantity.

Price Watch uses a product-level `comparison_quantity` to normalize store prices.

For a comparison quantity of `2 pcs`:

```text
Apotea
54 / 2 × 2 = 54 SEK

Amazon
27 / 1 × 2 = 54 SEK
```

Each store offer can therefore contain:

```text
Actual price
→ The real package price shown by the store

Unit price
→ Actual price / package quantity

Comparable total
→ Unit price × comparison quantity
```

This allows different package sizes to be compared using the same quantity.

## Manual Prices

Some stores cannot be scraped reliably.

Each store can independently use either automatic scraping or a manually entered price.

```text
Product scraper enabled
        │
        ├── Store scraper enabled
        │     → Scrape price with Playwright
        │
        └── Store scraper disabled
              → Use manual price
              → Do not open the store page
```

A product also has a master scraper switch. When disabled, all stores use manual prices and no store pages are opened.

## Dashboard

The Dashboard combines configured products with the latest scraper results:

```text
products.json
     +
latest.json
     ↓
Dashboard
```

New products appear immediately, even before the first scraper run:

```text
Product Name

Lowest Total
—

Not run yet
```

After a successful run, the Dashboard displays the latest calculated prices and status.

Product details provide access to:

- Latest total and unit prices
- Store offers
- Actual package prices
- Comparable totals
- Price statistics
- Historical charts
- Price history
- Edit
- Delete

## Architecture

```text
React + TypeScript + Vite + shadcn UI
                │
                │ /api
                ▼
        ASP.NET Core (.NET 10)
                │
                ├── Product configuration
                ├── Email settings
                ├── Automation settings
                ├── Scraper orchestration
                └── Local REST API
                │
                ▼
           Python Scraper
                │
                ├── Playwright
                ├── Store-specific extraction
                ├── Manual price handling
                ├── Price normalization
                ├── Price validation
                ├── History processing
                └── Notifications
                │
                ▼
            Local JSON
```

### Frontend

The React frontend handles the Dashboard, product forms, product details, store offer comparison, charts, history views, scraper status, and application settings.

### Backend

ASP.NET Core provides the local REST API and handles product CRUD, configuration validation, automation settings, email settings, and scraper process orchestration.

### Scraper

Python handles browser automation, price extraction, manual price processing, package quantity calculations, unit prices, comparable totals, validation, history processing, and notifications.

### Storage

Local JSON files are used for product configuration, latest results, historical price data, run metadata, email settings, and automation settings.

## Product Status

Products can have the following states:

| Status | Meaning |
| --- | --- |
| `Not run yet` | Configured but never processed by the scraper |
| `Success` | Processed successfully |
| `Failed` | No valid result could be produced |
| `Suspicious` | A price was found but failed validation |

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn UI
- Lucide

### Backend

- ASP.NET Core
- .NET 10

### Scraping

- Python
- Playwright
- Pydantic

### Storage & Automation

- Local JSON
- Windows Task Scheduler
- PowerShell

## Getting Started

Clone the repository and run:

```powershell
.\start.ps1
```

The startup script automatically checks the required runtimes, installs missing dependencies, creates the Python virtual environment, installs Playwright Firefox when required, restores .NET dependencies, and starts both the ASP.NET Core API and Vite frontend.

Dependencies are skipped on later runs unless the relevant dependency files change.

To run the scraper once before starting the application:

```powershell
.\start.ps1 -RunScraper
```

If PowerShell blocks local scripts:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

## Typical Workflow

1. Add a product from the Dashboard.
2. Add one or more store sources.
3. Configure scraping or manual pricing for each store.
4. Set each store's package quantity.
5. Optionally configure a comparison quantity.
6. Set target total and unit prices.
7. Run the scraper manually or through automation.
8. Review prices, offers, history, and status from the Dashboard.

Example:

```text
Product comparison quantity
2 pcs

Apotea
Actual price:      54 SEK
Package quantity:   2 pcs
Unit price:        27 SEK/pcs
Comparable total:  54 SEK

Amazon
Actual price:      27 SEK
Package quantity:   1 pc
Unit price:        27 SEK/pcs
Comparable total:  54 SEK
```

## Development Status

Price Watch is under active development.

The core application workflow is implemented, including multi-store product tracking, manual and automatic price sources, scraper controls, package normalization, comparable total pricing, unit price tracking, historical data, suspicious price detection, automation, email notifications, and Dashboard-based product management.

The project currently uses local JSON persistence and is intended primarily as a local-first price monitoring application.