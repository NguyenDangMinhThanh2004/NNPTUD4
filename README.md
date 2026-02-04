# Product Dashboard

This is a simple static dashboard that uses the API https://api.escuelajs.co/api/v1/products

Features implemented:
- Display columns: `id`, `title`, `price`, `category`, `images` with thumbnail
- Description shown on hover (row `title` attribute)
- Search by `title` (updates on input change)
- Pagination with options 5, 10, 20 per page
- Sort by `title` and `price` by clicking column headers
- Export current page view to CSV
- Modal to view and edit item details (updates via API `PUT`)
- Modal to create new item (creates via API `POST`)

How to run
- Open `index.html` in a modern browser (no server required). Some browsers may restrict `fetch` on `file://` pages; if so run a local static server:

  ```powershell
  # from project directory
  python -m http.server 8000
  # then open http://localhost:8000
  ```

Notes
- The API used is public demo API; CORS and behavior depend on that service.
- Screenshots: add images into `screenshots/` and commit them to the repo. The Word document (deliverable) should be prepared locally and not committed.

Files
- `index.html` — main UI
- `app.js` — logic
- `styles.css` — small styles
Nguyễn Đặng Minh Thành 
2280602944
