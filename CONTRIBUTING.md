# Contributing to Cleo

Thank you for your interest in contributing to **Cleo**! Whether you are fixing a bug, improving UI performance, adding support for a new search provider, or proposing a new feature, your help is welcome.

---

## Code of Conduct

Be respectful, constructive, and collaborative. Treat everyone with kindness and help build an inclusive, supportive environment.

---

## Architectural Principles

Before writing code, keep in mind Cleo's core philosophy:

* **Zero Runtime Dependencies:** Cleo is built with 100% native web technologies (HTML5, CSS3, ES6+ JavaScript). Do not introduce frameworks (React, Vue), build toolchains, or heavy external npm packages unless specifically discussed in an issue first.
* **Privacy First:** Cleo operates completely offline. No tracking pixels, third-party analytics, remote font loaders, or telemetry are permitted.
* **Performance & Zero-FOUC:** Dashboard initialization must remain instantaneous. Changes must preserve synchronous preloading (`preload.js`) and avoid layout shifts or render-blocking scripts.

---

## Getting Started

### 1. Fork & Clone the Repository

```bash
# Fork the repository on GitHub, then clone your fork:
git clone https://github.com/YOUR-USERNAME/Cleo.git
cd Cleo

```

### 2. Branch from `dev`

All development work and pull requests should target the **`dev`** branch, not `main`.

```bash
# Create a feature/bugfix branch from dev:
git checkout dev
git checkout -b feature/your-feature-name

```

---

## Local Development & Testing

Cleo runs directly in the browser without a compilation step.

### Testing in Google Chrome / Microsoft Edge / Brave

1. Open your browser and navigate to `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** via the toggle in the top-right corner.
3. Click **Load unpacked**.
4. Select the root folder of the cloned repository.
5. Open a new tab (`Ctrl + T` / `Cmd + T`) to see Cleo.
6. Whenever you make code changes, return to `chrome://extensions` and click the **Reload (🔄)** button on Cleo's extension tile.

### Testing in Mozilla Firefox

1. Navigate to `about:debugging#/runtime/this-firefox`.
2. Click **Load Temporary Add-on...**.
3. Select `manifest.json` from your local Cleo repository folder.
4. Open a new tab to test.

---

## Project Structure

```text
Cleo/
├── css/
│   ├── layout.css       # Core layout constraints & positioning
│   ├── main.css         # Reset & global styles
│   ├── panel.css        # Settings side panel & search styling
│   ├── pomodoro.css     # Pomodoro widget styles
│   ├── search.css       # Search bar & dropdown menu styles
│   ├── shortcuts.css    # Shortcut grid & tile styles
│   ├── ui.css           # Modal dialogs & buttons
│   └── variables.css    # Master CSS tokens & custom properties
├── icons/               # Extension icons (16, 48, 128px)
├── js/
│   ├── clock.js         # Clock & date rendering engine
│   ├── grid.js          # Shortcuts grid, drag-and-drop, context menu
│   ├── icon-utils.js    # Canvas pixel analyzer & smart favicon inverter
│   ├── main.js          # Entry point module
│   ├── panel.js         # Side-panel event handlers & sliders
│   ├── pomodoro.js      # Pomodoro widget UI & timer logic
│   ├── search.js        # Search provider routing & panel search
│   ├── state.js         # Default schema, storage sync, import/export
│   ├── theme.js         # Dynamic theming & master UI applicator
│   └── utils.js         # Color math, RGB/Hex conversion, contrast checks
├── background.js        # MV3 service worker (alarms, notifications)
├── preload.js           # Synchronous Zero-FOUC vanguard engine
├── newtab.html          # Main application markup
└── manifest.json        # Manifest V3 configuration

```

---

## Contribution Guidelines

### Making Changes

* **CSS:** Use existing tokens in `css/variables.css`. Ensure selectors account for both `:is(html, body)` where appropriate to match the preload engine.
* **Storage Keys:** If adding new settings, define fallback defaults inside `defaultSettings` in `state.js` and register proper bindings in `theme.js` and `panel.js`.
* **Cross-Browser Parity:** Test your modifications on at least one Chromium browser and Mozilla Firefox. Ensure APIs like `chrome.runtime.getURL('/_favicon/')` degrade gracefully via standard fallbacks.

### Commit Messages

Write clear, descriptive commit messages:

```bash
# Good examples:
git commit -m "Fix Pomodoro widget alignment in settings panel"
git commit -m "Add Qwant search provider to search bar"
git commit -m "Optimize favicon canvas analysis sampling"

```

---

## Submitting a Pull Request (PR)

1. Ensure your branch is up to date with `upstream/dev`.
2. Test that there are no JavaScript errors or unhandled exceptions in the browser developer console (`F12`).
3. Push your branch to your fork:
```bash
git push origin feature/your-feature-name

```


4. Open a Pull Request on GitHub targeting the **`dev`** branch.
5. Provide a concise summary of what changed, why the change was made, and how it was tested. Include screenshots or screen recordings for any visual/UI updates.

---

## Reporting Issues & Feature Suggestions

* **Bug Reports:** Provide steps to reproduce the issue, your browser name/version, and any relevant console error logs.
* **Feature Proposals:** Open an issue first to discuss new features or significant UI changes before submitting a large PR.