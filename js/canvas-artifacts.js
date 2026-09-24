/**
 * TOM AI - Canvas & Artifacts Interactive Workspace
 * Provides a split-screen live execution environment for HTML, JS apps,
 * games, SVGs, and documents (matching ChatGPT Canvas and Claude Artifacts).
 */

class CanvasArtifacts {
  constructor() {
    this.isOpen = false;
    this.currentArtifact = null;
    this.activeTab = 'preview'; // 'preview' or 'code'
    this.init();
  }

  init() {
    this.drawer = document.getElementById('canvasDrawer');
    this.previewPane = document.getElementById('canvasPreviewFrame');
    this.codePane = document.getElementById('canvasCodePane');
    this.codeTextarea = document.getElementById('canvasCodeTextarea');
    this.titleEl = document.getElementById('canvasTitle');
    this.typeBadge = document.getElementById('canvasTypeBadge');

    // Tab buttons
    document.getElementById('btnCanvasTabPreview')?.addEventListener('click', () => this.switchTab('preview'));
    document.getElementById('btnCanvasTabCode')?.addEventListener('click', () => this.switchTab('code'));

    // Controls
    document.getElementById('btnCloseCanvas')?.addEventListener('click', () => this.close());
    document.getElementById('btnUpdateCanvasPreview')?.addEventListener('click', () => this.updateFromCode());
    document.getElementById('btnDownloadArtifact')?.addEventListener('click', () => this.downloadCurrent());
    document.getElementById('btnCopyArtifactCode')?.addEventListener('click', () => this.copyCode());
  }

  open(title, type, content) {
    this.currentArtifact = { title, type, content };
    this.isOpen = true;

    if (this.titleEl) this.titleEl.textContent = title;
    if (this.typeBadge) this.typeBadge.textContent = type.toUpperCase();
    if (this.codeTextarea) this.codeTextarea.value = content;

    document.getElementById('app')?.classList.add('canvas-open');
    this.drawer?.classList.add('open');

    this.switchTab('preview');
    this.renderPreview(content, type);
  }

  close() {
    this.isOpen = false;
    document.getElementById('app')?.classList.remove('canvas-open');
    this.drawer?.classList.remove('open');
  }

  switchTab(tab) {
    this.activeTab = tab;
    const btnPreview = document.getElementById('btnCanvasTabPreview');
    const btnCode = document.getElementById('btnCanvasTabCode');

    if (tab === 'preview') {
      btnPreview?.classList.add('active');
      btnCode?.classList.remove('active');
      if (this.previewPane) this.previewPane.style.display = 'block';
      if (this.codePane) this.codePane.style.display = 'none';
    } else {
      btnCode?.classList.add('active');
      btnPreview?.classList.remove('active');
      if (this.previewPane) this.previewPane.style.display = 'none';
      if (this.codePane) this.codePane.style.display = 'block';
    }
  }

  renderPreview(content, type) {
    if (!this.previewPane) return;

    let srcdoc = '';
    const cleanType = (type || 'html').toLowerCase();

    if (cleanType === 'html' || content.includes('<!DOCTYPE') || content.includes('<html')) {
      srcdoc = content;
    } else if (cleanType === 'svg') {
      srcdoc = `<!DOCTYPE html><html><body style="margin:0; display:flex; align-items:center; justify-content:center; height:100vh; background:#0f172a;">${content}</body></html>`;
    } else if (cleanType === 'javascript' || cleanType === 'js') {
      srcdoc = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: monospace; background: #0f172a; color: #38bdf8; padding: 20px; font-size: 14px; }
            .log { margin-bottom: 6px; }
            .err { color: #f87171; }
          </style>
        </head>
        <body>
          <div id="output"><strong>[JavaScript Execution Sandbox]</strong><br><br></div>
          <script>
            const out = document.getElementById('output');
            const origLog = console.log;
            console.log = function(...args) {
              const div = document.createElement('div');
              div.className = 'log';
              div.textContent = '> ' + args.join(' ');
              out.appendChild(div);
              origLog.apply(console, args);
            };
            try {
              ${content}
            } catch(e) {
              const errDiv = document.createElement('div');
              errDiv.className = 'err';
              errDiv.textContent = '✕ Error: ' + e.message;
              out.appendChild(errDiv);
            }
          <\/script>
        </body>
        </html>
      `;
    } else {
      // Plain text or Markdown preview
      srcdoc = `<!DOCTYPE html><html><body style="font-family:sans-serif; padding:24px; color:#333; line-height:1.6;"><pre style="white-space:pre-wrap;">${MarkdownRenderer.escapeHtml(content)}</pre></body></html>`;
    }

    this.previewPane.srcdoc = srcdoc;
  }

  updateFromCode() {
    if (!this.codeTextarea) return;
    const newCode = this.codeTextarea.value;
    if (this.currentArtifact) {
      this.currentArtifact.content = newCode;
      this.renderPreview(newCode, this.currentArtifact.type);
      this.switchTab('preview');
      if (window.app) window.app.showToast('✓ Canvas preview updated!');
    }
  }

  downloadCurrent() {
    if (!this.currentArtifact) return;
    const blob = new Blob([this.currentArtifact.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = this.currentArtifact.type === 'javascript' ? 'js' : this.currentArtifact.type;
    a.download = `${this.currentArtifact.title.replace(/\s+/g, '_').toLowerCase()}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    if (window.app) window.app.showToast(`✓ Downloaded ${a.download}`);
  }

  copyCode() {
    if (!this.currentArtifact) return;
    navigator.clipboard.writeText(this.currentArtifact.content).then(() => {
      if (window.app) window.app.showToast('✓ Artifact code copied to clipboard!');
    });
  }
}

window.CanvasArtifacts = CanvasArtifacts;
