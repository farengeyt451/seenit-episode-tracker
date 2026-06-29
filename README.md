<div align="center">
  <img src="public/icon-128.png" alt="Seenit! Logo" width="120" height="120"/>

# Seenit! - Episode Tracker

  <p align="center">
    <strong>Your personal series companion that lives in your browser</strong>
    <br />
    Keep track of your favorite TV shows with a beautiful, intuitive interface
  </p>

  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Zustand-5.0-18222C?style=flat&logo=zustand&logoColor=white" alt="Zustand" />
    <img src="https://img.shields.io/badge/Tailwind-4.3-38B2AC?style=flat&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
    <img src="https://img.shields.io/badge/License-Source--Available-green.svg" alt="Source-Available, Non-Commercial License" />
  </p>

  <p align="center">
    <a href="#features">Features</a> •
    <a href="#screenshots">Screenshots</a> •
    <a href="#installation">Installation</a> •
    <a href="#development">Development</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#license">License</a>
  </p>
</div>

## Screenshots

<div align="center">
  <img src="promo/seenit-promo-1280x800-v2.png" alt="Seenit! episode tracker showing a series poster, rating, status, genres, and episode progress" width="100%" />
  <br />
  <br />
  <table>
    <tr>
      <td width="50%"><img src="promo/seenit-promo-myseries-1280x800-v2.png" alt="My Series — all your tracked shows in one place" /></td>
      <td width="50%"><img src="promo/seenit-promo-find-1280x800-v2.png" alt="Find Series — search and add any show" /></td>
    </tr>
  </table>
  <br />
  <img src="promo/seenit-promo-themes-1280x800-v2.png" alt="Seenit! in both dark and light themes" width="100%" />
</div>

## Installation

<p align="left">
  <a href="https://chromewebstore.google.com/detail/seenit-episode-tracker/amopmnmnaimidbcfnjbnlfagmlmdhlch">
    <img src="https://img.shields.io/badge/Chrome-Install-4285F4?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Install on Chrome Web Store" />
  </a>
  &nbsp;&nbsp;
  <a href="https://addons.mozilla.org/ru/firefox/addon/seenit-episode-tracker/">
    <img src="https://img.shields.io/badge/Firefox-Install-FF7139?style=for-the-badge&logo=firefox&logoColor=white" alt="Install on Firefox Add-ons" />
  </a>
</p>

## Features

### Core Functionality

- **Series Tracking**
- **Rich Series Overview**
- **Progress Monitoring**
- **Episode Management**
- **Favorites System**
- **Smart Search**
- **Filter & Sort**
- **Drag & Drop Ordering**
- **Dark & Light Themes**

### Data Management

- **Local-First Storage** - All data is stored locally by default using the Chrome Storage API
- **Export/Import** - Backup and restore your tracking data
- **Auto-Refresh** - Keep series metadata up to date

### Cloud Sync (Google Drive)

> **Chrome only.** Cloud Sync is available on Chrome; the Firefox build does not include it.

- **Google Drive Sync** - Optionally back up and sync your tracking data to your own Google Drive
- **Cross-Device** - Connect on multiple devices and pick up right where you left off
- **Automatic & Manual** - Changes are pushed to Drive automatically (debounced) after you edit, with a manual "Sync now" option in Settings
- **Conflict-Free Merge** - A smart merge reconciles changes from different devices, including episode progress and deletions, so nothing is lost
- **Private by Design** - Data lives in Drive's hidden app-data folder via the minimal `drive.appdata` scope — the extension can't access any of your other Drive files, and there are no third-party servers involved

---

### Install Manually

#### For Chrome

1. Download the latest release or build from source
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `dist_chrome` folder

#### For Firefox

> Firefox is supported on the **v1.0.2** tag (no Cloud Sync). Check it out before building: `git checkout v1.0.2`

1. Download the **v1.0.2** tag from git (`git checkout v1.0.2`) or build from that source
2. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`
3. Click "Load Temporary Add-on"
4. Select any file in the `dist_firefox` folder (e.g., `manifest.json`)

---

## Development

### Prerequisites

- Node.js >= 24
- npm

### Setup

```bash
# Clone the repository
git clone https://github.com/farengeyt451/seenit-extension.git
cd seenit-extension

