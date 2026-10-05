registerPlugin({
    name: "Kill CloudCode 💀",
    run: function() {
        let existing = document.getElementById('kill-cloudcode-plugin-modal');
        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'kill-cloudcode-plugin-modal';
            existing.className = 'modal';
            existing.innerHTML = `
                <div class="modal-content" style="width: 80%; max-width: 800px;">
                    <span class="close" onclick="document.getElementById('kill-cloudcode-plugin-modal').style.display='none'">&times;</span>
                    <h2>Kill CloudCode Trash 💀</h2>
                    <p style="color: #aaa;">Hunting down that pathetic cloudcode_cli memory hog...</p>
                    <button onclick="runCloudCodeKill()" style="padding: 10px; background:#ff0000; color:#fff; border:none; cursor:pointer; font-weight:bold; margin-bottom: 10px; width: 100%;">SEEK & DESTROY</button>
                    <div style="background: #000; border: 1px solid #ff00ff; padding: 10px; height: 300px; overflow-y: auto;">
                        <pre id="kc-output" style="color: #00ffcc; font-family: monospace; white-space: pre-wrap; margin: 0;"></pre>
                    </div>
                </div>
            `;
            document.body.appendChild(existing);

            window.runCloudCodeKill = function() {
                const out = document.getElementById('kc-output');
                out.innerHTML = "Executing search query...\n";
                
                const cmd1 = "find ~/.cache/cloud-code -maxdepth 4 -type f -name '*cloudcode*' -o -name '*duet*' 2>/dev/null | head -30";
                const cmd2 = "pkill -9 -f 'cloudcode_cli duet'; chmod -x ~/.cache/cloud-code/cloudcode_cli/cloudcode_cli/6aca8e36/cloudcode_cli";

                fetch('/exec_plugin_cmd', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({cmd: cmd1})
                }).then(r=>r.json()).then(d => {
                    out.innerHTML += "--- SEARCH RESULTS ---\n";
                    out.innerHTML += (d.output || d.error || "No files found.") + "\n\n";
                    out.innerHTML += "Executing kill sequence and neutering permissions...\n";
                    
                    return fetch('/exec_plugin_cmd', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({cmd: cmd2})
                    });
                }).then(r=>r.json()).then(d => {
                    out.innerHTML += "--- KILL RESULTS ---\n";
                    out.innerHTML += (d.output || d.error || "Target annihilated.") + "\n";
                    showToast("Cloudcode trash executed and stripped of perms!", "success");
                }).catch(e => {
                    out.innerHTML += "\nError: " + e.message;
                });
            };
        }
        existing.style.display = 'block';
        if (typeof bringToolToFront === 'function') bringToolToFront(existing.querySelector('.modal-content'));
    }
});