/* ============================================================
   ULTIMATE ICON SYSTEM v2.0
   Self-contained SVG icon library — zero emoji-font dependency.
   Icons use stroke="currentColor" so they adapt to every theme
   (space / umbrella / matrix / dark / white) automatically.
   Usage:
     HTML:  <i data-icon="search" data-size="22"></i>
     JS:    window.sysIcon('search', 20)  -> '<svg .../>'
     After injecting dynamic HTML call window.hydrateIcons(root)
   ============================================================ */
(function () {
    'use strict';

    var P = {
        /* ---- generic / UI ---- */
        'arrow-right': '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>',
        'arrow-left':  '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
        'x':           '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
        'plus':        '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
        'minus':       '<line x1="5" y1="12" x2="19" y2="12"/>',
        'check':       '<polyline points="20 6 9 17 4 12"/>',
        'search':      '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
        'eye':         '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        'settings':    '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
        'warning':     '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        'info':        '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
        'refresh':     '<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
        'power':       '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/>',
        'maximize':    '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>',
        'clock':       '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
        'star':        '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',

        /* ---- files / data ---- */
        'folder':      '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
        'folder-open': '<path d="M6 14l1.5-6h13L19 14H6z"/><path d="M2 19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-3"/>',
        'file-text':   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>',
        'book':        '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
        'clipboard':   '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
        'upload':      '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
        'download':    '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
        'database':    '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
        'hard-drive':  '<line x1="22" y1="12" x2="2" y2="12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/><line x1="6" y1="16" x2="6.01" y2="16"/><line x1="10" y1="16" x2="10.01" y2="16"/>',
        'save':        '<path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>',
        'terminal':    '<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',
        'code':        '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',

        /* ---- network / recon ---- */
        'globe':       '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
        'browser':     '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/>',
        'wifi':        '<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',
        'signal':      '<path d="M2 20h.01"/><path d="M7 20v-4"/><path d="M12 20v-8"/><path d="M17 20V8"/><path d="M22 20V4"/>',
        'radio':       '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49"/><path d="M7.76 16.24a6 6 0 0 1 0-8.49"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M4.93 19.07a10 10 0 0 1 0-14.14"/>',
        'crosshair':   '<circle cx="12" cy="12" r="10"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/>',
        'target':      '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
        'map-pin':     '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
        'map':         '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',
        'zap':         '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
        'network':     '<rect x="9" y="2" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="16" y="16" width="6" height="6" rx="1"/><path d="M5 16v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4"/><path d="M12 8v4"/>',
        'share':       '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',
        'shield':      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
        'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
        'lock':        '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
        'key':         '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
        'link':        '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
        'saturn':      '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.8" transform="rotate(-22 12 12)"/>',

        /* ---- actions ---- */
        'trash':       '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
        'edit':        '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
        'pencil':      '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',
        'stop':        '<polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="13"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        'play':        '<polygon points="5 3 19 12 5 21 5 3"/>',
        'rocket':      '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-1.26.37-2.56-.9-3.7a2.36 2.36 0 0 0-2.1-1.3z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',
        'shuffle':     '<polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>',
        'box':         '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',
        'grid':        '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>',
        'list':        '<line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>',
        'image':       '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
        'kanban':      '<rect x="4" y="3" width="4.5" height="14" rx="1"/><rect x="10" y="3" width="4.5" height="18" rx="1"/><rect x="16" y="3" width="4.5" height="10" rx="1"/>',
        'columns':     '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="3" x2="12" y2="21"/><line x1="3" y1="12" x2="21" y2="12"/>',
        'music':       '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
        'volume':      '<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a6 6 0 0 1 0 8.49"/>',
        'video':       '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
        'tv':          '<rect x="2" y="7" width="20" height="15" rx="2" ry="2"/><polyline points="17 2 12 7 7 2"/>',
        'camera':      '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
        'monitor':     '<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>',
        'laptop':      '<rect x="3" y="4" width="18" height="12" rx="2" ry="2"/><line x1="1" y1="20" x2="23" y2="20"/>',
        'users':       '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        'cpu':         '<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',
        'cloud':       '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
        'moon':        '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
        'sun':         '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',
        'git-branch':  '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
        'pie-chart':   '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
        'activity':    '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
        'layers':      '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',

        /* ---- brand-ish / custom cyber icons ---- */
        'github':      '<path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>',
        'youtube':     '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.4a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.42a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
        'dragon':      '<path d="M12 2c-4 0-7 3-7 7 0 1.6.5 3 1.4 4.2L4 16l3-1-1 4 3-2v3l3-3 3 3v-3l3 2-1-4 3 1-2.4-2.8C18.5 12 19 10.6 19 9c0-4-3-7-7-7z"/><circle cx="9" cy="9" r="1" fill="currentColor" stroke="none"/><circle cx="15" cy="9" r="1" fill="currentColor" stroke="none"/><path d="M9.5 12.5h5"/>',
        'spy':         '<path d="M2 13h20"/><path d="M5 13l2.5-8h9L19 13"/><circle cx="9" cy="17" r="1.2"/><circle cx="15" cy="17" r="1.2"/><path d="M8.5 20.5c1 .8 2.2 1.2 3.5 1.2s2.5-.4 3.5-1.2"/>',
        'skull':       '<path d="M12 2a8 8 0 0 0-8 8c0 2.4 1.1 4.6 2.8 6v3h10.4v-3c1.7-1.4 2.8-3.6 2.8-6a8 8 0 0 0-8-8z"/><circle cx="9" cy="10" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="10" r="1.4" fill="currentColor" stroke="none"/><path d="M10 16.5v2.5M14 16.5v2.5M12 16v4"/>',
        'worm':        '<path d="M6 20a2.5 2.5 0 1 1 2.5-2.5V15c0-2 1.5-3.5 3.5-3.5h2c2 0 3.5-1.5 3.5-3.5S16 4.5 14 4.5h-3"/><circle cx="6" cy="20" r="1.2" fill="currentColor" stroke="none"/><circle cx="11" cy="4.5" r="1.2" fill="currentColor" stroke="none"/><path d="M3 7c1-1.5 2.5-2.5 4.5-2.5"/>',
        'syringe':     '<path d="M19 2l3 3"/><path d="M20.5 3.5L14 10"/><path d="M14 10l-9 9-2 4 4-2 9-9"/><path d="M12 8l4 4"/><path d="M9 11l-1-1M11 9l-1-1"/>',
        'broom':       '<path d="M20 3l-4.5 4.5"/><path d="M15 9l-2-2"/><path d="M12.2 7.8l4 4-8.3 8.3a2.83 2.83 0 0 1-4-4l8.3-8.3z"/><path d="M8.5 15.5L3 21"/>',
        'recycle':     '<polyline points="5.5 8 8 4 10.5 8"/><path d="M8 4v6"/><path d="M17.5 8.5L20 13l-4 .2"/><path d="M13.5 20l-4.5-.1 2.2-3.9"/><path d="M19 13a7.5 7.5 0 0 1-5.5 7"/><path d="M9 20a7.5 7.5 0 0 1-5.6-6.5"/>',
        'tunnel':      '<path d="M4 20V10a8 8 0 0 1 16 0v10"/><line x1="2" y1="20" x2="22" y2="20"/><path d="M8.5 20v-8a3.5 3.5 0 0 1 7 0v8"/>',
        'plug':        '<path d="M9 7V2"/><path d="M15 7V2"/><path d="M6 7h12v4a6 6 0 0 1-12 0V7z"/><path d="M12 17v5"/>',
        'cookie':      '<circle cx="12" cy="12" r="9"/><circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="9.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="10" cy="14.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="14" r="1.1" fill="currentColor" stroke="none"/><path d="M16.5 11.5l4-1-1 4"/>',
        'alien':       '<path d="M12 3a8 8 0 0 0-8 8c0 1.6.5 3.1 1.3 4.4L4 19l3.6-1.2A8 8 0 1 0 12 3z"/><circle cx="9" cy="11" r="1.6" fill="currentColor" stroke="none"/><circle cx="15" cy="11" r="1.6" fill="currentColor" stroke="none"/><path d="M8.5 15c2 1.5 5 1.5 7 0"/>',
        'wrench':      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
        'hammer':      '<path d="M14 4l6 6-2.5 2.5L11 6z"/><path d="M11.5 8.5L3 17v4h4l8.5-8.5"/>',
        'send':        '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
        'home':        '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
        'windows':     '<rect x="3" y="3" width="8" height="8"/><rect x="13" y="3" width="8" height="8"/><rect x="3" y="13" width="8" height="8"/><rect x="13" y="13" width="8" height="8"/>',
        'linux':       '<path d="M12 2C8 2 4 6 4 11c0 2.5 1.5 5 2.5 7 .5 1 .5 2-1 3-1.5 1-1.5 2-.5 2h14c1 0 1-1-.5-2-1.5-1-1.5-2-1-3 1-2 2.5-4.5 2.5-7 0-5-4-9-8-9z"/><circle cx="9" cy="10" r="1.5" fill="currentColor"/><circle cx="15" cy="10" r="1.5" fill="currentColor"/><path d="M10 14h4v2h-4z"/>',
        'arp':         '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="12 8 12 12 16 14"/><path d="M4 12a8 8 0 0 1 16 0"/>'
    };

    var FALLBACK = P['x'];

    var P_EMOJI = {
        'arrow-right': '➡️', 'arrow-left': '⬅️', 'x': '✖️', 'plus': '➕', 'minus': '➖', 'check': '✔️', 'search': '🔍', 'eye': '👁️', 'settings': '⚙️', 'warning': '⚠️', 'info': 'ℹ️', 'refresh': '🔄', 'power': '⏻', 'maximize': '🔲', 'clock': '🕒', 'star': '⭐',
        'folder': '📁', 'folder-open': '📂', 'file-text': '📄', 'book': '📖', 'clipboard': '📋', 'upload': '📤', 'download': '📥', 'database': '🗄️', 'hard-drive': '💾', 'save': '💾', 'terminal': '🖥️', 'code': '💻',
        'globe': '🌍', 'browser': '🌐', 'wifi': '📶', 'signal': '📶', 'radio': '📻', 'crosshair': '🎯', 'target': '🎯', 'map-pin': '📍', 'map': '🗺️', 'zap': '⚡', 'network': '🕸️', 'share': '🔗', 'shield': '🛡️', 'lock': '🔒', 'key': '🔑', 'link': '🔗', 'saturn': '🪐',
        'trash': '🗑️', 'edit': '✏️', 'pencil': '✏️', 'stop': '🛑', 'play': '▶️', 'rocket': '🚀', 'shuffle': '🔀', 'box': '📦', 'grid': '🔠', 'list': '📋', 'image': '🖼️', 'kanban': '📋', 'columns': '⏸️', 'music': '🎵', 'volume': '🔊', 'video': '📹', 'tv': '📺', 'camera': '📷', 'monitor': '🖥️', 'laptop': '💻', 'users': '👥', 'cpu': '🖧', 'cloud': '☁️', 'moon': '🌙', 'sun': '☀️', 'git-branch': '🌿', 'pie-chart': '📊', 'activity': '📈', 'layers': '📑',
        'github': '🐙', 'youtube': '📺', 'dragon': '🐉', 'spy': '🕵️', 'skull': '💀', 'worm': '🪱', 'syringe': '💉', 'broom': '🧹', 'recycle': '♻️', 'tunnel': '🚇', 'plug': '🔌', 'cookie': '🍪', 'alien': '👽', 'wrench': '🛠️', 'hammer': '🔨', 'send': '📤', 'home': '🏠', 'windows': '🪟', 'linux': '🐧'
    };

    var P_SPACE = {
        'arrow-right': '<circle cx="12" cy="12" r="10" fill="#00ffcc"/><path d="M10 8l4 4-4 4" stroke="#000" stroke-width="3" fill="none"/>',
        'arrow-left': '<circle cx="12" cy="12" r="10" fill="#00ffcc"/><path d="M14 8l-4 4 4 4" stroke="#000" stroke-width="3" fill="none"/>',
        'plus': '<rect x="10" y="4" width="4" height="16" fill="#00ffcc" rx="1"/><rect x="4" y="10" width="16" height="4" fill="#00ffcc" rx="1"/>',
        'trash': '<rect x="8" y="2" width="8" height="4" fill="#888" rx="1"/><rect x="5" y="6" width="14" height="16" fill="#ff4444" rx="2"/><line x1="9" y1="10" x2="9" y2="18" stroke="#fff" stroke-width="2" stroke-linecap="round"/><line x1="15" y1="10" x2="15" y2="18" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
        'globe': '<circle cx="12" cy="12" r="10" fill="#0077ff"/><path d="M2 12 A10 10 0 0 0 22 12 A10 10 0 0 0 2 12" fill="#00ff00" opacity="0.6"/><path d="M12 2c3 0 5 4.5 5 10s-2 10-5 10-5-4.5-5-10 2-10 5-10z" fill="none" stroke="#fff" stroke-width="1.5"/><line x1="2" y1="12" x2="22" y2="12" stroke="#fff" stroke-width="1.5"/>',
        'folder': '<path d="M2 7C2 5.9 2.9 5 4 5H9L11 8H20C21.1 8 22 8.9 22 10V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V7Z" fill="#ffaa00" stroke="#e69500" stroke-width="1"/>',
        'cookie': '<circle cx="12" cy="12" r="10" fill="#d2a679"/><circle cx="8" cy="8" r="1.5" fill="#4a3623"/><circle cx="15" cy="9.5" r="1.5" fill="#4a3623"/><circle cx="10" cy="15" r="2" fill="#4a3623"/><circle cx="16" cy="14" r="1.5" fill="#4a3623"/><path d="M19 4a5 5 0 0 1-5-5 5 5 0 0 0 5 5z" fill="#000" opacity="0.2"/>',
        'target': '<circle cx="12" cy="12" r="10" fill="#ff0000"/><circle cx="12" cy="12" r="7" fill="#fff"/><circle cx="12" cy="12" r="4" fill="#ff0000"/><circle cx="12" cy="12" r="1" fill="#fff"/>',
        'wrench': '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" fill="#ffaa00" stroke="#fff" stroke-width="1"/><path d="M14 4l6 6-2.5 2.5L11 6z" fill="#ccc"/><path d="M11.5 8.5L3 17v4h4l8.5-8.5" fill="#888"/>',
        'network': '<circle cx="12" cy="12" r="10" fill="none" stroke="#555" stroke-width="2" stroke-dasharray="3 3"/><line x1="12" y1="2" x2="12" y2="22" stroke="#aaa"/><line x1="2" y1="12" x2="22" y2="12" stroke="#aaa"/><line x1="5" y1="5" x2="19" y2="19" stroke="#aaa"/><line x1="5" y1="19" x2="19" y2="5" stroke="#aaa"/><circle cx="12" cy="12" r="4" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="12" cy="12" r="2" fill="#000"/>',
        'box': '<path d="M12 2L2 7l10 5 10-5-10-5z" fill="#f0c080"/><path d="M2 7v10l10 5v-10L2 7z" fill="#c09060"/><path d="M22 7v10l-10 5v-10l10-5z" fill="#d2a679"/><rect x="5" y="11" width="3" height="4" fill="#ff0000"/>',
        'terminal': '<path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z" fill="#ffccaa"/><path d="M12 2v20M2 12h20" stroke="#d4a373" stroke-width="2"/><path d="M6 6q6 6 0 12M18 6q-6 6 0 12" stroke="#d4a373" fill="none" stroke-width="2"/>',
        'settings': '<circle cx="12" cy="12" r="6" fill="#888"/><path d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.5-7.5l-2.8 2.8M7.3 16.7l-2.8 2.8m14-0l-2.8-2.8M7.3 7.3L4.5 4.5" stroke="#aaa" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="#fff"/>',
        'shuffle': '<rect x="2" y="2" width="20" height="20" rx="4" fill="#0055ff"/><path d="M6 16l4-4m4-4l4-4M6 8l12 8" stroke="#fff" stroke-width="2"/><polygon points="18 16 14 16 18 12" fill="#fff"/><polygon points="18 8 14 8 18 12" fill="#fff"/>',
        'youtube': '<rect x="2" y="5" width="20" height="14" rx="4" fill="#ff0000"/><polygon points="10 9 16 12 10 15" fill="#fff"/>',
        'github': '<circle cx="12" cy="12" r="10" fill="#fff"/><path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.45-1.15-1.11-1.46-1.11-1.46-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" fill="#000"/>',
        'cpu': '<path d="M12 2L8 8h8zM2 12l6-4v8zM22 12l-6-4v8zM12 22l-4-6h8z" fill="#00ff00"/><circle cx="12" cy="12" r="3" fill="#00ff00"/>',
        'syringe': '<path d="M18 2l4 4-2 2-4-4 2-2z" fill="#aaa"/><path d="M16 6L6 16v2h2L18 8l-2-2z" fill="#ddd"/><line x1="6" y1="16" x2="2" y2="20" stroke="#ff0000" stroke-width="2"/><line x1="8" y1="14" x2="14" y2="8" stroke="#ff0000" stroke-width="4"/>',
        'download': '<rect x="4" y="14" width="16" height="8" fill="#555" rx="2"/><path d="M12 2v12m-4-4l4 4 4-4" stroke="#00ffcc" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
        'worm': '<path d="M4 12q4 -6 8 0t8 0" fill="none" stroke="#ff00ff" stroke-width="4" stroke-linecap="round"/><circle cx="4" cy="12" r="2" fill="#00ffcc"/><circle cx="20" cy="12" r="2" fill="#00ffcc"/>',
        'rocket': '<path d="M12 2C12 2 4 6 4 14c0 0 3 2 8 2s8-2 8-2c0-8-8-12-8-12z" fill="#ff0000"/><path d="M12 16L8 22h8l-4-6z" fill="#ffaa00"/><circle cx="12" cy="9" r="2" fill="#00ccff"/>',
        'search': '<circle cx="10" cy="10" r="7" fill="#00ccff" stroke="#fff" stroke-width="2"/><line x1="21" y1="21" x2="15" y2="15" stroke="#ff0000" stroke-width="4" stroke-linecap="round"/>',
        'edit': '<path d="M14 4l6 6-2 2-6-6 2-2z" fill="#ffaa00"/><path d="M12 6L4 14v6h6l8-8-6-6z" fill="#00ccff"/><polygon points="4 14 10 20 4 20" fill="#0055ff"/>',
        'clipboard': '<rect x="6" y="6" width="12" height="16" fill="#fff" rx="2"/><rect x="8" y="2" width="8" height="6" fill="#888" rx="1"/><line x1="9" y1="12" x2="15" y2="12" stroke="#000" stroke-width="2"/><line x1="9" y1="16" x2="15" y2="16" stroke="#000" stroke-width="2"/>',
        'stop': '<polygon points="8 2 16 2 22 8 22 16 16 22 8 22 2 16 2 8" fill="#ff0000"/><rect x="8" y="10" width="8" height="4" fill="#fff"/>',
        'monitor': '<rect x="2" y="4" width="20" height="12" fill="#222" stroke="#555" stroke-width="2" rx="2"/><polygon points="8 22 16 22 14 16 10 16" fill="#555"/><rect x="4" y="6" width="16" height="8" fill="#00ffcc"/>',
        'laptop': '<rect x="3" y="4" width="18" height="12" fill="#222" stroke="#555" stroke-width="2" rx="2"/><path d="M1 18h22l-2 4H3l-2-4z" fill="#555"/><rect x="5" y="6" width="14" height="8" fill="#00ffcc"/>',
        'music': '<path d="M9 18V5l12-2v13" fill="none" stroke="#ff00ff" stroke-width="2"/><circle cx="6" cy="18" r="3" fill="#00ccff"/><circle cx="18" cy="16" r="3" fill="#00ccff"/>',
        'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#e6e6e6"/><polygon points="14 2 14 8 20 8" fill="#ccc"/><line x1="8" y1="13" x2="16" y2="13" stroke="#000" stroke-width="2"/><line x1="8" y1="17" x2="16" y2="17" stroke="#000" stroke-width="2"/>',
        'hard-drive': '<rect x="4" y="4" width="16" height="16" rx="2" fill="#555"/><line x1="4" y1="10" x2="20" y2="10" stroke="#333" stroke-width="2"/><circle cx="8" cy="15" r="2" fill="#00ffcc"/><circle cx="16" cy="15" r="2" fill="#ff0000"/>',
        'broom': '<path d="M20 3l-4.5 4.5" stroke="#8c5c30" stroke-width="3" stroke-linecap="round"/><path d="M12.2 7.8l4 4-8.3 8.3a2.83 2.83 0 0 1-4-4l8.3-8.3z" fill="#e6c280"/><path d="M8.5 15.5L3 21" stroke="#e6c280" stroke-width="3" stroke-linecap="round"/>',
        'radio': '<rect x="2" y="8" width="20" height="12" rx="2" fill="#222" stroke="#777" stroke-width="2"/><circle cx="8" cy="14" r="3" fill="#ffaa00"/><line x1="16" y1="12" x2="16" y2="12" stroke="#fff" stroke-width="2"/><line x1="16" y1="16" x2="16" y2="16" stroke="#fff" stroke-width="2"/><line x1="6" y1="8" x2="18" y2="2" stroke="#777" stroke-width="2"/>',
        'map': '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" fill="#aaccff" stroke="#0055ff" stroke-width="1"/><line x1="8" y1="2" x2="8" y2="18" stroke="#0055ff"/><line x1="16" y1="6" x2="16" y2="22" stroke="#0055ff"/><path d="M12 10l-2-2 2-2 2 2-2 2z" fill="#ff0000"/>',
        'shield': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#0055ff" stroke="#00ccff" stroke-width="2"/><path d="M12 22s-8-4-8-10V5l8-3v20z" fill="#00ccff"/>',
        'message-square': '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" fill="#00ffcc" fill-opacity="0.2" stroke="#00ffcc" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="9" stroke="#fff" stroke-width="2"/><line x1="9" y1="13" x2="13" y2="13" stroke="#fff" stroke-width="2"/>',
        'zap': '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="#ffff00" stroke="#ffaa00" stroke-width="1"/>',
        'folder-open': '<path d="M6 14l1.5-6h13L19 14H6z" fill="#ffcc00"/><path d="M2 19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-3" fill="#ffaa00"/>',
        'browser': '<circle cx="12" cy="12" r="10" fill="#222" stroke="#00ffcc" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="#00ffcc"/><line x1="21.17" y1="8" x2="12" y2="8" stroke="#00ffcc" stroke-width="2"/><line x1="3.95" y1="6.06" x2="8.54" y2="14" stroke="#00ffcc" stroke-width="2"/><line x1="10.88" y1="21.94" x2="15.46" y2="14" stroke="#00ffcc" stroke-width="2"/>',
        'eye': '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" fill="#fff" stroke="#000" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="#00ccff" stroke="#000" stroke-width="1"/>',
        'image': '<rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill="#444"/><circle cx="8.5" cy="8.5" r="1.5" fill="#ffaa00"/><polyline points="21 15 16 10 5 21" fill="#00ffcc"/>',
        'arp': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="#00ffcc" stroke="#fff" stroke-width="1"/><circle cx="12" cy="12" r="4" fill="#ff0000"/><path d="M2 12h5m10 0h5" stroke="#ff0000" stroke-width="2"/>'
    };

    function svgMarkup(name, size, cls) {
        var iconType = localStorage.getItem('cyber_icon_type') || 'dynamic';
        
        if (iconType === 'emoji' && P_EMOJI[name]) {
            return '<span class="' + (cls || 'sys-icon-emoji') + '" style="font-size:' + (size || 24) + 'px; line-height:1; display:inline-block; font-style:normal; font-family:var(--emoji-font);">' + P_EMOJI[name] + '</span>';
        }

        var isSpace = document.body.classList.contains('theme-space') || (!document.body.classList.contains('theme-dark') && !document.body.classList.contains('theme-white') && !document.body.classList.contains('theme-umbrella') && !document.body.classList.contains('theme-matrix'));
        
        if (iconType === 'dynamic' && isSpace && P_SPACE[name]) {
            return '<svg xmlns="http://www.w3.org/2000/svg" class="' + (cls || 'sys-icon-svg') +
                   '" width="' + (size || 24) + '" height="' + (size || 24) +
                   '" viewBox="0 0 24 24" aria-hidden="true">' + P_SPACE[name] + '</svg>';
        }

        var body = P[name] || FALLBACK;
        return '<svg xmlns="http://www.w3.org/2000/svg" class="' + (cls || 'sys-icon-svg') +
               '" width="' + (size || 24) + '" height="' + (size || 24) +
               '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
               'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + body + '</svg>';
    }

    /* Public API */
    window.sysIcon = svgMarkup;
    window.SysIcons = P;

    /* Hydrate all <i data-icon="..."> placeholders inside a root element (default: document) */
    window.hydrateIcons = function (root, force) {
        var scope = root || document;
        var selector = force ? 'i[data-icon]' : 'i[data-icon]:not([data-icon-done])';
        var nodes = scope.querySelectorAll(selector);
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            var size = el.getAttribute('data-size');
            el.innerHTML = svgMarkup(el.getAttribute('data-icon'), size ? parseInt(size, 10) : 24);
            el.setAttribute('data-icon-done', '1');
            el.style.display = 'inline-flex';
            el.style.alignItems = 'center';
            el.style.justifyContent = 'center';
            el.style.lineHeight = '0';
            el.style.flexShrink = '0';
        }
    };

    /* Fallback for target favicon images that fail to load */
    window.faviconFallback = function (img) {
        img.onerror = null;
        img.src = '/static/fav_fallback.svg';
        img.style.opacity = '0.85';
        return true;
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () { window.hydrateIcons(); });
    } else {
        window.hydrateIcons();
    }

    /* Re-hydrate periodically to catch dynamically injected icons (cheap: only scans :not done) */
    setInterval(function () { window.hydrateIcons(); }, 2500);
})();
