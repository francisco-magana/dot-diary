# Dot Diary

One dot per day. Click a day, give it an icon and a few words about what mattered most,
and keep a longer markdown journal alongside it. Everything is stored locally in SQLite.

## Run it

Requires **Node.js 22.13+** (it uses the built-in `node:sqlite` module, so there's nothing native to compile).

```bash
npm install
npm start          # http://localhost:3000
```

Optional:

```bash
npm run seed       # fill an empty database with the sample days from the design
npm run dev        # restart the server automatically when files change
npm run icons      # re-download the icon list (public/data/icons.json) from Google
PORT=4000 npm start
```

The database lives at `data/dot-diary.sqlite` (override with `DB_PATH=...`). Back it up by copying that file.

> Icons and fonts load from Google Fonts (Material Symbols Rounded + IBM Plex Mono), so the first load needs internet.

## Using it

- **Click a day** → a quick popover opens. Type a few words, then tap an icon (or press Enter).
- **`…` in the popover** → the full editor: colors, a bigger preview, curated icon categories, an **All icons** tab and a
  **search box** over all ~4,000 Material Symbols (searches names and tags, e.g. "dog" finds `pets`). Changes save as you go.
- **Journal (left panel)** always shows the last day you clicked. Write in markdown; switch to *Preview* to see it rendered. It autosaves.
- Days with a journal entry get a small bar under their dot.
- **Year stepper** in the top bar: ‹ › jump to the previous/next year (or click the year, type one and press Enter). "Show 2024 / 2028" buttons add more years.
- `Esc` closes the popover and the editor.

## Project layout

```
server.js               Express app: static files + API routes
src/
  db.js                 SQLite schema and queries
  validate.js           Input checks (dates, icons, colors)
  routes/days.js        /api/days      – icon + label per day
  routes/journal.js     /api/journal   – markdown journal per day
scripts/seed.js         Sample data
scripts/build-icon-list.js  Builds public/data/icons.json (all icons + search tags)
public/
  index.html            Page structure
  css/styles.css        All styles
  data/icons.json       Every icon name + search tags
  js/
    app.js              Entry point; wires the pieces together
    store.js            App state, actions and change events
    api.js              fetch wrapper for the API
    calendar.js         The dot grid
    popover.js          Quick-entry popover
    editor.js           Full day editor panel
    journal.js          Journal panel + markdown toolbar
    year-picker.js      Year stepper (‹ 2026 ›)
    icon-library.js     Loads and searches the full icon list
    markdown.js         Tiny markdown renderer
    constants.js        Colors, icon categories, grid width
    dates.js            Date helpers
```

## API

| Method | Path                 | Body                         |
| ------ | -------------------- | ---------------------------- |
| GET    | `/api/days`          | → `{ days, recentIcons }`    |
| PUT    | `/api/days/:date`    | `{ icon, color, label }`     |
| DELETE | `/api/days/:date`    |                              |
| GET    | `/api/journal`       | → `{ dates }` with entries   |
| GET    | `/api/journal/:date` | → `{ title, body }`          |
| PUT    | `/api/journal/:date` | `{ title, body }` (empty → deleted) |

`:date` is `YYYY-MM-DD`. Colors: `black, red, green, blue, gray, orange, yellow`. Icons are
[Material Symbols](https://fonts.google.com/icons) names.

To change how many days appear per row, edit `GRID_COLUMNS` in `public/js/constants.js` (7, 14 or 21).
