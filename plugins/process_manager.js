registerPlugin({
    name: "Process Manager 💀",
    run: function() {
        let existing = document.getElementById('proc-mgr-plugin-modal');
        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'proc-mgr-plugin-modal';
            existing.className = 'modal';
            existing.innerHTML = `
                <div class="modal-content" style="width: 80%; max-width: 800px;">
                    <span class="close" onclick="document.getElementById('proc-mgr-plugin-modal').style.display='none'">&times;</span>
                    <h2>Process Manager 💀</h2>
                    <button onclick="refreshSysProcesses()" style="padding: 10px; background:#00ffcc; color:#000; border:none; cursor:pointer; font-weight:bold; margin-bottom: 10px;">Refresh Processes</button>
                    <div style="max-height: 400px; overflow-y: auto; background: #000; border: 1px solid #00ffcc; padding: 10px;">
                        <table style="width: 100%; text-align: left; border-collapse: collapse;">
                            <thead>
                                <tr style="color: #ff00ff; border-bottom: 1px solid #333;">
                                    <th>PID</th>
                                    <th>Name</th>
                                    <th>RAM %</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody id="proc-mgr-tbody">
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
            document.body.appendChild(existing);

            window.refreshSysProcesses = function() {
                fetch('/get_processes').then(res => res.json()).then(data => {
                    const tbody = document.getElementById('proc-mgr-tbody');
                    tbody.innerHTML = '';
                    if (!data.success) {
                        tbody.innerHTML = '<tr><td colspan="4" style="color:red;">Error fetching processes. Is psutil installed?</td></tr>';
                        return;
                    }
                    data.processes.forEach(p => {
                        const tr = document.createElement('tr');
                        const isHigh = p.memory_percent > 10;
                        tr.style.color = isHigh ? '#ff0000' : '#00ffcc';
                        tr.style.borderBottom = '1px solid #222';
                        tr.innerHTML = `
                            <td style="padding: 5px;">${p.pid}</td>
                            <td style="padding: 5px;">${p.name}</td>
                            <td style="padding: 5px;">${p.memory_percent.toFixed(2)}%</td>
                            <td style="padding: 5px;">
                                <button onclick="killSysProcess(${p.pid})" style="padding: 2px 5px; background: #ff0000; color: #fff; border: none; cursor: pointer;">KILL 💀</button>
                            </td>
                        `;
                        tbody.appendChild(tr);
                    });
                });
            };

            window.killSysProcess = function(pid) {
                if(confirm("Are you sure you want to violently assassinate PID " + pid + "?")) {
                    fetch('/kill_sys_process', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json'},
                        body: JSON.stringify({pid: pid})
                    }).then(res => res.json()).then(data => {
                        if(data.success) {
                            showToast("Process brutally executed! 💀", "success");
                            refreshSysProcesses();
                        } else {
                            showToast("Failed to kill: " + data.error, "error");
                        }
                    });
                }
            };
        }
        existing.style.display = 'block';
        if (typeof bringToolToFront === 'function') bringToolToFront(existing.querySelector('.modal-content'));
        window.refreshSysProcesses();
    }
});