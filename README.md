# Cleo

Cleo is a lightning-fast, privacy-focused, and highly customizable New Tab extension designed for Chromium and Firefox-based browsers (Chrome, Edge, Brave, Vivaldi, Firefox, etc.). It transforms the standard browser startup screen into a clean, distraction-free dashboard equipped with essential productivity tools, smart shortcut management, and deep aesthetic controls.

---

## Key Features

### ⏱️ Integrated Pomodoro Focus Timer

* **Custom Intervals:** Adjust focus sessions (25–120 min) and break intervals (5–30 min) with real-time numeric and slider controls.
* **Persistent Background Timing:** Operates via Manifest V3 alarms and service workers to track sessions even when tabs are closed.
* **Audio-Visual Notifications:** Native desktop notifications alert you when sessions start, pause, or complete.
* **Flexible UI:** Position the timer in the top-left or top-right corner, toggle borders, and choose between custom, accent-matched, or high-contrast monochrome styles.

### 🔍 Unified Search Hub

* **10 Built-In Search Providers:** Google, Google Web (Clean / UDM=14), DuckDuckGo, Brave, Startpage, Kagi, Bing, Yahoo, Qwant, and Ecosia.
* **Instant Engine Switcher:** Rapidly toggle engines directly from the search bar dropdown without entering settings.
* **Smart URL Navigation:** Detects valid domain structures and routes directly to URLs, bypassing standard search redirects.
* **Dynamic Greetings:** Displays contextual, time-aware greetings and clean search placeholders.

### ⚡ Smart Shortcut Grid

* **Hybrid Data Sources:** Switch between your browser's most visited sites (`topSites`) or a fully custom curated bookmark grid.
* **Drag-and-Drop Reordering:** Reorder shortcut tiles with fluid drag interactions.
* **Pinning & Menu Actions:** Pin essential shortcuts to keep them fixed at the front of the grid; edit or delete items on the fly.
* **Smart Favicon Contrast Inversion:** Built-in canvas contrast engine analyzes favicon pixel luminance to intelligently invert dark-on-dark or light-on-light monochromatic icons while leaving multi-colored logos untouched.
* **Accidental Deletion Recovery:** Built-in undo toasts let you restore removed shortcuts immediately.
* **Configurable Density:** Adjust grid sizes from 1 to 5 rows (10 to 50 max shortcuts) with optional text labels.

### 🎨 Advanced Theming & Layout Engine

* **One-Click Presets:** Instant access to curated themes: *Cleo Default*, *Midnight Slate*, *Warm Obsidian*, and *OLED Void*.
* **Custom Backgrounds & Wallpapers:** Set solid hex colors or upload local image wallpapers with automatic palette detection.
* **Global Master Controls:** Adjust corner roundness (0–50px), widget opacity (0–100%), and frosted glass blur (`backdrop-filter`) across the entire interface.
* **Typography Selector:** Choose across clean Sans-Serif, elegant Serif, Monospace, or System Default font stacks without page reloads.
* **Adaptive Clock & Date:** 12-hour/24-hour modes, optional seconds display, four date format conventions, and dynamic complementary color calculations.
* **Scrollbar Customization:** Set visibility to persistent or hover-only, with automatic, accent, or custom color modes.
* **Layout Lock:** One-click lock toggle prevents accidental drag movements or layout changes.

### ⚙️ Settings Panel Search & Data Portability

* **In-Panel Full-Text Search:** Find setting toggles and controls using a real-time search filter with keyword highlighting and match navigation.
* **Zero-FOUC Startup:** Preload engine initializes CSS variables and layout states synchronously from storage before the DOM renders, preventing screen flashes.
* **Clean-Slate Backup & Restore:** Export all dashboard configurations, shortcuts, and timers to a single JSON file, or restore backups cleanly without leaving legacy configuration artifacts.

---

## Technical Specifications

| Parameter | Specification |
| --- | --- |
| **Manifest Version** | Manifest V3 |
| **Frameworks / Libraries** | 100% Vanilla ES6+ JavaScript, CSS3, HTML5 (0 external runtime dependencies) |
| **Storage Architecture** | Synchronous `localStorage` cache backed by `chrome.storage.local` persistence |
| **Browser Compatibility** | Google Chrome, Microsoft Edge, Brave, Opera, Vivaldi, Mozilla Firefox (v109+) |
| **Rendering Strategy** | Hardware-accelerated CSS GPU compositing (`transform`, `opacity`, `backdrop-filter`) |
| **Network Requests** | 0 external telemetry, analytics, or CDN calls; operates 100% offline |

---

## Privacy & Security

Cleo is engineered to operate strictly within the client sandbox:

* **No Remote Telemetry:** Cleo does not collect, log, or transmit personal data, browsing history, or search queries.
* **Local Data Execution:** All configurations, custom shortcuts, and timer states remain stored exclusively inside your browser's local sandbox database.
* **Direct Search Routing:** Outgoing search queries route straight from your client to your selected search provider with zero intermediary proxies.