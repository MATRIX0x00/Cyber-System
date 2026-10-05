registerPlugin({
    name: "Raw HTTP Requester 💀",
    run: function() {
        if (!currentFolder) {
            showToast("Select a goddamn target first, you moron!", "error");
            return;
        }

        let existing = document.getElementById('raw-req-plugin-modal');
        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'raw-req-plugin-modal';
            existing.className = 'modal';
            existing.innerHTML = `
                <div class="modal-content" style="width: 90%; max-width: 1200px; display: flex; flex-direction: row; height: 80vh; padding: 0;">
                    <div style="width: 300px; background: #111; border-right: 1px solid #00ffcc; display: flex; flex-direction: column; padding: 15px;">
                        <h3 style="color:#ff00ff; margin-top:0;">Saved Requests</h3>
                        <input type="text" id="raw-req-search" placeholder="Search..." class="search-input" style="margin-bottom:10px; padding:5px;" onkeyup="window.filterRawReqs()">
                        <ul id="raw-req-list" style="list-style:none; padding:0; margin:0; flex:1; overflow-y:auto; border:1px solid #333; background:#000;"></ul>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; padding: 15px; position:relative;">
                        <div class="modal-header">
                            <h2 style="margin:0;">CYBER_JACK RAW REQUESTER [Target: <span id="raw-req-target-label"></span>]</h2>
                            <span class="close" onclick="document.getElementById('raw-req-plugin-modal').style.display='none'">&times;</span>
                        </div>
                        
                        <div style="display:flex; gap:10px; margin-bottom:10px;">
                            <input type="text" id="raw-req-save-name" placeholder="Name to save (e.g. login_bypass)..." class="search-input" style="flex:1; margin-bottom:0;">
                            <button onclick="window.saveRawReq()" style="padding:10px; background:#00ffcc; color:#000; border:none; font-weight:bold; cursor:pointer;">💾 Save</button>
                        </div>
                        
                        <div style="display:flex; flex:1; gap:10px;">
                            <div style="flex:1; display:flex; flex-direction:column;">
                                <label style="color:#ff0055; font-weight:bold;">INPUT_PAYLOAD:</label>
                                <textarea id="raw-req-input" style="flex:1; background:#000; color:#00ff00; border:1px solid #ff0055; font-family:monospace; padding:10px; resize:none;" placeholder="GET / HTTP/1.1\nHost: example.com\n\n"></textarea>
                                <button onclick="window.executeRawReq()" style="padding:15px; background:#ff0055; color:#fff; border:none; font-weight:bold; cursor:pointer; margin-top:10px; font-size:1.2em;">EXECUTE_PAYLOAD // ⚡</button>
                            </div>
                            <div style="flex:1; display:flex; flex-direction:column;">
                                <label style="color:#00ffff; font-weight:bold;">SERVER_RESPONSE:</label>
                                <textarea id="raw-req-output" style="flex:1; background:#000; color:#00ffff; border:1px solid #00ffff; font-family:monospace; padding:10px; resize:none;" readonly></textarea>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(existing);

            window.filterRawReqs = function() {
                let filter = document.getElementById('raw-req-search').value.toLowerCase();
                let items = document.getElementById('raw-req-list').getElementsByTagName('li');
                for(let i=0; i<items.length; i++) {
                    items[i].style.display = items[i].innerText.toLowerCase().includes(filter) ? 'block' : 'none';
                }
            };

            window.loadRawReqsList = function() {
                fetch('/list_raw_requests', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({folder: window.rawReqCurrentFolder})
                }).then(r=>r.json()).then(d=>{
                    let list = document.getElementById('raw-req-list');
                    list.innerHTML = '';
                    if(d.files) {
                        d.files.forEach(f => {
                            let li = document.createElement('li');
                            li.style.padding = '8px';
                            li.style.borderBottom = '1px solid #333';
                            li.style.cursor = 'pointer';
                            li.style.color = '#00ffcc';
                            li.innerText = f;
                            li.onmouseover = () => li.style.background = '#222';
                            li.onmouseout = () => li.style.background = 'transparent';
                            li.onclick = () => window.loadRawReqFile(f);
                            list.appendChild(li);
                        });
                    }
                });
            };

            window.loadRawReqFile = function(name) {
                fetch('/get_raw_request', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({folder: window.rawReqCurrentFolder, name: name})
                }).then(r=>r.json()).then(d=>{
                    if(d.success) {
                        document.getElementById('raw-req-save-name').value = name;
                        document.getElementById('raw-req-input').value = d.data.request;
                        document.getElementById('raw-req-output').value = d.data.response;
                    }
                });
            };

            window.saveRawReq = function() {
                let name = document.getElementById('raw-req-save-name').value;
                let req = document.getElementById('raw-req-input').value;
                let res = document.getElementById('raw-req-output').value;
                if(!name) { showToast("Give it a fucking name to save!", "error"); return; }
                fetch('/save_raw_request', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({folder: window.rawReqCurrentFolder, name: name, request: req, response: res})
                }).then(r=>r.json()).then(d=>{
                    if(d.success) {
                        showToast("Saved!", "success");
                        window.loadRawReqsList();
                    }
                });
            };

            window.executeRawReq = function() {
                let req = document.getElementById('raw-req-input').value;
                let out = document.getElementById('raw-req-output');
                if(!req.trim()) return;
                out.value = ">>> INITIATING CYBERPUNK OVERRIDE...\n>>> SENDING TO HOST...\n";
                fetch('/execute_raw_request', {
                    method: 'POST', headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({request: req})
                }).then(r=>r.json()).then(d=>{
                    if(d.success) {
                        out.value = d.response;
                    } else {
                        out.value = ">>> FATAL ERROR: " + d.error;
                    }
                }).catch(e => out.value = ">>> EXCEPTION: " + e.message);
            };
        }
        
        window.rawReqCurrentFolder = currentFolder;
        document.getElementById('raw-req-target-label').innerText = currentFolder;
        document.getElementById('raw-req-save-name').value = '';
        document.getElementById('raw-req-input').value = 'GET / HTTP/1.1\nHost: ' + currentFolder.split('/').pop() + '\nConnection: close\n\n';
        document.getElementById('raw-req-output').value = '';
        window.loadRawReqsList();
        
        existing.style.display = 'block';
        if (typeof bringToolToFront === 'function') bringToolToFront(existing.querySelector('.modal-content'));
    }
});