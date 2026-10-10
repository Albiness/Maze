<div align="center">

# 🧩 Escape the Maze

### A responsive Progressive Web App maze game for desktop and mobile

Navigate through increasingly challenging mazes, collect keys, activate switches, avoid traps, beat the timer, and reach the exit.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PWA](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![JSON](https://img.shields.io/badge/JSON-000000?style=for-the-badge&logo=json&logoColor=white)

</div>

---

## 🎮 About the project

**Escape the Maze** is a browser-based maze game created as a Web Technologies project. The game is designed to work on both **desktop and mobile devices** and supports several control methods.

The objective is simple: complete all available maze challenges. Depending on the level, the player may need to collect keys, activate switches, avoid static or moving traps, or finish before the time limit expires.

The game uses an HTML5 `<canvas>` for rendering and stores progress in the browser so a player can leave the game and continue later.

---

## ✨ Features

- 🧭 **5 different level types** with increasing difficulty
- 🎲 **Randomized level order**
- 🗺️ **Multiple maze layouts** for every level
- 💾 **Game progress saved with `localStorage`**
- ⌨️ **Keyboard controls**
- 🖱️ **Mouse-based movement** on desktop
- 📱 **Device orientation / gyroscope controls** on mobile
- 🔑 Collectible **keys**
- ⚠️ Static **traps**
- 🔄 **Moving traps**
- 🔘 Interactive **switches**
- ⏱️ **Timed challenge**
- 📐 Responsive game canvas
- 🏆 Victory and failure states
- 📱 PWA manifest and application icons
- 📴 Cache-first service worker implementation
- 🖨️ Print-friendly instructions

---

## 🕹️ Controls

### Desktop

| Control | Action |
|---|---|
| `W` | Move up |
| `A` | Move left |
| `S` | Move down |
| `D` | Move right |
| Mouse movement | Move toward the cursor |

> The game movement is based on position/motion — clicking is not required.

### Mobile

On supported mobile devices, the player can be controlled by **tilting the device**.

The game reads the device orientation values (`beta` and `gamma`) and adapts movement for portrait and landscape orientation.

> Sensor APIs normally require the game to be opened through **HTTPS** or `localhost`.

---

## 🧩 Levels

The game currently contains five challenge types. Each level has **three possible maze variants**, and one of them is selected randomly when the level is loaded.

| Level | Challenge |
|---|---|
| **1. Simple Maze** | Collect the required keys and find the exit. |
| **2. Maze with Traps** | Collect keys while avoiding traps that restart the level. |
| **3. Maze with Switches** | Activate switches, collect keys, avoid traps, and unlock the exit. |
| **4. Time Challenge** | Complete the maze before the **25-second** timer expires. |
| **5. Moving Traps** | Navigate around moving obstacles while collecting keys and reaching the exit. |

---

## 🗺️ Level format

Levels are stored separately in **`levels.json`**, which keeps game content independent from the main JavaScript logic.

A maze is represented as a grid of characters:

```text
#  Wall
P  Player start
K  Key
T  Static trap
M  Moving trap
S  Switch
E  Exit
```

Example:

```text
###############
#P    M     K #
#  ####  #### #
#            M#
#  ####  #### #
#K    M      E#
###############
```

This structure makes it easy to create additional maze layouts without rewriting the game engine.

---

## 🎲 Randomization & progress

The project uses two levels of randomization:

1. **Level order** is randomized.
2. Every level contains several maze variants, from which one is selected randomly.

Completed levels are removed from the active pool until the remaining levels are completed.

The following values are stored in `localStorage`:

```text
currentLevel
completedLevels
availableLevels
```

This allows the player to close the game and continue later without immediately repeating already completed levels.

---

## 🧠 Game mechanics

### 🔑 Keys

Keys must be collected before the player can successfully finish certain levels.

### ⚠️ Traps

Touching a static trap causes the current challenge to restart.

### 🔄 Moving traps

Moving traps continuously travel through the maze and reverse direction when they collide with a wall.

### 🔘 Switches

Some levels contain switches that must be activated before the exit becomes available.

### ⏱️ Timer

The timed level gives the player **25 seconds** to complete the challenge.

### 🧱 Collision detection

Movement is validated against maze walls before the player's position is changed. Collision detection is also used for keys, traps, switches, moving traps, and the exit.

---

## 📱 Progressive Web App

The repository contains the main components required for a PWA:

```text
manifest.json
service-worker.js
favicon/
```

The manifest configures the application to run in **standalone mode** and includes dedicated 192×192 and 512×512 application icons.

The service worker implements a cache-first strategy for the main game resources.

> **Important:** the current project files contain `service-worker.js`, but no explicit service-worker registration call is present in the supplied source. To enable offline caching/install behavior completely, register the service worker from the page and serve the project through HTTPS or `localhost`.

Example registration:

```javascript
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js');
    });
}
```

---

## 📂 Project structure

```text
Escape-the-Maze/
│
├── index.html              # Main application page
├── Maze.js                 # Game engine and gameplay logic
├── css.css                 # Styles and responsive design
├── levels.json             # Level definitions and maze layouts
├── manifest.json           # PWA manifest
├── service-worker.js       # Offline cache logic
│
├── favicon/
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-96x96.png
│   ├── apple-touch-icon.png
│   ├── web-app-manifest-192x192.png
│   └── web-app-manifest-512x512.png
│
└── photos/
    ├── exit.png
    ├── key.png
    ├── lock.png
    ├── switchOff.png
    ├── switchOn.png
    └── trap.png
```

---

## 🚀 Running the project locally

Because the levels are loaded using `fetch()`, opening `index.html` directly with the `file://` protocol may not work correctly in every browser.

Run the project through a local web server instead.

### Option 1 — VS Code Live Server

1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html`.
4. Select **Open with Live Server**.

### Option 2 — Python

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

### Option 3 — PHP

```bash
php -S localhost:8000
```

---

## 📲 Testing mobile controls

For real gyroscope/device-orientation testing:

1. Host the application through **HTTPS**.
2. Open it on a smartphone.
3. Allow motion/orientation access if requested by the browser.
4. Tilt the device to move the player.

The implementation handles portrait as well as left/right landscape orientation.

---

## 🛠️ Technologies

| Technology | Purpose |
|---|---|
| **HTML5** | Application structure and Canvas |
| **CSS3** | Responsive design and UI |
| **JavaScript** | Game engine and interaction logic |
| **Canvas API** | Maze and player rendering |
| **Device Orientation API** | Mobile tilt controls |
| **JSON** | Maze and level configuration |
| **Web Storage API** | Persistent game progress |
| **Web App Manifest** | PWA metadata and installation settings |
| **Service Worker / Cache API** | Offline resource caching |

---

## 🎯 Project requirements covered

The project was designed around the main requirements of the WEBTE1 final assignment:

- responsive desktop and mobile interface;
- keyboard, mouse, and mobile sensor controls;
- at least five different challenges;
- challenges defined in JSON;
- randomized tasks/layouts;
- persistent progress between sessions;
- help/instructions for the player;
- PWA-related functionality;
- print-optimized informational content.

---

## 🔮 Possible improvements

Some ideas for future development:

- add sound effects and background music;
- add difficulty settings;
- add player statistics and best times;
- add animations for keys, switches, and traps;
- improve touch/sensor permission handling on iOS;
- add an in-game pause menu;
- add more maze types and procedural generation;
- add automated tests;
- add full service-worker registration if not already injected by the hosting environment.

---

<div align="center">

### 🏁 Find the keys. Avoid the traps. Escape the maze.

Made with HTML, CSS and JavaScript.

</div>
