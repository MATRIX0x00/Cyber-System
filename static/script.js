window.openQuadTermModal = function() {
    window.showAndBringToFront('quad-term-modal');
    const iframe = document.getElementById('quad-term-iframe');
    if(!iframe.src || iframe.src === window.location.href) {
        iframe.src = '/web_terminal';
    }
    setTimeout(() => {
        if(iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'cyber_target_update',
                target: currentFolder ? currentFolder.split('/').pop() : '',
                atkIp: window.sysAttackerIp || ''
            }, '*');
        }
    }, 500);
};

window.toggleAppLauncherSettings = function() {
    const div = document.getElementById('app-launcher-settings');
    div.style.display = div.style.display === 'none' ? 'block' : 'none';
};

window.saveAppLauncherPath = function() {
    const path = document.getElementById('app-launcher-path').value;
    fetch('/save_sys_settings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({app_launcher_path: path})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            showToast('App Launcher path brutally updated! 💀', 'success');
            window.refreshAppLauncher();
        }
    });
};

window.openAppLauncherModal = function() {
    window.showAndBringToFront('app-launcher-modal');
    fetch('/get_sys_settings').then(r=>r.json()).then(d=>{
        document.getElementById('app-launcher-path').value = d.app_launcher_path || '';
    });
    window.refreshAppLauncher();
};

window.filterAppLauncher = function() {
    const filter = document.getElementById('app-launcher-search').value.toLowerCase();
    const items = document.getElementById('app-launcher-list').children;
    for (let i = 0; i < items.length; i++) {
        const nameEl = items[i].querySelector('.app-name-label');
        if(nameEl) {
            const name = nameEl.innerText.toLowerCase();
            items[i].style.display = name.includes(filter) ? 'flex' : 'none';
        }
    }
};

window.refreshAppLauncher = function() {
    fetch('/api/apps/list').then(r=>r.json()).then(data => {
        if(data.success) {
            const list = document.getElementById('app-launcher-list');
            list.innerHTML = '';
            data.apps.forEach(app => {
                const div = document.createElement('div');
                div.className = 'app-launcher-item';
                div.style = "display:flex; justify-content:space-between; align-items:center; padding:15px; background:#111; border:1px solid " + (app.running ? "#00ff00" : "#555") + "; border-radius:5px;";
                
                let btns = '';
                if(app.running) {
                    btns = `
                        <span style="color:#00ff00; font-weight:bold; margin-right:15px;">PORT: ${app.port}</span>
                        <button onclick="window.previewApp(${app.port})" style="padding:8px 15px; background:#00ffcc; color:#000; border:none; cursor:pointer; font-weight:bold; margin-right:10px;">🌍 Preview in Box</button>
                        <button onclick="window.openAppTab(${app.port})" style="padding:8px 15px; background:#ff00ff; color:#000; border:none; cursor:pointer; font-weight:bold; margin-right:10px;">↗️ Open Tab</button>
                        <button onclick="window.killApp('${app.name}')" style="padding:8px 15px; background:#ff0000; color:#fff; border:none; cursor:pointer; font-weight:bold;">🛑 Kill</button>
                    `;
                } else {
                    btns = `<button onclick="window.launchApp('${app.name}')" style="padding:8px 15px; background:#ff00ff; color:#000; border:none; cursor:pointer; font-weight:bold;">▶ Launch</button>`;
                }
                
                div.innerHTML = `
                    <div class="app-name-label" style="font-size:1.2em; font-weight:bold; color:${app.running ? '#00ff00' : '#00ffcc'};">${app.name}</div>
                    <div>${btns}</div>
                `;
                list.appendChild(div);
            });
            if(data.apps.length === 0) {
                list.innerHTML = '<div style="color:#aaa; text-align:center;">No apps found. Drop a .py file or a folder with a .py script.</div>';
            } else {
                window.filterAppLauncher();
            }
        }
    });
};

window.launchApp = function(name) {
    showToast("Launching " + name + "...", "warning");
    fetch('/api/apps/launch', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            showToast(name + " launched on port " + d.port + "! 💀", "success");
            window.refreshAppLauncher();
        } else {
            showToast("Failed to launch.", "error");
        }
    });
};

window.killApp = function(name) {
    fetch('/api/apps/kill', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            showToast(name + " violently killed.", "success");
            window.refreshAppLauncher();
        }
    });
};

window.previewApp = function(port) {
    closeModal('app-launcher-modal');
    const appUrl = window.location.protocol + '//' + window.location.hostname + ':' + port;
    document.getElementById('preview-url-input').value = appUrl;
    let modeSel = document.getElementById('preview-render-mode');
    if (modeSel) modeSel.value = 'iframe';
    if (!window.activeBrowserTabId) window.createNewBrowserTab();
    document.getElementById('preview-modal').style.display = 'block';
    loadPreviewUrl();
};

window.openAppTab = function(port) {
    const appUrl = window.location.protocol + '//' + window.location.hostname + ':' + port;
    window.open(appUrl, '_blank');
};

let currentFolder = '';
let commandsData = [];
let terminals = {};
let fitAddons = {};
let scanEvents = {};
let activeTerminalCmdId = null;
let interactiveTerminals = {};
let toolTerminals = {};
let currentToolTerm = null;
const socket = io();
window.currentFolderFiles = [];
window.sysAttackerIp = '';
window.sysAttackerUrl = '';

window.syncToTxtFinder = function() {
    const target = currentFolder ? currentFolder.split('/').pop() : '';
    const proto = window.globalProtocol || 'https://';
    const atkIp = window.sysAttackerIp || '';
    const atkUrl = window.sysAttackerUrl || '';
    
    if (currentFolder) {
        Promise.all([
            fetch('/get_target_ip', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({target: currentFolder})}).then(r=>r.json()),
            fetch('/get_cookie', {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({target: currentFolder})}).then(r=>r.json())
        ]).then(([ipData, cookieData]) => {
            fetch('/api/sync_target', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    target: target,
                    atk_ip: atkIp,
                    atk_url: atkUrl,
                    proto: proto,
                    cookie: cookieData.cookie || '',
                    ip: ipData.ip || ''
                })
            });
        }).catch(e => {});
    } else {
        fetch('/api/sync_target', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                target: target,
                atk_ip: atkIp,
                atk_url: atkUrl,
                proto: proto,
                cookie: '',
                ip: ''
            })
        });
    }
};

function showToast(msg, type='error') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast-msg ${type}`;
    toast.innerHTML = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 5000);
}

function validateCommand(command) {
    if (command.includes('{attacker-ip}') && !window.sysAttackerIp) {
        showToast('❌ Missing Attacker IP! Set it in Settings (⚙️).', 'error');
        return false;
    }
    if (command.includes('{attacker-url}') && !window.sysAttackerUrl) {
        showToast('❌ Missing Attacker URL! Set it in Settings (⚙️).', 'error');
        return false;
    }
    const reqMatch = command.match(/\{require->(.*?)\}/g);
    if (reqMatch) {
        for (let m of reqMatch) {
            const file = m.replace('{require->', '').replace('}', '');
            if (!window.currentFolderFiles || !window.currentFolderFiles.includes(file)) {
                showToast(`❌ Missing Required File: <b>${file}</b>. Run the prerequisite scan first!`, 'warning');
                return false;
            }
        }
    }
    return true;
}

function dragFlag(ev) {
    ev.dataTransfer.setData("flag", ev.target.dataset.flag);
}

function dropTargetFlag(ev, folder, el) {
    ev.stopPropagation();
    const flag = ev.dataTransfer.getData("flag");
    const action = flag ? 'add' : 'clear';
    fetch('/set_target_flag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folder, cmd_id: '_target_', flag: flag, action: action })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            const container = el.querySelector('.target-flag-container');
            if(container) {
                container.innerHTML = data.flags.join('');
            }
        }
    });
}

let clientId = localStorage.getItem('cyber_client_id');
if (!clientId) {
    clientId = 'client_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('cyber_client_id', clientId);
}

socket.on('connect', () => {
    socket.emit('register_client', { client_id: clientId });
});

// 💀 ADVANCED LOGIN SYSTEM 💀
function initPatternLock() {
    let lockState = 'checking';
    let currentPattern = [];
    let tempPattern = [];
    let isDrawing = false;
    
    fetch('/api/auth/status').then(r=>r.json()).then(d => {
        if(d.has_lock) {
            lockState = 'locked';
            document.getElementById('lock-title').innerText = "SYSTEM LOCKED";
            document.getElementById('lock-msg').innerText = "Draw pattern to grant access.";
        } else {
            lockState = 'setup1';
            document.getElementById('lock-title').innerText = "INITIALIZE SYSTEM";
            document.getElementById('lock-msg').innerText = "Draw a new secure pattern (min 4 nodes).";
        }
    }).catch(e => {
        unlockSystem();
    });

    const grid = document.querySelector('.pattern-grid');
    const nodes = document.querySelectorAll('.pattern-node');
    const pathEl = document.getElementById('pattern-path');
    const svg = document.getElementById('pattern-lines');

    function getCenter(node) {
        const rect = node.getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();
        return { x: rect.left + rect.width/2 - svgRect.left, y: rect.top + rect.height/2 - svgRect.top };
    }

    function drawLines(currentX, currentY) {
        if(currentPattern.length === 0) return;
        let d = '';
        for(let i=0; i<currentPattern.length; i++) {
            const center = getCenter(nodes[currentPattern[i]-1]);
            d += (i===0 ? 'M' : 'L') + ` ${center.x} ${center.y} `;
        }
        if(currentX !== undefined && currentY !== undefined) {
            const svgRect = svg.getBoundingClientRect();
            d += `L ${currentX - svgRect.left} ${currentY - svgRect.top}`;
        }
        pathEl.setAttribute('d', d);
    }

    function handleNode(node) {
        const id = parseInt(node.dataset.id);
        if(!currentPattern.includes(id)) {
            currentPattern.push(id);
            node.classList.add('active');
            drawLines();
        }
    }

    grid.addEventListener('mousedown', e => { 
        e.preventDefault();
        isDrawing = true; currentPattern=[]; 
        nodes.forEach(n=>n.classList.remove('active', 'error')); 
        pathEl.setAttribute('d',''); 
        pathEl.style.stroke='#00ffcc';
        
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if(target && target.classList.contains('pattern-node')) handleNode(target);
    });
    grid.addEventListener('touchstart', e => { 
        e.preventDefault(); 
        isDrawing = true; currentPattern=[]; 
        nodes.forEach(n=>n.classList.remove('active', 'error')); 
        pathEl.setAttribute('d',''); 
        pathEl.style.stroke='#00ffcc';
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if(target && target.classList.contains('pattern-node')) handleNode(target);
    }, {passive: false});
    
    window.addEventListener('mouseup', e => {
        if(!isDrawing) return;
        isDrawing = false;
        drawLines();
        processPattern();
    });
    
    grid.addEventListener('mousemove', e => {
        if(!isDrawing) return;
        const target = document.elementFromPoint(e.clientX, e.clientY);
        if(target && target.classList.contains('pattern-node')) {
            handleNode(target);
        }
        drawLines(e.clientX, e.clientY);
    });
    grid.addEventListener('touchmove', e => {
        if(!isDrawing) return;
        e.preventDefault();
        const touch = e.touches[0];
        const target = document.elementFromPoint(touch.clientX, touch.clientY);
        if(target && target.classList.contains('pattern-node')) {
            handleNode(target);
        }
        drawLines(touch.clientX, touch.clientY);
    }, {passive: false});
    window.addEventListener('touchend', e => {
        if(!isDrawing) return;
        isDrawing = false;
        drawLines();
        processPattern();
    });
    
    function processPattern() {
        if(currentPattern.length < 4) {
            showLockError("Pattern too short! Minimum 4 nodes.");
            return;
        }
        if(lockState === 'setup1') {
            tempPattern = [...currentPattern];
            currentPattern = [];
            nodes.forEach(n=>n.classList.remove('active'));
            pathEl.setAttribute('d','');
            lockState = 'setup2';
            document.getElementById('lock-msg').innerText = "Repeat pattern to confirm.";
            document.getElementById('lock-msg').style.color = '#ffaa00';
        } else if(lockState === 'setup2') {
            if(tempPattern.join(',') === currentPattern.join(',')) {
                fetch('/api/auth/setup', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({pattern: currentPattern}) })
                .then(r=>r.json()).then(d=>{
                    if(d.success) unlockSystem();
                    else showLockError("Failed to save pattern.");
                });
            } else {
                showLockError("Patterns do not match. Try again.");
                lockState = 'setup1';
                tempPattern = [];
            }
        } else if(lockState === 'locked') {
            fetch('/api/auth/verify', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({pattern: currentPattern}) })
            .then(r=>r.json()).then(d=>{
                if(d.success) unlockSystem();
                else showLockError("ACCESS DENIED.");
            });
        }
    }

    function showLockError(msg) {
        document.getElementById('lock-msg').innerText = msg;
        document.getElementById('lock-msg').style.color = '#ff0000';
        nodes.forEach(n => { if(n.classList.contains('active')) n.classList.add('error'); });
        pathEl.style.stroke = '#ff0000';
        setTimeout(() => {
            currentPattern = [];
            nodes.forEach(n=>n.classList.remove('active', 'error'));
            pathEl.setAttribute('d','');
            pathEl.style.stroke = '#00ffcc';
            document.getElementById('lock-msg').style.color = '#aaa';
            if(lockState === 'locked') document.getElementById('lock-msg').innerText = "Draw pattern to grant access.";
            else if(lockState === 'setup1') document.getElementById('lock-msg').innerText = "Draw a new secure pattern (min 4 nodes).";
        }, 1000);
    }

    function unlockSystem() {
        document.getElementById('lock-ui').style.opacity = '0';
        document.getElementById('lock-ui').style.transition = 'opacity 0.5s';
        document.getElementById('door-left').classList.add('door-open-left');
        document.getElementById('door-right').classList.add('door-open-right');
        setTimeout(() => { document.getElementById('cyber-lock-screen').style.display = 'none'; }, 1500);
    }
}
socket.on('existing_terminals', (data) => {
    const termIds = data.term_ids;
    if (termIds && termIds.length > 0) {
        termIds.forEach(id => {
            if (!multiTerminals[id] && id.startsWith('mterm_')) {
                recreateMultiTab(id);
            } else if (!interactiveTerminals[id] && id.startsWith('icmd__')) {
                recreateInteractiveTerminal(id);
            }
        });
        let maxCounter = multiTermCounter;
        termIds.forEach(id => {
            if (id.startsWith('mterm_')) {
                let num = parseInt(id.replace('mterm_', ''));
                if (num > maxCounter) maxCounter = num;
            }
        });
        multiTermCounter = maxCounter;
    }
});

socket.on('pty_output', function(data) {
    const tId = data.term_id || 'default';
    if (tId === 'default' && activeTerminalCmdId && terminals[activeTerminalCmdId]) {
        terminals[activeTerminalCmdId].write(data.data);
    } else if (multiTerminals[tId]) {
        multiTerminals[tId].term.write(data.data);
        multiTerminals[tId].outputBuffer = ((multiTerminals[tId].outputBuffer || '') + data.data).slice(-100);
        if (multiTerminals[tId].outputBuffer.includes('[CYBER-SYSTEM]') || multiTerminals[tId].outputBuffer.match(/X(\$|>| PS | MSYS2 | MINGW64 )/)) {
            multiTerminals[tId].isBusy = false;
            multiTerminals[tId].tabBtn.classList.remove('busy');
            let termNum = tId.replace('mterm_', '');
            if (multiTerminals[tId].tabBtn.firstChild) multiTerminals[tId].tabBtn.firstChild.nodeValue = 'Terminal ' + termNum + ' ';
            multiTerminals[tId].outputBuffer = '';
        }
    } else if (tId.startsWith('ovpn__') && window.ovpnTerm) {
        window.ovpnTerm.write(data.data);
    } else if (tId.startsWith('tunnel__') && window.tunnelTerm) {
        window.tunnelTerm.write(data.data);
        window.tunnelBuffer = (window.tunnelBuffer || '') + data.data;
        const urlMatch = window.tunnelBuffer.match(/https:\/\/[a-zA-Z0-9-]+\.(trycloudflare\.com|ngrok-free\.app|ngrok\.io|ngrok\.app)/);
        if (urlMatch) {
            const urlContainer = document.getElementById('tunnel-url-container');
            if (urlContainer) {
                urlContainer.style.display = 'block';
                document.getElementById('tunnel-public-url').href = urlMatch[0];
                document.getElementById('tunnel-public-url').innerText = urlMatch[0];
            }
        }
        if (window.tunnelBuffer.length > 2000) window.tunnelBuffer = window.tunnelBuffer.slice(-1000);
    } else if (tId.startsWith('ssh__') && window.sshTerm) {
        window.sshTerm.write(data.data);
    } else if (toolTerminals[tId]) {
        toolTerminals[tId].term.write(data.data);
    } else if (tId.startsWith('cterm__')) {
        let instId = Object.keys(window.canvasTerminalInstances || {}).find(k => window.canvasTerminalInstances[k].id === tId);
        if (instId) {
            let inst = window.canvasTerminalInstances[instId];
            inst.term.write(data.data);
            inst.outputBuffer = ((inst.outputBuffer || '') + data.data).slice(-100);
            if (inst.isRunning && (inst.outputBuffer.includes('[CYBER-SYSTEM]') || inst.outputBuffer.match(/X(\$|>| PS | MSYS2 | MINGW64 )/))) {
                inst.isRunning = false;
                inst.box.classList.remove('pulse-orange');
                inst.box.style.borderColor = '#00ff00';
                if (inst.onComplete) inst.onComplete();
                inst.outputBuffer = '';
            }
        }
    } else if (interactiveTerminals[tId]) {
        interactiveTerminals[tId].term.write(data.data);
        interactiveTerminals[tId].outputBuffer = ((interactiveTerminals[tId].outputBuffer || '') + data.data).slice(-100);
        if (interactiveTerminals[tId].outputBuffer.includes('[CYBER-SYSTEM]') || interactiveTerminals[tId].outputBuffer.match(/X(\$|>| PS | MSYS2 | MINGW64 )/)) {
            const cmdId = interactiveTerminals[tId].cmdId;
            const b = document.getElementById(cmdId);
            if (b && b.classList.contains('in-progress')) {
                b.classList.remove('in-progress');
                b.classList.add('completed');
                const resultIcon = b.querySelector('.result-icon');
                if (resultIcon) resultIcon.style.display = 'inline-block';
                updateRunBtnState();
            }
            interactiveTerminals[tId].outputBuffer = '';
        }
    }
});

function recreateInteractiveTerminal(termId) {
    const parts = termId.split('__');
    const cmdIdExtracted = parts[2];
    const pane = document.createElement('div');
    pane.style.height = '100%';
    pane.style.width = '100%';
    pane.style.display = 'none';
    document.getElementById('interactive-terminal-container').appendChild(pane);
    
    const term = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ff00' }, convertEol: true });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.open(pane);
    
    term.onData(data => {
        socket.emit('pty_input', { input: data, term_id: termId, client_id: clientId });
        if (data === '\r' || data === '\n') {
            const b = document.getElementById(cmdIdExtracted);
            if (b) { b.classList.add('in-progress'); updateRunBtnState(); }
        }
    });
    
    interactiveTerminals[termId] = { term, fitAddon, cmdId: cmdIdExtracted, pane };
}

function openInteractiveTerminal(cmdId) {
    if (!currentFolder) {
        showToast("Select a goddamn target folder first!", 'error');
        return;
    }
    const btn = document.getElementById(cmdId);
    if (!btn) return;
    if (!validateCommand(btn.dataset.command)) return;
    
    const termId = 'icmd__' + currentFolder.replace(/[/\\.]/g, '_') + '__' + cmdId;
    
    window.showAndBringToFront('interactive-terminal-modal');
    
    for (let id in interactiveTerminals) {
        interactiveTerminals[id].pane.style.display = 'none';
    }
    
    const isCompleted = btn.classList.contains('completed');
    
    if (interactiveTerminals[termId]) {
        if (isCompleted) {
            btn.classList.remove('completed');
            const resIcon = btn.querySelector('.result-icon');
            if (resIcon) resIcon.style.display = 'none';
        }
    }
    
    if (!interactiveTerminals[termId]) {
        const pane = document.createElement('div');
        pane.style.height = '100%';
        pane.style.width = '100%';
        document.getElementById('interactive-terminal-container').appendChild(pane);
        
        const term = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ff00' }, convertEol: true });
        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.onResize(({ cols, rows }) => {
            socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: termId, client_id: clientId });
        });
        term.open(pane);
        
        term.onData(data => {
            socket.emit('pty_input', { input: data, term_id: termId, client_id: clientId });
            if (data === '\r' || data === '\n') {
                const b = document.getElementById(cmdId);
                if (b) { b.classList.add('in-progress'); updateRunBtnState(); }
            }
        });
        
        interactiveTerminals[termId] = { term, fitAddon, cmdId, pane };
        
        socket.emit('start_terminal', {
            folder: currentFolder,
            filename: termId + '.log',
            cmd_filename: btn.dataset.filename,
            term_id: termId,
            client_id: clientId,
            command: btn.dataset.command,
            auto_run: false,
            shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
        });
    }
    
    interactiveTerminals[termId].pane.style.display = 'block';
    window.activeInteractiveTermId = termId;
    
    setTimeout(() => { 
        interactiveTerminals[termId].fitAddon.fit(); 
        interactiveTerminals[termId].term.focus(); 
    }, 50);
}

let multiTerminals = {};
let multiTermCounter = 0;
let activeMultiTermId = null;

let multiCmdFiles = [];

let multiNotesFiles = [];
let currentMtTab = 'commands';

function sendMultiTermInput(termId, data) {
    socket.emit('pty_input', { input: data, term_id: termId, client_id: clientId });
    let m = multiTerminals[termId];
    if (m) {
        if (m.inputBuffer === undefined) m.inputBuffer = '';
        if (data.includes('\r') || data.includes('\n')) {
            let parts = data.split(/[\r\n]/);
            m.inputBuffer += parts[0];
            let cmdStr = m.inputBuffer.trim();
            if (cmdStr) {
                m.isBusy = true;
                let cmdName = cmdStr.split(' ')[0];
                if (cmdName.length > 12) cmdName = cmdName.substring(0, 12) + '..';
                if (m.tabBtn.firstChild) m.tabBtn.firstChild.nodeValue = cmdName + ' ';
                m.tabBtn.classList.add('busy');
            }
            m.inputBuffer = parts[parts.length - 1] || '';
        } else if (data === '\x7f' || data === '\b') {
            m.inputBuffer = m.inputBuffer.slice(0, -1);
        } else {
            m.inputBuffer += data;
        }
    }
}

function loadMultiCmds() {
    fetch('/get_multi_commands_list').then(res => res.json()).then(files => {
        multiCmdFiles = files;
        fetch('/get_notes_list').then(res => res.json()).then(nFiles => {
            multiNotesFiles = nFiles;
            renderMultiCmds();
        });
    });
}

function renderMultiCmds(filter = '') {
    const list = document.getElementById('multi-cmd-list');
    list.innerHTML = '';
    const filesToRender = currentMtTab === 'commands' ? multiCmdFiles : multiNotesFiles;
    const searchWords = filter.toLowerCase().split(/\s+/).filter(Boolean);
    filesToRender.forEach(f => {
        let disp = f.replace(/\.txt$/i, '');
        const textToSearch = disp.toLowerCase() + " " + f.toLowerCase();
        if (searchWords.length === 0 || searchWords.every(word => textToSearch.includes(word))) {
            const li = document.createElement('li');
            li.style.padding = '5px 10px';
            li.style.borderBottom = '1px solid #333';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = disp;
            li.onmouseover = () => li.style.background = '#222';
            li.onmouseout = () => li.style.background = 'transparent';
            li.onclick = () => loadMultiCmdContent(f);
            list.appendChild(li);
        }
    });
}

function filterMultiCmds() {
    const val = document.getElementById('multi-cmd-search').value;
    renderMultiCmds(val);
}

function loadMultiCmdContent(filename) {
    const ep = currentMtTab === 'commands' ? '/multi_commands_file/' : '/notes_file/';
    fetch(ep + filename).then(res => res.text()).then(text => {
        if (currentFolder) {
            fetch('/render_macros', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: text, folder: currentFolder })
            }).then(r => r.json()).then(data => {
                if (data.success) {
                    document.getElementById('multi-cmd-editor').value = data.rendered;
                } else {
                    document.getElementById('multi-cmd-editor').value = data.raw || text;
                    showToast("Macro render warning: " + data.error, "warning");
                }
            }).catch(() => {
                document.getElementById('multi-cmd-editor').value = text;
            });
        } else {
            document.getElementById('multi-cmd-editor').value = text;
        }
    });
}

function runMultiCmd() {
    const content = document.getElementById('multi-cmd-editor').value;
    if (!content.trim()) return;
    if (!activeMultiTermId) {
        showToast("Open a goddamn tab first!", 'error');
        return;
    }
    if (!validateCommand(content)) return;
    const lines = content.split('\n');
    let delay = 0;
    const targetName = currentFolder ? currentFolder.split('/').pop() : '';
    lines.forEach(line => {
        if(line.trim()) {
            let processedLine = line;
            if(targetName) {
                processedLine = processedLine.replace(/{target}/g, targetName);
            }
            setTimeout(() => {
                sendMultiTermInput(activeMultiTermId, processedLine + '\r');
            }, delay);
            delay += 500;
        }
    });
}

function getThemeTabColors() {
    // Shared theme-aware tab palette (active/idle) for inline-styled tab buttons
    const body = document.body.className;
    if (body.includes('theme-white')) return { idleBg: '#ffffff', idleColor: '#1a1a1a', activeBg: '#0078d4', activeColor: '#ffffff' };
    if (body.includes('theme-dark')) return { idleBg: '#1a1a1a', idleColor: '#aaaaaa', activeBg: '#3a3a3a', activeColor: '#ffffff' };
    return { idleBg: '#111', idleColor: '#00ffcc', activeBg: '#00ffcc', activeColor: '#000' };
}

function switchMultiTermSidebar(tab) {
    currentMtTab = tab;
    const tc = getThemeTabColors();
    if(tab === 'commands') {
        document.getElementById('mt-tab-cmd').style.background = tc.activeBg;
        document.getElementById('mt-tab-cmd').style.color = tc.activeColor;
        document.getElementById('mt-tab-note').style.background = tc.idleBg;
        document.getElementById('mt-tab-note').style.color = tc.idleColor;
        document.getElementById('mt-run-btn').style.display = 'block';
    } else {
        document.getElementById('mt-tab-note').style.background = tc.activeBg;
        document.getElementById('mt-tab-note').style.color = tc.activeColor;
        document.getElementById('mt-tab-cmd').style.background = tc.idleBg;
        document.getElementById('mt-tab-cmd').style.color = tc.idleColor;
        document.getElementById('mt-run-btn').style.display = 'none';
    }
    loadMultiCmds();
}

function loadFileMgrList() {
    const type = document.getElementById('file-mgr-type').value;
    let endpoint = '/get_multi_commands_list';
    if(type === 'notes') endpoint = '/get_notes_list';
    else if(type === 'scripts') endpoint = '/get_scripts_list';
    else if(type === 'passwordlist') endpoint = '/get_passwordlist_list';
    else if(type === 'payloadslist') endpoint = '/get_payloadslist_list';
    else if(type === 'payloads') endpoint = '/get_payloads_list';
    
    fetch(endpoint).then(r=>r.json()).then(files => {
        const list = document.getElementById('file-mgr-list');
        list.innerHTML = '';
        files.forEach(f => {
            const li = document.createElement('li');
            li.style.padding = '8px';
            li.style.borderBottom = '1px solid #333';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            let disp = f;
            if(type === 'commands' || type === 'notes') disp = f.replace(/\.txt$/i, '');
            li.innerHTML = `<span style="flex:1; pointer-events:none; word-break:break-all;">${disp}</span>
                <div>
                    <span title="Share Link" onclick="event.stopPropagation(); window.shareFileMgr('${f}')" style="margin-right:5px; font-size:1.2em;">🔗</span>
                    <span title="Copy Absolute Path" onclick="event.stopPropagation(); window.copyFileMgrPath('${f}')" style="margin-right:5px; font-size:1.2em;">📋</span>
                    <span title="Edit" onclick="event.stopPropagation(); loadFileMgrContent('${f}')" style="margin-right:5px; font-size:1.2em;">✏️</span>
                    <span title="Delete" onclick="event.stopPropagation(); window.deleteFileMgr('${f}')" style="font-size:1.2em;">🗑️</span>
                </div>`;
            li.onclick = () => loadFileMgrContent(f);
            li.onmouseover = () => li.style.background = '#222';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
    });
}

function loadFileMgrContent(filename) {
    const type = document.getElementById('file-mgr-type').value;
    let endpoint = '/multi_commands_file/';
    if(type === 'notes') endpoint = '/notes_file/';
    else if(type === 'scripts') endpoint = '/scripts_file/';
    else if(type === 'passwordlist') endpoint = '/passwordlist_file/';
    else if(type === 'payloadslist') endpoint = '/payloadslist_file/';
    else if(type === 'payloads') endpoint = '/payloads_file/';
    fetch(endpoint + filename).then(r=>r.text()).then(txt => {
        if(document.getElementById('file-mgr-old-filename')) document.getElementById('file-mgr-old-filename').value = filename;
        let disp = filename;
        if(type === 'commands' || type === 'notes') disp = filename.replace(/\.txt$/i, '');
        document.getElementById('file-mgr-name').value = disp;
        document.getElementById('file-mgr-content').value = txt;
    });
}

function filterFileMgrList() {
    const filter = document.getElementById('file-mgr-search').value.toLowerCase();
    const items = document.getElementById('file-mgr-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

function openFileMgrModal() {
    window.showAndBringToFront('file-mgr-modal');
    if(document.getElementById('file-mgr-old-filename')) document.getElementById('file-mgr-old-filename').value = '';
    document.getElementById('file-mgr-name').value = '';
    document.getElementById('file-mgr-content').value = '';
    switchFileMgrTab('commands');
}

function switchFileMgrTab(tab) {
    document.getElementById('file-mgr-type').value = tab;
    const tc = getThemeTabColors();
    ['commands', 'notes', 'scripts', 'passwords', 'payloadslist', 'payloads'].forEach(t => {
        const btn = document.getElementById('tab-btn-' + t);
        if(btn) {
            btn.style.background = tc.idleBg;
            btn.style.color = tc.idleColor;
        }
    });
    const activeBtn = document.getElementById('tab-btn-' + (tab === 'passwordlist' ? 'passwords' : tab));
    if(activeBtn) {
        activeBtn.style.background = tc.activeBg;
        activeBtn.style.color = tc.activeColor;
    }
    if(document.getElementById('file-mgr-old-filename')) document.getElementById('file-mgr-old-filename').value = '';
    document.getElementById('file-mgr-name').value = '';
    document.getElementById('file-mgr-content').value = '';
    loadFileMgrList();
}

function saveFileMgr() {
    const type = document.getElementById('file-mgr-type').value;
    const name = document.getElementById('file-mgr-name').value;
    const oldName = document.getElementById('file-mgr-old-filename') ? document.getElementById('file-mgr-old-filename').value : '';
    const content = document.getElementById('file-mgr-content').value;
    if(!name) { showToast("Need a goddamn filename!", 'error'); return; }
    
    let endpoint = '/save_multi_command';
    if(type === 'notes') endpoint = '/save_note';
    else if(type === 'scripts') endpoint = '/save_script';
    else if(type === 'passwordlist') endpoint = '/save_passwordlist';
    else if(type === 'payloadslist') endpoint = '/save_payloadslist';
    else if(type === 'payloads') endpoint = '/save_payloads';
    
    fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: name, old_filename: oldName, content: content })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            showToast("File brutally saved! 💀", "success");
            if(document.getElementById('file-mgr-old-filename')) document.getElementById('file-mgr-old-filename').value = name;
            loadFileMgrList();
            if(document.getElementById('multi-terminal-modal').style.display === 'block') {
                loadMultiCmds();
            }
        }
    });
}

window.shareFileMgr = function(filename) {
    const type = document.getElementById('file-mgr-type').value;
    let endpoint = '/multi_commands_file/';
    if(type === 'notes') endpoint = '/notes_file/';
    else if(type === 'scripts') endpoint = '/scripts_file/';
    else if(type === 'passwordlist') endpoint = '/passwordlist_file/';
    else if(type === 'payloadslist') endpoint = '/payloadslist_file/';
    else if(type === 'payloads') endpoint = '/payloads_file/';
    
    const fullUrl = window.location.origin + endpoint + encodeURIComponent(filename);
    navigator.clipboard.writeText(fullUrl).then(() => {
        showToast("File link brutally copied to clipboard for sharing! 🔗", "success");
    }).catch(err => {
        showToast("Failed to copy that link.", "error");
    });
};

window.copyFileMgrPath = function(filename) {
    const type = document.getElementById('file-mgr-type').value;
    fetch('/get_absolute_path', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({type: type, filename: filename})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            navigator.clipboard.writeText(d.path).then(() => {
                showToast("Absolute path brutally copied to clipboard! 📋", "success");
            }).catch(err => {
                showToast("Failed to copy that shit.", "error");
            });
        } else {
            showToast("Error getting path", "error");
        }
    });
};

window.deleteFileMgr = function(filename) {
    if(!confirm("Are you sure you want to nuke '" + filename + "'?")) return;
    const type = document.getElementById('file-mgr-type').value;
    fetch('/delete_file_mgr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type, filename: filename })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            showToast("File violently deleted! 🗑️", "success");
            if(document.getElementById('file-mgr-name').value === filename) {
                document.getElementById('file-mgr-name').value = '';
                document.getElementById('file-mgr-content').value = '';
            }
            loadFileMgrList();
            if(document.getElementById('multi-terminal-modal').style.display === 'block') loadMultiCmds();
        }
    });
};

document.getElementById('right-edge-trigger').addEventListener('mouseenter', openMultiTerminalPanel);

function openMultiTerminalPanel() {
    window.showAndBringToFront('multi-terminal-modal');
    if (Object.keys(multiTerminals).length === 0) {
        createNewMultiTab();
    }
    loadMultiCmds();
}

function closeMultiTerminalPanel() {
    document.getElementById('multi-terminal-modal').style.display = 'none';
}

function openMultiTerminalModal() {
    openMultiTerminalPanel();
}

function createNewMultiTab() {
    multiTermCounter++;
    const termId = 'mterm_' + multiTermCounter;
    
    const tabBtn = document.createElement('button');
    tabBtn.className = 'multi-tab-btn';
    tabBtn.innerText = 'Terminal ' + multiTermCounter + ' ';
    
    const closeBtn = document.createElement('span');
    closeBtn.innerText = ' ✖';
    closeBtn.style.color = 'red';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeMultiTab(termId);
    };
    tabBtn.appendChild(closeBtn);

    tabBtn.onclick = () => activateMultiTab(termId);
    document.getElementById('multi-term-tabs').appendChild(tabBtn);
    
    const pane = document.createElement('div');
    pane.className = 'multi-term-pane';
    pane.id = 'pane_' + termId;
    document.getElementById('multi-term-container').appendChild(pane);
    
    const term = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ff00' }, convertEol: true });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.onResize(({ cols, rows }) => {
        socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: termId, client_id: clientId });
    });
    term.open(pane);
    
    term.onData(data => {
        sendMultiTermInput(termId, data);
    });
    
    multiTerminals[termId] = { term, fitAddon, tabBtn, pane };
    
    socket.emit('start_terminal', { folder: 'multi_terminals', filename: termId + '.log', term_id: termId, client_id: clientId, shell_type: localStorage.getItem('cyber_win_shell') || 'cmd' });
    
    activateMultiTab(termId);
}

function recreateMultiTab(termId) {
    const tabBtn = document.createElement('button');
    tabBtn.className = 'multi-tab-btn';
    tabBtn.innerText = 'Terminal ' + termId.replace('mterm_', '') + ' ';
    
    const closeBtn = document.createElement('span');
    closeBtn.innerText = ' ✖';
    closeBtn.style.color = 'red';
    closeBtn.style.cursor = 'pointer';
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeMultiTab(termId);
    };
    tabBtn.appendChild(closeBtn);

    tabBtn.onclick = () => activateMultiTab(termId);
    document.getElementById('multi-term-tabs').appendChild(tabBtn);
    
    const pane = document.createElement('div');
    pane.className = 'multi-term-pane';
    pane.id = 'pane_' + termId;
    document.getElementById('multi-term-container').appendChild(pane);
    
    const term = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ff00' }, convertEol: true });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.onResize(({ cols, rows }) => {
        socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: termId, client_id: clientId });
    });
    term.open(pane);
    
    term.onData(data => {
        sendMultiTermInput(termId, data);
    });
    
    multiTerminals[termId] = { term, fitAddon, tabBtn, pane };
    
    fetch(`/target_file/multi_terminals/${termId}.log`)
        .then(res => res.text())
        .then(text => {
            term.write(text);
        }).catch(e => console.log(e));
}

function closeMultiTab(termId) {
    socket.emit('kill_terminal', { client_id: clientId, term_id: termId });
    const m = multiTerminals[termId];
    if (m) {
        m.tabBtn.remove();
        m.pane.remove();
        delete multiTerminals[termId];
    }
    const remaining = Object.keys(multiTerminals);
    if (remaining.length > 0) {
        activateMultiTab(remaining[0]);
    } else {
        activeMultiTermId = null;
    }
}

function activateMultiTab(termId) {
    for (let id in multiTerminals) {
        multiTerminals[id].tabBtn.classList.remove('active');
        multiTerminals[id].pane.style.display = 'none';
    }
    multiTerminals[termId].tabBtn.classList.add('active');
    multiTerminals[termId].pane.style.display = 'block';
    
    setTimeout(() => {
        multiTerminals[termId].fitAddon.fit();
        multiTerminals[termId].term.focus();
    }, 50);
    
    activeMultiTermId = termId;
}

let currentViewMode = 'gallery';

function setViewMode(mode) {
    currentViewMode = mode;
    document.querySelectorAll('.view-icon').forEach(el => el.classList.remove('active-view'));
    const activeIcon = document.querySelector(`.view-icon[onclick="setViewMode('${mode}')"]`);
    if (activeIcon) activeIcon.classList.add('active-view');
    renderButtons();
}

function loadCommands() {
    fetch('/get_commands')
        .then(res => res.json())
        .then(data => {
            commandsData = data;
            renderButtons();
        });
}

function createCommandButton(cmd) {
    const btn = document.createElement('button');
    btn.className = 'scan-btn';
    btn.id = cmd.id;
    
    let processedCommand = cmd.command;
    if (processedCommand) {
        processedCommand = processedCommand.replace(/\{http-or-https\}/g, window.globalProtocol);
    }
    
    btn.dataset.command = processedCommand;
    btn.dataset.filename = cmd.filename;
    
    const cat = cmd.category || 'Uncategorized';
    const tags = cmd.tags || 'none';
    const ramWarning = cmd.high_ram ? `<span class="ram-warning-icon" title="High RAM Consumption!"><i data-icon="warning" data-size="16"></i></span>` : '';
    const osWinIcon = cmd.os_windows ? ((window.sysIcons && window.sysIcons.windows) ? `<span class="os-win-icon" title="Windows">${window.sysIcons.windows}</span>` : `<span class="os-win-icon" title="Windows"><i data-icon="windows" data-size="16"></i></span>`) : '';
    const osLinIcon = cmd.os_linux ? ((window.sysIcons && window.sysIcons.linux) ? `<span class="os-lin-icon" title="Linux">${window.sysIcons.linux}</span>` : `<span class="os-lin-icon" title="Linux"><i data-icon="linux" data-size="16"></i></span>`) : '';
    const orderBadge = cmd.order_num ? `<span style="background:#ff00ff; color:#000; padding:2px 6px; border-radius:50%; font-weight:bold; margin-right:8px; font-size:0.9em; box-shadow:0 0 5px #ff00ff;">${cmd.order_num}</span>` : '';
    const cmdIconImg = cmd.icon ? `<img src="${cmd.icon}" style="width:20px; height:20px; margin-right:8px; vertical-align:middle; filter:drop-shadow(0 0 5px #00ffcc);">` : '';
    const runIconStr = (window.sysIcons && window.sysIcons.run) ? window.sysIcons.run : (window.sysIcon ? window.sysIcon('search', 18) : '🔍');
    const cmdIconStr = (window.sysIcons && window.sysIcons.cmd) ? `<span class="cmd-custom-icon" style="margin-right:5px;">${window.sysIcons.cmd}</span>` : `<span class="cmd-custom-icon" style="margin-right:5px; display:none;"></span>`;
    const galleryCount = window.cmdImageCounts ? (window.cmdImageCounts[cmd.id] || 0) : 0;
    const galleryUI = `<div class="cmd-gallery-icon" style="position: absolute; bottom: 5px; left: 8px; cursor: pointer; display: flex; align-items: center; gap: 3px; opacity: 0.8; transition: 0.2s; z-index: 10;" title="View/Add Images" onclick="event.stopPropagation(); window.openCmdGallery('${cmd.id}', '${cmd.name}')">🖼️ <span id="gallery-count-${cmd.id}" style="font-size:0.8em; font-weight:bold; color:#00ffcc;">${galleryCount}</span></div>`;
    const icoDel  = window.sysIcon ? window.sysIcon('trash', 16) : '❌';
    const icoEdit = window.sysIcon ? window.sysIcon('edit', 16) : '✏️';
    const icoCopy = window.sysIcon ? window.sysIcon('clipboard', 16) : '📋';
    const icoStop = window.sysIcon ? window.sysIcon('stop', 16) : '🛑';
    const icoTerm = window.sysIcon ? window.sysIcon('monitor', 16) : '🖥️';
    const icoInter= window.sysIcon ? window.sysIcon('laptop', 16) : '💻';
    const icoEye  = window.sysIcon ? window.sysIcon('eye', 16) : '👁️';
    btn.innerHTML = `
        <span class="delete-icon" title="Delete" onclick="event.stopPropagation(); deleteCommand('${cmd.id}')">${icoDel}</span>
        <span class="edit-icon" title="Edit" onclick="event.stopPropagation(); editCommand('${cmd.id}')">${icoEdit}</span>
        <div style="text-align: left; width: 100%; display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px;">
            <div style="display:flex; align-items:flex-start; flex-wrap: wrap; gap: 5px; width: 100%;">
                <span class="flags-container" id="flags-${cmd.id}" style="display:inline-flex; gap:2px; flex-wrap: wrap; align-items:center;"></span>
                ${orderBadge}${ramWarning}${cmdIconImg}${cmdIconStr}
                <span style="flex: 1; word-break: break-word; white-space: normal; min-width: 100px;">${cmd.name}</span>
                <div style="display:inline-flex; gap:5px; flex-wrap: wrap; align-items:center;">
                    <span class="copy-icon" title="Copy Command" onclick="event.stopPropagation(); copyCommand('${cmd.id}')">${icoCopy}</span><span class="run-icon" title="Instant Run" onclick="event.stopPropagation(); instantRun('${cmd.id}')">${runIconStr}</span><span class="stop-icon" title="Kill Hanging Scan" onclick="event.stopPropagation(); killScan('${cmd.id}')">${icoStop}</span><span class="term-icon" title="Live Terminal" onclick="event.stopPropagation(); runTerminal('${cmd.id}')">${icoTerm}</span><span class="interactive-icon" title="Interactive Terminal" onclick="event.stopPropagation(); openInteractiveTerminal('${cmd.id}')">${icoInter}</span><span class="result-icon" title="View Results" onclick="event.stopPropagation(); viewResult('${cmd.filename}')" style="display:none;">${icoEye}</span>
                </div>
            </div>
            <div class="cmd-meta" style="word-break: break-word;">[<span class="cmd-cat">${cat}</span>] tags: <span class="cmd-tags">${tags}</span></div>
        </div>
        ${galleryUI}
        <div class="os-icons-container" style="position: absolute; bottom: 5px; right: 8px; display: flex; gap: 4px; opacity: 0.6; pointer-events: none;">
            ${osWinIcon}${osLinIcon}
        </div>
    `;
    
    btn.tabIndex = 0;
    btn.onclick = function() { this.classList.toggle('selected'); if(window.updateBulkEditBtn) window.updateBulkEditBtn(); };
    
    btn.addEventListener('paste', function(e) {
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            e.stopPropagation();
            window.uploadImageForCmd(cmd.id, e.clipboardData.files[0]);
        }
    });

    btn.ondragover = function(ev) { ev.preventDefault(); this.style.borderColor = '#ff00ff'; };
    btn.ondragleave = function(ev) { this.style.borderColor = ''; };
    btn.ondrop = function(ev) {
        ev.preventDefault();
        this.style.borderColor = '';
        if (ev.dataTransfer.files && ev.dataTransfer.files.length > 0 && ev.dataTransfer.files[0].type.startsWith('image/')) {
            ev.stopPropagation();
            window.uploadImageForCmd(cmd.id, ev.dataTransfer.files[0]);
            return;
        }
        if (!currentFolder) {
            showToast("Select a target first, you dumb fuck!", 'error');
            return;
        }
        const flag = ev.dataTransfer.getData("flag");
        const action = flag ? 'add' : 'clear';
        fetch('/set_target_flag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: currentFolder, cmd_id: cmd.id, flag: flag, action: action })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                const container = document.getElementById('flags-' + cmd.id);
                if (container) container.innerHTML = data.flags.join('');
                currentTargetFlags[cmd.id] = data.flags;
                filterButtons();
            }
        });
    };
    return btn;
}

window.copyCommand = function(cmdId) {
    const cmd = commandsData.find(c => c.id === cmdId);
    if (cmd) {
        fetch('/render_macros', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: cmd.command, folder: currentFolder || '' })
        }).then(r => r.json()).then(data => {
            let rendered = data.success ? data.rendered : cmd.command;
            navigator.clipboard.writeText(rendered).then(() => {
                showToast("Fully rendered command brutally copied to clipboard! 📋", "success");
            }).catch(err => {
                showToast("Failed to copy that shit.", "error");
            });
        }).catch(err => {
            showToast("Error rendering macros for copy.", "error");
        });
    }
};

window.cmdImageCounts = {};
function fetchCmdImageCounts() {
    if (!currentFolder) {
        window.cmdImageCounts = {};
        document.querySelectorAll('[id^="gallery-count-"]').forEach(el => el.innerText = '0');
        return;
    }
    fetch('/api/cmd_images/counts?target=' + encodeURIComponent(currentFolder)).then(r=>r.json()).then(d=>{
        window.cmdImageCounts = d;
        document.querySelectorAll('[id^="gallery-count-"]').forEach(el => el.innerText = '0');
        for (let cid in d) {
            const el = document.getElementById('gallery-count-' + cid);
            if(el) el.innerText = d[cid];
        }
    }).catch(e=>{});
}

window.currentGalleryCmdId = null;
window.currentGalleryImages = [];
window.currentGalleryIndex = 0;

window.uploadImageForCmd = function(cmdId, file) {
    if (!currentFolder) {
        showToast("Select a goddamn target first to save images!", "error");
        return;
    }
    if (!file || !file.type.startsWith('image/')) {
        showToast("Drop a valid image you moron!", "error");
        return;
    }
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            canvas.toBlob(function(blob) {
                const formData = new FormData();
                formData.append('file', blob, 'image.webp');
                formData.append('cmd_id', cmdId);
                formData.append('target', currentFolder);
                fetch('/api/cmd_images/upload', {method: 'POST', body: formData})
                .then(r=>r.json()).then(d => {
                    if(d.success) { 
                        showToast("Image violently injected as WebP for target! 💀", "success"); 
                        fetchCmdImageCounts();
                        if (window.currentGalleryCmdId === cmdId) {
                            window.loadGalleryImages(cmdId);
                        }
                    } else {
                        showToast("Failed to upload image.", "error");
                    }
                });
            }, 'image/webp', 0.9);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

window.openCmdGallery = function(cmdId, cmdName) {
    if (!currentFolder) {
        showToast("Select a target first!", "error");
        return;
    }
    window.currentGalleryCmdId = cmdId;
    document.getElementById('cmd-gallery-title').innerText = "Images: " + cmdName;
    window.showAndBringToFront('cmd-gallery-modal');
    window.loadGalleryImages(cmdId);
    document.getElementById('cmd-gallery-modal').focus();
};

window.closeCmdGallery = function() {
    closeModal('cmd-gallery-modal');
    window.currentGalleryCmdId = null;
    window.currentGalleryImages = [];
};

window.loadGalleryImages = function(cmdId) {
    if (!currentFolder) return;
    fetch('/api/cmd_images/list/' + encodeURIComponent(currentFolder) + '/' + cmdId).then(r=>r.json()).then(files => {
        window.currentGalleryImages = files;
        if (files.length > 0) {
            window.currentGalleryIndex = files.length - 1; // Show newest
            window.renderCmdGalleryImage();
        } else {
            document.getElementById('cmd-gallery-empty').style.display = 'block';
            document.getElementById('cmd-gallery-img').style.display = 'none';
            document.getElementById('cmd-gallery-prev').style.display = 'none';
            document.getElementById('cmd-gallery-next').style.display = 'none';
            document.getElementById('cmd-gallery-counter').innerText = '0 / 0';
        }
    });
};

window.renderCmdGalleryImage = function() {
    if (window.currentGalleryImages.length === 0 || !currentFolder) return;
    const filename = window.currentGalleryImages[window.currentGalleryIndex];
    const img = document.getElementById('cmd-gallery-img');
    img.src = '/cmd_images_file/' + encodeURIComponent(currentFolder) + '/' + window.currentGalleryCmdId + '/' + filename;
    img.style.display = 'block';
    document.getElementById('cmd-gallery-empty').style.display = 'none';
    
    document.getElementById('cmd-gallery-prev').style.display = window.currentGalleryImages.length > 1 ? 'block' : 'none';
    document.getElementById('cmd-gallery-next').style.display = window.currentGalleryImages.length > 1 ? 'block' : 'none';
    document.getElementById('cmd-gallery-counter').innerText = (window.currentGalleryIndex + 1) + " / " + window.currentGalleryImages.length;
};

window.nextCmdImage = function() {
    if (window.currentGalleryImages.length <= 1) return;
    window.currentGalleryIndex = (window.currentGalleryIndex + 1) % window.currentGalleryImages.length;
    window.renderCmdGalleryImage();
};

window.prevCmdImage = function() {
    if (window.currentGalleryImages.length <= 1) return;
    window.currentGalleryIndex = (window.currentGalleryIndex - 1 + window.currentGalleryImages.length) % window.currentGalleryImages.length;
    window.renderCmdGalleryImage();
};

document.addEventListener('keydown', function(e) {
    if (document.getElementById('cmd-gallery-modal').style.display === 'block') {
        if (e.key === 'ArrowRight') window.nextCmdImage();
        else if (e.key === 'ArrowLeft') window.prevCmdImage();
    }
});

document.addEventListener('paste', function(e) {
    if (document.getElementById('cmd-gallery-modal').style.display === 'block' && window.currentGalleryCmdId) {
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
            e.preventDefault();
            window.uploadImageForCmd(window.currentGalleryCmdId, e.clipboardData.files[0]);
        }
    }
});

function renderButtons() {
    const container = document.getElementById('scan-options-container');
    container.innerHTML = '';
    container.className = 'scan-options view-' + currentViewMode;
    
    if (currentViewMode === 'kanban') {
        const categories = {};
        commandsData.forEach(cmd => {
            const cat = cmd.category || 'Uncategorized';
            if (!categories[cat]) categories[cat] = [];
            categories[cat].push(cmd);
        });
        for (const cat in categories) {
            const col = document.createElement('div');
            col.className = 'kanban-col';
            col.innerHTML = `<div class="kanban-col-title">${cat}</div>`;
            categories[cat].forEach(cmd => {
                col.appendChild(createCommandButton(cmd));
            });
            container.appendChild(col);
        }
    } else {
        commandsData.forEach(cmd => {
            container.appendChild(createCommandButton(cmd));
        });
    }
    
    if (currentFolder) {
        loadTargetFlags();
    }
    filterButtons();
    updateRunBtnState();
}

let currentTargetFlags = {};
function loadTargetFlags() {
    if (!currentFolder) return;
    fetch('/get_target_flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: currentFolder })
    }).then(res => res.json()).then(flagsData => {
        currentTargetFlags = flagsData;
        document.querySelectorAll('.flags-container').forEach(el => el.innerHTML = '');
        for (let cmdId in flagsData) {
            const container = document.getElementById('flags-' + cmdId);
            if (container) {
                container.innerHTML = flagsData[cmdId].join('');
            }
        }
        filterButtons();
    });
}

document.getElementById('new-folder-btn').addEventListener('click', () => {
    document.getElementById('new-target-name').value = '';
    document.getElementById('new-target-ip').value = '';
    document.getElementById('new-folder-modal').style.display = 'block';
});

function deleteTarget(target) {
    if (confirm("Are you sure you want to nuke the target '" + target + "' and all its shit? This is permanent!")) {
        fetch('/delete_target', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: target })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                document.querySelectorAll('.target-container').forEach(el => {
                    const span = el.querySelector('span:nth-of-type(2)');
                    if (span && span.innerText === target) el.remove();
                });
                if (currentFolder === target || currentFolder.startsWith(target + '/')) {
                    currentFolder = '';
                    document.getElementById('active-folder').innerText = 'None';
                    renderButtons();
                }
                showToast("Target brutally deleted!", "success");
            }
            else showToast("Failed to delete the bitch: " + data.error, 'error');
        });
    }
}

async function saveNewFolder(isWifi = false, isPerson = false) {
    const folderName = document.getElementById(isPerson ? 'new-person-name' : (isWifi ? 'new-wifi-name' : 'new-target-name')).value;
    let ipAddress = document.getElementById(isWifi ? 'new-wifi-dummy-ip' : 'new-target-ip').value;
    const ssid = isWifi ? document.getElementById('new-wifi-ssid').value : '';
    const bssid = isWifi ? document.getElementById('new-wifi-bssid').value : '';
    const channel = isWifi ? document.getElementById('new-wifi-channel').value : '';
    
    const p_name = isPerson ? document.getElementById('person-meta-name').value : '';
    const p_email = isPerson ? document.getElementById('person-meta-email').value : '';
    const p_phone = isPerson ? document.getElementById('person-meta-phone').value : '';
    const p_location = isPerson ? document.getElementById('person-meta-location').value : '';
    const p_username = isPerson ? document.getElementById('person-meta-username').value : '';

    if (!folderName) return;

    if (folderName) {
        showToast("Auto-resolving target data... 🌍", "warning");
        let geo = null;
        try {
            const geoRes = await fetch('/geo_lookup', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ target: ipAddress || folderName })
            });
            const geoData = await geoRes.json();
            if (geoData.success && geoData.data.status === 'success') {
                geo = geoData.data;
                if (!ipAddress) ipAddress = geo.query;
                showToast(`Resolved IP: ${ipAddress} | Location: ${geo.city}, ${geo.country}`, "success");
            }
        } catch (e) {}

        fetch('/create_folder', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                folder_name: folderName, ip_address: ipAddress, ssid: ssid, bssid: bssid, channel: channel, 
                p_name: p_name, p_email: p_email, p_phone: p_phone, p_location: p_location, p_username: p_username,
                target_type: isPerson ? 'person' : (isWifi ? 'wifi' : 'bugbounty')
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                closeModal(isWifi ? 'new-wifi-modal' : 'new-folder-modal');
                showToast("Target created seamlessly! 💀", "success");
                
                if (geo && globalLeafletMap && !isWifi) {
                    const useFavicon = document.getElementById('map-show-favicon') && document.getElementById('map-show-favicon').checked;
                    const iconStyle = useFavicon ? `background-image: url('/target_file/${folderName}/favicon.png'); border-radius: 50%; background-size: cover;` : '';
                    const iconHtml = `<div class="cyber-pin-container"><div class="cyber-pin-label">${folderName}</div><div class="cyber-pin-icon" style="${iconStyle}"></div></div>`;
                    const icon = L.divIcon({ className: 'custom-map-pin', html: iconHtml, iconSize: [0, 0], iconAnchor: [0, 0] });
                    const marker = L.marker([geo.lat, geo.lon], {icon: icon}).addTo(globalLeafletMap);
                    marker.bindPopup(`<b>${folderName}</b><br>IP: ${geo.query}<br>Location: ${geo.city}, ${geo.country}<br>ISP: ${geo.isp}`);
                    marker.on('click', () => window.openMapTargetPanel(folderName, geo.query, geo));
                    marker.on('dblclick', () => window.openMapTargetPanel(folderName, geo.query, geo));
                    mapMarkers.push(marker);
                }

                const ul = document.getElementById('folder-list');
                const li = document.createElement('li');
                li.className = 'target-container';
                li.dataset.targetType = isPerson ? 'person' : (isWifi ? 'wifi' : 'bugbounty');
                li.innerHTML = `
                    <div class="folder-item" ondblclick="toggleSubdomains('${folderName}')" onclick="selectFolder('${folderName}', this)" ondragover="event.preventDefault(); this.classList.add('drag-over');" ondragleave="this.classList.remove('drag-over');" ondrop="this.classList.remove('drag-over'); dropTargetFlag(event, '${folderName}', this)">
                        <div style="display:flex; flex-direction:column; width:100%;">
                            <div style="display:flex; flex-direction:column; align-items:flex-start; width: 100%;">
                                <div style="display:flex; align-items:center; word-break: break-all; width: 100%;">
                                    <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:#111; vertical-align:middle; margin-right:5px; border: 1px solid #00ffcc; flex-shrink:0;"></span>
                                    <span style="font-weight:bold; font-size:1.1em; color:#fff;">${folderName}</span>
                                    <span id="scan-count-${folderName}" class="scan-count" style="display:none; margin-left: auto; background: #ffaa00; color: #000; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">0</span>
                                </div>
                                <div class="target-actions" style="margin-top: 8px; margin-left: 21px; display:flex; gap:12px; flex-wrap: wrap;">
                                    <span class="action-icon" title="Delete Target" onclick="event.stopPropagation(); deleteTarget('${folderName}')"><i data-icon="trash" data-size="16"></i></span>
                                    <span class="action-icon" title="Edit Target Info" onclick="event.stopPropagation(); openEditTargetModal('${folderName}', '${isPerson ? 'person' : (isWifi ? 'wifi' : 'bugbounty')}')"><i data-icon="edit" data-size="16"></i></span>
                                    ${(!isPerson && !isWifi) ? `
                                    <span class="action-icon" title="Add Subdomain" onclick="event.stopPropagation(); openSubdomainModal('${folderName}')"><i data-icon="globe" data-size="16"></i></span>
                                    <span class="action-icon" title="Bulk Upload Subdomains" onclick="event.stopPropagation(); openBulkSubdomainModal('${folderName}')"><i data-icon="folder" data-size="16"></i></span>
                                    <span class="action-icon" title="Edit Cookie" onclick="event.stopPropagation(); openCookieModal('${folderName}')"><i data-icon="cookie" data-size="16"></i></span>
                                    <span class="action-icon" title="Edit IP Address" onclick="event.stopPropagation(); openIpModal('${folderName}')"><i data-icon="target" data-size="16"></i></span>
                                    ` : ''}
                                    ${isWifi ? `
                                    <span class="action-icon" title="Edit IP Address" onclick="event.stopPropagation(); openIpModal('${folderName}')"><i data-icon="target" data-size="16"></i></span>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="target-flag-container" style="display:flex; gap:2px; margin-top:2px;"></div>
                        </div>
                    </div>
                    <ul id="subs-${folderName}" class="subdomain-list" style="display:none;"></ul>`;
                ul.appendChild(li);
            } else {
                showToast("Error: " + data.error, 'error');
            }
        });
    }
}

function toggleSubdomains(target) {
    const list = document.getElementById('subs-' + target);
    if (list) list.style.display = list.style.display === 'none' ? 'block' : 'none';
}

window.openEditTargetModal = function(target, type) {
    document.getElementById('edit-target-name-hidden').value = target;
    document.getElementById('edit-target-type-hidden').value = type;
    
    fetch('/get_target_details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target, type: type })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            const container = document.getElementById('edit-target-fields');
            container.innerHTML = '';
            
            const details = data.details;
            
            const createField = (label, id, val) => {
                const w = document.createElement('div');
                w.innerHTML = `<label style="color:#00ffcc;font-weight:bold;">${label}</label><input type="text" id="${id}" class="search-input" value="${val}" style="margin-bottom:0;">`;
                container.appendChild(w);
            };

            createField('IP Address:', 'edit-target-ip', details.ip || '');
            
            if(type === 'wifi') {
                createField('SSID:', 'edit-target-ssid', details.ssid || '');
                createField('BSSID:', 'edit-target-bssid', details.bssid || '');
                createField('Channel:', 'edit-target-channel', details.channel || '');
            } else if(type === 'person') {
                createField('Full Name:', 'edit-target-p_name', details.name || '');
                createField('Email:', 'edit-target-p_email', details.email || '');
                createField('Phone:', 'edit-target-p_phone', details.phone || '');
                createField('Location:', 'edit-target-p_location', details.location || '');
                createField('Username:', 'edit-target-p_username', details.username || '');
            }
            
            window.showAndBringToFront('edit-target-modal');
        } else {
            showToast("Failed to fetch target details.", "error");
        }
    });
};

window.saveEditedTarget = function() {
    const target = document.getElementById('edit-target-name-hidden').value;
    const type = document.getElementById('edit-target-type-hidden').value;
    
    let details = {};
    const getVal = (id) => document.getElementById(id) ? document.getElementById(id).value : null;
    
    details.ip = getVal('edit-target-ip');
    
    if(type === 'wifi') {
        details.ssid = getVal('edit-target-ssid');
        details.bssid = getVal('edit-target-bssid');
        details.channel = getVal('edit-target-channel');
    } else if(type === 'person') {
        details.name = getVal('edit-target-p_name');
        details.email = getVal('edit-target-p_email');
        details.phone = getVal('edit-target-p_phone');
        details.location = getVal('edit-target-p_location');
        details.username = getVal('edit-target-p_username');
    }
    
    fetch('/edit_target', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target, type: type, details: details })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            closeModal('edit-target-modal');
            showToast("Target details brutally updated! 💀", "success");
            if(target === (currentFolder ? currentFolder.split('/').pop() : '')) {
                window.syncToTxtFinder();
            }
        } else {
            showToast("Error saving details.", "error");
        }
    });
};

function openIpModal(target) {
    document.getElementById('ip-target').value = target;
    fetch('/get_target_ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target })
    }).then(res => res.json()).then(data => {
        document.getElementById('ip-value').value = data.ip || '';
        window.showAndBringToFront('ip-modal');
    });
}

function saveIp() {
    const target = document.getElementById('ip-target').value;
    const ipVal = document.getElementById('ip-value').value;
    fetch('/save_target_ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target, ip: ipVal })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            closeModal('ip-modal');
            showToast("IP address brutally updated! 🎯", "success");
            if (target === (currentFolder ? currentFolder.split('/').pop() : '')) {
                window.syncToTxtFinder();
            }
        } else {
            showToast("Error saving that fucking IP", 'error');
        }
    });
}

function openCookieModal(target) {
    document.getElementById('cookie-target').value = target;
    fetch('/get_cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target })
    }).then(res => res.json()).then(data => {
        document.getElementById('cookie-value').value = data.cookie || '';
        window.showAndBringToFront('cookie-modal');
    });
}

function saveCookie() {
    const target = document.getElementById('cookie-target').value;
    const cookieVal = document.getElementById('cookie-value').value;
    fetch('/save_cookie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target, cookie: cookieVal })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            closeModal('cookie-modal');
            showToast("Cookie saved like a boss! 🍪", "success");
            if (target === (currentFolder ? currentFolder.split('/').pop() : '')) {
                window.syncToTxtFinder();
            }
        } else {
            showToast("Error saving that fucking cookie", 'error');
        }
    });
}

function openSubdomainModal(target) {
    document.getElementById('subdomain-target').value = target;
    document.getElementById('subdomain-name').value = '';
    window.showAndBringToFront('add-subdomain-modal');
}

function saveSubdomain() {
    const target = document.getElementById('subdomain-target').value;
    const sub = document.getElementById('subdomain-name').value;
    if(!sub) return;
    fetch('/add_subdomain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: target, subdomain: sub })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            closeModal('add-subdomain-modal');
            const ul = document.getElementById('subs-' + target);
            if (ul) {
                const li = document.createElement('li');
                li.className = 'folder-item sub-item';
                li.onclick = function() { selectFolder(target + '/subdomains/' + sub, this); };
                li.innerHTML = `<div style="display:flex; flex-direction:column; width:100%;">
                                    <div style="display:flex; align-items:center;">
                                        <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:#222; vertical-align:middle; margin-right:5px; border: 1px dashed #00ffcc;"></span>
                                        ${sub}
                                    </div>
                                    <div class="target-flag-container" style="display:flex; gap:2px; margin-top:2px;"></div>
                                </div>`;
                ul.appendChild(li);
            }
            showToast("Subdomain forcibly added!", "success");
        } else showToast("Error: " + data.error, 'error');
    });
}

function openBulkSubdomainModal(target) {
    document.getElementById('bulk-subdomain-target').value = target;
    document.getElementById('bulk-subdomain-file').value = '';
    window.showAndBringToFront('bulk-subdomain-modal');
}

function uploadBulkSubdomains() {
    const target = document.getElementById('bulk-subdomain-target').value;
    const fileInput = document.getElementById('bulk-subdomain-file');
    if(!fileInput.files.length) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        fetch('/add_bulk_subdomains', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: target, subdomains: lines })
        }).then(res => res.json()).then(data => {
            if(data.success) {
                closeModal('bulk-subdomain-modal');
                showToast("Added " + data.added + " subdomains directly!", "success");
                lines.forEach(sub => {
                    const cleanSub = sub.trim();
                    if (!cleanSub) return;
                    const ul = document.getElementById('subs-' + target);
                    if (ul && !ul.innerHTML.includes(cleanSub)) {
                        const li = document.createElement('li');
                        li.className = 'folder-item sub-item';
                        li.onclick = function() { selectFolder(target + '/subdomains/' + cleanSub, this); };
                        li.innerHTML = `<div style="display:flex; flex-direction:column; width:100%;">
                                            <div style="display:flex; align-items:center;">
                                                <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:#222; vertical-align:middle; margin-right:5px; border: 1px dashed #00ffcc;"></span>
                                                ${cleanSub}
                                            </div>
                                            <div class="target-flag-container" style="display:flex; gap:2px; margin-top:2px;"></div>
                                        </div>`;
                        ul.appendChild(li);
                    }
                });
            } else showToast("Error: " + data.error, 'error');
        });
    };
    reader.readAsText(fileInput.files[0]);
}

function filterTargets() {
    const filter = document.getElementById('target-search').value.toLowerCase();
    document.querySelectorAll('.folder-item').forEach(el => {
        el.style.display = el.innerText.toLowerCase().includes(filter) ? 'block' : 'none';
    });
}

function filterButtons() {
    const textFilter = document.getElementById('button-search') ? document.getElementById('button-search').value.toLowerCase() : '';
    const flagFilter = document.getElementById('filter-flag') ? document.getElementById('filter-flag').value : 'all';
    const statusFilter = document.getElementById('filter-status') ? document.getElementById('filter-status').value : 'all';
    const mode = window.currentActiveMode || localStorage.getItem('cyber_active_main_tab') || 'bugbounty';
    
    document.querySelectorAll('.scan-btn').forEach(btn => {
        const cmd = commandsData.find(c => c.id === btn.id);
        if (!cmd) return;
        
        const typeMatch = (cmd.type === mode) || (!cmd.type && mode === 'bugbounty' && cmd.type !== 'person' && cmd.type !== 'wifi');
        
        const searchStr = (cmd.name + " " + (cmd.category || "") + " " + (cmd.tags || "")).toLowerCase();
        const searchWords = textFilter.split(/\s+/).filter(Boolean);
        const textMatch = searchWords.length === 0 || searchWords.every(word => searchStr.includes(word));
        
        let flagMatch = true;
        if (flagFilter !== 'all') {
            const flags = currentTargetFlags[btn.id] || [];
            const colorTarget = flagFilter === 'critical' ? '#ff0000' : flagFilter === 'high' ? '#ff8800' : flagFilter === 'medium' ? '#ffff00' : '#00ccff';
            flagMatch = flags.some(f => f.includes(colorTarget));
        }
        
        let statusMatch = true;
        if (statusFilter !== 'all') {
            const isCompleted = btn.classList.contains('completed');
            const isRunning = btn.classList.contains('in-progress');
            const isUnstarted = !isCompleted && !isRunning;
            
            if (statusFilter === 'completed' && !isCompleted) statusMatch = false;
            if (statusFilter === 'running' && !isRunning) statusMatch = false;
            if (statusFilter === 'unstarted' && !isUnstarted) statusMatch = false;
        }
        
        btn.style.display = (textMatch && flagMatch && statusMatch && typeMatch) ? 'flex' : 'none';
    });

    if (currentViewMode === 'kanban') {
        document.querySelectorAll('.kanban-col').forEach(col => {
            const hasVisible = Array.from(col.querySelectorAll('.scan-btn')).some(b => b.style.display !== 'none');
            col.style.display = hasVisible ? 'flex' : 'none';
        });
    }
}

function selectFolder(folder, element) {
    currentFolder = folder;
    document.getElementById('active-folder').innerText = folder;
    
    const iframe = document.getElementById('quad-term-iframe');
    if(iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'cyber_target_update',
            target: currentFolder ? currentFolder.split('/').pop() : '',
            atkIp: window.sysAttackerIp || ''
        }, '*');
    }

    document.querySelectorAll('.folder-item').forEach(el => el.classList.remove('active'));
    if (element) {
        element.classList.add('active');
    } else {
        document.querySelectorAll('.folder-item').forEach(el => {
            const oc = el.getAttribute('onclick');
            if (oc && oc.includes(`'${folder}'`)) el.classList.add('active');
        });
    }

    loadTargetFlags();
    fetchCmdImageCounts();
    fetch('/get_folder_files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: currentFolder })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.currentFolderFiles = data.files;
            document.querySelectorAll('.scan-btn').forEach(btn => {
                const scanKey = currentFolder + '||' + btn.id;
                const isRunning = (scanEvents[scanKey] && scanEvents[scanKey].readyState !== EventSource.CLOSED) || scanQueue.some(q => q.folder === currentFolder && q.id === btn.id);
                
                if (isRunning) {
                    btn.classList.remove('completed', 'selected');
                    btn.classList.add('in-progress');
                    btn.querySelector('.result-icon').style.display = 'none';
                } else if (data.files.includes(btn.dataset.filename)) {
                    btn.classList.remove('in-progress', 'selected');
                    btn.classList.add('completed');
                    btn.querySelector('.result-icon').style.display = 'inline-block';
                } else {
                    btn.classList.remove('completed', 'in-progress');
                    btn.querySelector('.result-icon').style.display = 'none';
                }
            });
            filterButtons();
        }
        updateRunBtnState();
        window.syncToTxtFinder();
    });
}

// REALTIME DOM SYNC LOOP
setInterval(() => {
    if (!currentFolder) return;
    fetch('/get_folder_files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: currentFolder })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.currentFolderFiles = data.files;
            let changed = false;
            document.querySelectorAll('.scan-btn').forEach(btn => {
                const scanKey = currentFolder + '||' + btn.id;
                const isRunning = (scanEvents[scanKey] && scanEvents[scanKey].readyState !== EventSource.CLOSED) || scanQueue.some(q => q.folder === currentFolder && q.id === btn.id);
                
                if (!isRunning && data.files.includes(btn.dataset.filename)) {
                    if (!btn.classList.contains('completed')) {
                        btn.classList.remove('in-progress', 'selected');
                        btn.classList.add('completed');
                        btn.querySelector('.result-icon').style.display = 'inline-block';
                        changed = true;
                    }
                }
            });
            if (changed) {
                filterButtons();
                updateRunBtnState();
            }
        }
    }).catch(() => {});
}, 2000);

let scanQueue = [];
let isQueueRunning = false;

function updateRunBtnState() {
    if(window.updateBulkEditBtn) window.updateBulkEditBtn();
    let isScanning = scanQueue.some(q => q.folder === currentFolder);
    for (let key in scanEvents) {
        if (key.startsWith(currentFolder + '||') && scanEvents[key].readyState !== EventSource.CLOSED) {
            isScanning = true;
            break;
        }
    }
    const hasInProgress = document.querySelectorAll('.scan-btn.in-progress').length > 0;
    if (hasInProgress) isScanning = true;
    const runBtn = document.getElementById('run-btn');
    if (isScanning) {
        runBtn.innerHTML = '🔥';
        runBtn.classList.add('scanning');
        runBtn.title = "SCAN IN PROGRESS...";
    } else {
        runBtn.innerHTML = '🚀';
        runBtn.classList.remove('scanning');
        runBtn.title = "INITIALIZE SCAN";
    }

    document.querySelectorAll('.scan-count').forEach(el => {
        const baseTarget = el.id.replace('scan-count-', '');
        let count = 0;
        for (let key in scanEvents) {
            if (key.startsWith(baseTarget + '||') && scanEvents[key].readyState !== EventSource.CLOSED) count++;
        }
        scanQueue.forEach(q => {
            if (q.folder.split('/')[0] === baseTarget) count++;
        });
        
        if (count > 0) {
            el.innerText = count;
            el.style.display = 'inline-block';
        } else {
            el.style.display = 'none';
        }
    });
    
    if (document.getElementById('graph-container').style.display === 'block') {
        syncGraphProgress();
    }
}

document.getElementById('run-btn').addEventListener('click', async () => {
    if (!currentFolder) {
        showToast("Select a goddamn target folder first!", 'error');
        return;
    }

    const selectedBtns = document.querySelectorAll('.scan-btn.selected');
    if (selectedBtns.length === 0) return;

    const folderToScan = currentFolder;
    const useQueue = (localStorage.getItem('cyber_queue_mode') === 'true');

    if (useQueue) {
        selectedBtns.forEach(btn => {
            scanQueue.push({ id: btn.id, command: btn.dataset.command, filename: btn.dataset.filename, folder: folderToScan });
            btn.classList.remove('selected', 'completed');
            btn.classList.add('in-progress');
        });
        if (!isQueueRunning) processQueue();
    } else {
        selectedBtns.forEach(btn => {
            runScanRequest(btn.id, btn.dataset.command, btn.dataset.filename, null, folderToScan);
        });
    }
    updateRunBtnState();
});

function processQueue() {
    if (scanQueue.length === 0) {
        isQueueRunning = false;
        updateRunBtnState();
        return;
    }
    isQueueRunning = true;
    const task = scanQueue.shift();
    runScanRequest(task.id, task.command, task.filename, () => {
        processQueue();
    }, task.folder);
}

function killScan(cmdId) {
    if (!currentFolder) return;
    const btn = document.getElementById(cmdId);
    if (!btn) return;
    fetch('/kill_scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: currentFolder, filename: btn.dataset.filename })
    }).then(res => res.json()).then(data => {
        if (data.success) {
            showToast('Scan annihilated 🛑', 'success');
        } else {
            showToast('Failed to kill: ' + data.error, 'error');
        }
    });
}

function instantRun(cmdId) {
    if (!currentFolder) {
        showToast("Select a goddamn target folder first!", 'error');
        return;
    }
    const btn = document.getElementById(cmdId);
    if(!btn) return;
    btn.classList.remove('selected');
    runScanRequest(cmdId, btn.dataset.command, btn.dataset.filename, null, currentFolder);
}

function runScanRequest(btnId, command, filename, callback, folderToScan = currentFolder) {
    if (!validateCommand(command)) {
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.remove('in-progress');
        if (callback) callback();
        updateRunBtnState();
        return;
    }
    const scanKey = folderToScan + '||' + btnId;
    const btn = document.getElementById(btnId);
    
    if (folderToScan === currentFolder && btn) {
        btn.classList.remove('completed', 'selected');
        btn.classList.add('in-progress');
        btn.querySelector('.result-icon').style.display = 'none';
    }

    if(scanEvents[scanKey]) scanEvents[scanKey].close();
    const actualTarget = folderToScan.split('/').pop();
    
    const termKey = scanKey;
    if(!terminals[termKey]) {
        terminals[termKey] = new Terminal({ allowTransparency: true, theme: { background: 'transparent', foreground: '#00ff00' }, convertEol: true });
        fitAddons[termKey] = new FitAddon.FitAddon();
        terminals[termKey].loadAddon(fitAddons[termKey]);
    }
    const term = terminals[termKey];
    term.clear();
    term.write(`Executing: ${command.replace('{target}', actualTarget)}\r\n\r\n`);
    
    const es = new EventSource(`/stream_scan?folder=${encodeURIComponent(folderToScan)}&command=${encodeURIComponent(command)}&filename=${encodeURIComponent(filename)}`);
    scanEvents[scanKey] = es;
    
    es.onmessage = function(e) {
        term.write(e.data + '\r\n');
    };
    es.addEventListener('close', function(e) {
        term.write('\r\n[PROCESS FULLY COMPLETED - HELL YEAH]\r\n');
        es.close();
        delete scanEvents[scanKey];
        if (folderToScan === currentFolder && btn) {
            btn.classList.remove('in-progress');
            btn.classList.add('completed');
            btn.querySelector('.result-icon').style.display = 'inline-block';
        }
        updateRunBtnState();
        if(callback) callback();
    });
    updateRunBtnState();
}

function viewResult(filename) {
    viewResultFor(currentFolder, filename);
}

window.loadMoreResultLines = function() {
    if (!window.ansiUpInstance) window.ansiUpInstance = new AnsiUp();
    const chunk = window.currentResultLines.slice(window.currentResultLineIndex, window.currentResultLineIndex + 50);
    const html = window.ansiUpInstance.ansi_to_html(chunk.join('\n') + (chunk.length > 0 && chunk.length === 50 ? '\n' : ''));
    const container = document.getElementById('ansi-terminal-content');
    if (container) {
        container.insertAdjacentHTML('beforeend', html);
        window.currentResultLineIndex += 50;
    }
    const loadMoreBtn = document.getElementById('load-more-results-btn');
    if (loadMoreBtn) {
        if (window.currentResultLineIndex >= window.currentResultLines.length) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'block';
            loadMoreBtn.innerHTML = `⬇️ LOAD MORE (Showing ${window.currentResultLineIndex} / ${window.currentResultLines.length} lines) ⬇️`;
        }
    }
};

window.setupIconDragDrop = function() {
    document.querySelectorAll('.icon-drop-input').forEach(input => {
        if(input.dataset.dragSet) return;
        input.dataset.dragSet = 'true';
        input.addEventListener('dragover', e => { e.preventDefault(); input.style.borderColor = '#fff'; });
        input.addEventListener('dragleave', e => { input.style.borderColor = ''; });
        input.addEventListener('drop', e => {
            e.preventDefault();
            input.style.borderColor = '';
            if(e.dataTransfer.files.length) {
                let file = e.dataTransfer.files[0];
                let formData = new FormData();
                formData.append('file', file);
                formData.append('key', 'drop_' + Date.now());
                fetch('/api/upload_sys_icon', { method: 'POST', body: formData })
                .then(r=>r.json()).then(d => {
                    if (d.success) {
                        input.value = `<img src="${d.path}" width="24">`;
                        saveSettings(false);
                        showToast('Icon dropped and injected into the backend! 💀', 'success');
                    } else {
                        showToast('Upload failed: ' + d.error, 'error');
                    }
                });
            }
        });
    });
};
setTimeout(window.setupIconDragDrop, 1000);

window.bgConfig = {categories: {default: []}, active_category: 'default', auto_change: false, interval: 30};

window.loadBgGallery = function() {
    fetch('/api/bg/config').then(r=>r.json()).then(cfg => {
        window.bgConfig = cfg;
        if(document.getElementById('bg-auto-check')) document.getElementById('bg-auto-check').checked = cfg.auto_change;
        if(document.getElementById('bg-interval-input')) document.getElementById('bg-interval-input').value = cfg.interval;
        const sel1 = document.getElementById('bg-active-cat-select');
        const sel2 = document.getElementById('bg-upload-cat-select');
        if(sel1) sel1.innerHTML = '';
        if(sel2) sel2.innerHTML = '';
        const container = document.getElementById('bg-gallery-container');
        if(container) container.innerHTML = '';
        for (let cat in cfg.categories) {
            if(sel1) {
                let opt = document.createElement('option');
                opt.value = cat; opt.innerText = cat;
                if(cat === cfg.active_category) opt.selected = true;
                sel1.appendChild(opt);
            }
            if(sel2) {
                let opt = document.createElement('option');
                opt.value = cat; opt.innerText = cat;
                sel2.appendChild(opt);
            }
            if(container) {
                const catDiv = document.createElement('div');
                catDiv.style = "border: 1px solid #555; padding: 10px; background: rgba(0,0,0,0.5);";
                catDiv.innerHTML = `<h4 style="margin-top:0; color:#00ffcc;">Category: ${cat} <button onclick="window.deleteBgCategory('${cat}')" style="float:right; background:red; color:white; border:none; cursor:pointer; padding:2px 5px;">Delete Cat</button></h4>`;
                const galDiv = document.createElement('div');
                galDiv.style = "display:flex; flex-wrap:wrap; gap:10px; min-height: 50px;";
                galDiv.id = 'bg-cat-' + cat;
                let divNone = document.createElement('div');
                divNone.style = "width:100px; height:80px; background:#000; display:flex; align-items:center; justify-content:center; color:#fff; border:2px solid transparent; cursor:pointer; font-weight:bold;";
                if (!window.activeBackground) divNone.style.borderColor = '#00ffcc';
                divNone.innerText = 'DEFAULT';
                divNone.onclick = () => { window.activeBackground = ''; window.loadBgGallery(); window.applyBackground(''); };
                if(cat === 'default') galDiv.appendChild(divNone);
                cfg.categories[cat].forEach((f, idx) => {
                    let div = document.createElement('div');
                    div.style = "width:100px; height:80px; position:relative; background:url('/backgrounds/" + encodeURIComponent(f) + "') no-repeat center/cover; border:2px solid transparent; cursor:grab;";
                    div.draggable = true;
                    if (window.activeBackground === f) div.style.borderColor = '#00ffcc';
                    div.onclick = () => { window.activeBackground = f; window.applyBackground(f); saveSettings(); window.loadBgGallery(); };
                    let delBtn = document.createElement('span');
                    delBtn.innerText = '✖';
                    delBtn.style = "position:absolute; top:2px; right:2px; background:rgba(255,0,0,0.8); color:#fff; font-weight:bold; cursor:pointer; padding:2px 5px; border-radius:3px; display:none; font-size:12px; z-index:10;";
                    div.onmouseenter = () => delBtn.style.display = 'block';
                    div.onmouseleave = () => delBtn.style.display = 'none';
                    delBtn.onclick = (e) => { e.stopPropagation(); window.deleteBgImage(cat, f); };
                    div.appendChild(delBtn);
                    div.ondragstart = (e) => { e.dataTransfer.setData('bg-idx', idx); e.dataTransfer.setData('bg-cat', cat); };
                    div.ondragover = (e) => { e.preventDefault(); div.style.opacity = 0.5; };
                    div.ondragleave = (e) => { div.style.opacity = 1; };
                    div.ondrop = (e) => {
                        e.preventDefault();
                        div.style.opacity = 1;
                        let srcIdx = e.dataTransfer.getData('bg-idx');
                        let srcCat = e.dataTransfer.getData('bg-cat');
                        if (srcCat === cat && srcIdx != idx) {
                            let item = window.bgConfig.categories[cat].splice(srcIdx, 1)[0];
                            window.bgConfig.categories[cat].splice(idx, 0, item);
                            window.saveBgConfig();
                        }
                    };
                    galDiv.appendChild(div);
                });
                catDiv.appendChild(galDiv);
                container.appendChild(catDiv);
            }
        }
        window.startBgAutoChanger();
    });
};

window.saveBgConfig = function() {
    let auto = document.getElementById('bg-auto-check')?.checked || false;
    let intv = parseInt(document.getElementById('bg-interval-input')?.value || 30);
    let act = document.getElementById('bg-active-cat-select')?.value || 'default';
    window.bgConfig.auto_change = auto;
    window.bgConfig.interval = intv;
    window.bgConfig.active_category = act;
    fetch('/api/bg/config', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(window.bgConfig)
    }).then(() => window.loadBgGallery());
};

window.addBgCategory = function() {
    let cat = document.getElementById('new-bg-cat-input').value.trim();
    if(cat && !window.bgConfig.categories[cat]) {
        window.bgConfig.categories[cat] = [];
        window.saveBgConfig();
        document.getElementById('new-bg-cat-input').value = '';
    }
};

window.deleteBgCategory = function(cat) {
    if(cat === 'default') { showToast("Can't delete default category", "error"); return; }
    if(confirm(`Delete category ${cat}?`)) {
        delete window.bgConfig.categories[cat];
        if(window.bgConfig.active_category === cat) window.bgConfig.active_category = 'default';
        window.saveBgConfig();
    }
};

window.deleteBgImage = function(cat, filename) {
    if(confirm(`Delete image ${filename}?`)) {
        fetch('/api/bg/delete', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({category: cat, filename: filename})
        }).then(() => window.loadBgGallery());
    }
};

let bgChangeIntervalId = null;
let currentBgIndex = 0;
window.startBgAutoChanger = function() {
    if(bgChangeIntervalId) clearInterval(bgChangeIntervalId);
    if(window.bgConfig.auto_change && window.bgConfig.interval > 0) {
        bgChangeIntervalId = setInterval(() => {
            let cat = window.bgConfig.active_category;
            let images = window.bgConfig.categories[cat];
            if(images && images.length > 0) {
                currentBgIndex = (currentBgIndex + 1) % images.length;
                let nextBg = images[currentBgIndex];
                window.applyBackground(nextBg);
                window.activeBackground = nextBg;
            }
        }, window.bgConfig.interval * 1000);
    }
};

socket.on('bg_update', function(cfg) {
    window.bgConfig = cfg;
    window.startBgAutoChanger();
    if (document.getElementById('settings-backgrounds').style.display === 'block') window.loadBgGallery();
});

window.toggleBgAnimation = function() {
    const active = document.getElementById('bg-animate-check').checked;
    localStorage.setItem('cyber_animate_bg', active);
    if (active) {
        document.body.classList.add('animate-bg');
    } else {
        document.body.classList.remove('animate-bg');
    }
};

window.applyBackground = function(bg) {
    if (bg) {
        document.documentElement.style.setProperty('--bg-image', `url('/backgrounds/${encodeURIComponent(bg)}')`);
    } else {
        document.documentElement.style.removeProperty('--bg-image');
    }
};

window.handleBgUpload = function(file) {
    if (!file) return;
    let cat = document.getElementById('bg-upload-cat-select')?.value || 'default';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', cat);
    fetch('/upload_background', { method: 'POST', body: formData })
    .then(r=>r.json()).then(d => {
        if(d.success) { showToast("Background uploaded!", "success"); window.loadBgGallery(); }
    });
};

window.handleLogoUpload = function(file) {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    fetch('/upload_logo', { method: 'POST', body: formData })
    .then(r=>r.json()).then(d => {
        if(d.success) { showToast("Logo uploaded! Refresh to see changes.", "success"); }
    });
};

['logo-drop-zone', 'bg-drop-zone'].forEach(id => {
    let interval = setInterval(() => {
        const el = document.getElementById(id);
        if(el) {
            clearInterval(interval);
            el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('dragover'); });
            el.addEventListener('dragleave', e => { el.classList.remove('dragover'); });
            el.addEventListener('drop', e => {
                e.preventDefault();
                el.classList.remove('dragover');
                if(e.dataTransfer.files.length) {
                    if(id === 'logo-drop-zone') window.handleLogoUpload(e.dataTransfer.files[0]);
                    else window.handleBgUpload(e.dataTransfer.files[0]);
                }
            });
        }
    }, 500);
});

window.searchResultLines = function() {
    const term = document.getElementById('result-search-box').value.toLowerCase();
    if (!term) {
        window.currentResultLines = window.allResultLines;
    } else {
        window.currentResultLines = window.allResultLines.filter(line => line.toLowerCase().includes(term));
    }
    window.currentResultLineIndex = 0;
    const container = document.getElementById('ansi-terminal-content');
    if (container) container.innerHTML = '';
    window.loadMoreResultLines();
};

function viewResultFor(folder, filename) {
    if (!folder) return;
    window.lastScanFolder = folder;
    window.lastScanFilename = filename;
    
    document.getElementById('gemini-report').style.display = 'none';
    document.getElementById('gemini-toggle-btn').style.display = 'none';
    
    fetch('/get_ai_report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folder, filename: filename })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            document.getElementById('gemini-report').innerHTML = data.content;
            document.getElementById('gemini-toggle-btn').style.display = 'inline-block';
        }
    });

    fetch('/get_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: folder, filename: filename })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            window.lastScanContent = data.content;
            document.getElementById('popup-title').innerText = `RESULT: ${filename}`;
            window.allResultLines = data.content.split('\n');
            window.currentResultLines = window.allResultLines;
            window.currentResultLineIndex = 0;
            const searchBox = document.getElementById('result-search-box');
            if (searchBox) searchBox.value = '';
            document.getElementById('popup-text').innerHTML = `<div class="ansi-terminal" id="ansi-terminal-content" style="background:#000; color:#0f0; min-height:200px;"></div><button id="load-more-results-btn" onclick="loadMoreResultLines()" style="display:none; width:100%; padding:10px; background:#00ffcc; color:#000; border:none; font-weight:bold; cursor:pointer; margin-top:10px; border-radius:5px;">⬇️ LOAD MORE ⬇️</button>`;
            window.loadMoreResultLines();
            document.getElementById('gemini-report').style.display = 'none';
            document.getElementById('popup-modal').style.display = "block";
            document.getElementById('popup-modal').style.zIndex = "3000"; // Ensure it's on top of everything
            bringToolToFront(document.querySelector('#popup-modal .modal-content'));
        } else {
            showToast("Result not found. Make sure the scan actually finished.", 'error');
        }
    });
}

let currentCmdTags = [];
window.globalProtocol = 'https://'; // Default

window.setGlobalProtocol = function(proto) {
    window.globalProtocol = proto;
    const btns = {
        'global-proto-http': proto === 'http://',
        'global-proto-https': proto === 'https://',
        'canvas-proto-http': proto === 'http://',
        'canvas-proto-https': proto === 'https://'
    };

    Object.keys(btns).forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (btns[id]) {
            el.style.background = '#00ffcc';
            el.style.color = '#000';
            el.style.border = 'none';
        } else {
            el.style.background = '#111';
            el.style.color = '#00ffcc';
            el.style.border = '1px solid #00ffcc';
        }
    });
    renderButtons();
    window.syncToTxtFinder();
};

function renderCmdTags() {
    const container = document.getElementById('tags-container');
    container.innerHTML = '';
    currentCmdTags.forEach((tag, index) => {
        const el = document.createElement('div');
        el.className = 'tag-item';
        el.innerHTML = `${tag} <span class="remove" onclick="removeCmdTag(${index})">&times;</span>`;
        container.appendChild(el);
    });
}

function handleTagInput(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        const val = e.target.value.trim();
        if (val && !currentCmdTags.includes(val)) {
            currentCmdTags.push(val);
            renderCmdTags();
        }
        e.target.value = '';
    }
}

function removeCmdTag(index) {
    currentCmdTags.splice(index, 1);
    renderCmdTags();
}

function filterCmdMacros() {
    const filter = document.getElementById('macro-search').value.toLowerCase();
    document.querySelectorAll('.macro-btn').forEach(btn => {
        const mac = btn.getAttribute('data-mac').toLowerCase();
        btn.style.display = mac.includes(filter) ? 'inline-block' : 'none';
    });
}

function switchMainTab(tab) {
    const tabs = ['bugbounty', 'wifi', 'person'];
    const sidebarTitle = document.getElementById('sidebar-warfare-title');
    const newTargetBtn = document.getElementById('new-folder-btn');
    const wifiBtn = document.getElementById('new-wifi-sidebar-btn');
    const personBtn = document.getElementById('new-person-sidebar-btn');

    document.getElementById('main-tab-btn-bugbounty').classList.remove('active');
    document.getElementById('main-tab-btn-wifi').classList.remove('active');
    document.getElementById('main-tab-btn-person').classList.remove('active');

    if (tab === 'wifi') {
        if(sidebarTitle) sidebarTitle.innerText = 'WIFI WARFARE';
        if(newTargetBtn) newTargetBtn.style.display = 'none';
        if(wifiBtn) wifiBtn.style.display = 'block';
        if(personBtn) personBtn.style.display = 'none';
        document.getElementById('main-tab-btn-wifi').classList.add('active');
    } else if (tab === 'person') {
        if(sidebarTitle) sidebarTitle.innerText = 'PERSON HUNTER';
        if(newTargetBtn) newTargetBtn.style.display = 'none';
        if(wifiBtn) wifiBtn.style.display = 'none';
        if(personBtn) personBtn.style.display = 'block';
        document.getElementById('main-tab-btn-person').classList.add('active');
    } else {
        if(sidebarTitle) sidebarTitle.innerText = 'BUG BOUNTY';
        if(newTargetBtn) newTargetBtn.style.display = 'block';
        if(wifiBtn) wifiBtn.style.display = 'none';
        if(personBtn) personBtn.style.display = 'none';
        document.getElementById('main-tab-btn-bugbounty').classList.add('active');
    }

    localStorage.setItem('cyber_active_main_tab', tab);
    window.currentActiveMode = tab;
    window.syncToTxtFinder();
    
    document.querySelectorAll('.target-container').forEach(container => {
        let type = container.dataset.targetType || 'bugbounty';
        if (type === tab) {
            container.style.display = 'block';
        } else {
            container.style.display = 'none';
        }
    });

    renderButtons();
}

function openAddCommandModal() {
    document.getElementById('cmd-id').value = '';
    document.getElementById('cmd-type').value = window.currentActiveMode || 'bugbounty';
    document.getElementById('cmd-name').value = '';
    document.getElementById('cmd-icon').value = '';
    document.getElementById('cmd-category').value = '';
    document.getElementById('cmd-order-num').value = '';
    currentCmdTags = [];
    renderCmdTags();
    document.getElementById('cmd-command').value = '';
    document.getElementById('cmd-filename').value = '';
    document.getElementById('cmd-high-ram').checked = false;
    document.getElementById('cmd-os-windows').checked = false;
    document.getElementById('cmd-os-linux').checked = false;
    window.showAndBringToFront('add-command-modal');
}

function editCommand(cmdId) {
    const cmd = commandsData.find(c => c.id === cmdId);
    if (!cmd) return;
    document.getElementById('cmd-id').value = cmd.id;
    document.getElementById('cmd-name').value = cmd.name;
    document.getElementById('cmd-icon').value = cmd.icon || '';
    document.getElementById('cmd-category').value = cmd.category;
    document.getElementById('cmd-order-num').value = cmd.order_num || '';
    currentCmdTags = cmd.tags ? cmd.tags.split(',').map(t => t.trim()).filter(t => t) : [];
    renderCmdTags();
    document.getElementById('cmd-command').value = cmd.command;
    document.getElementById('cmd-filename').value = cmd.filename;
    document.getElementById('cmd-high-ram').checked = !!cmd.high_ram;
    document.getElementById('cmd-os-windows').checked = !!cmd.os_windows;
    document.getElementById('cmd-os-linux').checked = !!cmd.os_linux;
    window.showAndBringToFront('add-command-modal');
}

function deleteCommand(cmdId) {
    if (confirm("Are you sure you want to delete this goddamn button? There is no going back.")) {
        fetch('/delete_command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: cmdId })
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                loadCommands();
            } else {
                showToast("Failed to delete the shit: " + data.error, 'error');
            }
        });
    }
}

function closeModal(id) { 
    const el = document.getElementById(id);
    el.style.display = 'none'; 
    const modalContent = el.querySelector('.modal-content');
    if (modalContent && modalContent.classList.contains('fullscreen-mode')) {
        modalContent.classList.remove('fullscreen-mode');
        const maxBtn = modalContent.querySelector('.sys-win-controls span:last-child');
        if (maxBtn && maxBtn.innerText === '❐') maxBtn.innerText = '□';
    }
    document.body.style.overflow = document.querySelectorAll('.fullscreen-mode').length > 0 ? 'hidden' : '';
}

function saveCommand() {
    const id = document.getElementById('cmd-id').value;
    const name = document.getElementById('cmd-name').value;
    const cat = document.getElementById('cmd-category').value;
    const tags = currentCmdTags.join(', ');
    const cmd = document.getElementById('cmd-command').value;
    let file = document.getElementById('cmd-filename').value;
    const highRam = document.getElementById('cmd-high-ram').checked;
    const osWindows = document.getElementById('cmd-os-windows').checked;
    const osLinux = document.getElementById('cmd-os-linux').checked;
    const orderNum = document.getElementById('cmd-order-num').value;
    const type = document.getElementById('cmd-type').value;
    const icon = document.getElementById('cmd-icon').value;
    
    if(!name || !cmd || !file) { showToast("Fill all the damn fields!", 'error'); return; }
    
    file = file.trim().replace(/\s+/g, '_');
    if (!file.includes('.')) file += '.txt';
    
    fetch('/add_command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: id, name: name, icon: icon, category: cat, tags: tags, command: cmd, filename: file, high_ram: highRam, order_num: orderNum, type: type, os_windows: osWindows, os_linux: osLinux })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            closeModal('add-command-modal');
            loadCommands();
        }
    });
}

function runTerminal(cmdId) {
    if (!currentFolder) return;
    const termKey = currentFolder + '||' + cmdId;
    window.showAndBringToFront('terminal-modal');
    const container = document.getElementById('terminal-container');
    container.innerHTML = '';
    activeTerminalCmdId = termKey;
    
    if(!terminals[termKey]) {
        terminals[termKey] = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ff00' }, convertEol: true });
        fitAddons[termKey] = new FitAddon.FitAddon();
        terminals[termKey].loadAddon(fitAddons[termKey]);
        terminals[termKey].write("Waiting for that bitch-ass scan to start...\r\n");
    }
    
    terminals[termKey].open(container);
    
    setTimeout(() => {
        if(fitAddons[termKey]) fitAddons[termKey].fit();
    }, 50);
}

function stopTerminal() {
    activeTerminalCmdId = null;
}

let toolWindowZIndex = 2000;
function getNextToolZIndex() {
    return ++toolWindowZIndex;
}

function bringToolToFront(win) {
    const nextZ = getNextToolZIndex();
    win.style.zIndex = nextZ;
    if (win.parentElement && win.parentElement.classList.contains('modal')) {
        win.parentElement.style.zIndex = nextZ;
    }
}

window.showAndBringToFront = function(id) {
    const modal = document.getElementById(id);
    if(modal) {
        modal.style.display = 'block';
        const mc = modal.querySelector('.modal-content');
        if (mc) bringToolToFront(mc);
    }
};

function toggleToolTerminal(toolName) {
    const multiInstances = localStorage.getItem('cyber_multi_tool_instances') === 'true';
    const baseTermId = 'tool__' + toolName;
    
    if (!multiInstances) {
        let existingWin = null;
        for (let tId in toolTerminals) {
            if (tId.startsWith(baseTermId) && toolTerminals[tId] && toolTerminals[tId].win) {
                existingWin = toolTerminals[tId].win;
                break;
            }
        }
        
        if (existingWin) {
            if (existingWin.style.display === 'none') {
                existingWin.style.display = 'flex';
                bringToolToFront(existingWin);
                const termIdStr = existingWin.id.replace('_window', '');
                if (toolTerminals[termIdStr] && toolTerminals[termIdStr].fitAddon) {
                    setTimeout(() => toolTerminals[termIdStr].fitAddon.fit(), 50);
                }
            } else {
                existingWin.style.display = 'none';
            }
            return;
        }
    }

    const termId = baseTermId + '_' + Date.now();
    let displayName = toolName.toUpperCase();
    if (toolName.startsWith('custom_')) {
        let idx = parseInt(toolName.split('_')[1]);
        if (window.customToolsConfig && window.customToolsConfig[idx]) {
            displayName = window.customToolsConfig[idx].name.toUpperCase();
        }
    } else if (toolName.startsWith('ping_')) {
        displayName = 'PING ' + toolName.split('ping_')[1];
    } else if (toolName.startsWith('nmap_')) {
        displayName = 'NMAP ' + toolName.split('nmap_')[1];
    }

    const win = document.createElement('div');
    win.id = termId + '_window';
    win.className = 'modal-content terminal-content';
    win.style.position = 'absolute';
    win.style.transform = 'none';
    
    let offset = (Object.keys(toolTerminals).length * 30) % 200;
    win.style.left = (250 + offset) + 'px';
    win.style.top = (100 + offset) + 'px';
    win.style.width = '70%';
    win.style.height = '70%';
    win.style.margin = '0';
    win.style.display = 'flex';
    win.style.flexDirection = 'column';
    win.style.boxShadow = '0 0 30px #ff00ff';
    win.style.borderColor = '#ff00ff';
    win.style.backgroundColor = 'rgba(5, 0, 15, 0.55)';
    win.style.zIndex = getNextToolZIndex();
    win.style.pointerEvents = 'auto';
    win.style.padding = '0';
    win.addEventListener('mousedown', () => bringToolToFront(win));

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '10px 15px';
    header.style.cursor = 'move';
    header.style.backgroundColor = 'rgba(255, 0, 255, 0.1)';
    header.style.borderBottom = '1px solid #ff00ff';
    header.style.flexWrap = 'nowrap';
    header.style.gap = '10px';
    header.style.boxSizing = 'border-box';

    const title = document.createElement('h2');
    title.style.color = '#ff00ff';
    title.style.margin = '0';
    title.style.fontSize = '1.2em';
    title.style.flex = '1';
    title.style.overflow = 'hidden';
    title.style.textOverflow = 'ellipsis';
    title.style.whiteSpace = 'nowrap';
    title.innerText = displayName + ' TERMINAL';

    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.alignItems = 'center';
    btnContainer.style.gap = '10px';
    btnContainer.style.flexShrink = '0';

    const stopBtn = document.createElement('button');
    stopBtn.innerText = '🛑 STOP (Ctrl+C)';
    stopBtn.style.padding = '5px 10px';
    stopBtn.style.background = '#ff0000';
    stopBtn.style.color = '#fff';
    stopBtn.style.border = 'none';
    stopBtn.style.fontWeight = 'bold';
    stopBtn.style.cursor = 'pointer';
    stopBtn.style.borderRadius = '3px';
    stopBtn.onclick = function(e) {
        e.stopPropagation();
        socket.emit('pty_input', { input: String.fromCharCode(3), term_id: termId, client_id: clientId });
    };

    const blurBtn = document.createElement('span');
    blurBtn.innerText = '👁️';
    blurBtn.style.cssText = 'cursor:pointer; font-size:18px; color:#ffaa00; line-height:1; display:inline-flex; align-items:center; justify-content:center; padding:2px 4px; border-radius:3px; transition:text-shadow 0.2s; user-select:none; flex-shrink:0;';
    blurBtn.title = 'Toggle Blur';
    blurBtn.onmouseover = () => blurBtn.style.textShadow = `0 0 8px #ffaa00`;
    blurBtn.onmouseout = () => blurBtn.style.textShadow = 'none';
    blurBtn.onclick = function(e) {
        e.stopPropagation();
        pane.classList.toggle('privacy-blur');
    };

    const minBtn = document.createElement('span');
    minBtn.innerText = '−';
    minBtn.style.cssText = 'cursor:pointer; font-size:18px; color:#00ffcc; line-height:1; display:inline-flex; align-items:center; justify-content:center; padding:2px 4px; border-radius:3px; transition:text-shadow 0.2s; user-select:none; flex-shrink:0;';
    minBtn.title = 'Minimize';
    minBtn.onmouseover = () => minBtn.style.textShadow = `0 0 8px #00ffcc`;
    minBtn.onmouseout = () => minBtn.style.textShadow = 'none';
    minBtn.onclick = function(e) {
        e.stopPropagation();
        if (pane.style.display === 'none') {
            pane.style.display = 'block';
            win.style.height = win.dataset.oldHeight || '70%';
            win.style.resize = 'both';
            if (toolTerminals[termId] && toolTerminals[termId].fitAddon) {
                setTimeout(() => toolTerminals[termId].fitAddon.fit(), 50);
            }
        } else {
            win.dataset.oldHeight = win.style.height;
            pane.style.display = 'none';
            win.style.height = 'auto';
            win.style.resize = 'none';
        }
    };

    const maxBtn = document.createElement('span');
    maxBtn.innerText = '□';
    maxBtn.style.cssText = 'cursor:pointer; font-size:18px; color:#00ffcc; line-height:1; display:inline-flex; align-items:center; justify-content:center; padding:2px 4px; border-radius:3px; transition:text-shadow 0.2s; user-select:none; flex-shrink:0;';
    maxBtn.title = 'Maximize';
    maxBtn.onmouseover = () => maxBtn.style.textShadow = `0 0 8px #00ffcc`;
    maxBtn.onmouseout = () => maxBtn.style.textShadow = 'none';
    maxBtn.onclick = function(e) {
        e.stopPropagation();
        if (!win.classList.contains('fullscreen-mode')) {
            win.classList.add('fullscreen-mode');
            maxBtn.innerHTML = '❐';
        } else {
            win.classList.remove('fullscreen-mode');
            maxBtn.innerHTML = '□';
        }
        document.body.style.overflow = document.querySelectorAll('.fullscreen-mode').length > 0 ? 'hidden' : '';
        if (toolTerminals[termId] && toolTerminals[termId].fitAddon) {
            setTimeout(() => toolTerminals[termId].fitAddon.fit(), 50);
        }
    };

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close';
    closeBtn.style.position = 'static';
    closeBtn.style.color = '#ff00ff';
    closeBtn.style.margin = '0';
    closeBtn.style.flexShrink = '0';
    closeBtn.style.lineHeight = '1';
    closeBtn.style.fontSize = '28px';
    closeBtn.onclick = function(e) {
        e.stopPropagation();
        socket.emit('kill_terminal', { client_id: clientId, term_id: termId });
        if (toolTerminals[termId]) {
            delete toolTerminals[termId];
        }
        win.remove();
        document.body.style.overflow = document.querySelectorAll('.fullscreen-mode').length > 0 ? 'hidden' : '';
    };

    const winControls = document.createElement('div');
    winControls.className = 'sys-win-controls';
    winControls.style.cssText = 'display:inline-flex; align-items:center; gap:12px; margin-right:8px; line-height:1; vertical-align:middle; flex-wrap:nowrap; flex-shrink:0;';
    winControls.appendChild(blurBtn);
    winControls.appendChild(minBtn);
    winControls.appendChild(maxBtn);

    btnContainer.appendChild(stopBtn);
    btnContainer.appendChild(winControls);
    btnContainer.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(btnContainer);

    const pane = document.createElement('div');
    pane.style.flex = '1';
    pane.style.width = '100%';
    pane.style.textAlign = 'left';
    pane.style.background = 'url("/static/logo.svg") center center / 35% no-repeat';
    pane.style.backgroundColor = 'rgba(0, 0, 0, 0)';
    pane.style.position = 'relative';
    pane.style.overflow = 'hidden';
    pane.style.padding = '10px';
    pane.style.boxSizing = 'border-box';

    win.appendChild(header);
    win.appendChild(pane);

    document.body.appendChild(win);

    makeToolDraggable(win, header);

    const term = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#ff00ff' }, convertEol: true });
    const fitAddon = new FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    term.onResize(({ cols, rows }) => {
        socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: termId, client_id: clientId });
    });
    term.open(pane);

    term.onData(data => {
        socket.emit('pty_input', { input: data, term_id: termId, client_id: clientId });
    });

    toolTerminals[termId] = { term, fitAddon, pane, win };

    let cmdToRun = '';
    if (toolName.startsWith('custom_')) {
        let idx = parseInt(toolName.split('_')[1]);
        if (window.customToolsConfig && window.customToolsConfig[idx]) {
            cmdToRun = window.customToolsConfig[idx].cmd;
        }
    }
    else if (toolName === 'sherlock') cmdToRun = 'sherlock --help';
    else if (toolName === 'blockchain') cmdToRun = 'echo "Blockchain tool activated"';
    else if (toolName === 'msfconsole') cmdToRun = 'msfconsole';
    else if (toolName.startsWith('ping_')) cmdToRun = navigator.userAgent.indexOf('Win') !== -1 ? 'ping ' + toolName.substring(5) + ' -t' : 'ping ' + toolName.substring(5);
    else if (toolName.startsWith('nmap_')) cmdToRun = 'nmap --system-dns -sV -O ' + toolName.substring(5);
    else if (toolName === 'kali') cmdToRun = 'cids=$(docker ps -a -q --filter ancestor=kalilinux/kali-rolling); count=$(echo "$cids" | grep -c . || true); if [ "$count" -eq 0 ]; then echo ">>> No Kali containers found. Spawning a new one..."; docker run --tty --interactive kalilinux/kali-rolling /bin/bash; else echo ">>> Found Kali containers:"; docker ps -a --filter ancestor=kalilinux/kali-rolling --format "table {{.ID}}\\t{{.Names}}\\t{{.Status}}"; read -p "Enter Container ID to start/attach (or leave empty for new): " choice; if [ -z "$choice" ]; then docker run --tty --interactive kalilinux/kali-rolling /bin/bash; else if [ "$(docker inspect -f \"{{.State.Running}}\" $choice 2>/dev/null)" = "true" ]; then docker exec -it $choice /bin/bash; else docker start -i $choice; fi; fi; fi';

    socket.emit('start_terminal', {
        folder: currentFolder || 'multi_terminals',
        filename: termId + '.log',
        term_id: termId,
        client_id: clientId,
        command: cmdToRun,
        auto_run: true,
        shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
    });

    setTimeout(() => {
        fitAddon.fit();
        term.focus();
    }, 50);
}

function makeToolDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    const resizer = document.createElement('div');
    resizer.style.width = '15px';
    resizer.style.height = '15px';
    resizer.style.background = '#ff00ff';
    resizer.style.position = 'absolute';
    resizer.style.right = '0';
    resizer.style.bottom = '0';
    resizer.style.cursor = 'se-resize';
    resizer.style.zIndex = '10';
    element.appendChild(resizer);
    
    resizer.onmousedown = initResize;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if(e.target === resizer || e.target.tagName === 'BUTTON' || e.target.classList.contains('close')) return;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToolToFront(element);
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
    
    function initResize(e) {
        e.preventDefault();
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResize);
        bringToolToFront(element);
    }
    
    function resize(e) {
        element.style.width = (e.clientX - element.getBoundingClientRect().left) + 'px';
        element.style.height = (e.clientY - element.getBoundingClientRect().top) + 'px';
        
        const termId = element.id.replace('_window', '');
        if (toolTerminals[termId] && toolTerminals[termId].fitAddon) {
            toolTerminals[termId].fitAddon.fit();
        }
    }
    
    function stopResize() {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
        const termId = element.id.replace('_window', '');
        if (toolTerminals[termId] && toolTerminals[termId].fitAddon) {
            toolTerminals[termId].fitAddon.fit();
        }
    }
}

function closeToolTerminal() {
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
        if(event.target.id === 'terminal-modal') stopTerminal();
    }
}

let graphNetwork = null;
let graphExpanded = false;
let obsidianMode = false;
let hierarchicalMode = false;
let spaceMode = false;
let netmapMode = false;
let graphNodes = null;
let graphEdges = null;
let threeState = { scene: null, camera: null, renderer: null, controls: null, nodes: {}, links: [], animationId: null, ctxListenerAdded: false };

document.addEventListener('click', function(e) {
    const ctxMenu = document.getElementById('graph-context-menu');
    if (ctxMenu && e.target.closest('#graph-context-menu') === null) {
        ctxMenu.style.display = 'none';
    }
});

function showGraphContextMenu(x, y, node) {
    const ctxMenu = document.getElementById('graph-context-menu');
    ctxMenu.style.left = x + 'px';
    ctxMenu.style.top = y + 'px';
    ctxMenu.style.display = 'block';
    
    document.getElementById('ctx-instant-run').onclick = () => { currentFolder = node.scan_target; instantRun(node.cmd_id); ctxMenu.style.display='none'; };
    document.getElementById('ctx-live-term').onclick = () => { currentFolder = node.scan_target; runTerminal(node.cmd_id); ctxMenu.style.display='none'; };
    document.getElementById('ctx-interactive').onclick = () => { currentFolder = node.scan_target; openInteractiveTerminal(node.cmd_id); ctxMenu.style.display='none'; };
    document.getElementById('ctx-result').onclick = () => { viewResultFor(node.scan_target, node.scan_filename); ctxMenu.style.display='none'; };
}

let d3NetmapState = { simulation: null };

function toggleNetmapMode() {
    netmapMode = !netmapMode;
    const btn = document.getElementById('btn-graph-netmap');
    if (btn) btn.classList.toggle('active-state', netmapMode);
    
    if (netmapMode) {
        document.getElementById('graph-view').style.display = 'none';
        document.getElementById('graph-3d-view').style.display = 'none';
        document.getElementById('d3-netmap-container').style.display = 'block';
        initGraph();
        showToast("D3 Netmap Mode Activated 🕸️", "success");
    } else {
        document.getElementById('graph-view').style.display = 'block';
        document.getElementById('graph-3d-view').style.display = 'none';
        document.getElementById('d3-netmap-container').style.display = 'none';
        if (d3NetmapState.simulation) d3NetmapState.simulation.stop();
        initGraph();
        showToast("Default Graph Restored", "success");
    }
}

function toggleSpaceMode() {
    spaceMode = !spaceMode;
    const btn = document.getElementById('btn-graph-space');
    if (btn) btn.classList.toggle('active-state', spaceMode);
    
    if (spaceMode) {
        document.getElementById('graph-view').style.display = 'none';
        document.getElementById('graph-3d-view').style.display = 'block';
        document.getElementById('d3-netmap-container').style.display = 'none';
        if (d3NetmapState.simulation) d3NetmapState.simulation.stop();
        initThreeJSGraph();
        showToast("3D Space Mode Activated 🪐", "success");
    } else {
        document.getElementById('graph-view').style.display = 'block';
        document.getElementById('graph-3d-view').style.display = 'none';
        if (netmapMode) {
            document.getElementById('d3-netmap-container').style.display = 'block';
        }
        if (threeState.animationId) cancelAnimationFrame(threeState.animationId);
        showToast("2D Graph Restored 🕸️", "success");
    }
}

function initThreeJSGraph() {
    const container = document.getElementById('graph-3d-view');
    if (!threeState.scene) {
        threeState.scene = new THREE.Scene();
        threeState.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 5000);
        threeState.camera.position.z = 800;
        
        threeState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        threeState.renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = '';
        container.appendChild(threeState.renderer.domElement);

        threeState.controls = new THREE.OrbitControls(threeState.camera, threeState.renderer.domElement);
        threeState.controls.enableDamping = true;

        if (!threeState.ctxListenerAdded) {
            threeState.renderer.domElement.addEventListener('contextmenu', function(e) {
                e.preventDefault();
                const rect = threeState.renderer.domElement.getBoundingClientRect();
                const mouse = new THREE.Vector2();
                mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
                const raycaster = new THREE.Raycaster();
                raycaster.setFromCamera(mouse, threeState.camera);
                const intersects = raycaster.intersectObjects(Object.values(threeState.nodes));
                if (intersects.length > 0) {
                    const node = intersects[0].object.userData;
                    if (node && node.group === 'scan') {
                        showGraphContextMenu(e.clientX - rect.left, e.clientY - rect.top, node);
                    }
                }
            });
            threeState.ctxListenerAdded = true;
        }

        threeState.scene.background = new THREE.Color(0x020205);
        threeState.scene.add(new THREE.AmbientLight(0x404040, 1.5));
        const pointLight = new THREE.PointLight(0xffffff, 1, 10000);
        pointLight.position.set(50, 50, 50);
        threeState.scene.add(pointLight);

        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({color: 0xffffff, size: 2, transparent: true, opacity: 0.8, sizeAttenuation: true});
        const starsVertices = [];
        for(let i=0; i<10000; i++) {
            starsVertices.push((Math.random() - 0.5) * 6000);
            starsVertices.push((Math.random() - 0.5) * 6000);
            starsVertices.push((Math.random() - 0.5) * 6000);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        threeState.scene.add(starField);
    }

    Object.values(threeState.nodes).forEach(obj => threeState.scene.remove(obj));
    threeState.links.forEach(obj => threeState.scene.remove(obj.line));
    threeState.nodes = {};
    threeState.links = [];

    if (!graphNodes || !graphEdges) return;

    graphNodes.get().forEach(node => {
        const isRoot = node.group === 'root';
        const isScan = node.group === 'scan';
        const geometry = new THREE.SphereGeometry(isRoot ? 20 : (isScan ? 5 : 10), 16, 16);
        
        let color = 0x00ffcc;
        if (isRoot) color = 0xff0055;
        else if (node.group === 'target') color = 0xff8800;
        else if (node.group === 'subdomain') color = 0x00ccff;
        else if (node.group === 'category') color = 0xaa00ff;
        else if (isScan) color = 0x00ff00;

        const material = new THREE.MeshPhongMaterial({ color: color, emissive: color, emissiveIntensity: 0.4 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set((Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500, (Math.random() - 0.5) * 500);
        sphere.userData = node;
        threeState.nodes[node.id] = sphere;
        threeState.scene.add(sphere);
    });

    graphEdges.get().forEach(edge => {
        const source = threeState.nodes[edge.from];
        const target = threeState.nodes[edge.to];
        if (!source || !target) return;
        const material = new THREE.LineBasicMaterial({ color: 0xff00ff, transparent: true, opacity: 0.5 });
        const geometry = new THREE.BufferGeometry().setFromPoints([source.position, target.position]);
        const line = new THREE.Line(geometry, material);
        threeState.links.push({ line, source, target });
        threeState.scene.add(line);
    });

    if (threeState.animationId) cancelAnimationFrame(threeState.animationId);
    animate3DGraph();
}

function animate3DGraph() {
    threeState.animationId = requestAnimationFrame(animate3DGraph);
    
    const repulsionStrength = 3000;
    const attractionStrength = 0.02;
    const nodeMeshes = Object.values(threeState.nodes);

    nodeMeshes.forEach(n1 => {
        n1.velocity = n1.velocity || new THREE.Vector3();
        nodeMeshes.forEach(n2 => {
            if (n1 === n2) return;
            const distVec = new THREE.Vector3().subVectors(n1.position, n2.position);
            const dist = distVec.length() + 0.1;
            n1.velocity.add(distVec.normalize().multiplyScalar(repulsionStrength / (dist * dist)));
        });
    });

    threeState.links.forEach(link => {
        const distVec = new THREE.Vector3().subVectors(link.target.position, link.source.position);
        const force = distVec.multiplyScalar(attractionStrength);
        link.source.velocity.add(force);
        link.target.velocity.sub(force);
    });

    nodeMeshes.forEach(node => {
        node.position.add(node.velocity.multiplyScalar(0.01));
        node.velocity.multiplyScalar(0.90);
    });
    
    threeState.links.forEach(linkObj => {
        const positions = linkObj.line.geometry.attributes.position.array;
        positions[0] = linkObj.source.position.x; positions[1] = linkObj.source.position.y; positions[2] = linkObj.source.position.z;
        positions[3] = linkObj.target.position.x; positions[4] = linkObj.target.position.y; positions[5] = linkObj.target.position.z;
        linkObj.line.geometry.attributes.position.needsUpdate = true;
    });

    threeState.controls.update();
    threeState.renderer.render(threeState.scene, threeState.camera);
}

function toggleObsidianMode() {
    obsidianMode = !obsidianMode;
    const btn = document.getElementById('btn-graph-obsidian');
    if (btn) btn.classList.toggle('active-state', obsidianMode);
    initGraph();
    showToast(obsidianMode ? "Obsidian Mode Activated 🌌" : "Default Graph Restored 🕸️", "success");
}

function toggleGraphExpansion() {
    graphExpanded = !graphExpanded;
    const btn = document.getElementById('btn-graph-expand');
    if (btn) btn.classList.toggle('active-state', graphExpanded);
    initGraph();
}

function toggleHierarchicalMode() {
    hierarchicalMode = !hierarchicalMode;
    const btn = document.getElementById('btn-graph-hierarchical');
    if (btn) btn.classList.toggle('active-state', hierarchicalMode);
    initGraph();
    showToast(hierarchicalMode ? "Tree View Activated 🌳" : "Physics Layout Restored 🕸️", "success");
}

function toggleGraphView() {
    const graphContainer = document.getElementById('graph-container');
    const runBtn = document.getElementById('run-btn');
    const flagContainer = document.getElementById('flag-container');
    if (graphContainer.style.display === 'none' || graphContainer.style.display === '') {
        graphContainer.style.display = 'block';
        if (runBtn) runBtn.style.display = 'none';
        if (flagContainer) flagContainer.style.display = 'none';
        initGraph();
        if (currentFolder) {
            setTimeout(() => {
                if (graphNetwork) graphNetwork.focus(currentFolder, { scale: 1.0, animation: true });
            }, 500);
        }
    } else {
        graphContainer.style.display = 'none';
        if (runBtn) runBtn.style.display = 'block';
        if (flagContainer) flagContainer.style.display = 'flex';
    }
}

function initGraph() {
    fetch(`/get_graph_data?expanded=${graphExpanded}`).then(res => res.json()).then(data => {
        const container = document.getElementById('graph-view');
        
        if (obsidianMode) {
            data.nodes.forEach(n => {
                n.title = n.label; // Set hover tooltip
                n.label = undefined;
                n.shape = 'dot';
                n.image = undefined;
                if (n.group === 'root') n.size = 15;
                else if (n.group === 'target') n.size = 12;
                else if (n.group === 'category') n.size = 8;
                else n.size = 5;
            });
        }

        graphNodes = new vis.DataSet(data.nodes);
        graphEdges = new vis.DataSet(data.edges);
        
        let options = {};
        if (netmapMode) {
            if (graphNetwork) { graphNetwork.destroy(); graphNetwork = null; }
            initD3Netmap(data.nodes, data.edges);
            syncGraphProgress();
            return;
        } else if (obsidianMode) {
            options = {
                nodes: { borderWidth: 0, shadow: false },
                edges: { width: 0.5, color: { color: '#555', highlight: '#00ffcc' }, smooth: false },
                groups: {
                    root: { color: { background: '#ff0055' } },
                    target: { color: { background: '#ff8800' } },
                    subdomain: { color: { background: '#00ccff' } },
                    category: { color: { background: '#aa00ff' } },
                    scan: { color: { background: '#00ff00' } }
                },
                physics: hierarchicalMode ? false : { barnesHut: { gravitationalConstant: -2000, centralGravity: 0.3, springLength: 50, springConstant: 0.04 } }
            };
        } else {
            options = {
                nodes: { shape: 'dot', size: 20, font: { color: '#00ffcc', face: 'Courier New' }, borderWidth: 2, shadow: true },
                edges: { width: 2, color: { color: '#ff00ff', highlight: '#00ffcc' }, smooth: { type: 'continuous' } },
                groups: {
                    root: { color: { background: '#000', border: '#fff' }, size: 30 },
                    target: { color: { background: '#111', border: '#ff00ff' } },
                    subdomain: { color: { background: '#222', border: '#00ffcc' }, size: 15 },
                    category: { color: { background: '#331133', border: '#ffaa00' }, shape: 'diamond', size: 20 },
                    scan: { color: { background: '#113311', border: '#00ff00' }, shape: 'box', font: { size: 12 } }
                },
                physics: hierarchicalMode ? false : { barnesHut: { gravitationalConstant: -3000, centralGravity: 0.3 } }
            };
        }
        
        if (hierarchicalMode) {
            options.layout = {
                hierarchical: {
                    direction: 'UD',
                    sortMethod: 'directed',
                    nodeSpacing: 150,
                    levelSeparation: 200
                }
            };
        }

        if (graphNetwork) {
            graphNetwork.destroy();
        }
        graphNetwork = new vis.Network(container, { nodes: graphNodes, edges: graphEdges }, options);
        
        syncGraphProgress();
        
        if (spaceMode) {
            initThreeJSGraph();
        }

        graphNetwork.on("oncontext", function (params) {
            params.event.preventDefault();
            const nodeId = graphNetwork.getNodeAt(params.pointer.DOM);
            if (nodeId) {
                const node = graphNodes.get(nodeId);
                if (node && node.group === 'scan') {
                    const rect = document.getElementById('graph-container').getBoundingClientRect();
                    showGraphContextMenu(params.event.clientX - rect.left, params.event.clientY - rect.top, node);
                }
            }
        });

        graphNetwork.on("click", function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const node = graphNodes.get(nodeId);
                
                if (node && node.group === 'scan') {
                    viewResultFor(node.scan_target, node.scan_filename);
                } else if (nodeId !== 'root' && (!node || node.group !== 'category')) {
                    selectFolder(nodeId, null);
                    document.getElementById('graph-container').style.display = 'none';
                    const runBtn = document.getElementById('run-btn');
                    if (runBtn) runBtn.style.display = 'block';
                    const flagContainer = document.getElementById('flag-container');
                    if (flagContainer) flagContainer.style.display = 'flex';
                }
            }
        });
    });
}

function initD3Netmap(nodesData, edgesData) {
    const container = d3.select("#d3-netmap-container");
    const mapLayer = d3.select("#d3-map-layer");
    const svg = d3.select("#d3-connections");
    const nodesContainer = d3.select("#d3-nodes-container");
    if (d3NetmapState.simulation) d3NetmapState.simulation.stop();
    svg.selectAll("*").remove();
    nodesContainer.selectAll("*").remove();

    const d3Nodes = nodesData.map(n => ({...n, d3Id: n.id}));
    const d3Links = edgesData.map(e => ({source: e.from, target: e.to, id: e.from + "-" + e.to}));

    d3NetmapState.simulation = d3.forceSimulation(d3Nodes)
        .force("charge", d3.forceManyBody().strength(-300))
        .force("link", d3.forceLink(d3Links).id(d => d.d3Id).distance(d => d.group === 'scan' ? 60 : 150))
        .force("center", d3.forceCenter(container.node().clientWidth / 2, container.node().clientHeight / 2))
        .force("collide", d3.forceCollide().radius(d => d.group === 'scan' ? 17 : 25))
        .on("tick", tickedD3);

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
        mapLayer.style("transform", `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`);
    });
    container.call(zoom).on("dblclick.zoom", null);

    const lineSelection = svg.selectAll("line").data(d3Links, d => d.id)
        .enter().append("line")
        .style("stroke-width", 1.5)
        .style("opacity", 0.5)
        .style("stroke", "#00ffcc");

    const nodeSelection = nodesContainer.selectAll(".d3-node").data(d3Nodes, d => d.d3Id)
        .enter().append("div")
        .attr("class", d => `d3-node d3-node-${d.group}`)
        .attr("id", d => `d3node-${d.d3Id}`)
        .html(d => d.group === 'scan' ? `<span>${d.label.substring(0,6)}</span>` : '')
        .on("contextmenu", (event, d) => {
            event.preventDefault();
            if (d.group === 'scan') {
                const rect = document.getElementById('graph-container').getBoundingClientRect();
                showGraphContextMenu(event.clientX - rect.left, event.clientY - rect.top, d);
            }
        })
        .on("click", (event, d) => {
            if (d.group === 'scan') {
                viewResultFor(d.scan_target, d.scan_filename);
            } else if (d.d3Id !== 'root' && d.group !== 'category') {
                selectFolder(d.d3Id, null);
                document.getElementById('graph-container').style.display = 'none';
                const runBtn = document.getElementById('run-btn');
                if (runBtn) runBtn.style.display = 'block';
                const flagContainer = document.getElementById('flag-container');
                if (flagContainer) flagContainer.style.display = 'flex';
            }
        })
        .call(d3.drag()
            .on("start", (event, d) => {
                if (!event.active) d3NetmapState.simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => {
                if (!event.active) d3NetmapState.simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
            }));

    nodeSelection.filter(d => d.group !== 'scan').each(function(d) {
        let lblColor = '#fff';
        if (d.group === 'root') lblColor = '#ff0055';
        else if (d.group === 'target') lblColor = '#ff8800';
        else if (d.group === 'subdomain') lblColor = '#00ccff';
        else if (d.group === 'category') lblColor = '#aa00ff';
        d3.select(this).append("div").attr("class", "d3-ip-label").style("color", lblColor).text(d.label || d.d3Id);
    });

    function tickedD3() {
        lineSelection.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        nodeSelection.style("left", d => d.x + "px").style("top", d => d.y + "px");
    }
}

function syncGraphProgress() {
    const activeScans = [];
    for (let key in scanEvents) {
        if (scanEvents[key].readyState !== EventSource.CLOSED) activeScans.push(key);
    }
    scanQueue.forEach(q => { activeScans.push(`${q.folder}||${q.id}`); });
    
    if (graphNodes) {
        const nodesToUpdate = [];
        graphNodes.forEach(node => {
            if (node.group === 'scan') {
                let cmdIdPart = node.id.split('_scan_');
                const scanKey = `${node.scan_target}||${cmdIdPart[cmdIdPart.length - 1]}`;
                if (activeScans.includes(scanKey)) {
                    nodesToUpdate.push({
                        id: node.id, 
                        color: { background: '#ffaa00', border: '#ff0000' },
                        shadow: { color: '#ffaa00', size: 20 }
                    });
                } else {
                    nodesToUpdate.push({
                        id: node.id,
                        color: { background: '#113311', border: '#00ff00' },
                        shadow: false
                    });
                }
            }
        });
        if (nodesToUpdate.length > 0) graphNodes.update(nodesToUpdate);
    }
    
    if (typeof d3 !== 'undefined') {
        d3.selectAll('.d3-node-scan').each(function(d) {
            let cmdIdPart = d.id.split('_scan_');
            const scanKey = `${d.scan_target}||${cmdIdPart[cmdIdPart.length - 1]}`;
            if (activeScans.includes(scanKey)) {
                d3.select(this).style("border-color", "#ff0000").style("box-shadow", "0 0 15px #ffaa00").style("color", "#ffaa00");
            } else {
                d3.select(this).style("border-color", "#00ff00").style("box-shadow", "0 0 10px #00ff00").style("color", "#00ff00");
            }
        });
    }
}

let sysPlugins = [];
function registerPlugin(plugin) {
    sysPlugins.push(plugin);
}

function loadPlugins() {
    fetch('/get_plugins_list').then(res => res.json()).then(files => {
        files.forEach(file => {
            let script = document.createElement('script');
            script.src = '/plugins_file/' + file;
            document.body.appendChild(script);
        });
    });
}

function openPluginsModal() {
    const list = document.getElementById('plugins-list');
    list.innerHTML = '';
    if (sysPlugins.length === 0) {
        list.innerHTML = '<li style="color:#aaa;">No plugins loaded.</li>';
    }
    sysPlugins.forEach(p => {
        let li = document.createElement('li');
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #555';
        li.style.cursor = 'pointer';
        li.style.color = '#00ffcc';
        li.innerText = p.name;
        li.onmouseover = () => li.style.background = '#111';
        li.onmouseout = () => li.style.background = 'transparent';
        li.onclick = () => { closeModal('plugins-modal'); p.run(); };
        list.appendChild(li);
    });
    window.showAndBringToFront('plugins-modal');
}

function insertMacroFileMgr(m) {
    const cmdInput = document.getElementById('file-mgr-content');
    const start = cmdInput.selectionStart;
    const end = cmdInput.selectionEnd;
    const text = cmdInput.value;
    const before = text.substring(0, start);
    const after  = text.substring(end, text.length);
    cmdInput.value = (before + m + after);
    cmdInput.selectionStart = cmdInput.selectionEnd = start + m.length;
    cmdInput.focus();
}

function insertMacro(m) {
    const cmdInput = document.getElementById('cmd-command');
    const start = cmdInput.selectionStart;
    const end = cmdInput.selectionEnd;
    const text = cmdInput.value;
    const before = text.substring(0, start);
    const after  = text.substring(end, text.length);
    cmdInput.value = (before + m + after);
    cmdInput.selectionStart = cmdInput.selectionEnd = start + m.length;
    cmdInput.focus();
}

function openRequireModal() {
    const list = document.getElementById('require-file-list');
    list.innerHTML = '';
    const uniqueFiles = [...new Set(commandsData.map(c => c.filename).filter(Boolean))];
    uniqueFiles.forEach(file => {
        const li = document.createElement('li');
        li.style.padding = '10px';
        li.style.borderBottom = '1px solid #555';
        li.style.cursor = 'pointer';
        li.style.color = '#00ffcc';
        li.innerText = file;
        li.onclick = () => {
            insertMacro(`{require->${file}}`);
            closeModal('require-file-modal');
        };
        li.onmouseover = () => li.style.background = '#111';
        li.onmouseout = () => li.style.background = 'transparent';
        list.appendChild(li);
    });
    document.getElementById('require-search').value = '';
    document.getElementById('require-file-modal').style.display = 'block';
}

function filterRequireFiles() {
    const filter = document.getElementById('require-search').value.toLowerCase();
    const listItems = document.getElementById('require-file-list').getElementsByTagName('li');
    for (let i = 0; i < listItems.length; i++) {
        const txt = listItems[i].innerText.toLowerCase();
        listItems[i].style.display = txt.includes(filter) ? '' : 'none';
    }
}

function cleanTmp() {
    showToast("Nuking /tmp and /var/tmp directories... 💥", "warning");
    fetch('/clean_tmp', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast("Temp files violently annihilated! 🧹", "success");
        } else {
            showToast("Failed to nuke tmp: " + data.error, "error");
        }
    }).catch(err => showToast("Error connecting for TMP clean", "error"));
}

function openDiskModal() {
    window.showAndBringToFront('disk-info-modal');
    document.getElementById('disk-info-output').innerText = "Loading disk stats... Don't rush me, bitch.";
    fetch('/get_disk_info').then(res => res.json()).then(data => {
        if (data.success) {
            document.getElementById('disk-info-output').innerText = data.data;
        } else {
            document.getElementById('disk-info-output').innerText = "ERROR: " + data.error;
        }
    }).catch(e => {
        document.getElementById('disk-info-output').innerText = "FATAL ERROR FETCHING DISK STATS.";
    });
}

function cleanRam() {
    showToast("Initiating ruthless RAM purge... 💀", "warning");
    fetch('/clean_ram', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
            showToast("RAM violently purged. You're welcome, bitch.", "success");
            updateSysStats();
        } else {
            showToast("Failed to nuke RAM: " + data.error, "error");
        }
    }).catch(err => showToast("Error connecting for RAM clean", "error"));
}

function updateSysStats() {
    fetch('/get_sys_stats').then(res => res.json()).then(data => {
        if (data.error) {
            document.getElementById('sys-cpu').innerText = "ERR";
            document.getElementById('sys-ram').innerText = "ERR";
            document.getElementById('sys-disk').innerText = "ERR";
            document.getElementById('sys-monitor').title = "Install psutil you lazy fuck: " + data.error;
            return;
        }
        document.getElementById('sys-cpu').innerText = data.cpu;
        document.getElementById('sys-ram').innerText = data.ram;
        document.getElementById('sys-disk').innerText = data.disk;
    }).catch(e => {});
}
setInterval(updateSysStats, 2000);

// Auto-purging RAM every 3 minutes like a ruthless bot
setInterval(() => {
    fetch('/clean_ram', { method: 'POST' }).then(() => console.log('Ruthless auto-RAM purge executed.'));
}, 180000);

function openSettingsModal() {
    document.getElementById('sys-reactive-shadows').checked = (localStorage.getItem('cyber_reactive_shadows') === 'true');
    const qmode = document.getElementById('sys-queue-mode');
    if (qmode) qmode.checked = (localStorage.getItem('cyber_queue_mode') === 'true');
    const boxmode = document.getElementById('sys-box-layout');
    if (boxmode) boxmode.checked = (localStorage.getItem('cyber_box_layout') === 'true');
    const swaymode = document.getElementById('sys-camera-sway');
    if (swaymode) swaymode.checked = (localStorage.getItem('cyber_camera_sway') === 'true');
    const multimode = document.getElementById('sys-multi-tool-instances');
    if (multimode) multimode.checked = (localStorage.getItem('cyber_multi_tool_instances') === 'true');
    const termBgEl = document.getElementById('sys-terminal-bg-style');
    if (termBgEl) termBgEl.value = localStorage.getItem('cyber_terminal_bg') || 'transparent';
    refreshSoundsUI();
    document.getElementById('sys-quality').value = localStorage.getItem('cyber_quality') || 'potato';
    const shellEl = document.getElementById('sys-win-shell');
    if (shellEl) shellEl.value = localStorage.getItem('cyber_win_shell') || 'cmd';
    document.getElementById('gemini-api-key').value = localStorage.getItem('gemini_api_key') || '';
    document.getElementById('gemini-model').value = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
    fetch('/get_sys_settings').then(res => res.json()).then(data => {
        document.getElementById('path-notes').value = data.path_notes || '';
        document.getElementById('path-commands').value = data.path_commands || '';
        document.getElementById('path-scripts').value = data.path_scripts || '';
        document.getElementById('path-passwords').value = data.path_passwords || '';
        document.getElementById('path-payloadslist').value = data.path_payloadslist || '';
        document.getElementById('path-payloads').value = data.path_payloads || '';
        document.getElementById('path-workflows').value = data.path_workflows || '';
        if(document.getElementById('sys-lock-show-logo')) {
            document.getElementById('sys-lock-show-logo').checked = data.lock_show_logo !== false;
            document.getElementById('sys-lock-opacity').value = data.lock_opacity !== undefined ? data.lock_opacity : 0.3;
            document.getElementById('sys-lock-opacity-val').innerText = document.getElementById('sys-lock-opacity').value;
            document.getElementById('sys-lock-blur').value = data.lock_blur !== undefined ? data.lock_blur : 15;
            document.getElementById('sys-lock-blur-val').innerText = document.getElementById('sys-lock-blur').value;
        }
        document.getElementById('attacker-ip').value = data.attacker_ip || '';
        document.getElementById('attacker-url').value = data.attacker_url || '';
        document.getElementById('sys-username').value = data.username || '';
        document.getElementById('sys-telnet-login').value = data.telnet_login_name || '';
        document.getElementById('github-token').value = data.github_token || '';
        document.getElementById('github-repo').value = data.github_repo || '';
        let icons = data.icons || {};
        document.getElementById('ico-add').value = icons.add || '';
        document.getElementById('ico-plugins').value = icons.plugins || '';
        document.getElementById('ico-graph').value = icons.graph || '';
        document.getElementById('ico-multi').value = icons.multi || '';
        document.getElementById('ico-settings').value = icons.settings || '';
        document.getElementById('ico-canvas').value = icons.canvas || '';
        document.getElementById('ico-preview').value = icons.preview || '';
        document.getElementById('ico-youtube').value = icons.youtube || '';
        document.getElementById('ico-github').value = icons.github || '';
        document.getElementById('ico-ram').value = icons.ram || '';
        document.getElementById('ico-live').value = icons.live || '';
        document.getElementById('ico-windows').value = icons.windows || '';
        document.getElementById('ico-linux').value = icons.linux || '';
        if(document.getElementById('ico-lan_internet')) document.getElementById('ico-lan_internet').value = icons.lan_internet || '';
        if(document.getElementById('ico-lan_router')) document.getElementById('ico-lan_router').value = icons.lan_router || '';
        if(document.getElementById('ico-lan_localhost')) document.getElementById('ico-lan_localhost').value = icons.lan_localhost || '';
        if(document.getElementById('ico-lan_target')) document.getElementById('ico-lan_target').value = icons.lan_target || '';
        if(document.getElementById('ico-app')) document.getElementById('ico-app').value = icons.app || '';
        document.getElementById('ico-download').value = icons.download || '';
        document.getElementById('ico-worm').value = icons.worm || '';
        document.getElementById('ico-run').value = icons.run || '';
        document.getElementById('ico-cmd').value = icons.cmd || '';
        if(document.getElementById('ico-oneliner')) document.getElementById('ico-oneliner').value = icons.oneliner || '';
        document.getElementById('sys-icon-type').value = data.icon_type || localStorage.getItem('cyber_icon_type') || 'dynamic';
        document.getElementById('custom-tools-container').innerHTML = '';
        if (data.custom_tools && data.custom_tools.length > 0) {
            data.custom_tools.forEach(t => window.addCustomToolField(t.name, t.icon, t.cmd));
        }
        if (document.getElementById('sys-terminal-prompt')) document.getElementById('sys-terminal-prompt').value = data.terminal_prompt || 'X';
    });
    window.showAndBringToFront('settings-modal');
}

window.addCustomToolField = function(name='', icon='', cmd='') {
    const container = document.getElementById('custom-tools-container');
    const div = document.createElement('div');
    const uniqueId = 'c-tool-icon-' + Date.now() + Math.floor(Math.random() * 1000);
    div.className = 'custom-tool-entry';
    div.style = 'border: 1px dashed #00ffcc; padding: 10px; margin-bottom: 10px; position: relative;';
    div.innerHTML = `
        <span onclick="this.parentElement.remove()" style="position:absolute; top:5px; right:10px; color:red; cursor:pointer; font-weight:bold;" title="Delete this trash">X</span>
        <input type="text" class="search-input c-tool-name" placeholder="Tool Name (e.g. My Script)" value="${name}" style="margin-bottom:5px;">
        <div style="display:flex; gap:10px; margin-bottom:5px; align-items:center;">
            <input type="text" id="${uniqueId}" class="search-input c-tool-icon icon-drop-input" placeholder="Icon (Drop image here, select, or type 💀)" value="${icon}" style="flex:1; margin-bottom:0;">
            <button type="button" onclick="window.openIconSelector('${uniqueId}')" style="padding:10px; background:#ff00ff; color:#000; border:none; font-weight:bold; cursor:pointer;">Select Icon</button>
        </div>
        <input type="text" class="search-input c-tool-cmd" placeholder="Command (e.g. python3 script.py)" value="${cmd}" style="margin-bottom:0;">
    `;
    container.appendChild(div);
    if (window.setupIconDragDrop) window.setupIconDragDrop();
};

function saveSettings(close = true) {
    const q = document.getElementById('sys-quality').value;
    localStorage.setItem('cyber_quality', q);
    window.setQuality(q);
    const winShell = document.getElementById('sys-win-shell');
    if (winShell) localStorage.setItem('cyber_win_shell', winShell.value);
    localStorage.setItem('gemini_api_key', document.getElementById('gemini-api-key').value);
    localStorage.setItem('gemini_model', document.getElementById('gemini-model').value);
    const aip = document.getElementById('attacker-ip').value;
    const aurl = document.getElementById('attacker-url').value;
    const uname = document.getElementById('sys-username').value;
    const tlogin = document.getElementById('sys-telnet-login').value;
    window.sysAttackerIp = aip;
    window.sysAttackerUrl = aurl;
    const gToken = document.getElementById('github-token').value;
    const gRepo = document.getElementById('github-repo').value;
    
    const reactive = document.getElementById('sys-reactive-shadows').checked;
    localStorage.setItem('cyber_reactive_shadows', reactive);
    const qm = document.getElementById('sys-queue-mode');
    if (qm) localStorage.setItem('cyber_queue_mode', qm.checked);
    const multim = document.getElementById('sys-multi-tool-instances');
    if (multim) localStorage.setItem('cyber_multi_tool_instances', multim.checked);
    const swaym = document.getElementById('sys-camera-sway');
    if (swaym) {
        localStorage.setItem('cyber_camera_sway', swaym.checked);
        window.applyCameraSway(swaym.checked);
    }
    const boxm = document.getElementById('sys-box-layout');
    if (boxm) {
        const wasBox = document.body.classList.contains('box-layout-active');
        const isBox = boxm.checked;
        localStorage.setItem('cyber_box_layout', isBox);
        if (isBox !== wasBox) {
            saveUILayout(); // Save current state before switching
            if (isBox) document.body.classList.add('box-layout-active');
            else document.body.classList.remove('box-layout-active');
            loadUILayout(); // Load state for new mode
        }
    }
    isReactive = reactive;
    if(!reactive) document.body.style.boxShadow = 'none';

    let icons = {
        add: document.getElementById('ico-add').value,
        plugins: document.getElementById('ico-plugins').value,
        graph: document.getElementById('ico-graph').value,
        multi: document.getElementById('ico-multi').value,
        settings: document.getElementById('ico-settings').value,
        canvas: document.getElementById('ico-canvas').value,
        preview: document.getElementById('ico-preview').value,
        youtube: document.getElementById('ico-youtube').value,
        github: document.getElementById('ico-github').value,
        ram: document.getElementById('ico-ram').value,
        live: document.getElementById('ico-live').value,
        windows: document.getElementById('ico-windows').value,
        linux: document.getElementById('ico-linux').value,
        lan_internet: document.getElementById('ico-lan_internet') ? document.getElementById('ico-lan_internet').value : '',
        lan_router: document.getElementById('ico-lan_router') ? document.getElementById('ico-lan_router').value : '',
        lan_localhost: document.getElementById('ico-lan_localhost') ? document.getElementById('ico-lan_localhost').value : '',
        lan_target: document.getElementById('ico-lan_target') ? document.getElementById('ico-lan_target').value : '',
        app: document.getElementById('ico-app') ? document.getElementById('ico-app').value : '',
        download: document.getElementById('ico-download').value,
        worm: document.getElementById('ico-worm').value,
        run: document.getElementById('ico-run').value,
        cmd: document.getElementById('ico-cmd').value,
        oneliner: document.getElementById('ico-oneliner') ? document.getElementById('ico-oneliner').value : ''
    };

    let custom_tools = [];
    document.querySelectorAll('.custom-tool-entry').forEach(el => {
        let n = el.querySelector('.c-tool-name').value;
        let i = el.querySelector('.c-tool-icon').value;
        let c = el.querySelector('.c-tool-cmd').value;
        if(n && i && c) custom_tools.push({name: n, icon: i, cmd: c});
    });

    const path_notes = document.getElementById('path-notes').value;
    const path_commands = document.getElementById('path-commands').value;
    const path_scripts = document.getElementById('path-scripts').value;
    const path_passwords = document.getElementById('path-passwords').value;
    const path_payloadslist = document.getElementById('path-payloadslist').value;
    const path_payloads = document.getElementById('path-payloads').value;
    const path_workflows = document.getElementById('path-workflows').value;

    let lockShowLogo = true, lockOpacity = 0.3, lockBlur = 15;
    if(document.getElementById('sys-lock-show-logo')) {
        lockShowLogo = document.getElementById('sys-lock-show-logo').checked;
        lockOpacity = parseFloat(document.getElementById('sys-lock-opacity').value);
        lockBlur = parseInt(document.getElementById('sys-lock-blur').value);
    }

    const currentTheme = localStorage.getItem('cyber_theme') || 'space';
    const iconType = document.getElementById('sys-icon-type') ? document.getElementById('sys-icon-type').value : 'dynamic';
    const termPromptEl = document.getElementById('sys-terminal-prompt');
    const termPrompt = termPromptEl ? termPromptEl.value : 'X';

    fetch('/save_sys_settings', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            icon_type: iconType,
            attacker_ip: aip, 
            attacker_url: aurl, 
            username: uname, 
            telnet_login_name: tlogin, 
            github_token: gToken, 
            github_repo: gRepo, 
            icons: icons, 
            custom_tools: custom_tools, 
            active_background: window.activeBackground,
            path_notes: path_notes,
            path_commands: path_commands,
            path_scripts: path_scripts,
            path_passwords: path_passwords,
            path_payloadslist: path_payloadslist,
            path_payloads: path_payloads,
            path_workflows: path_workflows,
            lock_show_logo: lockShowLogo,
            lock_opacity: lockOpacity,
            lock_blur: lockBlur,
            theme: currentTheme,
            terminal_prompt: termPrompt
        })
    }).then(() => {
        if (close) closeModal('settings-modal');
        applyCustomIcons(icons);
        window.renderCustomToolsSidebar(custom_tools);
        if(window.applyLockScreenStyles) window.applyLockScreenStyles({lock_show_logo: lockShowLogo, lock_opacity: lockOpacity, lock_blur: lockBlur});
        window.syncToTxtFinder();
        const iframe = document.getElementById('quad-term-iframe');
        if(iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'cyber_target_update',
                target: currentFolder ? currentFolder.split('/').pop() : '',
                atkIp: window.sysAttackerIp || ''
            }, '*');
        }
    });
}

window.renderCustomToolsSidebar = function(tools) {
    window.customToolsConfig = tools || [];
    document.querySelectorAll('.custom-tool-icon-added').forEach(el => el.remove());
    const sidebar = document.querySelector('.quick-tools-sidebar');
    if (!sidebar) return;
    window.customToolsConfig.forEach((t, idx) => {
        const div = document.createElement('div');
        div.className = 'tool-icon custom-tool-icon-added';
        div.id = 'custom_tool_' + idx;
        div.dataset.customIdx = idx;
        div.title = t.name;
        
        let iconHtml = t.icon;
        if (!iconHtml.includes('<')) {
            if (iconHtml.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i) || iconHtml.startsWith('/icons/')) {
                iconHtml = `<img src="${iconHtml}" style="width:24px; height:24px;">`;
            } else {
                iconHtml = `<span style="font-size: 24px;">${iconHtml}</span>`;
            }
        }
        div.innerHTML = iconHtml;
        
        const imgs = div.querySelectorAll('img');
        imgs.forEach(img => {
            img.onerror = function() {
                let fbIcon = t.name.toLowerCase().includes('win') ? 'windows' : (t.name.toLowerCase().includes('lin') ? 'linux' : 'skull');
                this.outerHTML = window.sysIcon ? window.sysIcon(fbIcon, 24) : '💀';
            };
        });

        div.onclick = () => toggleToolTerminal('custom_' + idx);
        sidebar.appendChild(div);
    });
    setTimeout(initUIReordering, 500);
};

function applyCustomIcons(icons) {
    if(!icons) return;
    if(icons.add) document.getElementById('add-btn-icon').innerHTML = icons.add;
    if(icons.plugins) document.getElementById('plugins-btn-icon').innerHTML = icons.plugins;
    if(icons.graph) document.getElementById('view-toggle-btn').innerHTML = icons.graph;
    if(icons.multi) document.getElementById('multi-term-btn-icon').innerHTML = icons.multi;
    if(icons.settings) document.getElementById('settings-btn-icon').innerHTML = icons.settings;
    if(icons.canvas) document.getElementById('canvas-btn-icon').innerHTML = icons.canvas;
    if(icons.preview) document.getElementById('preview-btn-icon').innerHTML = icons.preview;
    if(icons.youtube) document.getElementById('youtube-btn-icon').innerHTML = icons.youtube;
    if(icons.github) document.getElementById('github-pull-btn').innerHTML = icons.github;
    if(icons.ram) document.getElementById('clean-ram-btn-icon').innerHTML = icons.ram;
    if(icons.live) document.getElementById('live-editor-btn-icon').innerHTML = icons.live;
    if(icons.app) { const a = document.getElementById('app-launcher-btn-icon'); if(a) a.innerHTML = icons.app; }
    if(icons.download) document.getElementById('download-btn-icon').innerHTML = icons.download;
    if(icons.worm) document.getElementById('wormgpt-btn-icon').innerHTML = icons.worm;
    if(icons.run) {
        document.querySelectorAll('.run-icon').forEach(el => el.innerHTML = icons.run);
    }
    if(icons.cmd) {
        document.querySelectorAll('.cmd-custom-icon').forEach(el => { el.innerHTML = icons.cmd; el.style.display = 'inline-block'; });
    }
    if(icons.oneliner) { const el = document.getElementById('oneliner-btn-icon'); if(el) el.innerHTML = icons.oneliner; }
    if(icons.windows) {
        document.querySelectorAll('.os-win-icon').forEach(el => { el.innerHTML = icons.windows; });
    }
    if(icons.linux) {
        document.querySelectorAll('.os-lin-icon').forEach(el => { el.innerHTML = icons.linux; });
    }
    if(icons.kali) { const el = document.getElementById('tool-kali'); if(el) el.innerHTML = icons.kali; }
    if(icons.sherlock) { const el = document.getElementById('tool-sherlock'); if(el) el.innerHTML = icons.sherlock; }
    if(icons.blockchain) { const el = document.getElementById('tool-blockchain'); if(el) el.innerHTML = icons.blockchain; }
    if(icons.msfconsole) { const el = document.getElementById('tool-msfconsole'); if(el) el.innerHTML = icons.msfconsole; }
    if(icons.openvpn) { const el = document.getElementById('tool-openvpn'); if(el) el.innerHTML = icons.openvpn; }
    if(icons.tunnel) { const el = document.getElementById('tool-tunnel'); if(el) el.innerHTML = icons.tunnel; }
    if(icons.ssh) { const el = document.getElementById('tool-ssh'); if(el) el.innerHTML = icons.ssh; }
    if(icons.managefiles) { const el = document.getElementById('manage-files-btn'); if(el) el.innerHTML = icons.managefiles; }
    if(icons.sounds) { const el = document.getElementById('sounds-btn-icon'); if(el) el.innerHTML = icons.sounds; }
    if(icons.sysexp) { const el = document.getElementById('sys-explorer-btn-icon'); if(el) el.innerHTML = icons.sysexp; }
    if(icons.cleantmp) { const el = document.getElementById('clean-tmp-btn-icon'); if(el) el.innerHTML = icons.cleantmp; }
    if(icons.diskinfo) { const el = document.getElementById('disk-info-btn-icon'); if(el) el.innerHTML = icons.diskinfo; }
    if(icons.scanlan) { const el = document.getElementById('scanlan-btn-icon'); if(el) el.innerHTML = icons.scanlan; }
    if(icons.map) { const el = document.getElementById('map-btn-icon'); if(el) el.innerHTML = icons.map; }
    if(icons.quadterm) { const el = document.getElementById('quad-term-btn-icon'); if(el) el.innerHTML = icons.quadterm; }
    if(icons.toolbartoggle) { const el = document.getElementById('toolbar-toggle-btn'); if(el && !document.getElementById('top-toolbar').classList.contains('collapsed')) el.innerHTML = icons.toolbartoggle; }
    if(icons.sidebartoggle) { const el = document.getElementById('sidebar-toggle-btn'); if(el && !document.body.classList.contains('sidebar-collapsed')) el.innerHTML = icons.sidebartoggle; }
    if(icons.bottomtoggle) { const el = document.getElementById('bottom-toggle-btn'); if(el && !document.getElementById('bottom-toolbar').classList.contains('collapsed')) el.innerHTML = icons.bottomtoggle; }
}

const iconIdMap = {
    'tool-kali': 'kali', 'tool-sherlock': 'sherlock', 'tool-blockchain': 'blockchain',
    'tool-msfconsole': 'msfconsole', 'tool-openvpn': 'openvpn', 'tool-tunnel': 'tunnel',
    'tool-ssh': 'ssh', 'add-btn-icon': 'add', 'plugins-btn-icon': 'plugins',
    'view-toggle-btn': 'graph', 'multi-term-btn-icon': 'multi', 'settings-btn-icon': 'settings',
    'canvas-btn-icon': 'canvas', 'preview-btn-icon': 'preview', 'youtube-btn-icon': 'youtube',
    'github-pull-btn': 'github', 'clean-ram-btn-icon': 'ram', 'live-editor-btn-icon': 'live',
    'app-launcher-btn-icon': 'app', 'download-btn-icon': 'download', 'wormgpt-btn-icon': 'worm',
    'manage-files-btn': 'managefiles', 'sounds-btn-icon': 'sounds', 'sys-explorer-btn-icon': 'sysexp',
    'clean-tmp-btn-icon': 'cleantmp', 'disk-info-btn-icon': 'diskinfo', 'scanlan-btn-icon': 'scanlan',
    'map-btn-icon': 'map', 'quad-term-btn-icon': 'quadterm', 'toolbar-toggle-btn': 'toolbartoggle',
    'sidebar-toggle-btn': 'sidebartoggle', 'bottom-toggle-btn': 'bottomtoggle', 'oneliner-btn-icon': 'oneliner',
    'ico-lan_internet': 'lan_internet', 'ico-lan_router': 'lan_router', 'ico-lan_localhost': 'lan_localhost', 'ico-lan_target': 'lan_target'
};

let activeContextIconId = null;

document.addEventListener('contextmenu', function(e) {
    let targetIcon = e.target.closest('.tool-icon, .top-bar-icon, .bottom-bar-icon, .right-bar-icon');
    if (targetIcon && iconIdMap[targetIcon.id]) {
        e.preventDefault();
        activeContextIconId = targetIcon.id;
        const ctx = document.getElementById('icon-context-menu');
        if (ctx) {
            ctx.style.left = e.clientX + 'px';
            ctx.style.top = e.clientY + 'px';
            ctx.style.display = 'block';
        }
    }
});



const changeIconBtn = document.getElementById('ctx-change-icon');
if (changeIconBtn) {
    changeIconBtn.onclick = function() {
        document.getElementById('icon-context-menu').style.display = 'none';
        if (activeContextIconId) {
            document.getElementById('quick-icon-upload').click();
        }
    };
}

const selectIconBtn = document.getElementById('ctx-select-icon');
if (selectIconBtn) {
    selectIconBtn.onclick = function() {
        document.getElementById('icon-context-menu').style.display = 'none';
        if (activeContextIconId) {
            window.iconSelectCallback = function(path) {
                updateSingleIcon(activeContextIconId, `<img src="${path}" width="24">`);
                closeModal('icon-manager-modal');
            };
            window.showAndBringToFront('icon-manager-modal');
            window.loadIconManager();
        }
    };
}

const quickIconUpload = document.getElementById('quick-icon-upload');
if (quickIconUpload) {
    quickIconUpload.onchange = function(e) {
        let file = e.target.files[0];
        if (file && activeContextIconId) {
            let formData = new FormData();
            formData.append('file', file);
            formData.append('key', activeContextIconId);
            fetch('/api/upload_sys_icon', { method: 'POST', body: formData })
            .then(r=>r.json()).then(d => {
                if (d.success) {
                    const imgIcon = `<img src="${d.path}" width="24">`;
                    updateSingleIcon(activeContextIconId, imgIcon);
                } else {
                    showToast('Upload failed: ' + d.error, 'error');
                }
            });
        }
        e.target.value = '';
    };
}

const resetIconBtn = document.getElementById('ctx-reset-icon');
if (resetIconBtn) {
    resetIconBtn.onclick = function() {
        document.getElementById('icon-context-menu').style.display = 'none';
        if (activeContextIconId) {
            updateSingleIcon(activeContextIconId, '');
            showToast("Icon reset to default! Refresh the page to see original.", "success");
        }
    };
}

function updateSingleIcon(elementId, iconData) {
    let key = iconIdMap[elementId];
    if (!key) return;

    fetch('/get_sys_settings').then(r=>r.json()).then(data => {
        let icons = data.icons || {};
        icons[key] = iconData;

        const inputEl = document.getElementById('ico-' + key);
        if (inputEl) inputEl.value = iconData;

        fetch('/save_sys_settings', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ icons: icons })
        }).then(() => {
            applyCustomIcons(icons);
            showToast('Icon updated like a boss! 💀', 'success');
        });
    });
}

window.uploadIconFile = function(inputId) {
    let input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.svg';
    input.onchange = e => {
        let file = e.target.files[0];
        if(file) {
            let formData = new FormData();
            formData.append('file', file);
            formData.append('key', inputId.replace('ico-', ''));
            fetch('/api/upload_sys_icon', { method: 'POST', body: formData })
            .then(r=>r.json()).then(d => {
                if (d.success) {
                    document.getElementById(inputId).value = `<img src="${d.path}" width="24">`;
                    saveSettings(false);
                    showToast('Image ruthlessly uploaded to backend and saved! 💀', 'success');
                } else {
                    showToast('Upload failed: ' + d.error, 'error');
                }
            });
        }
    };
    input.click();
};

function switchSettingsTab(tab) {
    // Theme-aware tab colors
    window.currentSettingsTab = tab;
    const isDark = document.body.classList.contains('theme-dark');
    const isWhite = document.body.classList.contains('theme-white');
    const idleBg = isWhite ? '#ffffff' : isDark ? '#1a1a1a' : '#111';
    const idleColor = isWhite ? '#1a1a1a' : isDark ? '#aaaaaa' : '#00ffcc';
    const activeBg = isWhite ? '#0078d4' : isDark ? '#3a3a3a' : '#00ffcc';
    const activeColor = isWhite ? '#ffffff' : isDark ? '#ffffff' : '#000';
    const setTab = (id, active) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.style.background = active ? activeBg : idleBg;
        el.style.color = active ? activeColor : idleColor;
    };
    document.getElementById('settings-general').style.display = 'none';
    document.getElementById('settings-themes').style.display = 'none';
    if(document.getElementById('settings-backgrounds')) document.getElementById('settings-backgrounds').style.display = 'none';
    document.getElementById('settings-ips').style.display = 'none';
    document.getElementById('settings-github').style.display = 'none';
    if(document.getElementById('settings-icons')) document.getElementById('settings-icons').style.display = 'none';
    if(document.getElementById('settings-osicons')) document.getElementById('settings-osicons').style.display = 'none';
    if(document.getElementById('settings-sounds')) document.getElementById('settings-sounds').style.display = 'none';
    document.getElementById('set-tab-gen').style.background = idleBg;
    document.getElementById('set-tab-gen').style.color = idleColor;
    document.getElementById('set-tab-thm').style.background = idleBg;
    document.getElementById('set-tab-thm').style.color = idleColor;
    setTab('set-tab-bg', false);
    document.getElementById('set-tab-ips').style.background = idleBg;
    document.getElementById('set-tab-ips').style.color = idleColor;
    document.getElementById('set-tab-git').style.background = idleBg;
    document.getElementById('set-tab-git').style.color = idleColor;
    setTab('set-tab-ico', false);
    setTab('set-tab-snd', false);
    setTab('set-tab-cust', false);
    setTab('set-tab-paths', false);
    setTab('set-tab-term', false);
    setTab('set-tab-sec', false);
    if(document.getElementById('settings-custom')) {
        document.getElementById('settings-custom').style.display = 'none';
    }
    if(document.getElementById('settings-terminal')) {
        document.getElementById('settings-terminal').style.display = 'none';
    }
    if(document.getElementById('settings-paths')) {
        document.getElementById('settings-paths').style.display = 'none';
    }
    if(document.getElementById('settings-security')) {
        document.getElementById('settings-security').style.display = 'none';
    }
    
    if(tab === 'general') {
        document.getElementById('settings-general').style.display = 'block';
        setTab('set-tab-gen', true);
    } else if (tab === 'paths') {
        document.getElementById('settings-paths').style.display = 'block';
        setTab('set-tab-paths', true);
    } else if (tab === 'security') {
        document.getElementById('settings-security').style.display = 'block';
        setTab('set-tab-sec', true);
    } else if (tab === 'themes') {
        document.getElementById('settings-themes').style.display = 'block';
        setTab('set-tab-thm', true);
    } else if (tab === 'backgrounds') {
        document.getElementById('settings-backgrounds').style.display = 'block';
        setTab('set-tab-bg', true);
        window.loadBgGallery();
    } else if (tab === 'myips') {
        document.getElementById('settings-ips').style.display = 'block';
        setTab('set-tab-ips', true);
        fetchMyIPs();
    } else if (tab === 'github') {
        document.getElementById('settings-github').style.display = 'block';
        setTab('set-tab-git', true);
    } else if (tab === 'icons') {
        document.getElementById('settings-icons').style.display = 'block';
        setTab('set-tab-ico', true);
    } else if (tab === 'osicons') {
        document.getElementById('settings-osicons').style.display = 'block';
        setTab('set-tab-osicons', true);
    } else if (tab === 'sounds') {
        document.getElementById('settings-sounds').style.display = 'block';
        setTab('set-tab-snd', true);
    } else if (tab === 'custom') {
        document.getElementById('settings-custom').style.display = 'block';
        setTab('set-tab-cust', true);
    } else if (tab === 'terminal') {
        document.getElementById('settings-terminal').style.display = 'block';
        setTab('set-tab-term', true);
    }
}

function exportSystem() {
    window.location.href = '/export_all';
}

function importSystem() {
    const fileInput = document.getElementById('import-system-file');
    if (!fileInput.files.length) return;
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    fetch('/import_all', {
        method: 'POST',
        body: formData
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            showToast("System fully restored, bitch! Rebooting interface...", 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast("Failed to import: " + data.error, 'error');
        }
    });
}

function fetchMyIPs() {
    fetch('/get_my_ips').then(res => res.json()).then(data => {
        const list = document.getElementById('my-ips-list');
        list.innerHTML = '';
        if(data.error) { list.innerHTML = `<li style="color:red;">${data.error}</li>`; return; }
        for(let iface in data) {
            const ip = data[iface];
            const li = document.createElement('li');
            li.style = "padding: 8px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center;";
            li.innerHTML = `<div><strong>${iface}:</strong> <span style="color:#fff;">${ip}</span></div>
                            <button onclick="window.setAsAttackerIp('${ip}')" style="padding: 2px 8px; background: #ff00ff; color: #000; border: none; cursor: pointer; font-weight: bold; border-radius: 3px;">SET AS ATTACKER IP 🎯</button>`;
            list.appendChild(li);
        }
    });
}

window.setAsAttackerIp = function(ip) {
    document.getElementById('attacker-ip').value = ip;
    window.sysAttackerIp = ip;
    saveSettings();
    showToast("IP " + ip + " set as global attacker target! 💀", "success");
};

function toggleGeminiReport() {
    const reportDiv = document.getElementById('gemini-report');
    if(reportDiv.style.display === 'none') {
        reportDiv.style.display = 'block';
    } else {
        reportDiv.style.display = 'none';
    }
}

async function analyzeWithGemini() {
    const apiKey = localStorage.getItem('gemini_api_key');
    const model = localStorage.getItem('gemini_model') || 'gemini-1.5-flash';
    
    if (!apiKey) {
        showToast('Set your goddamn Gemini API key in the settings first!', 'error');
        return;
    }
    
    const reportDiv = document.getElementById('gemini-report');
    reportDiv.style.display = 'block';
    reportDiv.innerHTML = '<h3 style="color:#00ffcc; text-align: right;">🤖 AI is thinking...</h3>';
    
    if (!window.lastScanContent) {
        reportDiv.innerHTML = '<p style="color:red;">Error: No scan content found.</p>';
        return;
    }
    
    const prompt = "Please analyze this security scan report and explain it in Arabic. Give a detailed report with recommendations. Here is the scan data:\n\n" + window.lastScanContent;
    
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await res.json();
        if (data.error) {
            reportDiv.innerHTML = `<h3 style="color:red;">API Error:</h3><p>${data.error.message}</p>`;
        } else {
            const text = data.candidates[0].content.parts[0].text;
            const htmlContent = `<h3 style="color:#ff00ff; text-align: right;">🤖 Gemini Analysis (Arabic):</h3>${marked.parse(text)}`;
            reportDiv.innerHTML = htmlContent;
            document.getElementById('gemini-toggle-btn').style.display = 'inline-block';
            
            fetch('/save_ai_report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    folder: window.lastScanFolder,
                    filename: window.lastScanFilename,
                    content: htmlContent
                })
            });
        }
    } catch (e) {
        reportDiv.innerHTML = `<p style="color:red; text-align: right;">Failed to connect to Gemini API: ${e.message}</p>`;
    }
}

window.setQuality = function(q) {
    document.body.classList.remove('quality-potato', 'quality-realistic');
    document.body.classList.add('quality-' + q);
    window.applyCameraSway(localStorage.getItem('cyber_camera_sway') === 'true');
};
window.applyCameraSway = function(active) {
    const bg = document.querySelector('.space-background');
    if (bg) {
        if (!active || localStorage.getItem('cyber_quality') !== 'realistic') {
            bg.style.transform = 'none';
        }
    }
};
document.addEventListener('mousemove', function(e) {
    if (localStorage.getItem('cyber_camera_sway') === 'true' && document.body.classList.contains('quality-realistic')) {
        const x = (e.clientX / window.innerWidth - 0.5) * 40;
        const y = (e.clientY / window.innerHeight - 0.5) * 40;
        const bg = document.querySelector('.space-background');
        if (bg) {
            bg.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
        }
    }
});

window.setTheme = function(theme) {
    // Preserve non-theme classes (quality-*, box-layout-active, streamer-mode, etc.)
    const preservedClasses = Array.from(document.body.classList).filter(c =>
        !c.startsWith('theme-') && c !== 'sidebar-collapsed'
    );
    document.body.className = preservedClasses.join(' ') + ' theme-' + theme;
    localStorage.setItem('cyber_theme', theme);
    fetch('/get_sys_settings').then(r=>r.json()).then(data => {
        data.theme = theme;
        fetch('/save_sys_settings', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(data) });
    });
    showToast('Theme set to ' + theme.toUpperCase() + ' 💀', 'success');
    
    const titleEl = document.getElementById('main-title');
    if (titleEl) {
        if (theme === 'space') {
            titleEl.innerText = 'CYBER SPACE';
        } else if (theme === 'dark') {
            titleEl.innerText = 'DARK SYSTEM';
        } else if (theme === 'matrix') {
            titleEl.innerText = 'THE MATRIX';
        } else if (theme === 'white') {
            titleEl.innerText = 'WHITE SYSTEM';
        } else {
            titleEl.innerText = 'UMBRELLA CORPORATION';
        }
    }
    
    let termTheme = { background: '#000000', foreground: '#00ff00' };
    if (theme === 'umbrella') termTheme = { background: '#000000', foreground: '#ff0000' };
    else if (theme === 'space') termTheme = { background: '#000000', foreground: '#00ffcc' };
    else if (theme === 'matrix') termTheme = { background: '#000000', foreground: '#00ff00' };
    else if (theme === 'dark') termTheme = { background: '#000000', foreground: '#d0d0d0' };
    else if (theme === 'white') termTheme = { background: '#1e1e1e', foreground: '#e0e0e0' };
    
    for (let key in terminals) terminals[key].options.theme = termTheme;
    for (let key in multiTerminals) multiTerminals[key].term.options.theme = termTheme;
    for (let key in interactiveTerminals) interactiveTerminals[key].term.options.theme = termTheme;
    for (let key in toolTerminals) toolTerminals[key].term.options.theme = termTheme;
    if (window.ovpnTerm) window.ovpnTerm.options.theme = termTheme;
    if (window.tunnelTerm) window.tunnelTerm.options.theme = termTheme;
    if (window.sshTerm) window.sshTerm.options.theme = termTheme;
    
    // Reactivate sound-reactive border if enabled and applicable
    if (typeof applyCameraSway === 'function') applyCameraSway(localStorage.getItem('cyber_camera_sway') === 'true');
    
    // Re-apply terminal background style so injected <style> tag stays consistent
    // (white/dark themes neutralize it via CSS, other themes re-render it)
    if (typeof applyTerminalBgStyle === 'function') {
        applyTerminalBgStyle(localStorage.getItem('cyber_terminal_bg') || 'transparent');
    }

    // Force rehydration of dynamic icons based on theme
    if (typeof window.hydrateIcons === 'function') {
        window.hydrateIcons(document, true);
    }

    // Propagate theme to embedded web-terminal iframes (quad term etc.)
    try {
        document.querySelectorAll('iframe').forEach(fr => {
            if (fr.contentWindow) {
                fr.contentWindow.postMessage({ type: 'cyber_theme_update', theme: theme }, '*');
            }
        });
    } catch (e) { console.warn('iframe theme propagation skipped:', e); }

    // Re-tint inline-styled tab groups so they match the new theme immediately
    try {
        if (typeof getThemeTabColors === 'function' && typeof currentMtTab === 'string' &&
            document.getElementById('mt-tab-cmd') && document.getElementById('mt-tab-cmd').style.display !== 'none') {
            switchMultiTermSidebar(currentMtTab);
        }
        if (window.currentSettingsTab && document.getElementById('settings-modal').style.display === 'block') {
            switchSettingsTab(window.currentSettingsTab);
        }
        if (typeof switchFileMgrTab === 'function' && document.getElementById('file-mgr-type') &&
            document.getElementById('file-mgr-modal').style.display === 'block') {
            switchFileMgrTab(document.getElementById('file-mgr-type').value);
        }
    } catch (e) { console.warn('theme re-tint skipped:', e); }
};

function saveUILayout() {
    const topBar = Array.from(document.querySelectorAll('.top-right-bar > div[id], .top-right-bar > button[id]')).map(el => el.id);
    const sideBar = Array.from(document.querySelectorAll('.quick-tools-sidebar > div[id], .quick-tools-sidebar > button[id]')).map(el => el.id);
    const bottomBar = Array.from(document.querySelectorAll('.bottom-toolbar > div[id], .bottom-toolbar > button[id]')).map(el => el.id);
    const rightBar = Array.from(document.querySelectorAll('.right-toolbar > div[id], .right-toolbar > button[id]')).map(el => el.id);
    
    const isBox = document.body.classList.contains('box-layout-active');
    const mode = isBox ? 'box' : 'normal';
    
    fetch('/save_ui_layout', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ mode: mode, layout: { top: topBar, side: sideBar, bottom: bottomBar, right: rightBar } })
    }).catch(()=>{});
}

function loadUILayout() {
    fetch('/get_ui_layout').then(r=>r.json()).then(fullLayout => {
        const isBox = document.body.classList.contains('box-layout-active');
        const key = isBox ? 'box' : 'normal';
        let layout = fullLayout[key];
        
        if (!layout) {
            return;
        }
        
        if (!isBox && layout.right && layout.right.length > 0) {
            layout.top = layout.top.concat(layout.right);
            layout.right = [];
        }

        const topContainer = document.querySelector('.top-right-bar');
        const sideContainer = document.querySelector('.quick-tools-sidebar');
        const bottomContainer = document.querySelector('.bottom-toolbar');
        const rightContainer = document.querySelector('.right-toolbar');

        const restoreZone = (arr, container, addClass, removeClasses) => {
            if (!arr || !container) return;
            arr.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    removeClasses.forEach(cls => el.classList.remove(cls));
                    el.classList.add(addClass);
                    container.appendChild(el);
                }
            });
        };

        restoreZone(layout.top, topContainer, 'top-bar-icon', ['tool-icon', 'bottom-bar-icon', 'right-bar-icon']);
        restoreZone(layout.side, sideContainer, 'tool-icon', ['top-bar-icon', 'bottom-bar-icon', 'right-bar-icon']);
        restoreZone(layout.bottom, bottomContainer, 'bottom-bar-icon', ['top-bar-icon', 'tool-icon', 'right-bar-icon']);
        restoreZone(layout.right, rightContainer, 'right-bar-icon', ['top-bar-icon', 'tool-icon', 'bottom-bar-icon']);
    }).catch(()=>{});
}

function initUIReordering() {
    const zones = [document.querySelector('.top-right-bar'), document.querySelector('.quick-tools-sidebar'), document.querySelector('.bottom-toolbar'), document.querySelector('.right-toolbar')];
    const icons = document.querySelectorAll('.top-bar-icon, .tool-icon, .bottom-bar-icon, .right-bar-icon');
    let dragged = null;

    icons.forEach(icon => {
        if (icon.dataset.dragInit) return;
        icon.dataset.dragInit = 'true';
        if (!icon.id) icon.id = 'icon_' + Math.random().toString(36).substr(2, 9);
        icon.setAttribute('draggable', 'true');
        icon.addEventListener('dragstart', e => {
            dragged = e.target;
            e.dataTransfer.setData('icon_id', e.target.id);
            e.target.style.opacity = '0.3';
            e.target.style.transform = 'scale(0.9)';
        });
        icon.addEventListener('dragend', e => {
            e.target.style.opacity = '1';
            e.target.style.transform = '';
            dragged = null;
            saveUILayout();
        });
    });

    function getDragAfterElement(container, x, y) {
        const draggableElements = [...container.children].filter(el => el !== dragged && (el.classList.contains('top-bar-icon') || el.classList.contains('tool-icon') || el.classList.contains('bottom-bar-icon') || el.classList.contains('right-bar-icon')));
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const isVertical = container.classList.contains('quick-tools-sidebar');
            let offset;
            if (isVertical) {
                offset = y - box.top - box.height / 2;
            } else {
                offset = x - box.left - box.width / 2;
            }
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    zones.forEach(zone => {
        if (!zone) return;
        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.style.boxShadow = '0 0 20px #ff00ff';
            if (!dragged) return;
            
            dragged.classList.remove('top-bar-icon', 'tool-icon', 'bottom-bar-icon', 'right-bar-icon');
            if (zone.classList.contains('quick-tools-sidebar')) {
                dragged.classList.add('tool-icon');
            } else if (zone.classList.contains('bottom-toolbar')) {
                dragged.classList.add('bottom-bar-icon');
            } else if (zone.classList.contains('right-toolbar')) {
                dragged.classList.add('right-bar-icon');
            } else {
                dragged.classList.add('top-bar-icon');
            }

            const afterElement = getDragAfterElement(zone, e.clientX, e.clientY);
            
            if (afterElement == null) {
                zone.appendChild(dragged);
            } else {
                zone.insertBefore(dragged, afterElement);
            }
        });
        zone.addEventListener('dragleave', e => {
            zone.style.boxShadow = '';
        });
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.style.boxShadow = '';
            saveUILayout();
        });
    });
}

window.applyLockScreenStyles = function(data) {
    const showLogo = data.lock_show_logo !== false;
    const opacity = data.lock_opacity !== undefined ? data.lock_opacity : 0.3;
    const blur = data.lock_blur !== undefined ? data.lock_blur : 15;
    
    const dL = document.getElementById('door-left');
    const dR = document.getElementById('door-right');
    
    if (dL && dR) {
        const bgImg = showLogo ? "url('/static/logo.svg')" : "none";
        dL.style.background = `rgba(5, 15, 25, ${opacity}) ${bgImg} center center / 50% auto no-repeat`;
        dR.style.background = `rgba(5, 15, 25, ${opacity}) ${bgImg} center center / 50% auto no-repeat`;
        
        dL.style.backdropFilter = `blur(${blur}px)`;
        dL.style.webkitBackdropFilter = `blur(${blur}px)`;
        dR.style.backdropFilter = `blur(${blur}px)`;
        dR.style.webkitBackdropFilter = `blur(${blur}px)`;
    }
};

window.resetSystemLock = function() {
    if (confirm("Are you sure you want to nuke the current pattern lock? You'll need to set a new one on the next reload.")) {
        fetch('/api/auth/reset', { method: 'POST' })
        .then(r=>r.json()).then(d => {
            if(d.success) {
                showToast("Lock Pattern Annihilated! 💥 Reloading to set a new one...", "success");
                setTimeout(() => location.reload(), 1500);
            }
        });
    }
};

window.openIconManagerModal = function() {
    window.iconSelectCallback = null;
    window.showAndBringToFront('icon-manager-modal');
    window.loadIconManager();
};

window.openIconSelector = function(targetInputId) {
    window.iconSelectCallback = function(path) {
        document.getElementById(targetInputId).value = path;
        closeModal('icon-manager-modal');
    };
    window.showAndBringToFront('icon-manager-modal');
    window.loadIconManager();
};

window.loadIconManager = function() {
    fetch('/api/icons/list').then(r=>r.json()).then(d=>{
        const grid = document.getElementById('icon-mgr-grid');
        grid.innerHTML = '';
        if(d.icons) {
            d.icons.forEach(icon => {
                const path = '/icons/' + icon;
                const div = document.createElement('div');
                div.style = "background:#111; border:1px solid #333; padding:10px; display:flex; flex-direction:column; align-items:center; cursor:pointer;";
                div.innerHTML = `
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; width:100%;" onclick="window.handleIconClick('${path}')">
                        <img src="${path}" style="max-width:64px; max-height:64px;">
                    </div>
                    <span style="color:#00ffcc; font-size:11px; word-break:break-all; text-align:center; margin:8px 0;" class="icon-name">${icon}</span>
                    <div style="display:flex; gap:5px; width:100%; justify-content:center;">
                        <button onclick="event.stopPropagation(); window.renameIconManager('${icon}')" style="background:#ffaa00; color:#000; border:none; padding:4px 8px; font-size:12px; cursor:pointer; font-weight:bold; border-radius:3px;">✏️</button>
                        <button onclick="event.stopPropagation(); window.deleteIconManager('${icon}')" style="background:#ff0000; color:#fff; border:none; padding:4px 8px; font-size:12px; cursor:pointer; font-weight:bold; border-radius:3px;">🗑️</button>
                    </div>
                `;
                grid.appendChild(div);
            });
        }
    });
};

window.handleIconClick = function(path) {
    if (window.iconSelectCallback) {
        window.iconSelectCallback(path);
        window.iconSelectCallback = null;
    }
};

window.renameIconManager = function(oldName) {
    const newName = prompt("Rename icon:", oldName);
    if (newName && newName !== oldName) {
        fetch('/api/icons/rename', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({old_name: oldName, new_name: newName})
        }).then(r=>r.json()).then(res=>{
            if(res.success) {
                showToast("Icon renamed! ✏️", "success");
                window.loadIconManager();
            } else {
                showToast("Rename failed.", "error");
            }
        });
    }
};

window.deleteIconManager = function(name) {
    if(confirm("Are you sure you want to annihilate this icon?")) {
        fetch('/api/icons/delete', {
            method:'POST', headers:{'Content-Type':'application/json'},
            body:JSON.stringify({name: name})
        }).then(r=>r.json()).then(res=>{
            if(res.success) {
                showToast("Icon deleted! 🗑️", "success");
                window.loadIconManager();
            } else {
                showToast("Delete failed.", "error");
            }
        });
    }
};

window.uploadIconManagerFile = function(input) {
    if(input.files.length) {
        let formData = new FormData();
        formData.append('file', input.files[0]);
        formData.append('key', 'keep_name');
        fetch('/api/upload_sys_icon', { method: 'POST', body: formData })
        .then(r=>r.json()).then(d => {
            if(d.success) {
                showToast("Icon uploaded like a boss! 🖼️", "success");
                window.loadIconManager();
            } else {
                showToast("Upload failed: " + d.error, "error");
            }
        });
        input.value = '';
    }
};

window.filterIconManager = function() {
    const filter = document.getElementById('icon-mgr-search').value.toLowerCase();
    const items = document.getElementById('icon-mgr-grid').children;
    for(let i=0; i<items.length; i++) {
        const name = items[i].querySelector('.icon-name').innerText.toLowerCase();
        items[i].style.display = name.includes(filter) ? 'flex' : 'none';
    }
};

window.updateBulkEditBtn = function() {
    const selected = document.querySelectorAll('.scan-btn.selected');
    const bulkBtn = document.getElementById('bulk-edit-btn');
    const ghostBtn = document.getElementById('ghost-run-btn');
    if (bulkBtn) {
        bulkBtn.style.display = selected.length > 1 ? 'flex' : 'none';
    }
    if (ghostBtn) {
        ghostBtn.style.display = selected.length > 0 ? 'flex' : 'none';
    }
};

window.runGhostInteractiveSelected = function() {
    if (!currentFolder) {
        showToast("Select a goddamn target folder first!", 'error');
        return;
    }
    const selectedBtns = document.querySelectorAll('.scan-btn.selected');
    if (selectedBtns.length === 0) return;
    
    selectedBtns.forEach(btn => {
        window.ghostRunInteractive(btn.id);
    });
    showToast("Ghost Interactive Terminals Launched! 👻", "success");
};

window.ghostRunInteractive = function(cmdId) {
    if (!currentFolder) return;
    const btn = document.getElementById(cmdId);
    if (!btn) return;
    if (!validateCommand(btn.dataset.command)) return;
    
    const termId = 'icmd__' + currentFolder.replace(/[/\\.]/g, '_') + '__' + cmdId;
    
    const isCompleted = btn.classList.contains('completed');
    if (interactiveTerminals[termId]) {
        if (isCompleted) {
            btn.classList.remove('completed');
            const resIcon = btn.querySelector('.result-icon');
            if (resIcon) resIcon.style.display = 'none';
        }
    }
    
    if (!interactiveTerminals[termId]) {
        const pane = document.createElement('div');
        pane.style.height = '100%';
        pane.style.width = '100%';
        pane.style.display = 'none';
        document.getElementById('interactive-terminal-container').appendChild(pane);
        
        let termTheme = { background: 'transparent', foreground: '#00ff00' };
        if (Object.keys(terminals).length > 0) {
            termTheme = terminals[Object.keys(terminals)[0]].options.theme;
        }
        
        const term = new Terminal({ cursorBlink: true, allowTransparency: true, theme: termTheme, convertEol: true });
        const fitAddon = new FitAddon.FitAddon();
        term.loadAddon(fitAddon);
        term.onResize(({ cols, rows }) => {
            socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: termId, client_id: clientId });
        });
        term.open(pane);
        
        term.onData(data => {
            socket.emit('pty_input', { input: data, term_id: termId, client_id: clientId });
            if (data === '\r' || data === '\n') {
                const b = document.getElementById(cmdId);
                if (b) { b.classList.add('in-progress'); updateRunBtnState(); }
            }
        });
        
        interactiveTerminals[termId] = { term, fitAddon, cmdId, pane };
        
        socket.emit('start_terminal', {
            folder: currentFolder,
            filename: termId + '.log',
            cmd_filename: btn.dataset.filename,
            term_id: termId,
            client_id: clientId,
            command: btn.dataset.command,
            auto_run: false,
            shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
        });
        
        setTimeout(() => {
            socket.emit('pty_input', { input: '\r', term_id: termId, client_id: clientId });
        }, 1500);
    }
    
    btn.classList.add('in-progress');
    btn.classList.remove('selected');
    updateRunBtnState();
};

window.openBulkEditModal = function() {
    document.getElementById('bulk-cmd-icon').value = '';
    document.getElementById('bulk-cmd-os-windows').value = '';
    document.getElementById('bulk-cmd-os-linux').value = '';
    window.showAndBringToFront('bulk-edit-modal');
};

window.saveBulkEdit = function() {
    const selected = document.querySelectorAll('.scan-btn.selected');
    const ids = Array.from(selected).map(btn => btn.id);
    
    const icon = document.getElementById('bulk-cmd-icon').value;
    const winStr = document.getElementById('bulk-cmd-os-windows').value;
    const linStr = document.getElementById('bulk-cmd-os-linux').value;
    
    let updates = {};
    if (icon.trim() !== '') updates.icon = icon.trim();
    if (winStr !== '') updates.os_windows = (winStr === 'true');
    if (linStr !== '') updates.os_linux = (linStr === 'true');
    
    if (Object.keys(updates).length === 0) {
        showToast('Nothing to update, fucker!', 'warning');
        return;
    }
    
    fetch('/bulk_edit_commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: ids, updates: updates })
    })
    .then(res => res.json())
    .then(data => {
        if(data.success) {
            closeModal('bulk-edit-modal');
            showToast('Commands brutally mass-edited! 💀', 'success');
            loadCommands();
        } else {
            showToast('Failed to bulk edit: ' + data.error, 'error');
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const selectionBox = document.getElementById('selection-box');
    const mainContent = document.querySelector('.main-content');
    if(!selectionBox || !mainContent) return;

    let isSelecting = false;
    let startX = 0, startY = 0;

    mainContent.addEventListener('mousedown', (e) => {
        if (e.target.closest('.scan-btn') || e.target.closest('button') || e.target.closest('.search-container') || e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.closest('#cmd-file-box') || e.target.closest('.modal') || e.target.closest('.drag-window') || e.target.closest('.sys-win-controls')) return;
        if (e.button !== 0) return; // Only left click
        e.preventDefault(); // PREVENT TEXT SELECTION GLITCHES
        isSelecting = true;
        startX = e.clientX;
        startY = e.clientY;
        selectionBox.style.left = startX + 'px';
        selectionBox.style.top = startY + 'px';
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
        
        if (!e.shiftKey && !e.ctrlKey) {
            document.querySelectorAll('.scan-btn').forEach(btn => btn.classList.remove('selected'));
            updateRunBtnState();
        }
    });

    document.addEventListener('mousemove', (e) => {
        if (!isSelecting) return;
        e.preventDefault(); // Extra protection against text selection during drag
        const currentX = e.clientX;
        const currentY = e.clientY;

        const left = Math.min(startX, currentX);
        const top = Math.min(startY, currentY);
        const width = Math.abs(startX - currentX);
        const height = Math.abs(startY - currentY);

        selectionBox.style.left = left + 'px';
        selectionBox.style.top = top + 'px';
        selectionBox.style.width = width + 'px';
        selectionBox.style.height = height + 'px';

        const boxRect = selectionBox.getBoundingClientRect();
        document.querySelectorAll('.scan-btn').forEach(btn => {
            if (btn.style.display === 'none') return;
            const btnRect = btn.getBoundingClientRect();
            if (
                btnRect.left < boxRect.right &&
                btnRect.right > boxRect.left &&
                btnRect.top < boxRect.bottom &&
                btnRect.bottom > boxRect.top
            ) {
                btn.classList.add('selected');
            } else {
                if (!e.shiftKey && !e.ctrlKey) {
                    btn.classList.remove('selected');
                }
            }
        });
        updateRunBtnState();
    });

    document.addEventListener('mouseup', (e) => {
        if (isSelecting) {
            isSelecting = false;
            selectionBox.style.display = 'none';
            updateRunBtnState();
        }
    });
});

window.onload = () => {
    if(typeof initPatternLock === 'function') initPatternLock();
    document.querySelectorAll('input, textarea').forEach(el => el.setAttribute('autocomplete', 'off'));
    isReactive = (localStorage.getItem('cyber_reactive_shadows') === 'true');
    window.setQuality(localStorage.getItem('cyber_quality') || 'potato');
    if (localStorage.getItem('cyber_box_layout') === 'true') document.body.classList.add('box-layout-active');

    const savedTab = localStorage.getItem('cyber_active_main_tab') || 'bugbounty';
    switchMainTab(savedTab);
    
    const animateBg = localStorage.getItem('cyber_animate_bg') === 'true';
    if (document.getElementById('bg-animate-check')) document.getElementById('bg-animate-check').checked = animateBg;
    if (animateBg) document.body.classList.add('animate-bg');

    document.querySelectorAll('.modal-content').forEach(modal => {
        if (modal.id !== 'tool-terminal-modal' && modal.parentElement.id !== 'multi-terminal-modal') {
            makeGlobalDraggable(modal);
        }
    });
    
    injectWindowControls();

    loadCommands(); 
    loadPlugins(); 
    fetchCmdImageCounts();
    updateSysStats(); 
    fetch('/get_sys_settings').then(res => res.json()).then(data => {
        window.sysAttackerIp = data.attacker_ip || '';
        window.sysAttackerUrl = data.attacker_url || '';
        window.activeBackground = data.active_background || '';
        window.applyBackground(window.activeBackground);
        if(data.icon_type) { localStorage.setItem('cyber_icon_type', data.icon_type); }
        if(data.theme) { window.setTheme(data.theme); }
        if(window.applyLockScreenStyles) window.applyLockScreenStyles(data);
        if(data.icons) { window.sysIcons = data.icons; applyCustomIcons(data.icons); }
        if(window.hydrateIcons) window.hydrateIcons(document, true);
        if(data.custom_tools && window.renderCustomToolsSidebar) window.renderCustomToolsSidebar(data.custom_tools);
        loadUILayout();
        setTimeout(initUIReordering, 1000); // Initialize drag and drop after DOM populates
    });
    fetch('/api/bg/config').then(r=>r.json()).then(cfg => {
        window.bgConfig = cfg;
        window.startBgAutoChanger();
    });
};

let canvasNetwork = null;
let canvasNodes = new vis.DataSet();
let canvasEdges = new vis.DataSet();
let canvasNodeIdCounter = 0;
let usedCanvasCmds = new Set();

function openCanvasModal() {
    if (!currentFolder) {
        showToast("Select a goddamn target folder first, you stupid fuck!", 'error');
        return;
    }
    window.showAndBringToFront('canvas-modal');
    renderCanvasSidebar();
    renderCanvasWorkflowList();
    
    if (!canvasNetwork) {
        const container = document.getElementById('canvas-network-container');
        const options = {
            interaction: { hover: true, selectConnectedEdges: false },
            physics: false,
            edges: {
                color: { color: 'transparent', highlight: 'transparent', hover: 'transparent' },
                smooth: false,
                width: 0,
                selectionWidth: 0
            },
            nodes: {
                shape: 'box',
                margin: 15,
                borderWidth: 2,
                color: { 
                    background: '#050510', 
                    border: '#00ffcc',
                    highlight: { background: '#1a001a', border: '#ff00ff' },
                    hover: { background: '#111', border: '#ffaa00' }
                },
                font: { color: '#00ffcc', face: 'monospace', size: 14, bold: true }
            }
        };
        canvasNetwork = new vis.Network(container, { nodes: canvasNodes, edges: canvasEdges }, options);

        canvasNetwork.on('zoom', updateAllPinsPositions);
        canvasNetwork.on('dragging', updateAllPinsPositions);
        canvasNetwork.on('dragNode', updateAllPinsPositions);

        canvasNetwork.on('click', function(params) {
            if (params.edges.length > 0 && params.nodes.length === 0) {
                if (confirm("Delete this connection?")) canvasEdges.remove(params.edges[0]);
            }
        });

        canvasNetwork.on('afterDrawing', function() {
            drawMainCanvasEdges();
            updateAllPinsPositions();
        });

        canvasNetwork.on('doubleClick', function(params) {
            if (params.nodes.length > 0) {
                if (confirm("Delete this node?")) {
                    const node = canvasNodes.get(params.nodes[0]);
                    if(node) {
                        usedCanvasCmds.delete(node.cmdId);
                        renderCanvasSidebar();
                    }
                    canvasNodes.remove(params.nodes[0]);
                }
            }
        });
        
        const workspace = document.getElementById('canvas-workspace');
        workspace.addEventListener('dragover', (e) => e.preventDefault());
        workspace.addEventListener('drop', (e) => {
            e.preventDefault();
            const cmdId = e.dataTransfer.getData('cmdId');
            if (cmdId && !usedCanvasCmds.has(cmdId)) {
                const cmd = commandsData.find(c => c.id === cmdId);
                if (cmd) {
                    usedCanvasCmds.add(cmdId);
                    renderCanvasSidebar();
                    const rect = workspace.getBoundingClientRect();
                    const pos = canvasNetwork.DOMtoCanvas({x: e.clientX - rect.left, y: e.clientY - rect.top});
                    canvasNodeIdCounter++;
                    
                    canvasNodes.add({
                        id: canvasNodeIdCounter,
                        label: cmd.name,
                        x: pos.x,
                        y: pos.y,
                        cmdId: cmd.id,
                        command: cmd.command,
                        filename: cmd.filename
                    });
                }
            }
        });
    }
}

function renderCanvasSidebar() {
    const list = document.getElementById('canvas-commands-list');
    const filter = document.getElementById('canvas-cmd-search-input')?.value.toLowerCase() || '';
    list.innerHTML = '';
    commandsData.forEach(cmd => {
        if (!cmd.name.toLowerCase().includes(filter)) return;
        const div = document.createElement('div');
        div.style.padding = '8px';
        div.style.marginBottom = '5px';
        if (usedCanvasCmds.has(cmd.id)) {
            div.style.background = '#000';
            div.style.border = '1px solid #333';
            div.style.color = '#555';
            div.style.cursor = 'not-allowed';
            div.innerText = cmd.name + ' [USED]';
            div.draggable = false;
        } else {
            div.style.background = '#1a1a2e';
            div.style.border = '1px solid #ff00ff';
            div.style.color = '#00ffcc';
            div.style.cursor = 'grab';
            div.innerText = cmd.name;
            div.draggable = true;
            div.ondragstart = (e) => {
                e.dataTransfer.setData('cmdId', cmd.id);
            };
            div.onmouseover = () => div.style.boxShadow = '0 0 10px #ff00ff';
            div.onmouseout = () => div.style.boxShadow = 'none';
        }
        list.appendChild(div);
    });
}

function renderCanvasWorkflowList() {
    const list = document.getElementById('canvas-workflow-list-sidebar');
    const filter = document.getElementById('canvas-workflow-search-input')?.value.toLowerCase() || '';
    fetch('/get_workflows').then(res => res.json()).then(files => {
        list.innerHTML = '';
        files.forEach(f => {
            if (!f.toLowerCase().includes(filter)) return;
            const div = document.createElement('div');
            div.style.padding = '8px';
            div.style.marginBottom = '5px';
            div.style.background = '#0d1117';
            div.style.border = '1px solid #00ccff';
            div.style.color = '#00ccff';
            div.style.cursor = 'pointer';
            div.innerText = f;
            div.onclick = () => loadWorkflow(f);
            div.onmouseover = () => div.style.boxShadow = '0 0 10px #00ccff';
            div.onmouseout = () => div.style.boxShadow = 'none';
            list.appendChild(div);
        });
    });
}

function toggleCanvasFullscreen() {
    const modal = document.querySelector('#canvas-modal .modal-content');
    modal.classList.toggle('fullscreen-mode');
    document.body.style.overflow = document.querySelectorAll('.fullscreen-mode').length > 0 ? 'hidden' : '';
    if (canvasNetwork) canvasNetwork.redraw();
}

function clearCanvas() {
    canvasNodes.clear();
    canvasEdges.clear();
    usedCanvasCmds.clear();
    const pinsContainer = document.getElementById('canvas-pins-container');
    if (pinsContainer) pinsContainer.innerHTML = '';
    const tempEdge = document.getElementById('canvas-temp-edge');
    const svg = document.getElementById('canvas-edge-svg');
    if (svg && tempEdge) {
        svg.innerHTML = '';
        svg.appendChild(tempEdge);
    }
    renderCanvasSidebar();
}

function startCanvasWorkflow() {
    if (!currentFolder) {
        showToast("Target missing, you idiot!", 'error');
        return;
    }
    
    if (!window.canvasTerminalSpaceActive) {
        toggleCanvasTerminalSpace();
    }
    
    const nodes = canvasNodes.get();
    const edges = canvasEdges.get();
    
    if (nodes.length === 0) return;
    
    const inDegree = {};
    nodes.forEach(n => {
        inDegree[n.id] = 0;
        canvasNodes.update({id: n.id, color: { background: '#111', border: '#00ffcc' }});
    });
    
    edges.forEach(e => {
        inDegree[e.to]++;
    });
    
    const queue = [];
    nodes.forEach(n => {
        if (inDegree[n.id] === 0) queue.push(n.id);
    });
    
    if (queue.length === 0) {
        showToast("Cycle detected or no starting nodes! Fix your shit.", 'error');
        return;
    }
    
    queue.forEach(nodeId => {
        const inst = window.canvasTerminalInstances[nodeId];
        if (inst) {
            inst.isRunning = true;
            inst.box.classList.add('pulse-orange');
            inst.box.style.borderColor = '#ffaa00';
            setTimeout(() => {
                socket.emit('pty_input', { input: '\r', term_id: inst.id, client_id: clientId });
            }, 1000);
        }
    });
}

let isMouseOverPins = false;
let hoveredCanvasNode = null;
let isDraggingEdge = false;
let edgeStartNode = null;
let activePinSide = null;

function drawMainCanvasEdges() {
    const svg = document.getElementById('canvas-edge-svg');
    if (!svg || document.getElementById('canvas-workspace').style.display === 'none') return;
    Array.from(svg.children).forEach(child => {
        if (child.id !== 'canvas-temp-edge') child.remove();
    });
    if (!canvasNetwork) return;
    svg.style.display = 'block';
    const edges = canvasEdges.get();
    const positions = canvasNetwork.getPositions();
    edges.forEach(e => {
        const fromPos = positions[e.from];
        const toPos = positions[e.to];
        if (!fromPos || !toPos) return;
        const fDom = canvasNetwork.canvasToDOM(fromPos);
        const tDom = canvasNetwork.canvasToDOM(toPos);
        
        const fBox = canvasNetwork.getBoundingBox(e.from);
        const fTL = canvasNetwork.canvasToDOM({x: fBox.left, y: fBox.top});
        const fBR = canvasNetwork.canvasToDOM({x: fBox.right, y: fBox.bottom});
        const fW = fBR.x - fTL.x;
        const fH = fBR.y - fTL.y;

        const tBox = canvasNetwork.getBoundingBox(e.to);
        const tTL = canvasNetwork.canvasToDOM({x: tBox.left, y: tBox.top});
        const tBR = canvasNetwork.canvasToDOM({x: tBox.right, y: tBox.bottom});
        const tW = tBR.x - tTL.x;
        const tH = tBR.y - tTL.y;

        const fSide = e.fromSide || 'right';
        const tSide = e.toSide || 'left';
        
        let px1 = fDom.x, py1 = fDom.y;
        if(fSide==='top') py1 -= fH/2;
        else if(fSide==='bottom') py1 += fH/2;
        else if(fSide==='left') px1 -= fW/2;
        else if(fSide==='right') px1 += fW/2;
        
        let px2 = tDom.x, py2 = tDom.y;
        if(tSide==='top') py2 -= tH/2;
        else if(tSide==='bottom') py2 += tH/2;
        else if(tSide==='left') px2 -= tW/2;
        else if(tSide==='right') px2 += tW/2;
        
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", calcBezier(px1, py1, fSide, px2, py2, tSide));
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#ff00ff");
        path.setAttribute("stroke-width", "4");
        path.style.filter = "drop-shadow(0 0 5px #ff00ff)";
        svg.appendChild(path);
    });
}

function calcBezier(x1, y1, s1, x2, y2, s2) {
    const dist = Math.hypot(x2-x1, y2-y1), off = Math.min(dist*0.5, 150);
    let c1x=x1, c1y=y1, c2x=x2, c2y=y2;
    if(s1==='top') c1y-=off; else if(s1==='bottom') c1y+=off; else if(s1==='left') c1x-=off; else c1x+=off;
    if(s2==='top') c2y-=off; else if(s2==='bottom') c2y+=off; else if(s2==='left') c2x-=off; else c2x+=off;
    return `M ${x1} ${y1} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${x2} ${y2}`;
}

function updateAllPinsPositions() {
    const pinsContainer = document.getElementById('canvas-pins-container');
    if (!pinsContainer || !canvasNetwork) return;
    
    const nodes = canvasNodes.get();
    const positions = canvasNetwork.getPositions();
    
    Array.from(pinsContainer.children).forEach(child => {
        if (!canvasNodes.get(child.dataset.nodeId)) {
            child.remove();
        }
    });

    nodes.forEach(node => {
        let pinGroup = document.getElementById('pin-group-' + node.id);
        if (!pinGroup) {
            pinGroup = document.createElement('div');
            pinGroup.id = 'pin-group-' + node.id;
            pinGroup.className = 'canvas-pin-group';
            pinGroup.dataset.nodeId = node.id;
            pinGroup.style.position = 'absolute';
            pinGroup.style.pointerEvents = 'none';
            pinGroup.style.zIndex = '10';
            
            const createPin = (side) => {
                const pin = document.createElement('div');
                pin.className = 'canvas-pin';
                pin.dataset.side = side;
                pin.dataset.nodeId = node.id;
                pin.style.pointerEvents = 'auto';
                pin.addEventListener('mousedown', function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    isDraggingEdge = true;
                    edgeStartNode = node.id;
                    activePinSide = side;
                    const rect = document.getElementById('canvas-workspace').getBoundingClientRect();
                    const pinRect = e.target.getBoundingClientRect();
                    const startX = pinRect.left + pinRect.width/2 - rect.left;
                    const startY = pinRect.top + pinRect.height/2 - rect.top;
                    const tempEdge = document.getElementById('canvas-temp-edge');
                    tempEdge.dataset.startX = startX;
                    tempEdge.dataset.startY = startY;
                    tempEdge.setAttribute('d', `M ${startX} ${startY} L ${startX} ${startY}`);
                    document.getElementById('canvas-edge-svg').style.display = 'block';
                });
                return pin;
            };
            
            pinGroup.appendChild(createPin('top'));
            pinGroup.appendChild(createPin('bottom'));
            pinGroup.appendChild(createPin('left'));
            pinGroup.appendChild(createPin('right'));
            
            pinsContainer.appendChild(pinGroup);
        }
        
        const pos = positions[node.id];
        if (!pos) return;
        const domPos = canvasNetwork.canvasToDOM(pos);
        const boundingBox = canvasNetwork.getBoundingBox(node.id);
        const topLeft = canvasNetwork.canvasToDOM({x: boundingBox.left, y: boundingBox.top});
        const bottomRight = canvasNetwork.canvasToDOM({x: boundingBox.right, y: boundingBox.bottom});
        const w = bottomRight.x - topLeft.x;
        const h = bottomRight.y - topLeft.y;
        
        pinGroup.style.left = domPos.x + 'px';
        pinGroup.style.top = domPos.y + 'px';
        
        const pins = pinGroup.children;
        pins[0].style.top = (-h/2) + 'px'; pins[0].style.left = '0px'; 
        pins[1].style.top = (h/2) + 'px'; pins[1].style.left = '0px'; 
        pins[2].style.top = '0px'; pins[2].style.left = (-w/2) + 'px'; 
        pins[3].style.top = '0px'; pins[3].style.left = (w/2) + 'px'; 
    });
}

document.getElementById('canvas-workspace').addEventListener('mousemove', function(e) {
    if (isDraggingEdge) {
        const rect = this.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const tempEdge = document.getElementById('canvas-temp-edge');
        const startX = parseFloat(tempEdge.dataset.startX);
        const startY = parseFloat(tempEdge.dataset.startY);
        let targetSide = 'left';
        if (activePinSide === 'left') targetSide = 'right';
        else if (activePinSide === 'right') targetSide = 'left';
        else if (activePinSide === 'top') targetSide = 'bottom';
        else if (activePinSide === 'bottom') targetSide = 'top';
        const d = calcBezier(startX, startY, activePinSide, x, y, targetSide);
        tempEdge.setAttribute('d', d);
    }
});

document.addEventListener('mouseup', function(e) {
    if (isDraggingEdge) {
        isDraggingEdge = false;
        const tempEdge = document.getElementById('canvas-temp-edge');
        tempEdge.setAttribute('d', '');
        
        const rect = document.getElementById('canvas-workspace').getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const canvasPos = canvasNetwork.DOMtoCanvas({x, y});
        let targetNode = canvasNetwork.getNodeAt({x, y});
        if (!targetNode && e.target.classList.contains('canvas-pin')) {
            targetNode = isNaN(e.target.dataset.nodeId) ? e.target.dataset.nodeId : parseInt(e.target.dataset.nodeId);
        }
        
        if (targetNode && targetNode !== edgeStartNode) {
            const fromPos = canvasNetwork.getPositions([edgeStartNode])[edgeStartNode];
            const toPos = canvasNetwork.getPositions([targetNode])[targetNode];
            let targetSide = 'left';
            if (e.target.classList.contains('canvas-pin')) {
                targetSide = e.target.dataset.side;
            } else if (fromPos && toPos) {
                const dx = toPos.x - fromPos.x;
                const dy = toPos.y - fromPos.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    targetSide = dx > 0 ? 'left' : 'right';
                } else {
                    targetSide = dy > 0 ? 'top' : 'bottom';
                }
            }
            const existingEdges = canvasEdges.get({
                filter: item => (item.from === edgeStartNode && item.to === targetNode)
            });
            if (existingEdges.length === 0) {
                canvasEdges.add({ from: edgeStartNode, to: targetNode, fromSide: activePinSide, toSide: targetSide });
                drawMainCanvasEdges();
            }
        }
        edgeStartNode = null;
    }
});

function openSaveWorkflowModal() {
    document.getElementById('workflow-save-name').value = '';
    window.showAndBringToFront('save-workflow-modal');
}

function saveWorkflow() {
    const name = document.getElementById('workflow-save-name').value;
    if (!name) { showToast('Enter a goddamn name!', 'error'); return; }
    
    if (canvasNetwork) {
        const positions = canvasNetwork.getPositions();
        const updates = [];
        for (let nodeId in positions) {
            updates.push({ id: nodeId, x: positions[nodeId].x, y: positions[nodeId].y });
        }
        canvasNodes.update(updates);
    }
    
    const nodes = canvasNodes.get();
    const edges = canvasEdges.get();
    fetch('/save_workflow', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: name, nodes: nodes, edges: edges })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            closeModal('save-workflow-modal');
            showToast('Workflow saved!', 'success');
        }
    });
}

function openLoadWorkflowModal() {
    fetch('/get_workflows').then(res => res.json()).then(files => {
        const list = document.getElementById('workflow-list');
        list.innerHTML = '';
        files.forEach(f => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #555';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = f;
            li.onclick = () => loadWorkflow(f);
            list.appendChild(li);
        });
        document.getElementById('workflow-search').value = '';
        window.showAndBringToFront('load-workflow-modal');
    });
}

function filterWorkflows() {
    const filter = document.getElementById('workflow-search').value.toLowerCase();
    const items = document.getElementById('workflow-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

window.canvasTerminalSpaceActive = false;
window.canvasTerminalInstances = {};

function toggleCanvasTerminalSpace() {
    const space = document.getElementById('canvas-terminal-space');
    const workspace = document.getElementById('canvas-workspace');
    const btn = document.getElementById('btn-canvas-terminal-space');

    window.canvasTerminalSpaceActive = !window.canvasTerminalSpaceActive;

    if (window.canvasTerminalSpaceActive) {
        space.style.display = 'block';
        workspace.style.display = 'none';
        btn.innerText = '🗺️ BACK TO CANVAS';
        btn.style.background = '#00ccff';
        renderTerminalSpace();
    } else {
        space.style.display = 'none';
        workspace.style.display = 'block';
        btn.innerText = '📺 FULL TERMINAL SPACE';
        btn.style.background = '#ff00ff';
        Object.values(window.canvasTerminalInstances).forEach(t => {
            socket.emit('kill_terminal', { client_id: clientId, term_id: t.id });
        });
        window.canvasTerminalInstances = {};
    }
}

function renderTerminalSpace() {
    const space = document.getElementById('canvas-terminal-space');
    space.innerHTML = '<svg id="term-space-svg" style="position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:0;"></svg>';
    const nodes = canvasNodes.get();
    if (nodes.length === 0) {
        space.innerHTML = '<div style="color:#ff0000; font-weight:bold; text-align:center; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">NO NODES DETECTED. DROP SOME COMMANDS FIRST, MORON.</div>';
        return;
    }

    nodes.forEach((node, idx) => {
        const termId = 'cterm__' + node.id + '_' + Date.now();
        const box = document.createElement('div');
        box.className = 'terminal-space-box';
        box.id = 'box-' + termId;
        
        // Default positioning
        const offset = idx * 30;
        box.style.left = (50 + offset) + 'px';
        box.style.top = (50 + offset) + 'px';

        let cmdToRun = node.command || '';
        if (cmdToRun) {
            cmdToRun = cmdToRun.replace(/\{target\}/g, currentFolder ? currentFolder.split('/').pop() : '{target}');
            cmdToRun = cmdToRun.replace(/\{http-or-https\}/g, window.globalProtocol);
        }

        box.innerHTML = `
            <div class="term-space-header" id="handle-${termId}">
                <div style="display:flex; align-items:center; gap:10px;">
                    <span class="status-indicator active" id="status-${termId}"></span>
                    <span style="color:#00ffcc; font-weight:bold;">[${node.label}]</span>
                </div>
                <div class="term-space-cmd-display">CMD: ${cmdToRun}</div>
                <div style="display:flex; gap:10px;">
                    <button class="term-space-stop-btn" onclick="socket.emit('pty_input', { input: String.fromCharCode(3), term_id: '${termId}', client_id: clientId });">🛑 STOP</button>
                    <span class="close-box" onclick="this.parentElement.parentElement.parentElement.remove()" style="cursor:pointer; color:red;">&times;</span>
                </div>
            </div>
            <div id="cont-${termId}" class="term-space-body"></div>
            <div class="term-pin term-pin-top" data-side="top"></div>
            <div class="term-pin term-pin-bottom" data-side="bottom"></div>
            <div class="term-pin term-pin-left" data-side="left"></div>
            <div class="term-pin term-pin-right" data-side="right"></div>`;
        
        space.appendChild(box);

        const term = new Terminal({ 
            cursorBlink: true, 
            allowTransparency: true, 
            fontSize: 12, 
            theme: { background: 'transparent', foreground: '#00ff00' }, 
            convertEol: true 
        });
        const fit = new FitAddon.FitAddon();
        term.loadAddon(fit);
        term.onResize(({ cols, rows }) => {
            socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: termId, client_id: clientId });
        });
        term.open(box.querySelector('.term-space-body'));
        
        term.onData(data => {
            socket.emit('pty_input', { input: data, term_id: termId, client_id: clientId });
            if (data === '\r' || data === '\n') {
                const inst = window.canvasTerminalInstances[node.id];
                if (inst && !inst.isRunning) {
                    inst.isRunning = true;
                    inst.box.classList.add('pulse-orange');
                    inst.box.style.borderColor = '#ffaa00';
                    if (typeof canvasEdges !== 'undefined') {
                        const inEdges = canvasEdges.get({ filter: e => e.to === node.id });
                        inEdges.forEach(e => {
                            const path = document.getElementById(`edge-${e.from}-${e.to}`);
                            if(path) { path.setAttribute("stroke", "#ffaa00"); path.classList.add("edge-pulse"); }
                        });
                    }
                }
            }
        });

        const instObj = { id: termId, term, fit, node, box, completedParents: 0 };
        instObj.onComplete = () => {
            if (typeof canvasEdges === 'undefined') return;
            const outEdges = canvasEdges.get({ filter: e => e.from === node.id });
            outEdges.forEach(e => {
                const path = document.getElementById(`edge-${e.from}-${e.to}`);
                if(path) { path.setAttribute("stroke", "#00ff00"); path.classList.remove("edge-pulse"); }
                
                const childInst = window.canvasTerminalInstances[e.to];
                if (childInst) {
                    childInst.completedParents++;
                    const totalParents = canvasEdges.get({ filter: edge => edge.to === e.to }).length;
                    if (childInst.completedParents >= totalParents) {
                        childInst.completedParents = 0;
                        childInst.isRunning = true;
                        childInst.box.classList.add('pulse-orange');
                        childInst.box.style.borderColor = '#ffaa00';
                        
                        const childInEdges = canvasEdges.get({ filter: edge => edge.to === e.to });
                        childInEdges.forEach(ce => {
                            const p = document.getElementById(`edge-${ce.from}-${ce.to}`);
                            if(p) { p.setAttribute("stroke", "#ffaa00"); p.classList.add("edge-pulse"); }
                        });
                        
                        setTimeout(() => {
                            socket.emit('pty_input', { input: '\r', term_id: childInst.id, client_id: clientId });
                        }, 1000);
                    }
                }
            });
        };
        window.canvasTerminalInstances[node.id] = instObj;

        socket.emit('start_terminal', {
            folder: currentFolder,
            filename: termId + '.log', 
            cmd_filename: node.filename,
            term_id: termId,
            client_id: clientId,
            command: node.command || '',
            auto_run: false,
            shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
        });

        makeElementDraggableWithin(box, box.querySelector('.term-space-header'), space);

        setTimeout(() => fit.fit(), 100);
    });
    drawTermSpaceEdges();
}

function drawTermSpaceEdges() {
    const svg = document.getElementById('term-space-svg');
    if (!svg) return;
    svg.innerHTML = '';
    const edges = canvasEdges.get();
    edges.forEach(e => {
        const fromInst = window.canvasTerminalInstances[e.from];
        const toInst = window.canvasTerminalInstances[e.to];
        if (fromInst && toInst) {
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.id = `edge-${e.from}-${e.to}`;
            path.setAttribute("fill", "none");
            path.setAttribute("stroke", "#ff00ff");
            path.setAttribute("stroke-width", "3");
            path.setAttribute("stroke-dasharray", "5,5");
            svg.appendChild(path);
            updateTermSpaceEdge(e.from, e.to);
        }
    });
}

function updateTermSpaceEdge(fromId, toId) {
    const edge = canvasEdges.get({ filter: e => e.from === fromId && e.to === toId })[0];
    const path = document.getElementById(`edge-${fromId}-${toId}`);
    const fromInst = window.canvasTerminalInstances[fromId];
    const toInst = window.canvasTerminalInstances[toId];
    if (path && fromInst && toInst && edge) {
        const b1 = fromInst.box;
        const b2 = toInst.box;
        
        let x1 = b1.offsetLeft, y1 = b1.offsetTop, w1 = b1.offsetWidth, h1 = b1.offsetHeight;
        let x2 = b2.offsetLeft, y2 = b2.offsetTop, w2 = b2.offsetWidth, h2 = b2.offsetHeight;
        
        const fSide = edge.fromSide || 'right';
        const tSide = edge.toSide || 'left';
        
        let px1 = x1 + w1/2, py1 = y1 + h1/2;
        if(fSide==='top') { py1 = y1; }
        else if(fSide==='bottom') { py1 = y1 + h1; }
        else if(fSide==='left') { px1 = x1; }
        else if(fSide==='right') { px1 = x1 + w1; }

        let px2 = x2 + w2/2, py2 = y2 + h2/2;
        if(tSide==='top') { py2 = y2; }
        else if(tSide==='bottom') { py2 = y2 + h2; }
        else if(tSide==='left') { px2 = x2; }
        else if(tSide==='right') { px2 = x2 + w2; }
        
        path.setAttribute("d", calcBezier(px1, py1, fSide, px2, py2, tSide));
    }
}

function makeElementDraggableWithin(elmnt, handle, container) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        if (e.target.tagName === 'BUTTON') return;
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        // Bring to front
        document.querySelectorAll('.terminal-space-box').forEach(b => b.style.zIndex = 1);
        elmnt.style.zIndex = 100;
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        
        let newTop = elmnt.offsetTop - pos2;
        let newLeft = elmnt.offsetLeft - pos1;

        // Constraints
        if (newTop < 0) newTop = 0;
        if (newLeft < 0) newLeft = 0;
        if (newTop + elmnt.offsetHeight > container.offsetHeight) newTop = container.offsetHeight - elmnt.offsetHeight;
        if (newLeft + elmnt.offsetWidth > container.offsetWidth) newLeft = container.offsetWidth - elmnt.offsetWidth;

        elmnt.style.top = newTop + "px";
        elmnt.style.left = newLeft + "px";
        
        const instId = Object.keys(window.canvasTerminalInstances).find(k => window.canvasTerminalInstances[k].box === elmnt);
        if (instId && typeof updateTermSpaceEdge === 'function') {
            canvasEdges.get().forEach(e => {
                if (e.from == instId || e.to == instId) updateTermSpaceEdge(e.from, e.to);
            });
        }
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function loadWorkflow(name) {
    fetch('/load_workflow', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: name })
    }).then(res => res.json()).then(data => {
        if(data.success) {
            canvasNodes.clear();
            canvasEdges.clear();
            const pinsContainer = document.getElementById('canvas-pins-container');
            if (pinsContainer) pinsContainer.innerHTML = '';
            
            // Re-apply box shape to nodes from older workflows if needed
            const nodes = data.workflow.nodes.map(n => {
                n.shape = 'box';
                n.margin = 15;
                return n;
            });
            
            canvasNodes.add(nodes);
            canvasEdges.add(data.workflow.edges);
            let maxId = 0;
            usedCanvasCmds.clear();
            nodes.forEach(n => { 
                if (n.id > maxId) maxId = n.id; 
                usedCanvasCmds.add(n.cmdId);
            });
            canvasNodeIdCounter = maxId;
            renderCanvasSidebar();
            setTimeout(() => {
                updateAllPinsPositions();
                drawMainCanvasEdges();
            }, 100);
            closeModal('load-workflow-modal');
        }
    });
}

window.browserTabs = {};
window.activeBrowserTabId = null;
window.browserTabCounter = 0;

window.createNewBrowserTab = function(url = 'about:blank') {
    window.browserTabCounter++;
    const tabId = 'btab_' + window.browserTabCounter;
    const tab = document.createElement('div');
    tab.className = 'browser-tab-item';
    tab.id = 'tab_ui_' + tabId;
    tab.style = "background: #233440; color: #aaa; padding: 8px 15px 8px 20px; border-radius: 10px 10px 0 0; font-family: sans-serif; font-size: 0.85em; display: flex; align-items: center; gap: 15px; border: 1px solid #233440; border-bottom: none; cursor: pointer; min-width: 150px; max-width: 200px;";
    tab.innerHTML = `<span class="tab-indicator" style="display:inline-block; width:10px; height:10px; background:#555; border-radius:50%;"></span><span class="tab-title" style="font-weight:bold; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1;">New Tab</span><span style="cursor:pointer; font-size:1.2em; color:#aaa; transition: 0.2s;" onmouseover="this.style.color='#ff0000'" onmouseout="this.style.color='#aaa'" onclick="event.stopPropagation(); window.closeBrowserTab('${tabId}')">&times;</span>`;
    tab.onclick = () => window.switchBrowserTab(tabId);
    document.getElementById('browser-tabs-container').appendChild(tab);
    const iframe = document.createElement('iframe');
    iframe.id = 'iframe_' + tabId;
    iframe.style = "flex: 1; width: 100%; height: 100%; border: none; background: #050510; box-shadow: inset 0 0 20px rgba(0,255,204,0.1); border-radius: 2px; display: none;";
    const blankHtml = `<html><body style="margin:0;height:100vh;display:flex;align-items:center;justify-content:center;background-color:#050510;"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="300" height="300" style="opacity:0.6; filter:drop-shadow(0 0 20px #ff0000);"><circle cx="50" cy="50" r="45" fill="none" stroke="#ff0000" stroke-width="4"/><path d="M50 5 L95 50 L50 95 L5 50 Z" fill="#ff0000" opacity="0.6"/><text x="50" y="55" font-family="Courier New" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">UMBRELLA</text></svg></body></html>`;
    iframe.src = url === 'about:blank' ? "data:text/html;charset=utf-8," + encodeURIComponent(blankHtml) : url;
    document.getElementById('browser-iframes-container').appendChild(iframe);
    window.browserTabs[tabId] = { id: tabId, url: url, iframe: iframe, tabUi: tab };
    window.switchBrowserTab(tabId);
};

window.switchBrowserTab = function(tabId) {
    if (!window.browserTabs[tabId]) return;
    window.activeBrowserTabId = tabId;
    for (let id in window.browserTabs) {
        let t = window.browserTabs[id];
        t.iframe.style.display = 'none';
        t.tabUi.style.background = '#233440';
        t.tabUi.style.color = '#aaa';
        t.tabUi.querySelector('.tab-indicator').style.background = '#555';
        t.tabUi.querySelector('.tab-indicator').style.boxShadow = 'none';
    }
    let activeT = window.browserTabs[tabId];
    activeT.iframe.style.display = 'block';
    activeT.tabUi.style.background = '#3a4148';
    activeT.tabUi.style.color = '#e0e0e0';
    activeT.tabUi.querySelector('.tab-indicator').style.background = '#00ffcc';
    activeT.tabUi.querySelector('.tab-indicator').style.boxShadow = '0 0 5px #00ffcc';
    document.getElementById('preview-url-input').value = activeT.url === 'about:blank' ? '' : activeT.url;
};

window.closeBrowserTab = function(tabId) {
    if (!window.browserTabs[tabId]) return;
    let t = window.browserTabs[tabId];
    t.tabUi.remove();
    t.iframe.remove();
    delete window.browserTabs[tabId];
    let remaining = Object.keys(window.browserTabs);
    if (remaining.length > 0) {
        if (window.activeBrowserTabId === tabId) {
            window.switchBrowserTab(remaining[remaining.length - 1]);
        }
    } else {
        window.activeBrowserTabId = null;
        document.getElementById('preview-url-input').value = '';
        window.createNewBrowserTab();
    }
};

window.updateActiveTabUrl = function(url) {
    if (!window.activeBrowserTabId) return;
    window.browserTabs[window.activeBrowserTabId].url = url;
    let tabTitle = window.browserTabs[window.activeBrowserTabId].tabUi.querySelector('.tab-title');
    tabTitle.innerText = url;
    document.getElementById('preview-url-input').value = url;
};

function openPreviewModal() {
    if (Object.keys(window.browserTabs).length === 0) window.createNewBrowserTab();
    window.showAndBringToFront('preview-modal');
}

window.togglePreviewFullscreen = function() {
    const modalContent = document.querySelector('#preview-modal .modal-content');
    const btn = document.querySelector('#preview-modal .maximize-btn');
    
    if (!modalContent.classList.contains('fullscreen-mode')) {
        modalContent.classList.add('fullscreen-mode');
        btn.innerText = '❐';
    } else {
        modalContent.classList.remove('fullscreen-mode');
        btn.innerText = '□';
    }
    document.body.style.overflow = document.querySelectorAll('.fullscreen-mode').length > 0 ? 'hidden' : '';
};

window.bookmarkUrl = function() {
    showToast('URL Bookmarked! ⭐ (Not really, but it looks cool)', 'success');
};

function loadPreviewUrl() {
    let url = document.getElementById('preview-url-input').value.trim();
    let ua = document.getElementById('preview-browser-select').value;
    let mode = document.getElementById('preview-render-mode');
    let renderMode = mode ? mode.value : 'proxy';
    if (!url) return;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
    }
    if (!window.activeBrowserTabId) window.createNewBrowserTab();
    const activeIframe = document.getElementById('iframe_' + window.activeBrowserTabId);
    if (!activeIframe) return;
    if (renderMode === 'iframe' || ua === 'raw_iframe') {
        activeIframe.src = url;
    } else if (ua === 'playwright_html') {
        activeIframe.src = "/playwright_proxy?mode=html&url=" + encodeURIComponent(url);
    } else if (ua === 'playwright_png') {
        activeIframe.src = "/playwright_proxy?mode=screenshot&url=" + encodeURIComponent(url);
    } else {
        activeIframe.src = "/proxy?url=" + encodeURIComponent(url) + "&ua=" + encodeURIComponent(ua);
    }
    window.updateActiveTabUrl(url);
}

function pullFromGithub() {
    if (confirm('Are you sure you want to rip down files from GitHub? This will OVERWRITE your local commands.json and sync notes/commands!')) {
        showToast('Pulling from GitHub...', 'warning');
        fetch('/github_pull', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                showToast('GitHub Sync Complete! Rebooting interface...', 'success');
                setTimeout(() => location.reload(), 1500);
            } else {
                showToast('Failed to pull: ' + data.error, 'error');
            }
        }).catch(err => showToast('Error pulling from GitHub', 'error'));
    }
}

window.arpStatusData = { status: 'safe' };
window.updateArpUI = function(data) {
    const btn = document.getElementById('arp-monitor-btn');
    if(!btn) return;
    if(data.status === 'attack') {
        btn.style.color = '#ff0000';
        btn.style.textShadow = '0 0 15px #ff0000';
        btn.classList.add('pulse-orange');
        btn.title = data.details || 'ARP SPOOFING DETECTED!';
        if(window.arpStatusData.status !== 'attack') {
            showToast("CRITICAL: " + btn.title, 'error');
            if(typeof playEvilSound === 'function') playEvilSound('alert');
        }
    } else {
        btn.style.color = '#00ffcc';
        btn.style.textShadow = 'none';
        btn.classList.remove('pulse-orange');
        btn.title = 'ARP Secure: ' + (data.details || '');
    }
    window.arpStatusData = data;
};

setInterval(() => {
    fetch('/api/arp_status').then(r=>r.json()).then(d => window.updateArpUI(d)).catch(e=>{});
}, 3000);

socket.on('arp_alert', function(data) {
    window.updateArpUI(data);
});

window.pingStatusData = { status: 'safe' };
window.pingResetTimeout = null;

window.updatePingUI = function(data) {
    const btn = document.getElementById('ping-monitor-btn');
    if(!btn) return;
    if(data.status === 'attack') {
        btn.style.color = '#ff0000';
        btn.style.textShadow = '0 0 15px #ff0000';
        btn.classList.add('pulse-orange');
        btn.title = data.details || 'PING DETECTED!';
        showToast("CRITICAL: " + btn.title, 'error');
        if(typeof playEvilSound === 'function') playEvilSound('alert');
        
        if(window.pingResetTimeout) clearTimeout(window.pingResetTimeout);
        window.pingResetTimeout = setTimeout(() => {
            window.updatePingUI({status: 'safe', details: 'Monitoring active.'});
        }, 3000);
    } else {
        btn.style.color = '#00ffcc';
        btn.style.textShadow = 'none';
        btn.classList.remove('pulse-orange');
        btn.title = 'Ping Monitor: ' + (data.details || '');
    }
    window.pingStatusData = data;
};

socket.on('ping_alert', function(data) {
    window.updatePingUI(data);
});

window.openChatModal = function() {
    window.showAndBringToFront('chat-modal');
    socket.emit('get_chat_history');
    setTimeout(() => document.getElementById('chat-input').focus(), 100);
};

window.sendChatMessage = function() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    const user = document.getElementById('chat-username').value.trim() || 'Anonymous Fucker';
    if(msg) {
        socket.emit('send_chat_message', { message: msg, username: user });
        input.value = '';
    }
};

socket.on('chat_history', function(history) {
    const box = document.getElementById('chat-messages');
    if(!box) return;
    box.innerHTML = '';
    history.forEach(msg => {
        window.appendChatMessage(msg);
    });
    box.scrollTop = box.scrollHeight;
});

socket.on('new_chat_message', function(msg) {
    window.appendChatMessage(msg);
    const box = document.getElementById('chat-messages');
    if(box) box.scrollTop = box.scrollHeight;
    
    if (document.getElementById('chat-modal').style.display !== 'block') {
        const btn = document.getElementById('chat-btn-icon');
        if(btn) {
            btn.style.color = '#ff00ff';
            btn.style.textShadow = '0 0 15px #ff00ff';
            btn.classList.add('pulse-orange');
            setTimeout(() => {
                btn.style.color = '';
                btn.style.textShadow = '';
                btn.classList.remove('pulse-orange');
            }, 3000);
        }
    }
});

window.appendChatMessage = function(msg) {
    const box = document.getElementById('chat-messages');
    if(!box) return;
    const div = document.createElement('div');
    const date = new Date(msg.timestamp * 1000);
    const timeStr = date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0') + ':' + date.getSeconds().toString().padStart(2, '0');
    
    const safeMsg = msg.message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const safeUser = msg.user.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    div.innerHTML = `<span style="color:#888;">[${timeStr}]</span> <strong style="color:#ff00ff;">${safeUser}:</strong> <span style="color:#fff; word-break: break-word;">${safeMsg}</span>`;
    box.appendChild(div);
};

setInterval(() => {
    fetch('/api/sync/peers').then(r=>r.json()).then(peers => {
        const ind = document.getElementById('sync-indicator');
        if (ind) {
            ind.style.display = peers.length > 0 ? 'block' : 'none';
        }
    }).catch(()=>{});
}, 5000);

window.openSyncModal = function() {
    window.showAndBringToFront('sync-modal');
    window.refreshSyncPeers();
};

window.refreshSyncPeers = function() {
    const list = document.getElementById('sync-peers-list');
    list.innerHTML = '<li>Scanning...</li>';
    fetch('/api/sync/peers').then(r=>r.json()).then(peers => {
        list.innerHTML = '';
        if (peers.length === 0) {
            list.innerHTML = '<li style="color:#aaa;">No peers found on LAN.</li>';
        } else {
            peers.forEach(p => {
                const li = document.createElement('li');
                li.style = "padding: 10px; border-bottom: 1px solid #00ff00; display: flex; justify-content: space-between; align-items: center;";
                li.innerHTML = `<span>${p}</span> <button style="background:#00ff00; color:#000; font-weight:bold; border:none; padding:5px 10px; cursor:pointer; border-radius:3px;" onclick="executeLanSync('${p}')">SYNC BITCH</button>`;
                list.appendChild(li);
            });
        }
    });
};

window.executeLanSync = function(ip) {
    if(!confirm(`Are you sure you want to pull ALL data from ${ip}? This will overwrite local configs!`)) return;
    showToast(`Initiating violent sync with ${ip}...`, 'warning');
    fetch('/api/sync/execute', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ip: ip})
    }).then(r=>r.json()).then(d => {
        if (d.success) {
            showToast('Sync complete! Rebooting matrix...', 'success');
            setTimeout(() => location.reload(), 1500);
        } else {
            showToast('Sync failed: ' + d.error, 'error');
        }
    }).catch(e => showToast('Network error during sync.', 'error'));
};

window.ovpnTerm = null;
window.ovpnFitAddon = null;
const ovpnTermId = 'ovpn__1';

window.ovpnChecked = false;
window.openOpenVPNModal = function() {
    const ovpnModal = document.getElementById('openvpn-modal');
    if (ovpnModal.style.display === 'block') {
        ovpnModal.style.display = 'none';
        return;
    }
    window.showAndBringToFront('openvpn-modal');
    if (!window.ovpnChecked) {
        window.checkOpenVPN();
    }
    window.loadOvpnList();
    if (!window.ovpnTerm) {
        window.ovpnTerm = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ffcc' }, convertEol: true });
        window.ovpnFitAddon = new FitAddon.FitAddon();
        window.ovpnTerm.loadAddon(window.ovpnFitAddon);
        window.ovpnTerm.onResize(({ cols, rows }) => {
            socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: ovpnTermId, client_id: clientId });
        });
        window.ovpnTerm.open(document.getElementById('ovpn-terminal-container'));
        window.ovpnTerm.onData(data => {
            socket.emit('pty_input', { input: data, term_id: ovpnTermId, client_id: clientId });
        });
        
        socket.emit('start_terminal', {
            folder: 'OPENVPN',
            filename: ovpnTermId + '.log',
            term_id: ovpnTermId,
            client_id: clientId,
            command: '',
            auto_run: false,
            shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
        });
    }
    setTimeout(() => { window.ovpnFitAddon.fit(); window.ovpnTerm.focus(); }, 100);
};

window.checkOpenVPN = function() {
    window.ovpnChecked = true;
    document.getElementById('ovpn-status').innerHTML = 'Checking OpenVPN installation...';
    fetch('/exec_plugin_cmd', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({cmd: 'which openvpn || where openvpn'})
    }).then(r=>r.json()).then(d => {
        const statusEl = document.getElementById('ovpn-status');
        if (d.success && d.output.trim() !== '') {
            statusEl.innerHTML = '<span style="color:#00ff00;">OpenVPN is INSTALLED! ✅ Path: ' + d.output.trim() + '</span>';
        } else {
            statusEl.innerHTML = '<span style="color:#ff0000; margin-right:10px;">OpenVPN is NOT INSTALLED!</span> <button onclick="window.installOpenVPN()" style="padding: 5px 10px; background: #ff00ff; color: #000; border: none; font-weight: bold; cursor: pointer; border-radius: 3px;">INSTALL NOW 🛠️</button> <button onclick="window.checkOpenVPN()" style="padding: 5px 10px; background: #00ffcc; color: #000; border: none; font-weight: bold; cursor: pointer; border-radius: 3px;">RECHECK 🔄</button>';
        }
    });
};

window.installOpenVPN = function() {
    document.getElementById('ovpn-status').innerHTML = '<span style="color:#ffaa00;">Installing OpenVPN... Please wait ⏳</span>';
    socket.emit('pty_input', { input: 'sudo apt-get update && sudo apt-get install openvpn -y\r', term_id: ovpnTermId, client_id: clientId });
    setTimeout(() => window.checkOpenVPN(), 15000);
};

window.setupOvpnDropZone = function() {
    const dropZone = document.getElementById('ovpn-drop-zone');
    const fileInput = document.getElementById('ovpn-file-input');
    if(!dropZone) return;
    dropZone.onclick = () => fileInput.click();
    dropZone.ondragover = (e) => { e.preventDefault(); dropZone.style.background = '#331133'; };
    dropZone.ondragleave = () => { dropZone.style.background = '#111'; };
    dropZone.ondrop = (e) => {
        e.preventDefault();
        dropZone.style.background = '#111';
        if (e.dataTransfer.files.length) {
            window.loadOvpnFile(e.dataTransfer.files[0]);
        }
    };
    fileInput.onchange = (e) => {
        if (e.target.files.length) {
            window.loadOvpnFile(e.target.files[0]);
        }
    };
};
setTimeout(window.setupOvpnDropZone, 1000);

window.loadOvpnFile = function(file) {
    document.getElementById('ovpn-filename').value = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('ovpn-editor').value = e.target.result;
    };
    reader.readAsText(file);
};

window.loadOvpnList = function() {
    fetch('/list_ovpn').then(r=>r.json()).then(d=>{
        const list = document.getElementById('ovpn-saved-list');
        list.innerHTML = '';
        if(d.files) {
            d.files.forEach(f => {
                const li = document.createElement('li');
                li.style.padding = '8px';
                li.style.borderBottom = '1px solid #333';
                li.style.cursor = 'pointer';
                li.style.color = '#00ffcc';
                li.style.display = 'flex';
                li.style.justifyContent = 'space-between';
                li.style.alignItems = 'center';
                li.innerHTML = `<span style="flex:1; pointer-events:none; word-break:break-all;">${f}</span>
                    <div>
                        <span title="Rename" onclick="event.stopPropagation(); window.renameOvpn('${f}')" style="margin-right:5px; font-size:1.2em;">✏️</span>
                        <span title="Delete" onclick="event.stopPropagation(); window.deleteOvpn('${f}')" style="font-size:1.2em;">🗑️</span>
                    </div>`;
                li.onmouseover = () => li.style.background = '#222';
                li.onmouseout = () => li.style.background = 'transparent';
                li.onclick = () => window.fetchOvpnFile(f);
                list.appendChild(li);
            });
        }
    });
};

window.filterOvpnList = function() {
    const filter = document.getElementById('ovpn-search').value.toLowerCase();
    const items = document.getElementById('ovpn-saved-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        items[i].style.display = text.includes(filter) ? 'flex' : 'none';
    }
};

window.renameOvpn = function(oldName) {
    const newName = prompt("Rename OVPN file:", oldName);
    if(newName && newName !== oldName) {
        fetch('/rename_ovpn', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({old_name: oldName, new_name: newName})
        }).then(r=>r.json()).then(d => {
            if(d.success) { showToast("File renamed!", "success"); window.loadOvpnList(); }
            else { showToast("Rename failed.", "error"); }
        });
    }
};

window.deleteOvpn = function(filename) {
    if(confirm("Nuke this config?")) {
        fetch('/delete_ovpn', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({filename: filename})
        }).then(r=>r.json()).then(d => {
            if(d.success) { showToast("Deleted!", "success"); window.loadOvpnList(); }
            else { showToast("Delete failed.", "error"); }
        });
    }
};

window.fetchOvpnFile = function(filename) {
    fetch('/get_ovpn', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filename: filename})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            document.getElementById('ovpn-filename').value = filename;
            document.getElementById('ovpn-editor').value = d.content;
            showToast('Loaded ' + filename, 'success');
        } else {
            showToast('Failed to load file.', 'error');
        }
    });
};

window.saveOvpnFile = function() {
    const filename = document.getElementById('ovpn-filename').value;
    const content = document.getElementById('ovpn-editor').value;
    if (!filename || !content) {
        showToast('Give me a file and content you fuck.', 'error');
        return;
    }
    fetch('/save_ovpn', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({filename: filename, content: content})
    }).then(r=>r.json()).then(d => {
        if (d.success) {
            showToast('OVPN file saved in the shadows! 💀', 'success');
            window.loadOvpnList();
        } else {
            showToast('Error saving: ' + d.error, 'error');
        }
    });
};

window.connectOpenVPN = function() {
    const filename = document.getElementById('ovpn-filename').value;
    if (!filename) { showToast('No config saved/loaded.', 'error'); return; }
    window.ovpnTerm.write('\r\n>>> INITIATING OVPN CONNECTION FOR ' + filename + '...\r\n');
    
    let execCmd = 'cd ../../openvpn && (sudo openvpn --config "' + filename + '" || openvpn --config "' + filename + '")';
    socket.emit('pty_input', { input: execCmd + '\r', term_id: ovpnTermId, client_id: clientId });
    
    setTimeout(() => { window.ovpnFitAddon.fit(); window.ovpnTerm.focus(); }, 200);
};

window.disconnectOpenVPN = function() {
    socket.emit('pty_input', { input: '\x03', term_id: ovpnTermId, client_id: clientId });
    if(window.ovpnTerm) window.ovpnTerm.write('\r\n[OPENVPN TERMINATED. CONNECTION SEVERED. BOOM 💥]\r\n');
};

window.addEventListener('message', function(e) {
    if(e.data && (e.data.type === 'cyber_proxy_url' || e.data.type === 'cyber_proxy_hover')) {
        const urlInput = document.getElementById('preview-url-input');
        if (urlInput && urlInput.value !== e.data.url) {
            urlInput.value = e.data.url;
        }
    } else if (e.data && e.data.type === 'request_cyber_target_update') {
        const iframe = document.getElementById('quad-term-iframe');
        if(iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'cyber_target_update',
                target: currentFolder ? currentFolder.split('/').pop() : '',
                atkIp: window.sysAttackerIp || ''
            }, '*');
        }
    }
});

function openLiveEditorModal() {
    const savedCode = localStorage.getItem('cyber_live_code');
    const savedUrl = localStorage.getItem('cyber_live_url');
    const savedOpacity = localStorage.getItem('cyber_live_opacity');
    if (savedCode) document.getElementById('live-editor-input').value = savedCode;
    if (savedUrl) document.getElementById('live-url-input').value = savedUrl;
    if (savedOpacity) {
        document.getElementById('live-opacity-slider').value = savedOpacity;
        document.getElementById('live-opacity-val').innerText = parseFloat(savedOpacity).toFixed(5);
    }

    if (currentFolder && !document.getElementById('live-url-input').value) {
        const targetName = currentFolder.split('/').pop();
        const urlInput = document.getElementById('live-url-input');
        urlInput.value = (targetName.startsWith('http') ? targetName : 'http://' + targetName);
    }
    window.showAndBringToFront('live-editor-modal');
    updateLivePreview();
}

function updateLivePreview() {
    let code = document.getElementById('live-editor-input').value;
    let baseUrl = document.getElementById('live-url-input').value.trim();
    const opacity = document.getElementById('live-opacity-slider').value;
    const iframe = document.getElementById('live-editor-iframe');
    
    document.getElementById('live-opacity-val').innerText = parseFloat(opacity).toFixed(5);
    
    localStorage.setItem('cyber_live_code', code);
    localStorage.setItem('cyber_live_url', baseUrl);
    localStorage.setItem('cyber_live_opacity', opacity);

    // Real-time Opacity Injection
    code = code.replace(/opacity:\s*[\d.]+;/g, `opacity:${opacity};`);

    // Dynamic Iframe Hijacking
    if (!baseUrl && currentFolder) {
        const targetName = currentFolder.split('/').pop();
        baseUrl = (targetName.startsWith('http') ? targetName : 'http://' + targetName);
    }

    if (baseUrl) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(code, 'text/html');
        const targetIframe = doc.getElementById('target_website');
        if (targetIframe) {
            targetIframe.src = baseUrl;
            code = doc.documentElement.innerHTML;
        }
    }

    let finalHtml = code;
    if (baseUrl) {
        finalHtml = `<base href="${baseUrl}">\n` + finalHtml;
    }
    iframe.srcdoc = finalHtml;
}

document.getElementById('live-editor-input')?.addEventListener('input', updateLivePreview);
document.getElementById('live-url-input')?.addEventListener('input', updateLivePreview);
document.getElementById('live-opacity-slider')?.addEventListener('input', updateLivePreview);

window.sshTerm = null;
window.sshFitAddon = null;
const sshTermId = 'ssh__1';

function openSshModal() {
    window.showAndBringToFront('ssh-modal');
    if (currentFolder) {
        document.getElementById('ssh-target').value = currentFolder.split('/').pop();
    }
    
    if (!window.sshTerm) {
        window.sshTerm = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ffcc' }, convertEol: true });
        window.sshFitAddon = new FitAddon.FitAddon();
        window.sshTerm.loadAddon(window.sshFitAddon);
        window.sshTerm.onResize(({ cols, rows }) => {
            socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: sshTermId, client_id: clientId });
        });
        window.sshTerm.open(document.getElementById('ssh-terminal-container'));
        window.sshTerm.onData(data => {
            socket.emit('pty_input', { input: data, term_id: sshTermId, client_id: clientId });
        });
    }
    setTimeout(() => { window.sshFitAddon.fit(); window.sshTerm.focus(); }, 100);
}

function connectSsh() {
    const target = document.getElementById('ssh-target').value;
    const user = document.getElementById('ssh-user').value || 'root';
    const port = document.getElementById('ssh-port').value || '22';
    const pass = document.getElementById('ssh-pass').value;
    
    if (!target) { showToast('Need a target!', 'error'); return; }
    
    socket.emit('kill_terminal', { client_id: clientId, term_id: sshTermId });
    window.sshTerm.clear();
    
    let cmd = '';
    if (pass) {
        cmd = `which sshpass || (echo "Installing sshpass..." && sudo apt-get update && sudo apt-get install sshpass -y); sshpass -p '${pass.replace(/'/g, "'\\''")}' ssh -o StrictHostKeyChecking=no ${user}@${target} -p ${port}`;
    } else {
        cmd = `ssh -o StrictHostKeyChecking=no ${user}@${target} -p ${port}`;
    }
    
    window.sshTerm.write(`>>> INITIATING SSH CONNECTION TO ${user}@${target}:${port}...\r\n`);
    
    setTimeout(() => {
        socket.emit('start_terminal', {
            folder: 'multi_terminals',
            filename: sshTermId + '.log',
            term_id: sshTermId,
            client_id: clientId,
            command: cmd,
            auto_run: true,
            shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
        });
    }, 500);
}

window.tunnelTerm = null;
window.tunnelFitAddon = null;
const tunnelTermId = 'tunnel__1';

function openTunnelModal() {
    window.showAndBringToFront('tunnel-modal');
    document.getElementById('ngrok-auth').value = localStorage.getItem('ngrok_auth') || '';
    
    if (currentFolder) {
        fetch('/get_target_ip', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: currentFolder })
        }).then(res => res.json()).then(data => {
            document.getElementById('tunnel-target-ip').value = data.ip || '';
        });
    } else {
        document.getElementById('tunnel-target-ip').value = '';
    }

    if (!window.tunnelTerm) {
        window.tunnelTerm = new Terminal({ cursorBlink: true, allowTransparency: true, theme: { background: 'transparent', foreground: '#00ffcc' }, convertEol: true });
        window.tunnelFitAddon = new FitAddon.FitAddon();
        window.tunnelTerm.loadAddon(window.tunnelFitAddon);
        window.tunnelTerm.onResize(({ cols, rows }) => {
            socket.emit('resize_terminal', { cols: cols, rows: rows, term_id: tunnelTermId, client_id: clientId });
        });
        window.tunnelTerm.open(document.getElementById('tunnel-terminal-container'));
        window.tunnelTerm.onData(data => {
            socket.emit('pty_input', { input: data, term_id: tunnelTermId, client_id: clientId });
        });
    }
    setTimeout(() => { window.tunnelFitAddon.fit(); window.tunnelTerm.focus(); }, 100);
}

function installTunnels() {
    window.tunnelTerm.clear();
    window.tunnelTerm.write('>>> INITIATING RUTHLESS INSTALLATION SEQUENCE...\r\n');
    const cmd = `mkdir -p tools && cd tools && echo "Downloading Cloudflared..." && curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared && chmod +x cloudflared && echo "Downloading Ngrok..." && curl -sL https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-linux-amd64.tgz -o ngrok.tgz && tar -xzf ngrok.tgz && chmod +x ngrok && rm ngrok.tgz && echo "INSTALLATION COMPLETE BITCH."`;
    
    socket.emit('start_terminal', {
        folder: 'multi_terminals',
        filename: tunnelTermId + '.log',
        term_id: tunnelTermId,
        client_id: clientId,
        command: cmd,
        auto_run: true,
        shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
    });
}

function startTunnel(type) {
    const port = document.getElementById('tunnel-port').value || '3000';
    const ip = document.getElementById('tunnel-target-ip').value || 'localhost';
    let cmd = '';
    
    socket.emit('kill_terminal', { client_id: clientId, term_id: tunnelTermId });
    window.tunnelTerm.clear();
    document.getElementById('tunnel-url-container').style.display = 'none';
    window.tunnelBuffer = '';
    
    if (type === 'ngrok') {
        const auth = document.getElementById('ngrok-auth').value;
        if (!auth) { showToast('Need Ngrok Auth Token!', 'error'); return; }
        localStorage.setItem('ngrok_auth', auth);
        cmd = `./tools/ngrok config add-authtoken ${auth} && ./tools/ngrok http ${ip}:${port}`;
        window.tunnelTerm.write(`>>> FIRING UP NGROK ON ${ip}:${port}...\r\n`);
    } else {
        cmd = `./tools/cloudflared tunnel --url http://${ip}:${port}`;
        window.tunnelTerm.write(`>>> FIRING UP CLOUDFLARED ON ${ip}:${port}...\r\n`);
    }
    
    setTimeout(() => {
        socket.emit('start_terminal', {
            folder: 'multi_terminals',
            filename: tunnelTermId + '.log',
            term_id: tunnelTermId,
            client_id: clientId,
            command: cmd,
            auto_run: true,
            shell_type: localStorage.getItem('cyber_win_shell') || 'cmd'
        });
    }, 500);
}

window.copyTunnelUrl = function() {
    const url = document.getElementById('tunnel-public-url').innerText;
    if (url) {
        navigator.clipboard.writeText(url).then(() => {
            showToast("Tunnel URL brutally copied to clipboard! 📋", "success");
        }).catch(err => {
            showToast("Failed to copy that shit.", "error");
        });
    }
};

function openDownloadModal() {
    document.getElementById('dl-mgr-old-name').value = '';
    document.getElementById('dl-mgr-name').value = '';
    document.getElementById('dl-mgr-filename').value = '';
    document.getElementById('dl-mgr-url').value = '';
    window.showAndBringToFront('download-mgr-modal');
    loadDownloadUrls();
}

function loadDownloadUrls() {
    fetch('/download_mgr_list').then(r=>r.json()).then(urls=>{
        const list = document.getElementById('dl-mgr-list');
        list.innerHTML = '';
        urls.forEach(u => {
            const li = document.createElement('li');
            li.style.padding = '8px';
            li.style.borderBottom = '1px solid #333';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.style.display = 'flex';
            li.style.justifyContent = 'space-between';
            li.style.alignItems = 'center';
            li.innerHTML = `<span style="flex:1; pointer-events:none;">${u.name}</span>
                <div>
                    <span title="Edit" onclick="event.stopPropagation(); editDownloadUrl('${u.name}', '${u.filename}', '${u.url}')" style="margin-right:5px;">✏️</span>
                    <span title="Delete" onclick="event.stopPropagation(); deleteDownloadUrl('${u.name}')">🗑️</span>
                </div>`;
            li.onclick = () => {
                document.getElementById('dl-mgr-name').value = u.name || '';
                document.getElementById('dl-mgr-filename').value = u.filename || '';
                document.getElementById('dl-mgr-url').value = u.url || '';
                document.getElementById('dl-mgr-old-name').value = u.name || '';
            };
            li.onmouseover = () => li.style.background = '#222';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
    });
}

function filterDownloadUrls() {
    const filter = document.getElementById('dl-mgr-search').value.toLowerCase();
    const items = document.getElementById('dl-mgr-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

function editDownloadUrl(name, filename, url) {
    document.getElementById('dl-mgr-name').value = name || '';
    document.getElementById('dl-mgr-filename').value = filename || '';
    document.getElementById('dl-mgr-url').value = url || '';
    document.getElementById('dl-mgr-old-name').value = name || '';
}

function deleteDownloadUrl(name) {
    if(confirm("Are you sure you want to nuke this URL?")) {
        fetch('/download_mgr_delete', {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({name: name})
        }).then(r=>r.json()).then(d=>{
            if(d.success) { showToast("Violently deleted!", "success"); loadDownloadUrls(); }
        });
    }
}

function saveDownloadUrl() {
    const old_name = document.getElementById('dl-mgr-old-name').value;
    const name = document.getElementById('dl-mgr-name').value;
    const filename = document.getElementById('dl-mgr-filename').value;
    const url = document.getElementById('dl-mgr-url').value;
    if (!name || !filename || !url) { showToast("Display Name, File Name, and URL are required!", "error"); return; }
    fetch('/download_mgr_save', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({old_name: old_name, name: name, filename: filename, url: url})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            showToast("Saved to list!", "success");
            document.getElementById('dl-mgr-old-name').value = '';
            loadDownloadUrls();
        }
    });
}

function executeDownload() {
    const name = document.getElementById('dl-mgr-name').value;
    const filename = document.getElementById('dl-mgr-filename').value;
    const url = document.getElementById('dl-mgr-url').value;
    const folder = document.getElementById('dl-mgr-folder').value;
    if (!filename || !url) { showToast("File Name and URL are required!", "error"); return; }
    
    document.getElementById('dl-mgr-status').innerText = 'Downloading...';
    fetch('/download_file_now', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({name: name, filename: filename, url: url, folder: folder})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            document.getElementById('dl-mgr-status').innerText = 'SUCCESS: ' + filename + ' saved to ' + folder + '/';
            showToast("Download complete!", "success");
        } else {
            document.getElementById('dl-mgr-status').innerText = 'ERROR: ' + d.error;
            showToast("Download failed!", "error");
        }
    });
}

function openScriptModal() {
    fetch('/get_scripts_list').then(r=>r.json()).then(files=>{
        const list = document.getElementById('script-file-list');
        list.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #555';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = file;
            li.onclick = () => { insertMacro(`{script->${file}}`); closeModal('script-file-modal'); };
            li.onmouseover = () => li.style.background = '#111';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
        document.getElementById('script-search').value = '';
        window.showAndBringToFront('script-file-modal');
    });
}

function filterScripts() {
    const filter = document.getElementById('script-search').value.toLowerCase();
    const items = document.getElementById('script-file-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

function openPasswordlistModal() {
    fetch('/get_passwordlist_list').then(r=>r.json()).then(files=>{
        const list = document.getElementById('passwordlist-file-list');
        list.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #555';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = file;
            li.onclick = () => { insertMacro(`{passwordlist->${file}}`); closeModal('passwordlist-file-modal'); };
            li.onmouseover = () => li.style.background = '#111';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
        document.getElementById('passwordlist-search').value = '';
        window.showAndBringToFront('passwordlist-file-modal');
    });
}

function filterPasswordlists() {
    const filter = document.getElementById('passwordlist-search').value.toLowerCase();
    const items = document.getElementById('passwordlist-file-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

function openPayloadslistModal() {
    fetch('/get_payloadslist_list').then(r=>r.json()).then(files=>{
        const list = document.getElementById('payloadslist-file-list');
        list.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #555';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = file;
            li.onclick = () => { insertMacro(`{payloadslist->${file}}`); closeModal('payloadslist-file-modal'); };
            li.onmouseover = () => li.style.background = '#111';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
        document.getElementById('payloadslist-search').value = '';
        window.showAndBringToFront('payloadslist-file-modal');
    });
}

function filterPayloadslists() {
    const filter = document.getElementById('payloadslist-search').value.toLowerCase();
    const items = document.getElementById('payloadslist-file-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

window.openPayloadFilenameModal = function() {
    document.getElementById('payload-filename-input').value = '';
    window.showAndBringToFront('payload-filename-modal');
    setTimeout(() => document.getElementById('payload-filename-input').focus(), 100);
};

window.insertSaveInPathPayloads = function() {
    const filename = document.getElementById('payload-filename-input').value.trim();
    if (!filename) {
        showToast("Enter a fucking filename!", "error");
        return;
    }
    insertMacro('{saveinpathpayloads}/' + filename);
    closeModal('payload-filename-modal');
};

function openPayloadsModal() {
    fetch('/get_payloads_list').then(r=>r.json()).then(files=>{
        const list = document.getElementById('payloads-file-list');
        list.innerHTML = '';
        files.forEach(file => {
            const li = document.createElement('li');
            li.style.padding = '10px';
            li.style.borderBottom = '1px solid #555';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = file;
            li.onclick = () => { insertMacro(`{payloads->${file}}`); closeModal('payloads-file-modal'); };
            li.onmouseover = () => li.style.background = '#111';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
        document.getElementById('payloads-search').value = '';
        window.showAndBringToFront('payloads-file-modal');
    });
}

function filterPayloads() {
    const filter = document.getElementById('payloads-search').value.toLowerCase();
    const items = document.getElementById('payloads-file-list').getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? '' : 'none';
    }
}

let audioCtx;
let analyser;
let audioSrc;
let isReactive = false;

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        const player = document.getElementById('evil-audio-player');
        player.crossOrigin = "anonymous";
        audioSrc = audioCtx.createMediaElementSource(player);
        audioSrc.connect(analyser);
        analyser.connect(audioCtx.destination);
        analyser.fftSize = 256;
        renderAudioVisuals();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function renderAudioVisuals() {
    requestAnimationFrame(renderAudioVisuals);
    if (!isReactive) {
        document.body.style.boxShadow = 'none';
        return;
    }
    if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
        let avg = sum / bufferLength; 
        let intensity = (avg / 255) * 150; 
        
        const isUmbrella = document.body.className.includes('umbrella');
        const isMatrix = document.body.className.includes('matrix');
        const isDark = document.body.className.includes('dark');
        const isWhite = document.body.className.includes('white');
        const color = isUmbrella ? 'rgba(255,0,0,' : isMatrix ? 'rgba(0,255,0,' : isDark ? 'rgba(80,80,80,' : isWhite ? 'rgba(0,120,212,' : 'rgba(255,0,255,';
        
        document.body.style.boxShadow = `inset 0 0 ${intensity * 3}px ${color}${intensity / 100}), 0 0 ${intensity * 2}px ${color}${intensity / 100})`;
    }
}

function toggleSoundsList() {
    const dd = document.getElementById('sounds-dropdown');
    if (dd.style.display === 'none' || dd.style.display === '') {
        dd.style.display = 'block';
        refreshSoundsUI();
    } else {
        dd.style.display = 'none';
    }
}

function refreshSoundsUI() {
    fetch('/list_sounds').then(r=>r.json()).then(files=>{
        const ddList = document.getElementById('sounds-dropdown-list');
        const setList = document.getElementById('settings-sounds-list');
        if(ddList) ddList.innerHTML = '';
        if(setList) setList.innerHTML = '';
        files.forEach(f => {
            if(ddList) {
                const li = document.createElement('li');
                li.style.padding = '10px'; li.style.borderBottom = '1px solid #333'; li.style.cursor = 'pointer'; li.style.color = '#00ffcc'; li.style.fontWeight = 'bold';
                li.innerText = '▶ ' + f;
                li.onclick = () => playEvilSound(f);
                li.onmouseover = () => li.style.background = '#222'; li.onmouseout = () => li.style.background = 'transparent';
                ddList.appendChild(li);
            }
            if(setList) {
                const li = document.createElement('li');
                li.style.padding = '8px'; li.style.borderBottom = '1px solid #333'; li.style.display = 'flex'; li.style.justifyContent = 'space-between';
                li.innerHTML = `<span style="color:#ffaa00;">${f}</span> <button onclick="deleteEvilSound('${f}')" style="background:#ff0000; color:#fff; border:none; cursor:pointer; padding:2px 10px; font-weight:bold;">DELETE 🗑️</button>`;
                setList.appendChild(li);
            }
        });
    });
}

function playEvilSound(filename) {
    initAudioContext();
    const player = document.getElementById('evil-audio-player');
    player.src = '/sounds_file/' + encodeURIComponent(filename);
    player.play().then(() => {
        showToast("Now blasting: " + filename + " 💀🔊", "warning");
    }).catch(err => {
        showToast("Browser blocked playback or error: " + err.message, "error");
    });
}

function stopEvilSound() {
    const player = document.getElementById('evil-audio-player');
    player.pause();
    player.currentTime = 0;
    document.body.style.boxShadow = 'none';
    showToast("Audio stopped.", "success");
}

function uploadEvilSound() {
    const fileInput = document.getElementById('sound-upload-file');
    const nameInput = document.getElementById('sound-upload-name');
    if (!fileInput.files.length) { showToast("Select an audio file you fuck!", "error"); return; }
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('name', nameInput.value);
    
    fetch('/upload_sound', { method: 'POST', body: formData })
    .then(r=>r.json()).then(d=>{
        if(d.success) {
            showToast("Track uploaded successfully! 💀", "success");
            fileInput.value = '';
            nameInput.value = '';
            refreshSoundsUI();
        } else {
            showToast("Upload failed: " + (d.error || "Unknown error"), "error");
        }
    }).catch(err => {
        showToast("Upload error: " + err.message, "error");
    });
}

function deleteEvilSound(filename) {
    if(confirm("Are you sure you want to nuke this track?")) {
        fetch('/delete_sound', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({name: filename}) })
        .then(r=>r.json()).then(d=>{
            if(d.success) { showToast("Track deleted.", "success"); refreshSoundsUI(); }
        });
    }
}

// WORMGPT LOGIC 💀🪱
window.wormChatHistory = [];
window.wormSettingsCache = { system_prompt: "You are WormGPT...", model: "gemini-1.5-flash" };

window.openWormChatModal = function() {
    window.showAndBringToFront('wormgpt-chat-modal');
    window.populateWormTargets();
    if (window.wormChatHistory.length === 0) {
        fetch('/get_worm_settings').then(r=>r.json()).then(d=>{
            window.wormSettingsCache = d;
            const chatBox = document.getElementById('wormgpt-chat-box');
            chatBox.innerHTML = `<div style="color:#ff00ff; text-align:center; font-weight:bold; margin-bottom: 20px;">WormGPT Initialized. System instructions loaded from file. Ready to cause chaos. 💀</div>`;
        });
    }
};

window.openWormSettingsModal = function() {
    fetch('/get_worm_settings').then(r=>r.json()).then(d=>{
        document.getElementById('wormgpt-sys-prompt').value = d.system_prompt || '';
        document.getElementById('wormgpt-model').value = d.model || 'gemini-1.5-flash';
        window.showAndBringToFront('wormgpt-settings-modal');
    });
};

window.saveWormSettings = function() {
    const prompt = document.getElementById('wormgpt-sys-prompt').value;
    const model = document.getElementById('wormgpt-model').value;
    fetch('/save_worm_settings', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({system_prompt: prompt, model: model})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            window.wormSettingsCache = {system_prompt: prompt, model: model};
            showToast("WormGPT Settings Brutally Saved to File! 💀", "success");
            closeModal('wormgpt-settings-modal');
        }
    });
};

window.sendWormMessage = async function() {
    const input = document.getElementById('wormgpt-chat-input');
    const msg = input.value.trim();
    if(!msg) return;
    input.value = '';

    const chatBox = document.getElementById('wormgpt-chat-box');
    chatBox.innerHTML += `<div style="margin-bottom:15px; border-left:3px solid #00ffcc; padding-left:10px;"><strong style="color:#00ffcc;">YOU:</strong><br>
${msg.replace(/\n/g, '<br>')}</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    const apiKey = localStorage.getItem('gemini_api_key');
    if(!apiKey) {
        chatBox.innerHTML += `<div style="margin-bottom:15px;color:#ff0000; font-weight:bold;">[SYSTEM] Set your damn Gemini API Key in main settings first!</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
        return;
    }

    window.wormChatHistory.push({ role: "user", parts: [{ text: msg }] });

    const payload = {
        systemInstruction: { parts: [{ text: window.wormSettingsCache.system_prompt }] },
        contents: window.wormChatHistory
    };

    const loadingId = "load_" + Date.now();
    chatBox.innerHTML += `<div id="${loadingId}" style="margin-bottom:15px;color:#ff00ff; animation: pulse 1s infinite;">WormGPT is thinking of something evil...</div>`;
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${window.wormSettingsCache.model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        document.getElementById(loadingId).remove();

        if (data.error) {
            chatBox.innerHTML += `<div style="margin-bottom:15px;color:#ff0000; font-weight:bold;">[ERROR] ${data.error.message}</div>`;
            window.wormChatHistory.pop();
        } else {
            const reply = data.candidates[0].content.parts[0].text;
            window.wormChatHistory.push({ role: "model", parts: [{ text: reply }] });
            const formatted = typeof marked !== 'undefined' ? marked.parse(reply) : reply;
            chatBox.innerHTML += `<div class="markdown-body" style="margin-bottom:15px; background:rgba(255,0,255,0.05); padding:10px; border-left:3px solid #ff00ff;"><strong style="color:#ff00ff; font-size:1.2em;">WormGPT 💀:</strong><br>${formatted}</div>`;
        }
    } catch(e) {
        document.getElementById(loadingId).remove();
        chatBox.innerHTML += `<div style="margin-bottom:15px;color:#ff0000; font-weight:bold;">[SYSTEM ERROR] ${e.message}</div>`;
        window.wormChatHistory.pop();
    }
    chatBox.scrollTop = chatBox.scrollHeight;
};

window.populateWormTargets = function() {
    fetch('/api/all_results').then(r=>r.json()).then(data => {
        window.wormAllResultsData = data;
        const tSel = document.getElementById('wormgpt-target-select');
        tSel.innerHTML = '<option value="">-- Select Target --</option>';
        for (let target in data) {
            tSel.innerHTML += `<option value="${target}">${target}</option>`;
        }
    });
};

window.loadWormGptResults = function() {
    const target = document.getElementById('wormgpt-target-select').value;
    const rSel = document.getElementById('wormgpt-result-select');
    rSel.innerHTML = '<option value="">-- Select Result --</option>';
    if (target && window.wormAllResultsData && window.wormAllResultsData[target]) {
        window.wormAllResultsData[target].forEach(f => {
            rSel.innerHTML += `<option value="${f}">${f}</option>`;
        });
    }
};

window.injectWormGptResult = function() {
    const target = document.getElementById('wormgpt-target-select').value;
    const filename = document.getElementById('wormgpt-result-select').value;
    if (!target || !filename) { showToast("Select a target and a result file first!", "error"); return; }
    
    fetch('/get_result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: target, filename: filename })
    }).then(r=>r.json()).then(d => {
        if(d.success) {
            const prompt = `Analyze this raw scan result from target '${target}' (${filename}). Explain the vulnerabilities or findings clearly, and tell me the EXACT next command I should run to exploit this system further. Be ruthless.\n\n` + d.content;
            document.getElementById('wormgpt-chat-input').value = prompt;
            window.sendWormMessage();
        } else {
            showToast("Failed to load result.", "error");
        }
    });
};

window.analyzeWithWormGPT = function() {
    if (!window.lastScanContent) {
        showToast("No scan content available to analyze!", "error");
        return;
    }
    closeModal('popup-modal');
    window.openWormChatModal();
    const prompt = `Analyze this raw scan result from target '${window.lastScanFolder}' (${window.lastScanFilename}). Explain the vulnerabilities or findings clearly, and tell me the EXACT next command I should run to exploit this system further. Be ruthless.\n\n` + window.lastScanContent;
    document.getElementById('wormgpt-chat-input').value = prompt;
    setTimeout(() => window.sendWormMessage(), 500);
};

window.toggleToolbar = function() {
    const tb = document.getElementById('top-toolbar');
    tb.classList.toggle('collapsed');
    const btn = document.getElementById('toolbar-toggle-btn');
    if (tb.classList.contains('collapsed')) {
        btn.innerHTML = '<i data-icon="arrow-left" data-size="24"></i>';
    } else {
        btn.innerHTML = '<i data-icon="arrow-right" data-size="24"></i>';
    }
    if (window.hydrateIcons) window.hydrateIcons(btn);
};

window.toggleSidebar = function() {
    document.body.classList.toggle('sidebar-collapsed');
    const btn = document.getElementById('sidebar-toggle-btn');
    if (document.body.classList.contains('sidebar-collapsed')) {
        btn.innerHTML = '<i data-icon="arrow-right" data-size="24"></i>';
    } else {
        btn.innerHTML = '<i data-icon="arrow-left" data-size="24"></i>';
    }
    if (window.hydrateIcons) window.hydrateIcons(btn);
};

window.toggleBottomToolbar = function() {
    const tb = document.getElementById('bottom-toolbar');
    tb.classList.toggle('collapsed');
    const btn = document.getElementById('bottom-toggle-btn');
    if (tb.classList.contains('collapsed')) {
        btn.innerHTML = '<i data-icon="arrow-left" data-size="24"></i>';
    } else {
        btn.innerHTML = '<i data-icon="arrow-right" data-size="24"></i>';
    }
    if (window.hydrateIcons) window.hydrateIcons(btn);
};

let globalLeafletMap = null;
let mapMarkers = [];
let mapTileLayer = null;
let mapIsSatellite = false;
let mapIs3D = false;
let mapThreeState = { scene: null, camera: null, renderer: null, controls: null, sphere: null, animationId: null };

window.toggleMapSatellite = function() {
    mapIsSatellite = !mapIsSatellite;
    const btn = document.getElementById('map-satellite-btn');
    if (btn) btn.classList.toggle('active-state', mapIsSatellite);
    if (mapIsSatellite) {
        document.body.classList.add('map-satellite');
    } else {
        document.body.classList.remove('map-satellite');
    }
    if (globalLeafletMap) {
        if (mapTileLayer) {
            globalLeafletMap.removeLayer(mapTileLayer);
        }
        if (mapIsSatellite) {
            mapTileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                maxZoom: 19
            }).addTo(globalLeafletMap);
        } else {
            mapTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19
            }).addTo(globalLeafletMap);
        }
    }
};

window.toggleMap3D = function() {
    mapIs3D = !mapIs3D;
    const btn = document.getElementById('map-3d-btn');
    if (btn) btn.classList.toggle('active-state', mapIs3D);
    
    if (mapIs3D) {
        document.getElementById('map-container').style.display = 'none';
        document.getElementById('map-3d-container').style.display = 'block';
        initMap3D();
        showToast("3D Planet Activated 🪐", "success");
    } else {
        document.getElementById('map-container').style.display = 'block';
        document.getElementById('map-3d-container').style.display = 'none';
        if (mapThreeState.animationId) cancelAnimationFrame(mapThreeState.animationId);
        showToast("2D Map Restored 🗺️", "success");
    }
};

function initMap3D() {
    const container = document.getElementById('map-3d-container');
    if (!mapThreeState.scene) {
        mapThreeState.scene = new THREE.Scene();
        mapThreeState.camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
        mapThreeState.camera.position.z = 15;
        
        mapThreeState.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        mapThreeState.renderer.setSize(container.clientWidth, container.clientHeight);
        container.innerHTML = '';
        container.appendChild(mapThreeState.renderer.domElement);

        mapThreeState.controls = new THREE.OrbitControls(mapThreeState.camera, mapThreeState.renderer.domElement);
        mapThreeState.controls.enableDamping = true;

        mapThreeState.scene.add(new THREE.AmbientLight(0x333333));
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5,3,5);
        mapThreeState.scene.add(light);

        const geometry = new THREE.SphereGeometry(5, 64, 64);
        const textureLoader = new THREE.TextureLoader();
        const material = new THREE.MeshPhongMaterial({ 
            map: textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg'),
            bumpScale: 0.1
        });
        mapThreeState.sphere = new THREE.Mesh(geometry, material);
        mapThreeState.scene.add(mapThreeState.sphere);
        
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({color: 0xffffff, size: 0.1, transparent: true, opacity: 0.8});
        const starsVertices = [];
        for(let i=0; i<5000; i++) {
            starsVertices.push((Math.random() - 0.5) * 200);
            starsVertices.push((Math.random() - 0.5) * 200);
            starsVertices.push((Math.random() - 0.5) * 200);
        }
        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const starField = new THREE.Points(starsGeometry, starsMaterial);
        mapThreeState.scene.add(starField);
    }
    
    if (mapThreeState.markersGroup) {
        mapThreeState.scene.remove(mapThreeState.markersGroup);
    }
    mapThreeState.markersGroup = new THREE.Group();
    mapThreeState.scene.add(mapThreeState.markersGroup);
    
    mapMarkers.forEach(marker => {
        const lat = marker.getLatLng().lat;
        const lon = marker.getLatLng().lng;
        
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const radius = 5.05;
        
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = (radius * Math.sin(phi) * Math.sin(theta));
        const y = (radius * Math.cos(phi));
        
        const markerGeo = new THREE.SphereGeometry(0.1, 16, 16);
        const markerMat = new THREE.MeshBasicMaterial({ color: 0xff00ff });
        const mesh = new THREE.Mesh(markerGeo, markerMat);
        mesh.position.set(x, y, z);
        mapThreeState.markersGroup.add(mesh);
    });

    if (mapThreeState.animationId) cancelAnimationFrame(mapThreeState.animationId);
    animateMap3D();
}

function animateMap3D() {
    mapThreeState.animationId = requestAnimationFrame(animateMap3D);
    if (mapThreeState.sphere) mapThreeState.sphere.rotation.y += 0.001;
    if (mapThreeState.markersGroup) mapThreeState.markersGroup.rotation.y += 0.001;
    mapThreeState.controls.update();
    mapThreeState.renderer.render(mapThreeState.scene, mapThreeState.camera);
}

window.addEventListener('resize', () => {
    if (mapIs3D && mapThreeState.camera && mapThreeState.renderer) {
        const container = document.getElementById('map-3d-container');
        mapThreeState.camera.aspect = container.clientWidth / container.clientHeight;
        mapThreeState.camera.updateProjectionMatrix();
        mapThreeState.renderer.setSize(container.clientWidth, container.clientHeight);
    }
});

window.openMapModal = function() {
    window.showAndBringToFront('map-modal');
    if (!globalLeafletMap) {
        globalLeafletMap = L.map('map-container', { zoomControl: false, attributionControl: false, doubleClickZoom: false }).setView([20, 0], 2);
        mapTileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19
        }).addTo(globalLeafletMap);
        
        const mapEl = document.getElementById('map-container');
        mapEl.addEventListener('dragover', (e) => e.preventDefault());
        mapEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const targetName = e.dataTransfer.getData('targetName');
            if (!targetName) return;
            const pt = globalLeafletMap.mouseEventToLatLng(e);
            const latLngStr = `${pt.lat},${pt.lng}`;
            fetch('/save_target_ip', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ target: targetName, ip: latLngStr })
            }).then(r=>r.json()).then(d => {
                if(d.success) {
                    showToast(`Target ${targetName} ruthlessly moved to coordinates! 🎯`, 'success');
                    window.plotAllTargetsOnMap();
                }
            });
        });

        globalLeafletMap.on('dblclick', function(e) {
            const targetName = prompt("Enter target name for this location 💀:");
            if (targetName) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                const icon = L.divIcon({
                    className: 'custom-map-pin',
                    html: `<div class="cyber-pin-container"><div class="cyber-pin-label" style="border-color: #ffaa00; color: #ffaa00;">${targetName}</div><div class="cyber-pin-icon" style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ffaa00%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M12 2l9 4.9V17L12 22l-9-4.9V6.9z%22/><circle cx=%2212%22 cy=%2212%22 r=%223%22 fill=%22%23ffaa00%22/></svg>'); filter: drop-shadow(0 0 8px #ffaa00);"></div></div>`,
                    iconSize: [0, 0],
                    iconAnchor: [0, 0]
                });
                const marker = L.marker([lat, lng], {icon: icon}).addTo(globalLeafletMap);
                marker.bindPopup(`<b>${targetName}</b><br>Manual Pin<br>Lat: ${lat.toFixed(4)}<br>Lon: ${lng.toFixed(4)}`).openPopup();
                marker.on('click', () => window.openMapTargetPanel(targetName, `${lat},${lng}`, {city: 'Manual Pin', country: '', isp: ''}));
                marker.on('dblclick', () => window.openMapTargetPanel(targetName, `${lat},${lng}`, {city: 'Manual Pin', country: '', isp: ''}));
                mapMarkers.push(marker);
                
                fetch('/create_folder', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folder_name: targetName, ip_address: `${lat},${lng}` })
                }).then(res => res.json()).then(data => {
                    if (data.success) {
                        showToast(`Target ${targetName} brutally added at coords! 🎯`, "success");
                        const ul = document.getElementById('folder-list');
                        const li = document.createElement('li');
                        li.className = 'target-container';
                        li.innerHTML = `
                            <div class="folder-item" ondblclick="toggleSubdomains('${targetName}')" onclick="selectFolder('${targetName}', this)" ondragover="event.preventDefault(); this.classList.add('drag-over');" ondragleave="this.classList.remove('drag-over');" ondrop="this.classList.remove('drag-over'); dropTargetFlag(event, '${targetName}', this)">
                                <div style="display:flex; flex-direction:column; width:100%;">
                                    <div style="display:flex; flex-direction:column; align-items:flex-start; width: 100%;">
                                        <div style="display:flex; align-items:center; word-break: break-all; width: 100%;">
                                            <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:#111; vertical-align:middle; margin-right:5px; border: 1px solid #00ffcc; flex-shrink:0;"></span>
                                            <span style="font-weight:bold; font-size:1.1em; color:#fff;">${targetName}</span>
                                            <span id="scan-count-${targetName}" class="scan-count" style="display:none; margin-left: auto; background: #ffaa00; color: #000; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">0</span>
                                        </div>
                                        <div class="target-actions" style="margin-top: 8px; margin-left: 21px; display:flex; gap:12px; flex-wrap: wrap;">
                                            <span class="action-icon" title="Delete Target" onclick="event.stopPropagation(); deleteTarget('${targetName}')"><i data-icon="trash" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit Target Info" onclick="event.stopPropagation(); openEditTargetModal('${targetName}', 'bugbounty')"><i data-icon="edit" data-size="16"></i></span>
                                            <span class="action-icon" title="Add Subdomain" onclick="event.stopPropagation(); openSubdomainModal('${targetName}')"><i data-icon="globe" data-size="16"></i></span>
                                            <span class="action-icon" title="Bulk Upload Subdomains" onclick="event.stopPropagation(); openBulkSubdomainModal('${targetName}')"><i data-icon="folder" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit Cookie" onclick="event.stopPropagation(); openCookieModal('${targetName}')"><i data-icon="cookie" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit IP Address" onclick="event.stopPropagation(); openIpModal('${targetName}')"><i data-icon="target" data-size="16"></i></span>
                                        </div>
                                    </div>
                                    <div class="target-flag-container" style="display:flex; gap:2px; margin-top:2px;"></div>
                                </div>
                            </div>
                            <ul id="subs-${targetName}" class="subdomain-list" style="display:none;"></ul>`;
                        ul.appendChild(li);
                    } else {
                        showToast("Error: " + data.error, "error");
                    }
                });
            }
        });
    }
    setTimeout(() => { 
        globalLeafletMap.invalidateSize(); 
        window.plotAllTargetsOnMap(); 
    }, 200);
};

window.mapZoomIn = function() { if (globalLeafletMap) globalLeafletMap.zoomIn(); };
window.mapZoomOut = function() { if (globalLeafletMap) globalLeafletMap.zoomOut(); };
window.mapReset = function() { if (globalLeafletMap) globalLeafletMap.setView([20, 0], 2); };

window.plotAllTargetsOnMap = async function() {
    mapMarkers.forEach(m => globalLeafletMap.removeLayer(m));
    mapMarkers = [];
    
    const targets = Array.from(document.querySelectorAll('.target-container > .folder-item')).map(el => ({
        name: el.querySelector('span:nth-of-type(2)').innerText,
        type: el.parentElement.dataset.targetType || 'bugbounty'
    })).filter(t => t.name.trim() !== '');
    
    const stagingArea = document.getElementById('map-staging-list');
    if (stagingArea) stagingArea.innerHTML = '';

    for (let tObj of targets) {
        const target = tObj.name;
        const type = tObj.type;
        try {
            const ipRes = await fetch('/get_target_ip', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({target: target}) });
            const ipData = await ipRes.json();
            let ipToLocate = ipData.ip || '';
            
            const isManualCoord = ipToLocate.includes(',') && !isNaN(parseFloat(ipToLocate.split(',')[0]));
            
            if (!isManualCoord && !ipToLocate && stagingArea) {
                const div = document.createElement('div');
                div.className = 'map-staging-item type-' + type;
                div.draggable = true;
                div.innerText = target;
                div.dataset.targetName = target;
                div.ondragstart = (e) => e.dataTransfer.setData('targetName', target);
                stagingArea.appendChild(div);
                continue;
            }

            let lat, lng, geoDataResult = null;

            if (isManualCoord) {
                lat = parseFloat(ipToLocate.split(',')[0]);
                lng = parseFloat(ipToLocate.split(',')[1]);
            } else {
                const geoRes = await fetch('/geo_lookup', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({target: ipToLocate || target}) });
                const geoData = await geoRes.json();
                if (geoData.success && geoData.data.status === 'success') {
                    lat = geoData.data.lat;
                    lng = geoData.data.lon;
                    geoDataResult = geoData.data;
                } else {
                    if (stagingArea) {
                        const div = document.createElement('div');
                        div.className = 'map-staging-item type-' + type;
                        div.draggable = true;
                        div.innerText = target;
                        div.dataset.targetName = target;
                        div.ondragstart = (e) => e.dataTransfer.setData('targetName', target);
                        stagingArea.appendChild(div);
                    }
                    continue;
                }
            }

            const useFavicon = document.getElementById('map-show-favicon')?.checked;
            const iconClass = 'cyber-pin-icon type-' + type;
            const iconStyle = useFavicon ? `background-image: url('/target_file/${target}/favicon.png'); border-radius: 50%; background-size: cover;` : '';
            
            const icon = L.divIcon({
                className: 'custom-map-pin',
                html: `<div class="cyber-pin-container"><div class="cyber-pin-label">${target}</div><div class="${iconClass}" style="${iconStyle}"></div></div>`,
                iconSize: [0, 0], iconAnchor: [0, 0]
            });
            
            const marker = L.marker([lat, lng], {icon: icon}).addTo(globalLeafletMap);
            if (geoDataResult) {
                marker.bindPopup(`<b>${target}</b><br>Type: ${type.toUpperCase()}<br>IP: ${geoDataResult.query}<br>Location: ${geoDataResult.city}, ${geoDataResult.country}`);
                marker.on('click', () => window.openMapTargetPanel(target, geoDataResult.query, geoDataResult));
            } else {
                marker.bindPopup(`<b>${target}</b><br>Type: ${type.toUpperCase()}<br>Coords: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
                marker.on('click', () => window.openMapTargetPanel(target, ipToLocate, {city: 'Pinned', country: '', isp: ''}));
            }
            mapMarkers.push(marker);
        } catch(e) {}
    }
    if (mapIs3D) initMap3D();
};

window.mapSearch = function() {
    const val = document.getElementById('map-search').value.toLowerCase().trim();
    if (!val) return;
    
    fetch('/geo_lookup', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({target: val}) })
    .then(r=>r.json())
    .then(geoData => {
        if (geoData.success && geoData.data.status === 'success') {
            const geo = geoData.data;
            globalLeafletMap.setView([geo.lat, geo.lon], 8);
            const useFavicon = document.getElementById('map-show-favicon') && document.getElementById('map-show-favicon').checked;
            const baseIconStr = "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23ff00ff%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22M12 2l9 4.9V17L12 22l-9-4.9V6.9z%22/><circle cx=%2212%22 cy=%2212%22 r=%223%22 fill=%22%23ff00ff%22/></svg>')";
            const iconStyle = useFavicon ? `background-image: url('/target_file/${val}/favicon.png'); border-radius: 50%; background-size: cover;` : `background-image: ${baseIconStr}; filter: drop-shadow(0 0 8px #ff00ff);`;
            const icon = L.divIcon({
                className: 'custom-map-pin',
                html: `<div class="cyber-pin-container"><div class="cyber-pin-label" style="border-color: #ff00ff; color: #ff00ff;">TARGET LOCKED: ${val}</div><div class="cyber-pin-icon" style="${iconStyle}"></div></div>`,
                iconSize: [0, 0],
                iconAnchor: [0, 0]
            });
            const marker = L.marker([geo.lat, geo.lon], {icon: icon}).addTo(globalLeafletMap);
            marker.bindPopup(`<b>${val}</b><br>IP: ${geo.query}<br>Location: ${geo.city}, ${geo.country}<br>ISP: ${geo.isp}`).openPopup();
            marker.on('click', () => window.openMapTargetPanel(val, geo.query, geo));
            marker.on('dblclick', () => window.openMapTargetPanel(val, geo.query, geo));
            mapMarkers.push(marker);
        } else {
            showToast("IP not found or invalid. Are you stupid?", "error");
        }
    });
};

window.cyberWarModeActive = false;
window.originalMapParent = null;
window.original3DParent = null;

window.toggleCyberWarMap = function() {
    const dash = document.getElementById('cyber-war-dashboard');
    const mapContainer = document.getElementById('map-container');
    const map3dContainer = document.getElementById('map-3d-container');
    
    if (!window.cyberWarModeActive) {
        window.cyberWarModeActive = true;
        window.originalMapParent = mapContainer.parentElement;
        window.original3DParent = map3dContainer.parentElement;
        
        document.getElementById('map-modal').style.display = 'none';
        dash.style.display = 'grid';
        
        document.getElementById('cw-center-map-slot').appendChild(mapContainer);
        document.getElementById('cw-3d-slot').appendChild(map3dContainer);
        
        mapContainer.style.position = 'absolute';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';
        
        map3dContainer.style.display = 'block';
        map3dContainer.style.position = 'absolute';
        map3dContainer.style.width = '100%';
        map3dContainer.style.height = '100%';
        
        if (!mapThreeState.scene) initMap3D();
        window.populateCwTargets();
        
        showToast("CIA CYBER WARFARE INTERFACE ENGAGED 🌐", "warning");
    } else {
        window.cyberWarModeActive = false;
        dash.style.display = 'none';
        
        window.originalMapParent.insertBefore(mapContainer, document.getElementById('map-staging-box'));
        window.original3DParent.appendChild(map3dContainer);
        map3dContainer.style.display = mapIs3D ? 'block' : 'none';
        
        document.getElementById('map-modal').style.display = 'block';
        
        showToast("Returned to Standard Operations", "success");
    }
    
    setTimeout(() => {
        if (globalLeafletMap) globalLeafletMap.invalidateSize();
        if (mapThreeState.camera && mapThreeState.renderer) {
            const c3d = document.getElementById('cw-3d-slot');
            if (c3d.clientWidth > 0) {
                mapThreeState.camera.aspect = c3d.clientWidth / c3d.clientHeight;
                mapThreeState.camera.updateProjectionMatrix();
                mapThreeState.renderer.setSize(c3d.clientWidth, c3d.clientHeight);
            }
        }
    }, 300);
};

window.populateCwTargets = function() {
    const list = document.getElementById('cw-target-list');
    list.innerHTML = '';
    mapMarkers.forEach(m => {
        const li = document.createElement('li');
        li.className = 'cw-target-li';
        let nameMatch = m.getPopup().getContent().match(/<b>(.*?)<\/b>/);
        let tName = nameMatch ? nameMatch[1] : "Unknown";
        
        li.innerHTML = `[${tName}] <span style="color:#0055ff; font-size:0.8em; float:right;">${m.getLatLng().lat.toFixed(2)}, ${m.getLatLng().lng.toFixed(2)}</span>`;
        li.onclick = () => {
            globalLeafletMap.flyTo(m.getLatLng(), 12, {animate: true, duration: 1.5});
            m.openPopup();
            const feed = document.getElementById('cw-intel-feed');
            feed.innerHTML = `> Locking onto <span style="color:#00ffcc">${tName}</span>...<br>> Coords: ${m.getLatLng().lat.toFixed(4)}, ${m.getLatLng().lng.toFixed(4)}<br>> Tracking signal...<br>> Ready to strike.`;
        };
        list.appendChild(li);
    });
};

window.filterCwTargets = function() {
    const val = document.getElementById('cw-target-search').value.toLowerCase();
    const items = document.getElementById('cw-target-list').children;
    for(let i=0; i<items.length; i++) {
        items[i].style.display = items[i].innerText.toLowerCase().includes(val) ? 'block' : 'none';
    }
};

window.setCwCam = function(id) {
    const camDiv = document.getElementById('cw-cam-' + id);
    const iframe = camDiv.querySelector('.cw-cam-iframe');
    const url = prompt("Enter IP Camera Feed URL or RTSP Stream for CAM " + id + ":\n(e.g., http://192.168.1.100:8080/video)");
    if (url) {
        iframe.src = url;
        camDiv.querySelector('.cw-cam-label').style.background = 'rgba(0,255,0,0.8)';
        camDiv.querySelector('.cw-cam-label').innerText = 'LIVE - CAM ' + id;
        camDiv.style.borderColor = '#00ff00';
    }
};

window.openMapTargetPanel = function(target, ip, geo) {
    document.getElementById('map-target-panel').style.display = 'flex';
    document.getElementById('map-panel-title').innerText = target;
    document.getElementById('map-panel-info').innerHTML = `<b>IP:</b> ${ip || 'Unknown'}<br><b>Location:</b> ${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}<br><b>ISP:</b> ${geo.isp || 'Unknown'}`;
    document.getElementById('map-panel-search').value = '';
    
    const list = document.getElementById('map-panel-cmd-list');
    list.innerHTML = '';
    if (typeof commandsData !== 'undefined') {
        commandsData.forEach(cmd => {
            const div = document.createElement('div');
            div.className = 'scan-btn';
            div.style.justifyContent = 'space-between';
            div.style.minWidth = 'auto';
            div.style.padding = '10px';
            div.innerHTML = `<div><span style="color:#00ffcc; font-weight:bold;">${cmd.name}</span><br><span style="font-size:0.8em; color:#aaa;">[${cmd.category || 'Uncategorized'}]</span></div> <button style="padding:5px 15px; background:#ff00ff; color:#000; border:none; cursor:pointer; font-weight:bold;" onclick="window.executeMapCmd('${cmd.id}', '${target}', '${ip}')">EXECUTE ⚡</button>`;
            list.appendChild(div);
        });
    }
};

window.filterMapPanelCmds = function() {
    const filter = document.getElementById('map-panel-search').value.toLowerCase();
    const searchWords = filter.split(/\s+/).filter(Boolean);
    const items = document.getElementById('map-panel-cmd-list').children;
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        items[i].style.display = searchWords.every(word => text.includes(word)) ? 'flex' : 'none';
    }
};

window.executeMapCmd = function(cmdId, target, ip) {
    fetch('/create_folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder_name: target, ip_address: ip }) })
    .then(res => res.json()).then(data => {
        closeModal('map-modal');
        selectFolder(target, null);
        setTimeout(() => runTerminal(cmdId), 500);
    }).catch(err => {
        closeModal('map-modal');
        selectFolder(target, null);
        setTimeout(() => runTerminal(cmdId), 500);
    });
};

let scanLanNetwork = null;
let sysExpHistory = [];
let sysExpHistoryIndex = -1;

window.openHostBrowserModal = function() {
    const urlInput = document.getElementById('host-browser-url');
    if (currentFolder) {
        const target = currentFolder.split('/').pop();
        urlInput.value = target.startsWith('http') ? target : window.globalProtocol + target;
    } else {
        urlInput.value = '';
    }
    window.showAndBringToFront('host-browser-modal');
};

window.launchHostBrowser = function() {
    const browser = document.getElementById('host-browser-select').value;
    const url = document.getElementById('host-browser-url').value;
    if (!url) { showToast("Enter a fucking URL!", "error"); return; }
    
    fetch('/api/launch_browser', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({browser: browser, url: url})
    }).then(r=>r.json()).then(d=>{
        if(d.success) {
            showToast("Browser brutally launched on host system! 🚀", "success");
            closeModal('host-browser-modal');
        } else {
            showToast("Failed to launch: " + d.error, "error");
        }
    }).catch(e => showToast("Network error launching browser.", "error"));
};

window.openYouTubeModal = function() {
    window.showAndBringToFront('youtube-modal');
};

window.loadYouTubeVideo = function() {
    let url = document.getElementById('yt-url-input').value.trim();
    if(!url) { showToast("Give me a fucking YouTube URL!", "error"); return; }
    let mode = document.getElementById('yt-render-mode').value;
    let embedUrl = url;
    
    if(url.includes('watch?v=')) {
        let videoId = url.split('watch?v=')[1].split('&')[0];
        embedUrl = 'https://www.youtube.com/embed/' + videoId;
    } else if(url.includes('youtu.be/')) {
        let videoId = url.split('youtu.be/')[1].split('?')[0];
        embedUrl = 'https://www.youtube.com/embed/' + videoId;
    }
    
    if(mode === 'proxy') {
        document.getElementById('yt-iframe').src = '/proxy?url=' + encodeURIComponent(embedUrl);
    } else {
        document.getElementById('yt-iframe').src = embedUrl;
    }
};

window.openSysExplorerModal = function() {
    window.showAndBringToFront('sys-explorer-modal');
    sysExpHistory = [];
    sysExpHistoryIndex = -1;
    window.sysExpGoHome();
};

window.sysExpGoHome = function() {
    fetch('/api/fs/roots').then(r=>r.json()).then(data => {
        const container = document.getElementById('sys-exp-list');
        container.innerHTML = '';
        document.getElementById('sys-exp-path').value = 'ROOTS';
        data.forEach(r => {
            const div = document.createElement('div');
            div.className = 'cyber-file-item';
            div.onclick = () => loadSysPath(r.path);
            div.innerHTML = `
                <svg class="cyber-file-icon" viewBox="0 0 24 24"><path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></svg>
                <div class="cyber-file-label">${r.name}</div>
            `;
            container.appendChild(div);
        });
    });
};

window.loadSysPath = function(path, addToHistory = true) {
    document.getElementById('sys-exp-path').value = path;
    if (addToHistory) {
        sysExpHistory = sysExpHistory.slice(0, sysExpHistoryIndex + 1);
        sysExpHistory.push(path);
        sysExpHistoryIndex++;
    }
    fetch('/api/fs/list', {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({path: path})
    }).then(r=>r.json()).then(data => {
        const container = document.getElementById('sys-exp-list');
        container.innerHTML = '';
        if (data.success) {
            data.items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'cyber-file-item';
                const safePath = item.path.replace(/\\/g, '\\\\');
                div.onclick = () => window.sysItemClick(safePath, item.is_dir);
                div.oncontextmenu = (e) => window.sysExpContextMenu(e, safePath, item.is_dir);
                
                let iconSvg = item.is_dir 
                    ? `<svg class="cyber-file-icon" viewBox="0 0 24 24"><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></svg>`
                    : `<svg class="cyber-file-icon" viewBox="0 0 24 24" fill="#666"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></svg>`;
                    
                div.innerHTML = `
                    ${iconSvg}
                    <div class="cyber-file-label">${item.name}</div>
                `;
                container.appendChild(div);
            });
        } else {
            showToast("Failed to list directory: " + data.error, "error");
        }
    });
};

window.sysExpGoBack = function() {
    if (sysExpHistoryIndex > 0) {
        sysExpHistoryIndex--;
        loadSysPath(sysExpHistory[sysExpHistoryIndex], false);
    } else {
        window.sysExpGoHome();
    }
};

window.sysExpGoForward = function() {
    if (sysExpHistoryIndex < sysExpHistory.length - 1) {
        sysExpHistoryIndex++;
        loadSysPath(sysExpHistory[sysExpHistoryIndex], false);
    }
};

window.sysExpGoUp = function() {
    let path = document.getElementById('sys-exp-path').value;
    if (path === 'ROOTS') return;
    let upPath = path.substring(0, Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\')));
    if (!upPath) upPath = path.includes('\\') ? path.substring(0, path.indexOf('\\')+1) : '/';
    loadSysPath(upPath);
};

window.sysItemClick = function(path, isDir) {
    if (isDir) {
        loadSysPath(path);
    } else {
        const ext = path.split('.').pop().toLowerCase();
        const imgExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
        const vidExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
        
        document.getElementById('sys-file-title').innerText = path;
        const textContainer = document.getElementById('sys-file-content');
        const mediaContainer = document.getElementById('sys-file-media-container');
        
        document.getElementById('sys-file-save-btn').style.display = 'none';
        if (imgExts.includes(ext)) {
            textContainer.style.display = 'none';
            mediaContainer.style.display = 'flex';
            mediaContainer.innerHTML = `<img src="/api/fs/serve?path=${encodeURIComponent(path)}" style="max-width:100%; max-height:100%; object-fit:contain;">`;
            document.getElementById('sys-file-view-modal').style.display = 'block';
        } else if (vidExts.includes(ext)) {
            textContainer.style.display = 'none';
            mediaContainer.style.display = 'flex';
            mediaContainer.innerHTML = `<video controls autoplay style="max-width:100%; max-height:100%; outline:none;"><source src="/api/fs/serve?path=${encodeURIComponent(path)}"></video>`;
            document.getElementById('sys-file-view-modal').style.display = 'block';
        } else {
            textContainer.style.display = 'block';
            mediaContainer.style.display = 'none';
            mediaContainer.innerHTML = '';
            fetch('/api/fs/read', {
                method: 'POST', headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({path: path})
            }).then(r=>r.json()).then(data => {
                if (data.success) {
                    document.getElementById('sys-file-content').value = data.type === 'text' ? data.content : "[BINARY DATA, DUMBASS. I CAN'T READ THIS SHIT AS TEXT.]";
                    document.getElementById('sys-file-save-btn').style.display = data.type === 'text' ? 'block' : 'none';
                    document.getElementById('sys-file-view-modal').style.display = 'block';
                } else {
                    showToast("Failed to read file: " + data.error, "error");
                }
            });
        }
    }
};

window.sysExpCurrentContextPath = '';
window.sysExpCurrentContextIsDir = false;

document.getElementById('sys-exp-content').addEventListener('contextmenu', function(e) {
    if (e.target === this || e.target.id === 'sys-exp-list') {
        const curPath = document.getElementById('sys-exp-path').value;
        if(curPath !== 'ROOTS') {
            window.sysExpContextMenu(e, curPath, true, true);
        }
    }
});

window.sysExpContextMenu = function(e, path, isDir, isSpace=false) {
    e.preventDefault();
    e.stopPropagation();
    window.sysExpCurrentContextPath = path;
    window.sysExpCurrentContextIsDir = isDir;
    
    const ctx = document.getElementById('sys-exp-context-menu');
    ctx.style.left = e.clientX + 'px';
    ctx.style.top = e.clientY + 'px';
    ctx.style.display = 'block';
    
    document.getElementById('ctx-sysexp-create-file').style.display = isDir || isSpace ? 'block' : 'none';
    document.getElementById('ctx-sysexp-create-folder').style.display = isDir || isSpace ? 'block' : 'none';
    document.getElementById('ctx-sysexp-copy-path').style.display = isSpace ? 'none' : 'block';
    document.getElementById('ctx-sysexp-delete').style.display = isSpace ? 'none' : 'block';
};

document.addEventListener('click', function(e) {
    const ctx1 = document.getElementById('icon-context-menu');
    if(ctx1 && !e.target.closest('#icon-context-menu')) ctx1.style.display = 'none';
    const ctx2 = document.getElementById('sys-exp-context-menu');
    if(ctx2 && !e.target.closest('#sys-exp-context-menu')) ctx2.style.display = 'none';
});

document.getElementById('ctx-sysexp-create-file').onclick = function() {
    document.getElementById('sys-exp-context-menu').style.display = 'none';
    const name = prompt("Enter new file name:");
    if(name) {
        let basePath = window.sysExpCurrentContextIsDir ? window.sysExpCurrentContextPath : document.getElementById('sys-exp-path').value;
        fetch('/api/fs/create', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({path: basePath, name: name, is_dir: false})}).then(r=>r.json()).then(d=>{
            if(d.success) { showToast("File brutally created!", "success"); loadSysPath(basePath, false); }
            else showToast("Error: " + d.error, "error");
        });
    }
};

document.getElementById('ctx-sysexp-create-folder').onclick = function() {
    document.getElementById('sys-exp-context-menu').style.display = 'none';
    const name = prompt("Enter new folder name:");
    if(name) {
        let basePath = window.sysExpCurrentContextIsDir ? window.sysExpCurrentContextPath : document.getElementById('sys-exp-path').value;
        fetch('/api/fs/create', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({path: basePath, name: name, is_dir: true})}).then(r=>r.json()).then(d=>{
            if(d.success) { showToast("Folder brutally created!", "success"); loadSysPath(basePath, false); }
            else showToast("Error: " + d.error, "error");
        });
    }
};

document.getElementById('ctx-sysexp-copy-path').onclick = function() {
    document.getElementById('sys-exp-context-menu').style.display = 'none';
    navigator.clipboard.writeText(window.sysExpCurrentContextPath).then(()=>showToast("Path copied!", "success"));
};

document.getElementById('ctx-sysexp-delete').onclick = function() {
    document.getElementById('sys-exp-context-menu').style.display = 'none';
    if(confirm(`Are you sure you want to nuke ${window.sysExpCurrentContextPath}?`)) {
        fetch('/api/fs/delete', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({path: window.sysExpCurrentContextPath})}).then(r=>r.json()).then(d=>{
            if(d.success) { showToast("Annihilated!", "success"); loadSysPath(document.getElementById('sys-exp-path').value, false); }
            else showToast("Error: " + d.error, "error");
        });
    }
};

window.sysExpSaveFile = function() {
    const path = document.getElementById('sys-file-title').innerText;
    const content = document.getElementById('sys-file-content').value;
    fetch('/api/fs/write', {method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({path: path, content: content})}).then(r=>r.json()).then(d=>{
        if(d.success) showToast("File mercilessly overwritten!", "success");
        else showToast("Failed to save: " + d.error, "error");
    });
};

window.openScanLanModal = function() {
    window.showAndBringToFront('scanlan-modal');
    if (!scanLanNetwork) initScanLanNetwork({nodes: [], edges: []});
};

window.runAdvancedLanScan = function() {
    showToast("Initiating ruthless LAN sweep...", "warning");
    fetch('/api/scan_lan').then(r=>r.json()).then(data => {
        if(data.success) {
            window.lastScanLanData = data.network;
            initScanLanNetwork(data.network);
            showToast("LAN brutally mapped! 💀", "success");
        } else {
            showToast("Failed to scan: " + data.error, "error");
        }
    });
};

window.scanLanLayoutMode = 'hierarchical';
window.scanLanLineType = 'curve';

window.toggleScanLanLines = function() {
    window.scanLanLineType = window.scanLanLineType === 'curve' ? 'pcb' : 'curve';
    const btn = document.getElementById('scanlan-line-toggle');
    if (btn) {
        btn.innerText = window.scanLanLineType === 'curve' ? '〰 CURVE LINES' : '⎍ PCB LINES';
        btn.style.borderColor = window.scanLanLineType === 'curve' ? '#00ffcc' : '#ff00ff';
        btn.style.color = window.scanLanLineType === 'curve' ? '#00ffcc' : '#ff00ff';
    }
    if (window.lastScanLanData) {
        window.initScanLanNetwork(window.lastScanLanData);
    }
};

window.saveScanLanMap = function() {
    const container = document.getElementById('scanlan-network-container');
    const canvas = container.querySelector('canvas');
    if (!canvas) {
        showToast("No map to save!", "error");
        return;
    }
    const link = document.createElement('a');
    link.download = 'cyber_lan_map.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast("LAN Map Saved! 💾", "success");
};

window.toggleScanLanNetmap = function() {
    window.scanLanLayoutMode = 'netmap';
    const btn1 = document.getElementById('scanlan-tree-btn');
    const btn2 = document.getElementById('scanlan-netmap-btn');
    if(btn1) btn1.classList.remove('active-state');
    if(btn2) btn2.classList.add('active-state');
    if (window.lastScanLanData) {
        window.initScanLanNetwork(window.lastScanLanData);
    }
};

window.toggleScanLanTree = function() {
    window.scanLanLayoutMode = 'hierarchical';
    const btn1 = document.getElementById('scanlan-tree-btn');
    const btn2 = document.getElementById('scanlan-netmap-btn');
    if(btn2) btn2.classList.remove('active-state');
    if(btn1) btn1.classList.add('active-state');
    if (window.lastScanLanData) {
        window.initScanLanNetwork(window.lastScanLanData);
    }
};

let d3ScanLanState = { simulation: null };

function initD3ScanLanNetmap(nodesData, edgesData) {
    const container = d3.select("#scanlan-network-container");
    container.selectAll("*").remove();
    
    container.style("background", "radial-gradient(circle at center, #001a00 0%, #000 100%)").style("cursor", "grab");
             
    const mapLayer = container.append("div").style("position", "absolute").style("top", "0").style("left", "0").style("width", "100%").style("height", "100%").style("transform-origin", "0 0");
    const svg = mapLayer.append("svg").style("position", "absolute").style("top", "0").style("left", "0").style("width", "100%").style("height", "100%").style("pointer-events", "none").style("overflow", "visible");
    const nodesContainer = mapLayer.append("div").style("position", "absolute").style("top", "0").style("left", "0").style("width", "100%").style("height", "100%");

    const d3Nodes = nodesData.map(n => ({...n, d3Id: n.id}));
    const d3Links = edgesData.map(e => ({source: e.from, target: e.to, id: e.from + "-" + e.to}));

    if (d3ScanLanState.simulation) d3ScanLanState.simulation.stop();

    d3ScanLanState.simulation = d3.forceSimulation(d3Nodes)
        .force("charge", d3.forceManyBody().strength(-300))
        .force("link", d3.forceLink(d3Links).id(d => d.d3Id).distance(150))
        .force("center", d3.forceCenter(container.node().clientWidth / 2, container.node().clientHeight / 2))
        .force("collide", d3.forceCollide().radius(25))
        .on("tick", tickedD3);

    const zoom = d3.zoom().scaleExtent([0.1, 4]).on("zoom", (event) => {
        mapLayer.style("transform", `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`);
    });
    container.call(zoom).on("dblclick.zoom", null);

    const lineSelection = svg.selectAll("line").data(d3Links, d => d.id)
        .enter().append("line")
        .style("stroke-width", 1.5)
        .style("opacity", 0.5)
        .style("stroke", d => {
            if (d.target.d3Id === 'router' || d.source.d3Id === 'router') return '#00ff00';
            if (d.target.d3Id === 'internet' || d.source.d3Id === 'internet') return '#0055ff';
            return '#ff0055';
        })
        .style("stroke-dasharray", d => {
            if (d.target.d3Id !== 'router' && d.source.d3Id !== 'router' && d.target.d3Id !== 'internet' && d.source.d3Id !== 'internet') return "5,5";
            return "none";
        });

    const nodeSelection = nodesContainer.selectAll(".d3-node").data(d3Nodes, d => d.d3Id)
        .enter().append("div")
        .attr("class", d => {
            if (d.d3Id === 'internet') return "d3-node d3-node-subdomain";
            if (d.d3Id === 'localhost') return "d3-node d3-node-root";
            if (d.d3Id === 'router') return "d3-node d3-node-scan";
            return "d3-node d3-node-target";
        })
        .on("contextmenu", (event, d) => {
            event.preventDefault();
            const ctxMenu = document.getElementById('scanlan-context-menu');
            const rect = document.getElementById('scanlan-network-container').getBoundingClientRect();
            ctxMenu.style.left = (event.clientX - rect.left) + 'px';
            ctxMenu.style.top = (event.clientY - rect.top) + 'px';
            ctxMenu.style.display = 'block';
            
            const rawIp = d.label.replace('GATEWAY (', '').replace(')', '').trim();
            document.getElementById('ctx-scanlan-details').onclick = () => { toggleToolTerminal('nmap_' + rawIp); ctxMenu.style.display = 'none'; };
            document.getElementById('ctx-scanlan-gateway').onclick = () => { 
                fetch('/create_folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder_name: rawIp, ip_address: rawIp }) })
                .then(res => res.json()).then(data => { 
                    if (data.success) { 
                        showToast(`Target ${rawIp} brutally added! 🎯`, "success");
                        const ul = document.getElementById('folder-list');
                        const li = document.createElement('li');
                        li.className = 'target-container';
                        li.innerHTML = `
                            <div class="folder-item" ondblclick="toggleSubdomains('${rawIp}')" onclick="selectFolder('${rawIp}', this)" ondragover="event.preventDefault(); this.classList.add('drag-over');" ondragleave="this.classList.remove('drag-over');" ondrop="this.classList.remove('drag-over'); dropTargetFlag(event, '${rawIp}', this)">
                                <div style="display:flex; flex-direction:column; width:100%;">
                                    <div style="display:flex; flex-direction:column; align-items:flex-start; width: 100%;">
                                        <div style="display:flex; align-items:center; word-break: break-all; width: 100%;">
                                            <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:#111; vertical-align:middle; margin-right:5px; border: 1px solid #00ffcc; flex-shrink:0;"></span>
                                            <span style="font-weight:bold; font-size:1.1em; color:#fff;">${rawIp}</span>
                                        </div>
                                        <div class="target-actions" style="margin-top: 8px; margin-left: 21px; display:flex; gap:12px;">
                                            <span class="action-icon" title="Delete Target" onclick="event.stopPropagation(); deleteTarget('${rawIp}')"><i data-icon="trash" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit Target Info" onclick="event.stopPropagation(); openEditTargetModal('${rawIp}', 'bugbounty')"><i data-icon="edit" data-size="16"></i></span>
                                            <span class="action-icon" title="Add Subdomain" onclick="event.stopPropagation(); openSubdomainModal('${rawIp}')"><i data-icon="globe" data-size="16"></i></span>
                                            <span class="action-icon" title="Bulk Upload Subdomains" onclick="event.stopPropagation(); openBulkSubdomainModal('${rawIp}')"><i data-icon="folder" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit Cookie" onclick="event.stopPropagation(); openCookieModal('${rawIp}')"><i data-icon="cookie" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit IP Address" onclick="event.stopPropagation(); openIpModal('${rawIp}')"><i data-icon="target" data-size="16"></i></span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ul id="subs-${rawIp}" class="subdomain-list" style="display:none;"></ul>`;
                        ul.appendChild(li);
                        if (window.hydrateIcons) window.hydrateIcons(li);
                    }
                });
                ctxMenu.style.display = 'none'; 
            };
            document.getElementById('ctx-scanlan-ping').onclick = () => { toggleToolTerminal('ping_' + rawIp); ctxMenu.style.display = 'none'; };
            document.getElementById('ctx-scanlan-commands').onclick = () => { window.openScanLanCmdModal(rawIp); ctxMenu.style.display = 'none'; };
        })
        .call(d3.drag()
            .on("start", (event, d) => {
                if (!event.active) d3ScanLanState.simulation.alphaTarget(0.3).restart();
                d.fx = d.x; d.fy = d.y;
            })
            .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
            .on("end", (event, d) => {
                if (!event.active) d3ScanLanState.simulation.alphaTarget(0);
                d.fx = null; d.fy = null;
            }));

    nodeSelection.each(function(d) {
        let lblColor = '#fff';
        if (d.d3Id === 'internet') lblColor = '#00ccff';
        else if (d.d3Id === 'localhost') lblColor = '#ff0000';
        else if (d.d3Id === 'router') lblColor = '#00ffcc';
        else lblColor = '#00ff00';
        d3.select(this).append("div").attr("class", "d3-ip-label").style("color", lblColor).text(d.label || d.d3Id);
    });

    function tickedD3() {
        lineSelection.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        nodeSelection.style("left", d => d.x + "px").style("top", d => d.y + "px");
    }
}

window.initScanLanNetwork = function(data) {
    const container = document.getElementById('scanlan-network-container');
    let renderNodes = JSON.parse(JSON.stringify(data.nodes));
    let renderEdges = JSON.parse(JSON.stringify(data.edges));
    let options = {};

    if (window.scanLanLayoutMode === 'netmap') {
        if (scanLanNetwork) { scanLanNetwork.destroy(); scanLanNetwork = null; }
        initD3ScanLanNetmap(data.nodes, data.edges);
        return;
    } else {
        if (d3ScanLanState.simulation) d3ScanLanState.simulation.stop();
        container.innerHTML = '';
        container.style.background = '';
    }
    
    if (window.scanLanLayoutMode === 'circular') {
        options = {
            nodes: {
                shape: 'image',
                size: 35,
                font: { color: '#00ffcc', size: 14, face: 'monospace', background: 'rgba(0,0,0,0.8)' },
                borderWidth: 0,
                shadow: { enabled: true, color: 'rgba(0,255,204,0.8)', size: 20, x: 0, y: 0 }
            },
            edges: {
                width: 3,
                color: { color: '#ff00ff', highlight: '#ffffff', hover: '#00ffff' },
                smooth: window.scanLanLineType === 'curve' ? { type: 'continuous' } : { type: 'discrete', roundness: 0 }
            },
            layout: { hierarchical: false },
            physics: {
                solver: 'forceAtlas2Based',
                forceAtlas2Based: { gravitationalConstant: -100, centralGravity: 0.01, springLength: 150, springConstant: 0.08 },
                minVelocity: 0.75
            },
            interaction: { hover: true }
        };
    } else {
        options = {
            nodes: {
                shape: 'image',
                size: 30,
                font: { color: '#00ffcc', size: 14, face: 'monospace', background: 'rgba(0,0,0,0.7)' },
                borderWidth: 0,
                shadow: { enabled: true, color: 'rgba(0,255,204,0.5)', size: 15, x: 0, y: 0 }
            },
            edges: {
                width: 3,
                color: { color: window.scanLanLineType === 'curve' ? '#00ffff' : '#ff00ff', highlight: '#ffffff', hover: '#00ffff' },
                smooth: window.scanLanLineType === 'curve' ? { type: 'cubicBezier', forceDirection: 'vertical', roundness: 0.4 } : { type: 'stepBefore', roundness: 0 }
            },
            layout: {
                hierarchical: { direction: 'UD', sortMethod: 'directed', nodeSpacing: 250, levelSeparation: 200 }
            },
            physics: { hierarchicalRepulsion: { nodeDistance: 250 } },
            interaction: { hover: true }
        };
    }
    
    if (scanLanNetwork) scanLanNetwork.destroy();
    
    scanLanNetwork = new vis.Network(container, {
        nodes: new vis.DataSet(renderNodes),
        edges: new vis.DataSet(renderEdges)
    }, options);

    scanLanNetwork.on("stabilizationIterationsDone", function () {
        scanLanNetwork.setOptions( { physics: false } );
    });

    scanLanNetwork.on("oncontext", function (params) {
        params.event.preventDefault();
        const nodeId = scanLanNetwork.getNodeAt(params.pointer.DOM);
        if (nodeId) {
            const node = renderNodes.find(n => n.id === nodeId);
            if(!node) return;
            const ctxMenu = document.getElementById('scanlan-context-menu');
            const rect = container.getBoundingClientRect();
            ctxMenu.style.left = (params.event.clientX - rect.left) + 'px';
            ctxMenu.style.top = (params.event.clientY - rect.top) + 'px';
            ctxMenu.style.display = 'block';
            
            const rawIp = node.label.replace('GATEWAY (', '').replace(')', '').trim();
            document.getElementById('ctx-scanlan-details').onclick = () => { toggleToolTerminal('nmap_' + rawIp); ctxMenu.style.display = 'none'; };
            document.getElementById('ctx-scanlan-gateway').onclick = () => { 
                fetch('/create_folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder_name: rawIp, ip_address: rawIp }) })
                .then(res => res.json()).then(data => { 
                    if (data.success) { 
                        showToast(`Target ${rawIp} brutally added! 🎯`, "success");
                        const ul = document.getElementById('folder-list');
                        const li = document.createElement('li');
                        li.className = 'target-container';
                        li.innerHTML = `
                            <div class="folder-item" ondblclick="toggleSubdomains('${rawIp}')" onclick="selectFolder('${rawIp}', this)" ondragover="event.preventDefault(); this.classList.add('drag-over');" ondragleave="this.classList.remove('drag-over');" ondrop="this.classList.remove('drag-over'); dropTargetFlag(event, '${rawIp}', this)">
                                <div style="display:flex; flex-direction:column; width:100%;">
                                    <div style="display:flex; flex-direction:column; align-items:flex-start; width: 100%;">
                                        <div style="display:flex; align-items:center; word-break: break-all; width: 100%;">
                                            <span style="display:inline-block; width:16px; height:16px; border-radius:50%; background:#111; vertical-align:middle; margin-right:5px; border: 1px solid #00ffcc; flex-shrink:0;"></span>
                                            <span style="font-weight:bold; font-size:1.1em; color:#fff;">${rawIp}</span>
                                            <span id="scan-count-${rawIp}" class="scan-count" style="display:none; margin-left: auto; background: #ffaa00; color: #000; padding: 2px 6px; border-radius: 10px; font-size: 0.8em; font-weight: bold;">0</span>
                                        </div>
                                        <div class="target-actions" style="margin-top: 8px; margin-left: 21px; display:flex; gap:12px;">
                                            <span class="action-icon" title="Delete Target" onclick="event.stopPropagation(); deleteTarget('${rawIp}')"><i data-icon="trash" data-size="16"></i></span>
                                            <span class="action-icon" title="Add Subdomain" onclick="event.stopPropagation(); openSubdomainModal('${rawIp}')"><i data-icon="globe" data-size="16"></i></span>
                                            <span class="action-icon" title="Bulk Upload Subdomains" onclick="event.stopPropagation(); openBulkSubdomainModal('${rawIp}')"><i data-icon="folder" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit Cookie" onclick="event.stopPropagation(); openCookieModal('${rawIp}')"><i data-icon="cookie" data-size="16"></i></span>
                                            <span class="action-icon" title="Edit IP Address" onclick="event.stopPropagation(); openIpModal('${rawIp}')"><i data-icon="target" data-size="16"></i></span>
                                        </div>
                                    </div>
                                    <div class="target-flag-container" style="display:flex; gap:2px; margin-top:2px;"></div>
                                </div>
                            </div>
                            <ul id="subs-${rawIp}" class="subdomain-list" style="display:none;"></ul>`;
                        ul.appendChild(li);
                        if (window.hydrateIcons) window.hydrateIcons(li);
                    } else { showToast("Error: " + data.error, "error"); }
                });
                ctxMenu.style.display = 'none'; 
            };
            document.getElementById('ctx-scanlan-ping').onclick = () => { toggleToolTerminal('ping_' + rawIp); ctxMenu.style.display = 'none'; };
            document.getElementById('ctx-scanlan-commands').onclick = () => { window.openScanLanCmdModal(rawIp); ctxMenu.style.display = 'none'; };
        }
    });
    
    scanLanNetwork.on("click", function() {
        document.getElementById('scanlan-context-menu').style.display = 'none';
    });
};

window.openScanLanCmdModal = function(ip) {
    document.getElementById('scanlan-cmd-target').innerText = ip;
    document.getElementById('scanlan-cmd-search').value = '';
    const list = document.getElementById('scanlan-cmd-list');
    list.innerHTML = '';
    if (typeof commandsData !== 'undefined') {
        commandsData.forEach(cmd => {
            const div = document.createElement('div');
            div.className = 'scan-btn';
            div.style.justifyContent = 'space-between';
            div.style.minWidth = 'auto';
            div.style.padding = '10px';
            div.innerHTML = `<div><span style="color:#00ffcc; font-weight:bold;">${cmd.name}</span><br><span style="font-size:0.8em; color:#aaa;">[${cmd.category || 'Uncategorized'}]</span></div> <button style="padding:5px 15px; background:#ff00ff; color:#000; border:none; cursor:pointer; font-weight:bold;" onclick="window.executeScanLanCmd('${cmd.id}', '${ip}')">EXECUTE ⚡</button>`;
            list.appendChild(div);
        });
    }
    window.showAndBringToFront('scanlan-cmd-modal');
};

window.filterScanLanCmds = function() {
    const filter = document.getElementById('scanlan-cmd-search').value.toLowerCase();
    const searchWords = filter.split(/\s+/).filter(Boolean);
    const items = document.getElementById('scanlan-cmd-list').children;
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        items[i].style.display = searchWords.every(word => text.includes(word)) ? 'flex' : 'none';
    }
};

window.executeScanLanCmd = function(cmdId, ip) {
    fetch('/create_folder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ folder_name: ip, ip_address: ip }) })
    .then(res => res.json()).then(data => {
        closeModal('scanlan-cmd-modal');
        closeModal('scanlan-modal');
        selectFolder(ip, null);
        setTimeout(() => runTerminal(cmdId), 500);
    }).catch(err => {
        closeModal('scanlan-cmd-modal');
        closeModal('scanlan-modal');
        selectFolder(ip, null);
        setTimeout(() => runTerminal(cmdId), 500);
    });
};

function makeGlobalDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    
    // Check if it already has a resizer to avoid duplicate
    if (!element.querySelector('.global-resizer') && !element.classList.contains('terminal-content')) {
        const resizer = document.createElement('div');
        resizer.className = 'global-resizer';
        resizer.style.width = '15px';
        resizer.style.height = '15px';
        resizer.style.background = 'transparent';
        resizer.style.borderRight = '2px solid #00ffcc';
        resizer.style.borderBottom = '2px solid #00ffcc';
        resizer.style.position = 'absolute';
        resizer.style.right = '2px';
        resizer.style.bottom = '2px';
        resizer.style.cursor = 'se-resize';
        resizer.style.zIndex = '100';
        element.appendChild(resizer);
        
        resizer.addEventListener('mousedown', function(e) {
            e.preventDefault();
            e.stopPropagation();
            window.addEventListener('mousemove', resize);
            window.addEventListener('mouseup', stopResize);
            bringToolToFront(element);
        });

        function resize(e) {
            element.style.width = (e.clientX - element.getBoundingClientRect().left) + 'px';
            element.style.height = (e.clientY - element.getBoundingClientRect().top) + 'px';
            const iframe = element.querySelector('iframe');
            if (iframe && iframe.contentWindow) iframe.contentWindow.dispatchEvent(new Event('resize'));
        }
        function stopResize() {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResize);
        }
    }

    element.addEventListener('mousedown', dragMouseDown);

    function dragMouseDown(e) {
        const interactiveTags = ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT', 'OPTION', 'A'];
        
        // Move only from header/top area (first 50px) or specific handles
        const isHeader = e.target.tagName === 'H2' || e.target.tagName === 'H3' || e.target.closest('.sys-win-controls') || e.target.closest('header');
        const isTopArea = e.clientY - element.getBoundingClientRect().top < 50;

        if (
            !isHeader && !isTopArea ||
            interactiveTags.includes(e.target.tagName) || 
            e.target.classList.contains('close') || 
            e.target.classList.contains('global-resizer') ||
            e.target.closest('.terminal') ||
            e.target.closest('.CodeMirror') ||
            e.target.closest('iframe') ||
            e.target.closest('.xterm') ||
            e.target.closest('#canvas-workspace') ||
            e.target.closest('#map-container') ||
            e.target.classList.contains('nav-btn') ||
            e.target.classList.contains('maximize-btn') ||
            e.target.classList.contains('graph-ctrl-btn') ||
            e.target.closest('#map-target-panel') ||
            e.target.closest('.leaflet-container') ||
            e.target.closest('#sys-exp-content') ||
            e.target.closest('.jstree')
        ) {
            if (!e.target.closest('.leaflet-container')) {
                bringToolToFront(element);
            }
            return;
        }

        // Do not preventDefault here if it's not a drag start on header, so text selection works
        if (isHeader || isTopArea) e.preventDefault();
        
        if (window.getComputedStyle(element).transform !== 'none') {
            const rect = element.getBoundingClientRect();
            element.style.transform = 'none';
            element.style.top = rect.top + 'px';
            element.style.left = rect.left + 'px';
        }

        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        bringToolToFront(element);
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + "px";
        element.style.left = (element.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}

function injectWindowControls() {
    document.querySelectorAll('.modal-content').forEach(modal => {
        if (
            modal.parentElement.id === 'multi-terminal-modal' ||
            modal.id === 'tool-terminal-modal' ||
            modal.classList.contains('terminal-content') ||
            modal.querySelector('.sys-win-controls')
        ) return;

        const closeBtn = modal.querySelector(':scope > .close, :scope > div > .close, :scope > header > .close');
        if (!closeBtn) return;

        const bar = document.createElement('span');
        bar.className = 'sys-win-controls';
        bar.style.cssText = 'display:inline-flex; align-items:center; gap:12px; margin-right:8px; line-height:1; vertical-align:middle; flex-wrap:nowrap; flex-shrink:0;';

        const makeBtn = (symbol, title, color) => {
            const btn = document.createElement('span');
            btn.innerHTML = symbol;
            btn.title = title;
            btn.style.cssText = `
                cursor:pointer;
                font-size:18px;
                color:${color};
                line-height:1;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                padding:2px 4px;
                border-radius:3px;
                transition:text-shadow 0.2s;
                user-select:none;
                flex-shrink:0;
            `;
            btn.onmouseover = () => btn.style.textShadow = `0 0 8px ${color}`;
            btn.onmouseout = () => btn.style.textShadow = 'none';
            return btn;
        };

        // Blur button
        const blurBtn = makeBtn('👁️', 'Toggle Blur', '#ffaa00');
        blurBtn.onclick = e => {
            e.stopPropagation();
            const targetToBlur = modal.querySelector('.terminal-container, .xterm-screen, textarea, iframe, #interactive-terminal-container, #multi-term-container, #terminal-container');
            if (targetToBlur) targetToBlur.classList.toggle('privacy-blur');
            else modal.classList.toggle('privacy-blur');
        };
        bar.appendChild(blurBtn);

        // Min button
        const minBtn = makeBtn('−', 'Minimize', '#00ffcc');
        let isMin = false;
        minBtn.onclick = e => {
            e.stopPropagation();
            if (modal.parentElement && modal.parentElement.id === 'openvpn-modal') {
                modal.parentElement.style.display = 'none';
                return;
            }
            if (!isMin) {
                Array.from(modal.children).forEach(child => {
                    if (!child.classList.contains('modal-header') && !child.classList.contains('close') && !child.classList.contains('sys-win-controls') && child.tagName !== 'H2' && child.tagName !== 'H3') {
                        child.dataset.oldDisplay = child.style.display || getComputedStyle(child).display;
                        child.style.display = 'none';
                    }
                });
                modal.dataset.savedH = modal.style.height || getComputedStyle(modal).height;
                modal.dataset.savedOvf = modal.style.overflow;
                modal.style.height = 'auto';
                modal.style.minHeight = 'auto';
                modal.style.overflow = 'hidden';
                isMin = true;
            } else {
                Array.from(modal.children).forEach(child => {
                    if (child.dataset.oldDisplay !== undefined) {
                        child.style.display = child.dataset.oldDisplay === 'none' ? '' : child.dataset.oldDisplay;
                    }
                });
                modal.style.height = modal.dataset.savedH || '';
                modal.style.minHeight = '';
                modal.style.overflow = modal.dataset.savedOvf || '';
                isMin = false;
            }
        };

        // Max button
        const maxBtn = makeBtn('□', 'Maximize', '#00ffcc');
        maxBtn.onclick = e => {
            e.stopPropagation();
            const full = modal.classList.toggle('fullscreen-mode');
            document.body.style.overflow = document.querySelectorAll('.fullscreen-mode').length > 0 ? 'hidden' : '';
            maxBtn.innerHTML = full ? '❐' : '□';
            const termId = modal.parentElement?.id?.replace('-modal', '') || '';
            if (interactiveTerminals?.[termId]?.fitAddon) {
                setTimeout(() => interactiveTerminals[termId].fitAddon.fit(), 50);
            }
            const iframe = modal.querySelector('iframe');
            if (iframe && iframe.contentWindow) {
                setTimeout(() => iframe.contentWindow.dispatchEvent(new Event('resize')), 50);
            }
        };

        bar.appendChild(minBtn);
        bar.appendChild(maxBtn);

        // Brutal UI fix for overlapping buttons
        const isHeaderDirectChild = closeBtn.parentNode.classList.contains('modal-header');
        const parentIsColumn = getComputedStyle(closeBtn.parentNode).flexDirection === 'column';
        const parentFlex = (closeBtn.parentNode.tagName === 'DIV' && 
                            (closeBtn.parentNode.style.display === 'flex' || getComputedStyle(closeBtn.parentNode).display === 'flex') && 
                            !parentIsColumn);
        
        if (isHeaderDirectChild) {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'display:flex; align-items:center; gap:10px; flex-shrink:0;';
            closeBtn.parentNode.insertBefore(wrapper, closeBtn);
            wrapper.appendChild(bar);
            wrapper.appendChild(closeBtn);
            closeBtn.style.position = 'static';
            closeBtn.style.margin = '0';
        } else if (parentFlex) {
            closeBtn.parentNode.insertBefore(bar, closeBtn);
            closeBtn.style.position = 'static';
            closeBtn.style.margin = '0';
            closeBtn.style.flexShrink = '0';
        } else {
            const wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:absolute; top:8px; right:15px; display:flex; align-items:center; gap:8px; z-index:100; flex-wrap:nowrap; flex-shrink:0; background:inherit; padding-left:10px; border-radius:5px;';
            closeBtn.parentNode.insertBefore(wrapper, closeBtn);
            bar.style.margin = '0';
            wrapper.appendChild(bar);
            wrapper.appendChild(closeBtn);
            closeBtn.style.position = 'static';
            closeBtn.style.margin = '0';
            closeBtn.style.right = 'auto';
            closeBtn.style.top = 'auto';
            closeBtn.style.flexShrink = '0';
        }
    });
}

// ── Terminal Background Style ────────────────────────────────────────────
function applyTerminalBgStyle(style) {
    let styleTag = document.getElementById('cyber-terminal-bg-style');
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'cyber-terminal-bg-style';
        document.head.appendChild(styleTag);
    }

    const LOGO = "url('/static/logo.svg')";

    // xterm transparency is always required so the background logo shows through
    const xtermTransparent = `
        .xterm,
        .xterm-viewport,
        .xterm-screen,
        .xterm-helpers,
        .xterm canvas { background: transparent !important; background-color: transparent !important; }
    `;

    // logo base styles shared across all panes
    const logoBase = `
        background-image: ${LOGO} !important;
        background-repeat: no-repeat !important;
        background-position: center center !important;
        background-size: 180px !important;
    `;

    const PANES = `
        #terminal-container,
        #multi-term-container,
        .multi-term-pane,
        #interactive-terminal-container,
        #tool-terminal-container,
        #ovpn-terminal-container,
        #tunnel-terminal-container,
        #ssh-terminal-container
    `;

    if (style === 'transparent') {
        styleTag.textContent = `
            ${PANES} {
                ${logoBase}
                background-color: rgba(0, 0, 0, 0.15) !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
            .terminal-content { background-color: rgba(5, 0, 15, 0.4) !important; }
            ${xtermTransparent}
        `;
    } else if (style === 'black-logo') {
        styleTag.textContent = `
            ${PANES} {
                ${logoBase}
                background-color: rgba(0, 0, 0, 0.92) !important;
                backdrop-filter: none !important;
                -webkit-backdrop-filter: none !important;
            }
            .terminal-content { background-color: rgba(0, 0, 0, 0.92) !important; }
            ${xtermTransparent}
        `;
    } else if (style === 'blur-logo') {
        styleTag.textContent = `
            ${PANES} {
                ${logoBase}
                background-color: rgba(5, 0, 20, 0.3) !important;
                backdrop-filter: blur(14px) !important;
                -webkit-backdrop-filter: blur(14px) !important;
            }
            .terminal-content {
                background-color: rgba(5, 0, 20, 0.3) !important;
                backdrop-filter: blur(14px) !important;
                -webkit-backdrop-filter: blur(14px) !important;
            }
            ${xtermTransparent}
        `;
    }
}

// Apply on page load
(function() {
    const saved = localStorage.getItem('cyber_terminal_bg') || 'transparent';
    applyTerminalBgStyle(saved);
})();

window.toggleCmdFileBox = function() {
    const box = document.getElementById('cmd-file-box');
    if (box.style.display === 'none' || box.style.display === '') {
        box.style.display = 'block';
        window.loadCmdFileBoxList();
    } else {
        box.style.display = 'none';
    }
};

window.loadCmdFileBoxList = function() {
    fetch('/get_multi_commands_list').then(r=>r.json()).then(files => {
        const list = document.getElementById('cmd-file-box-list');
        list.innerHTML = '';
        files.forEach(f => {
            let disp = f.replace(/\.txt$/i, '');
            const li = document.createElement('li');
            li.style.padding = '8px';
            li.style.borderBottom = '1px solid #333';
            li.style.cursor = 'pointer';
            li.style.color = '#00ffcc';
            li.innerText = disp;
            li.onclick = () => {
                fetch('/multi_commands_file/' + f).then(res=>res.text()).then(txt => {
                    document.getElementById('cmd-command').value = txt;
                    document.getElementById('cmd-name').value = disp;
                    document.getElementById('cmd-filename').value = disp;
                    document.getElementById('cmd-file-box').style.display = 'none';
                });
            };
            li.onmouseover = () => li.style.background = '#222';
            li.onmouseout = () => li.style.background = 'transparent';
            list.appendChild(li);
        });
    });
};

window.filterCmdFileBox = function() {
    const filter = document.getElementById('cmd-file-box-search').value.toLowerCase();
    const searchWords = filter.split(/\s+/).filter(Boolean);
    const items = document.getElementById('cmd-file-box-list').children;
    for (let i = 0; i < items.length; i++) {
        const text = items[i].innerText.toLowerCase();
        items[i].style.display = searchWords.every(word => text.includes(word)) ? 'block' : 'none';
    }
};

socket.on('fs_update', function(data) {
    if (data.type === 'commands' || data.type === 'notes') {
        if (document.getElementById('multi-terminal-modal').style.display === 'block') {
            loadMultiCmds();
        }
        if (document.getElementById('file-mgr-modal').style.display === 'block') {
            loadFileMgrList();
        }
        const cmdFileBox = document.getElementById('cmd-file-box');
        if (cmdFileBox && cmdFileBox.style.display === 'block') {
            window.loadCmdFileBoxList();
        }
    }
});

window.toggleStreamerMode = function() {
    document.body.classList.toggle('streamer-mode');
    const btn = document.getElementById('streamer-btn-icon');
    if (document.body.classList.contains('streamer-mode')) {
        if(btn) btn.style.color = '#ff0000';
        showToast("Streamer Mode ON: Terminals & Textareas Blurred 🙈", "warning");
    } else {
        if(btn) btn.style.color = '';
        showToast("Streamer Mode OFF: Visibility Restored 👁️", "success");
    }
};

window.openOneLinerModal = function() {
    window.showAndBringToFront('oneliner-modal');
};

window.generateOneLiners = function() {
    const input = document.getElementById('oneliner-input').value;
    const lines = input.split('\n').map(l => l.trim()).filter(l => l !== '');
    if (lines.length === 0) {
        showToast("Enter some goddamn commands first!", "error");
        return;
    }
    
    const winLine = lines.join(' && ');
    const linLine = lines.join(' ; ');

    document.getElementById('oneliner-win-out').value = winLine;
    document.getElementById('oneliner-lin-out').value = linLine;
};
