# Baker production CSV exports

Staff-only production exports are generated from the **same calculations** used for the Overview, Calendar and Bake List. The export never accesses customer contact details, dietary notes, delivery addresses or payment credentials.

## How to use

Sign into the private MNTL admin and choose:

- **Overview → Export 14 days:** Download the next 14 calendar days, starting today.
- **Bake list → Export CSV:** Download the selected bake date's product totals.

Both actions work in demo mode. A demo filename begins `mntl-DEMO-production-` and every data row is flagged `DEMO_ONLY`; live exports use `LIVE`.

## CSV columns

| Column | Grain / meaning |
| --- | --- |
| `bake_date` | Local Calgary bakery date, YYYY-MM-DD |
| `product_id` | Product UUID; stable analytics join key |
| `product_name` | Descriptive name, safe-escaped for spreadsheets |
| `confirmed_paid_loaves` | Loaf quantity from paid, noncancelled orders only |
| `unpaid_loaves` | Separate unpaid quantity; **not production commitment** |
| `subscription_forecast_loaves` | Active subscription demand not already represented by paid renewal orders; **not revenue** |
| `bake_day_scheduled` | Whether a bake day is configured |
| `capacity_loaves` | Total daily capacity, blank if date not scheduled |
| `bake_day_status` | Live calendar state (or `unscheduled`) |
| `data_source` | `LIVE` or `DEMO_ONLY` |

**One row = one (bake_date, product_id)**. This is not an order-level export and must never be treated as containing all deliveries or financial data. Daily capacity is repeated on each recipe row, so downstream analysts must not sum capacity across products.

The exporter validates the composite row key, integer quantities and date format. It also protects against CSV formula injection if product names contain spreadsheet formulas. UTF-8 BOM is included for spreadsheet compatibility.

### Important scaling limitation

The admin currently fetches a maximum of 1,000 rows **per database table**. For large historical reporting, build server-side paginated exports or a secure warehouse pipeline instead of treating browser exports as complete history.

### Source and tests

- `admin/productionExport.js`: pure row construction, escaping, filenames and serialization.
- `admin/productionMetrics.js`: shared operational aggregation.
- `tests/production-export.test.mjs`: grain, privacy, demo provenance, spreadsheet safety and calculation tests.
- `admin/main.jsx`: download triggers using a local browser Blob.

This export does not contact any external service or mutate Supabase.
