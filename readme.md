# Umbrella Cyber System - Advanced Penetration Testing & C2 Platform

![Umbrella Cyber System](static/logo.svg)

[![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-blue.svg)](https://github.com/)
[![Python](https://img.shields.io/badge/python-3.8%2B-blue.svg)](https://www.python.org/)
[![Framework](https://img.shields.io/badge/framework-Flask%20%7C%20Socket.IO-brightgreen.svg)](https://flask.palletsprojects.com/)
[![Terminal](https://img.shields.io/badge/terminals-xterm.js-orange.svg)](https://xtermjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## Table of Contents
- [Overview](#overview)
- [Key Capabilities](#key-capabilities)
  - [Target Management & Attack Surface Recon](#target-management--attack-surface-recon)
  - [Visual Exploit Chaining & Interactive Canvas](#visual-exploit-chaining--interactive-canvas)
  - [Quad Terminal & Multi-Shell Orchestration](#quad-terminal--multi-shell-orchestration)
  - [Real-Time Network Defense & Intrusion Monitoring](#real-time-network-defense--intrusion-monitoring)
  - [Geospatial & Planetary Network Topology](#geospatial--planetary-network-topology)
  - [Advanced Local Area Network (LAN) Scanner](#advanced-local-area-network-lan-scanner)
  - [Integrated Security Tooling & Tunneling](#integrated-security-tooling--tunneling)
  - [AI Vulnerability Analysis & LLM Integration](#ai-vulnerability-analysis--llm-integration)
  - [Comprehensive File & Payload Manager](#comprehensive-file--payload-manager)
  - [UI Customization & Display Themes](#ui-customization--display-themes)
- [Architecture](#architecture)
- [Installation & Quick Start](#installation--quick-start)
- [Configuration & Settings](#configuration--settings)
- [Plugin Development](#plugin-development)
- [Disclaimer](#disclaimer)

---

## Overview
**Umbrella Cyber System** is an advanced, web-based Command and Control (C2), Attack Surface Management, and Penetration Testing framework. Built for security researchers, ethical hackers, and red-team operations, it unifies reconnaissance, interactive terminal emulation, automated command chaining, visual network mapping, and AI-driven telemetry diagnostics into a centralized dashboard.

---

## Key Capabilities

### Target Management & Attack Surface Recon
- **Multivariate Scope Categories**: Manage and organize targets across **Bug Bounty** (web assets/domains), **Wireless** (SSID/BSSID/Channel), and **OSINT / Personnel** scopes.
- **Subdomain Hierarchy**: Track domains, roots, and subdomains with automated favicon extraction and metadata association.
- **Dynamic Macro Resolution**: Automate parameter injection across all commands using dynamic tags (`{target}`, `{ip}`, `{cookie}`, `{attacker-ip}`, `{attacker-url}`, `{SSID}`, `{BSSID}`, `{username}`, etc.).
- **Severity Flag Tagging**: Drag-and-drop severity indicators (Critical, High, Medium, Low) directly onto targets and commands to categorize discovered vulnerabilities.

### Visual Exploit Chaining & Interactive Canvas
- **Pin-to-Pin Visual Workflow Graph**: Design sequential execution chains with accurate border-anchored directional wiring.
- **Full-Screen Interactive Terminal Space**: Transition any visual graph into live, interconnected console panes that trigger sequentially upon upstream command completion.
- **Visual Pipeline Feedback**: Real-time border pulses (neon orange for active processes, neon green for successful completion) display execution state across the entire exploit chain.

### Quad Terminal & Multi-Shell Orchestration
- **Synchronized Multi-Pane Terminals**: Run synchronized xterm.js terminals in a high-density 2x2 or N-grid arrangement with dynamic viewport fitting.
- **Full PTY Emulation**: Native pseudo-terminal (`pty`) management on Unix environments and background-piped process polling for Windows environments.
- **Automated Workflow Drops**: Drag saved command playbooks and scripts directly into active terminals with instantaneous macro resolution.
- **Ghost Interactive Execution**: Execute commands as hidden background terminals and attach to live interactive sessions on demand.

### Real-Time Network Defense & Intrusion Monitoring
- **Autonomous ARP Spoofing / MITM Detection**: Continuously monitors the default gateway MAC address on the host network adapter, issuing real-time WebSocket alerts if gateway hijacking is detected.
- **ICMP Ping Monitor**: Leverages raw socket inspection to detect incoming ICMP ping probes targeting the host machine and alerts the operator.
- **Local Network Peer Discovery**: Periodic UDP broadcast beacons discover and list running Umbrella C2 nodes across the subnet for one-click configuration synchronization.

### Geospatial & Planetary Network Topology
- **2D/3D Network Topology Graphs**: Inspect target relationships via physics-based force-directed 2D networks, Obsidian-style minimalist node graphs, or D3 Netmaps.
- **3D Interactive Planetary Globe**: Visualize geographically mapped targets on a three-dimensional WebGL globe powered by Three.js.
- **Tactical Leaflet Geospatial Map**: View target locations on satellite and dark-mode cartographic tiles, complete with IP lookup and coordinate resolution.

### Advanced Local Area Network (LAN) Scanner
- **Subnet Sweeping**: Scan and identify connected hosts and devices on local network interfaces.
- **Visual Network Rendering**: Render local network topology using circuit-style PCB or smooth cubic Bezier connectors.
- **Direct Node Interaction**: Execute port scans, ping sweeps, and custom toolkits against mapped devices via interactive context menus.

### Integrated Security Tooling & Tunneling
- **OpenVPN Manager**: Upload, edit, view, and initialize OpenVPN (`.ovpn`) configurations with an embedded interactive console.
- **Tunnel Gateway**: Deploy, configure, and monitor Cloudflared and Ngrok tunneling agents directly through the web UI.
- **Integrated SSH Terminal**: Connect to remote hosts with embedded credentials and session persistence.
- **One-Liner Generator**: Rapidly combine and format command lists into single execution strings for Windows (`&&`) and Unix (`;`).
- **Container & Tool Shortcuts**: Dedicated quick-access panels for Kali Linux Docker containers, Metasploit Framework, and Sherlock OSINT.

### AI Vulnerability Analysis & LLM Integration
- **Contextual Security Review**: Ingest raw scan outputs (Nmap, Nikto, Gobuster, etc.) directly into Google Gemini models to assess vulnerability severity and exploitability.
- **Prescriptive Next-Step Guidance**: Receive targeted recommendations on the next command, script, or payload to deploy based on parsed telemetry.
- **Customizable Directives**: Fine-tune system instructions, execution models, and response parameters.

### Comprehensive File & Payload Manager
- **Host File Explorer**: Navigate the host filesystem with a dual-pane explorer supporting file uploads, creation, renaming, and removal.
- **Embedded Code Editor**: Create, modify, and overwrite scripts, wordlists, and commands with syntax preservation and macro insertion tools.
- **Download Manager**: Save and download remote payloads and dependencies directly into categorized workspace directories (`scripts/`, `passwordlist/`, `payloads/`).

### UI Customization & Display Themes
- **Themes for Any Environment**: Space (Default Neon Cyberpunk), The Matrix (Green Monochrome), Umbrella (High-Contrast Red/Black), Dark (Minimalist Matte), and White (Clean High-Key).
- **Adaptive SVG Iconography**: Scalable vector icons dynamically update strokes to match the selected theme, with support for custom uploaded icon packs.
- **Security Screen Lock**: Pattern-based authentication lock screen with configurable blur and opacity controls.

---

## Architecture

```
├── app.py                      # Flask & Socket.IO backend orchestration
├── static/
│   ├── script.js               # Frontend application logic, state, and WebSockets
│   ├── style.css               # Theme definitions and responsive interface styling
│   ├── icons.js                # SVG vector icon management and dynamic hydration
│   └── logo.svg                # Vector system branding
├── templates/
│   ├── index.html              # Primary operations dashboard
│   └── web_terminal.html       # Quad terminal & workflow orchestration view
├── plugins/                    # Expandable JavaScript plugins
│   ├── base64.js               # Base64 encoder/decoder
│   ├── process_manager.js      # Host process viewer and manager
│   └── raw_requester.js        # Low-level HTTP payload sender
├── targets/                    # Target directories and scan artifacts
├── scripts/                    # Custom penetration testing scripts
├── workflows/                  # Saved visual workflows and execution chains
└── commands.json               # Command catalog and metadata definitions
```

---

## Installation & Quick Start

### Prerequisites
- **Python**: Version 3.8 or higher
- **Operating System**: Linux (recommended for full PTY support), macOS, or Windows
- **Privileges**: Administrative/root access required for raw socket monitoring (ARP/ICMP)

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/umbrella-cyber-system.git
   cd umbrella-cyber-system
   ```

2. **Install dependencies**:
   ```bash
   pip install flask flask-socketio psutil werkzeug requests playwright
   python -m playwright install chromium
   ```
   *(Note: The system also checks and installs missing dependencies automatically upon startup.)*

3. **Launch the application**:
   ```bash
   python3 app.py --port 5000
   ```

4. **Access the interface**:
   Open your web browser and navigate to:
   ```
   http://localhost:5000
   ```

---

## Configuration & Settings

System parameters can be configured directly from the **Settings (⚙️)** modal in the top navigation bar:

| Setting | Description |
| :--- | :--- |
| **Attacker IP** | Sets `{attacker-ip}` for reverse shells and listeners |
| **Attacker URL** | Sets `{attacker-url}` for remote payload staging |
| **Gemini API Key** | Enables AI report generation and scan output analysis |
| **Terminal Shell** | Configures the default shell on Windows (`cmd`, `powershell`, `msys2`, `mingw64`) |
| **Storage Paths** | Customize locations for notes, commands, scripts, wordlists, and payloads |
| **Theme** | Switch between Space, Umbrella, Matrix, Full Dark, and Full White styles |
| **Pattern Lock** | Establish pattern-based lock screen security on session launch |

---

## Plugin Development

The platform supports modular JavaScript plugins placed in the `plugins/` directory. Plugins register automatically on startup:

```javascript
registerPlugin({
    name: "Sample Tool",
    run: function() {
        // Your custom logic or modal interface
        showToast("Sample Tool Launched", "success");
    }
});
```

---

## Disclaimer

> **NOTICE**: This software is developed strictly for educational purposes, authorized security auditing, and red-team engagements under explicit written authorization. Unauthorized access to computer systems or networks is illegal. The authors and maintainers assume no liability and are not responsible for any misuse, damage, or legal ramifications caused by this software.
