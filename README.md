# Still

A calmer corner of the internet. A responsive focus workspace built by Chidera Emmanuel (CE).

Still gives you a focus timer, intentional daily tasks, a little ambient rain, and a reminder to go at your own pace.

## Features

- Adjustable focus sessions (1–120 minutes), 5-minute short breaks, and 15-minute long breaks.
- Start, pause, resume, and reset. The timer uses a real deadline and recovers after reloading or returning from a background tab.
- Task creation, completion, selection for your next session, and removal.
- Daily focus totals, completed session history, and JSON export.
- Locally generated rain sounds. No audio downloads or API keys.
- Light and dark themes, keyboard shortcuts, responsive layouts, and reduced-motion support.
- Browser-local saving. No account, analytics, or backend. Your tasks and history stay in this browser. Google Fonts requests fonts; system fonts are the fallback.

## Run locally

Serve this directory with any static web server, for example `python -m http.server 8000`, and open `http://localhost:8000`. JavaScript modules need an HTTP server rather than opening the HTML file directly.

Run the timer and saved-state checks with `npm test` (Node.js 18+; no dependencies).

## Deploy

GitHub Pages: publish the `main` branch, `/ (root)` folder. No build step is needed. Relative asset paths support project Pages URLs.

## Notes

The timer completes when the browser next runs it. Background suspension may delay the visible completion message; completed focus time is recorded against the scheduled end time. Breaks never start automatically. Rain must be enabled with a click, and stops when the page closes. Clearing site storage removes saved tasks and history; export history first if you need a copy.

Made with HTML, CSS, JavaScript, and a little stillness.
