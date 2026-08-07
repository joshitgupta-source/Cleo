# Cleo

## About Cleo

Cleo is a lightning-fast, privacy-focused New Tab page extension designed for Chromium-based browsers (Chrome, Edge, Brave, Vivaldi, etc.). It replaces the default, cluttered new tab screen with a highly customizable, glassmorphic dashboard. Built entirely with a focus on minimalism and performance, Cleo allows users to tailor their browsing experience—from dynamic color themes to personalized shortcut grids—without sacrificing speed or data privacy.

## How it Works

Cleo is built using strict, vanilla web technologies (HTML, CSS, and JavaScript) and operates entirely locally on your machine. It utilizes the modern Chrome Extension API (Manifest V3) for maximum security and compliance.

All user settings, preferences, and custom shortcuts are serialized and saved directly to the browser's native `chrome.storage.local` database. Cleo makes absolutely zero external API calls (with the sole exception of securely routing your query to your chosen search engine) and performs all mathematical color-contrast calculations natively in the browser. Because it does not rely on third-party servers, web hosting, or analytics trackers, your data never leaves your device.

## Features

* **Dynamic Search Integration:** Search the web using 9 built-in engines, including privacy-focused options like DuckDuckGo, Startpage, Kagi, and Ecosia. The search bar features a custom glassmorphic dropdown, adjustable corner radii, and dynamic shadow toggling.
* **Smart Shortcut Grid:** Curate your favorite websites or let Cleo automatically display your top visited sites. Shortcuts can be easily added, edited, removed, and rearranged via a smooth drag-and-drop interface. Icons are fetched natively using the browser's built-in high-resolution `_favicon` API.
* **Advanced Theming Engine:** Complete control over the dashboard's aesthetic. Users can set custom background colors, upload local image wallpapers, and choose global fonts. UI elements feature an "Auto" mode that intelligently calculates text contrast (switching between dark and light text) based on the current background.
* **Data Portability (Backup & Restore):** Never lose your layout. Cleo includes a built-in JSON exporter that packages your entire local database into a downloadable file, allowing you to seamlessly restore your settings across different devices or profiles.
* **Modular Widgets:** Toggleable time (12-hour or 24-hour) and date displays with adjustable positioning, alongside deeply customizable scrollbar visibility and color modes.

## Resource Consumption

Cleo was engineered from the ground up to have a microscopic performance footprint.

* **Zero Frameworks:** By completely avoiding heavy JavaScript frameworks (like React or Vue) and avoiding external library dependencies, Cleo parses and paints in the browser almost instantly.
* **Hardware Accelerated UI:** All visual transitions, glassmorphic blurs (`backdrop-filter`), and drag-and-drop animations rely on CSS 2D transforms and opacity shifts. This offloads the rendering to the GPU, guaranteeing a butter-smooth 60FPS experience without taxing the CPU.
* **Memory Efficiency:** Cleo contains zero background scripts or active service workers. It only consumes memory while the New Tab page is actively open. By utilizing native browser APIs to fetch favicons dynamically, it avoids bloating your local storage with cached image data.