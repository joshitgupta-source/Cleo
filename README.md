# Cleo

<p align="center">
  <img src="assets/Cleo%20Default.jpeg" alt="Cleo Default Dashboard" width="850">
</p>

Cleo is a lightning-fast, privacy-focused, and highly customizable New Tab extension designed for Chromium and Firefox-based browsers (Chrome, Edge, Brave, Vivaldi, Firefox, etc.). It transforms the standard browser startup screen into a clean, distraction-free dashboard equipped with essential productivity tools, smart shortcut management, and deep aesthetic controls.

---

## 🎨 Theme Presets & Adaptive Styling

Switch between high-contrast presets or adapt the UI dynamically to any uploaded wallpaper.

<div align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <img src="assets/Midnight%20Slate.jpeg" alt="Midnight Slate Preset" width="100%"><br>
        <b>Midnight Slate</b>
      </td>
      <td align="center" width="50%">
        <img src="assets/Warm%20Obsidian.jpeg" alt="Warm Obsidian Preset" width="100%"><br>
        <b>Warm Obsidian</b>
      </td>
    </tr>
    <tr>
      <td align="center" width="50%">
        <img src="assets/OLED%20Void.jpeg" alt="OLED Void Preset" width="100%"><br>
        <b>OLED Void</b>
      </td>
      <td align="center" width="50%">
        <img src="assets/Custom%20Wallpaper.jpeg" alt="Adaptive Custom Wallpaper" width="100%"><br>
        <b>Adaptive Custom Wallpaper</b>
      </td>
    </tr>
  </table>
</div>

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
* **Toggleable Search Border:** Enable an accent-colored border outline or switch to a borderless, floating input bar.
* **Adaptive Dropdown Contrast:** Dropdown menus calculate effective alpha-blended luminance against underlying wallpapers, keeping provider names and borders sharp and legible even at 0% widget opacity.
* **Universal Typography Inheritance:** Search inputs and provider dropdowns inherit your selected global font family.
* **Smart URL Navigation:** Detects valid domain structures and routes directly to URLs, bypassing standard search redirects.
* **Dynamic Greetings:** Contextual, time-aware greetings and clean search placeholders.

### ⚡ Smart Shortcut Grid

* **Horizontal Length Alignment:** The shortcut grid spans the exact bounding width of the search container for symmetrical, edge-to-edge alignment.
* **Dual Alignment Modes:**
  * **Left Aligned (Column Locked):** Locks shortcuts into rigid, 10-column vertical tracks so incomplete rows remain structured in an application-dock format.
  * **Center Aligned:** Automatically centers incomplete rows with calculated gap distribution while keeping full rows flush edge-to-edge.
* **Hybrid Data Sources:** Switch between your browser's most visited sites (`topSites`) or a fully custom curated bookmark grid.
* **Context-Aware Recovery:** The "Restore hidden sites" action appears only when using the Most Visited Sites source, keeping custom shortcut menus uncluttered.
* **Drag-and-Drop Reordering:** Fluid drag interactions with lock protection.
* **Pinning & Menu Actions:** Pin essential shortcuts to the front of the grid; edit URLs, names, or remove items on the fly.
* **Smart Favicon Contrast Inversion:** Canvas contrast engine analyzes favicon pixel luminance to invert monochromatic icons over contrasting backgrounds while leaving colored logos untouched.
* **Accidental Deletion Recovery:** Toast notifications with immediate undo actions for removed shortcuts.
* **Configurable Density:** Adjust grid capacities from 1 to 5 rows (10 to 50 max shortcuts) with optional label visibility.

### 🎨 Advanced Theming & Layout Engine

* **One-Click Presets:** Instant access to curated themes: *Cleo Default*, *Midnight Slate*, *Warm Obsidian*, and *OLED Void*.
* **Custom Backgrounds & Wallpapers:** Set solid hex colors or upload image wallpapers with automatic palette detection.
* **Global Master Controls:** Adjust corner roundness (0–50px), widget opacity (0–100%), and frosted glass blur (`backdrop-filter`).
* **Contextual UI Disclosures:** Smart collapsible panels automatically hide child options (e.g., date formats collapse when the date is disabled; custom pickers collapse in auto mode) to eliminate visual clutter.
* **Typography Selector:** Choose between clean Sans-Serif, elegant Serif, Monospace, or System Default font stacks without page reloads.
* **Adaptive Clock & Date:** 12-hour/24-hour modes, optional seconds display, four date format conventions, and dynamic complementary color calculations.
* **Scrollbar Customization:** Set visibility to persistent or hover-only, with automatic, accent, or custom color modes.
* **Layout Lock:** One-click lock toggle prevents accidental drag movements or layout alterations.

### ⚙️ Settings Panel Search & Data Portability

* **In-Panel Full-Text Search:** Find setting toggles using a real-time search filter with keyword highlighting and match navigation.
* **Zero-FOUC Startup:** Preload engine initializes CSS variables and layout states synchronously from storage before DOM render, preventing screen flashes.
* **Clean-Slate Backup & Restore:** Export dashboard configurations, shortcuts, and timers to a single JSON file, or restore backups cleanly without legacy configuration artifacts.

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
* **Local Data Execution:** All configurations, custom shortcuts, and timer states remain stored exclusively inside your browser's local sandbox storage.
* **Direct Search Routing:** Outgoing search queries route directly from your client to your selected search provider with zero intermediary proxies.