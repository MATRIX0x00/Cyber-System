registerPlugin({
    name: "Base64 Encoder/Decoder",
    run: function() {
        let existing = document.getElementById('base64-plugin-modal');
        if (!existing) {
            existing = document.createElement('div');
            existing.id = 'base64-plugin-modal';
            existing.className = 'modal';
            existing.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="document.getElementById('base64-plugin-modal').style.display='none'">&times;</span>
                    <h2>Base64 Converter</h2>
                    <textarea id="base64-input" class="search-input" rows="5" placeholder="Enter string to encode/decode..." style="margin-bottom:10px;"></textarea><br>
                    <div style="display:flex; gap:10px; margin-bottom:15px;">
                        <button onclick="document.getElementById('base64-output').value = btoa(document.getElementById('base64-input').value)" style="flex:1; padding: 10px; background:#00ffcc; color:#000; border:none; cursor:pointer; font-weight:bold;">Encode to Base64</button>
                        <button onclick="try{document.getElementById('base64-output').value = atob(document.getElementById('base64-input').value)}catch(e){showToast('Invalid Base64 format!', 'error')}" style="flex:1; padding: 10px; background:#ff00ff; color:#000; border:none; cursor:pointer; font-weight:bold;">Decode from Base64</button>
                    </div>
                    <textarea id="base64-output" class="search-input" rows="5" placeholder="Result..." readonly></textarea>
                </div>
            `;
            document.body.appendChild(existing);
        }
        existing.style.display = 'block';
        if (typeof bringToolToFront === 'function') bringToolToFront(existing.querySelector('.modal-content'));
    }
});