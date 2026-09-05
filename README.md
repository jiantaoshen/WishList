# Price Watch

A local-first product price monitoring application built with React, TypeScript, ASP.NET Core, and Python.

Price Watch monitors product prices across multiple stores, supports both automatic JSON-LD extraction and manual prices, normalizes different package sizes for fair comparison, tracks price history, and provides scheduled runs and email notifications.

## Features

* Multi-store price tracking
* Automatic JSON-LD price extraction with Playwright
* Manual prices for websites that cannot be extracted reliably
* Product-level and store-level scraper switches
* Mixed automatic and manual sources within the same product
* Package quantity and unit price tracking
* Comparable total price calculation across different package sizes
* Target total price and target unit price tracking
* Historical price data
* Suspicious price change detection
* Manual **Run Now** execution
* Email notifications with duplicate-alert protection
* Windows Task Scheduler integration
* Local JSON persistence
* Dashboard-based product management
* **Not run yet**, **Success**, **Failed**, and **Suspicious** product states
* Product detail pages with Edit and Delete
* Store offer comparison with actual, unit, and normalized prices

## Price Comparison

Stores may sell the same product in different package sizes.

For example:

```text
Apotea
54 SEK for 2 pcs

Amazon
27 SEK for 1 pc
```

Comparing raw package prices directly would incorrectly make Amazon appear cheaper when comparing the same quantity.

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

## Automatic and Manual Prices

Price Watch supports two source modes:

```text
Product scraper enabled
        │
        ├── Store scraper enabled
        │     → Open the page with Playwright
        │     → Read Product JSON-LD
        │     → Use the extracted price
        │
        └── Store scraper disabled
              → Use manual price
              → Do not open the store page
```

A product also has a master scraper switch.

When the product-level scraper is disabled, all stores use manual prices and no store pages are opened.

### JSON-LD Extraction

Automatic extraction is intentionally simple:

```text
Store page
    ↓
Playwright
    ↓
Product JSON-LD
    ↓
Price found
    ├── Yes → use scraped price
    └── No  → source fails
```

Price Watch does not maintain store-specific scraper implementations.

If a store does not expose a usable price through Product JSON-LD, the recommended workflow is to disable scraping for that source and enter a manual price.

This keeps the scraper architecture small and avoids maintaining custom extraction logic for individual websites.

## Dashboard

The Dashboard combines configured products with the latest scraper results:

```text
products.json
     +
latest.json
     ↓
Dashboard
```

New products appear immediately, even before their first run:

```text
Product Name

Lowest Total
—

Not run yet
```

After a successful run, the Dashboard displays the latest calculated prices and status.

Product details provide access to:

* Latest total and unit prices
* Store offers
* Actual package prices
* Comparable totals
* Price statistics
* Historical charts
* Price history
* Edit
* Delete

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
          Python Price Engine
                │
                ├── Playwright
                ├── JSON-LD extraction
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

The React frontend handles:

* Dashboard
* Product creation and editing
* Product details
* Store source configuration
* Scraper switches
* Manual prices
* Offer comparison
* Charts
* History views
* Scraper status
* Automation settings
* Email settings

### Backend

ASP.NET Core provides the local REST API and handles:

* Product CRUD
* Configuration validation
* Automation settings
* Email settings
* Scraper process orchestration
* Runtime and history data endpoints

### Python

Python handles:

* Playwright browser automation
* Product JSON-LD extraction
* Manual price processing
* Package quantity calculations
* Unit prices
* Comparable totals
* Price validation
* History processing
* Run metadata
* Notifications
* Cross-process run locking

### Storage

Price Watch uses local files rather than an external database.

Typical runtime structure:

```text
backend/
├── data/
│   ├── latest.json
│   ├── history/
│   ├── runs/
│   └── settings/
│
└── python/
    ├── products.json
    ├── webscraping.py
    ├── .state/
    └── pricewatch/
```

Key files include:

```text
python/products.json
→ Product configuration

data/latest.json
→ Latest successful product results

data/history/
→ Historical price snapshots

data/runs/
→ Scraper run metadata

data/settings/
→ Application settings such as scheduling

python/.state/
→ Internal scraper state such as notification and run-lock state
```

## Product Status

Products can have the following states:

| Status        | Meaning                                     |
| ------------- | ------------------------------------------- |
| `Not run yet` | Configured but never successfully processed |
| `Success`     | Processed successfully                      |
| `Failed`      | No valid result could be produced           |
| `Suspicious`  | A price was found but failed validation     |

Suspicious and failed results are not written as successful price history.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn UI
* Lucide

### Backend

* ASP.NET Core
* .NET 10

### Price Processing

* Python
* Playwright
* Pydantic
* JSON-LD

### Storage and Automation

* Local JSON
* Windows Task Scheduler
* PowerShell

## Getting Started

Clone the repository and run:

```powershell
.\start.ps1
```

The startup script:

* Checks Node.js, npm, .NET, and Python
* Installs frontend dependencies when required
* Creates the Python virtual environment
* Installs Python dependencies when required
* Installs Playwright Firefox when required
* Restores ASP.NET Core dependencies
* Starts the ASP.NET Core API
* Starts the Vite frontend

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
3. Enable automatic extraction or manual pricing for each store.
4. Set each store's package quantity when applicable.
5. Optionally configure a comparison quantity.
6. Set target total and unit prices.
7. Run the scraper manually or through automation.
8. Review prices, offers, history, and status from the Dashboard.
9. If a store cannot be extracted through JSON-LD, disable scraping for that source and enter a manual price.

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

## Scraper Behavior

The effective scraper state is:

```text
Product scraping_enabled
        │
        ├── false
        │     → all sources use manual_price
        │     → browser pages are not opened
        │
        └── true
              │
              ├── Source scraping_enabled = true
              │     → Playwright + JSON-LD
              │
              └── Source scraping_enabled = false
                    → manual_price
                    → source URL is not opened
```

When every configured source is manual, the scraper skips browser startup entirely.

Automatic sources are retried briefly in case JSON-LD is populated after page load.

If no valid JSON-LD price is found, that source is treated as failed rather than falling back to store-specific extraction logic.

## Notifications

Price Watch can send summary email notifications for:

* Products reaching their target price
* Suspicious price changes
* Failed scraper runs

Notification state is stored locally to avoid repeatedly sending the same alert.

A target alert is re-armed if the price later rises above the target again.

Suspicious prices are also deduplicated so the same suspicious value is not repeatedly emailed.

## Automation

Windows Task Scheduler can be configured through the application to run Price Watch automatically.

The ASP.NET Core backend manages the scheduled task and invokes the Python scraper using the configured local environment.

Manual execution remains available through the application using **Run Now**.

## Development Status

Price Watch is under active development.

The core application workflow is implemented, including:

* Multi-store product tracking
* JSON-LD automatic price extraction
* Manual price sources
* Product and source scraper controls
* Package normalization
* Comparable total pricing
* Unit price tracking
* Historical data
* Suspicious price detection
* Automation
* Email notifications
* Dashboard-based product management

The project currently uses local JSON persistence and is intended primarily as a local-first price monitoring application.

The scraper architecture intentionally avoids store-specific adapters: automatic sources use Product JSON-LD, while unsupported stores can be configured with manual prices.