# Install dependencies
npm install
# or
yarn install
```

### Development Mode

```bash
# Start development for Chrome (with hot reload)
npm run dev:chrome

# Start development for Firefox (with hot reload)
npm run dev:firefox
```

### Build for Production

```bash
# Build for Chrome
npm run build:chrome

# Build for Firefox
npm run build:firefox
```

Output will be in `dist_chrome` or `dist_firefox` folders.

---

## Tech Stack

### Core Technologies

- **[React 19](https://react.dev/)**
- **[TypeScript 6.0](https://www.typescriptlang.org/)**
- **[Vite 8.0](https://vitejs.dev/)**
- **[Tailwind CSS 4.3](https://tailwindcss.com/)**

### State Management & Data

- **[Zustand 5.0](https://github.com/pmndrs/zustand)**
- **[Immer 11.1](https://immerjs.github.io/immer/)**
- **[Zod 4.4](https://zod.dev/)**
- **Chrome Storage API**
- **[Google Drive API](https://developers.google.com/drive)** - Optional cloud sync via the `drive.appdata` scope (OAuth through `chrome.identity`)

### UI Components

- **[Headless UI 2.2](https://headlessui.com/)**
- **[Heroicons 2.2](https://heroicons.com/)**
- **[dnd kit](https://next.dndkit.com/)** - Drag-and-drop reordering of tracked series
- **[React Rewards 2.1](https://github.com/thedevelobear/react-rewards)**

### Utilities

- **[Luxon 3.7](https://moment.github.io/luxon/)**
- **[Axios 1.16](https://axios-http.com/)**
- **[@uidotdev/usehooks](https://usehooks.com/)**
- **[webextension-polyfill](https://github.com/mozilla/webextension-polyfill)** - Cross-browser (Chrome & Firefox) extension APIs
- **[clsx 2.1](https://github.com/lukeed/clsx)**

### Development Tools

- **[@crxjs/vite-plugin](https://crxjs.dev/vite-plugin/)**
- **[ESLint 9](https://eslint.org/)**
- **[Prettier 3.8](https://prettier.io/)**
- **[Nodemon 3.1](https://nodemon.io/)**

---

## Project Structure

```
seenit-extension/
├── public/               # Static assets (icons)
├── src/
│   ├── components/       # React components
│   │   ├── ui/           # Reusable UI components
│   │   ├── episodes-tracker/
│   │   ├── search/
│   │   └── ...
│   ├── store/            # Zustand stores
│   │   ├── useSeriesStore.ts
│   │   ├── useThemeStore.ts
│   │   └── ...
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript types
│   ├── enums/            # Enums and constants
│   └── pages/
│       ├── popup/        # Main extension popup
│       └── background/   # Background script (optional)
├── manifest.json         # Extension manifest
├── vite.config.*.ts      # Vite configurations
└── package.json
```

---

## License

This project is **Source-Available** under a **Non-Commercial Proprietary License**.

**You are allowed to:**

- ✅ View the source code
- ✅ Modify it for personal, non-commercial use only

**You are NOT allowed to:**

- 🚫 Sell, license, redistribute, or publish this software or any modified versions
- 🚫 Use any part of this software for commercial purposes
- 🚫 Re-upload to any browser extension store without explicit written permission
- 🚫 Reverse engineer premium features or server components

All rights not explicitly granted are reserved by the author.

For commercial permissions or business inquiries, contact: **seenitapp@outlook.com**

For more details, see the [LICENSE](LICENSE) file.

---

## Acknowledgments

- Built with the [Vite Web Extension Boilerplate](https://github.com/JohnBra/vite-web-extension) by Jonathan Braat
- Series metadata powered by [THETVDB API](https://www.thetvdb.com/)
- Icons by [Heroicons](https://heroicons.com/)

---

<div align="center">
  <p>
    <a href="https://github.com/farengeyt451/seenit-extension/issues">Report Bug</a> •
    <a href="https://github.com/farengeyt451/seenit-extension/issues">Request Feature</a>
  </p>
</div>
