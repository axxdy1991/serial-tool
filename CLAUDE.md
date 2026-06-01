# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run tauri dev     # Full app with hot reload (Vite + Tauri)
npm run tauri build   # Production build → src-tauri/target/release/serial-tool.exe
npm run dev           # Vite dev server only (frontend, port 1420)
npm run build         # TypeScript check + Vite build only
```

`cargo clean` inside `src-tauri/` to fix Rust build issues; `npm install` for frontend deps.

## Architecture

**Tauri 2.0 desktop app** — React 18 (TypeScript + Tailwind CSS + Vite) frontend communicating with a Rust backend via Tauri's IPC bridge.

### Frontend (`src/`)

Single-page React app with no routing. `src/App.tsx` contains all UI logic in one component. It auto-scans serial ports on mount, polls `read_serial_data` every 50ms while a port is open, and renders a dark-themed config panel + receive/send text areas. `@tauri-apps/api/core`'s `invoke()` is the sole bridge to the Rust backend.

### Backend (`src-tauri/src/main.rs`)

Five Tauri commands, all synchronous:

| Command | Purpose |
|---|---|
| `get_available_ports` | Enumerates system serial ports via `serialport::available_ports()` |
| `open_serial_port` | Creates a port with configured baud/data/stop/parity, stores in `SerialPortMap` |
| `close_serial_port` | Removes a port from the map (implicit drop closes it) |
| `write_serial_data` | Writes `Vec<u8>` to the named port |
| `read_serial_data` | Reads up to 4096 bytes with a **10ms timeout**; returns empty `Vec<u8>` on timeout |

**State:** `SerialPortMap` is `Arc<Mutex<HashMap<String, Box<dyn SerialPort>>>>` — keyed by port name, shared across all command handlers via Tauri's `.manage()`.

**Key detail:** The serial port is configured with a 10ms read timeout. On timeout the command returns an empty vec (not an error), so the frontend polling loop stays quiet when no data is available.

**Release builds** hide the Windows console window via `#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]`.

### IPC flow

```
App.tsx invoke("command_name", { args })
  → Tauri IPC
  → main.rs #[tauri::command] fn
  → returns Result<T, String> serialized as JSON
```

All serial port I/O happens on the Rust side; the frontend never touches hardware directly.

### Tauri config (`src-tauri/tauri.conf.json`)

- Dev server URL: `http://localhost:1420` (Vite strict port)
- `beforeDevCommand`: `npm run dev`
- `beforeBuildCommand`: `npm run build`
- Bundle targets MSI installer (`wix`) with `zh-CN` language
- Window min size: 800×600
