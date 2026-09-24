/**
 * TOM AI - Markdown and Code Syntax Renderer
 * Converts Markdown text into clean HTML with code syntax highlighting,
 * copy-to-clipboard buttons, and safe interactive widgets.
 */

class MarkdownRenderer {
  static escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static highlightSyntax(code, lang) {
    const escaped = MarkdownRenderer.escapeHtml(code);
    const language = (lang || '').toLowerCase();

    // Syntax regex tokens
    const keywords = /\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|extends|async|await|try|catch|finally|throw|new|typeof|def|elif|lambda|yield|self|True|False|None|print|struct|pub|fn|impl|use|mut|enum|match|case|switch|break|continue)\b/g;
    const booleans = /\b(true|false|null|undefined|nil)\b/gi;
    const numbers = /\b(\d+(\.\d+)?)\b/g;
    const strings = /(["'`])(?:(?=(\\?))\2[\s\S])*?\1/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm;

    let highlighted = escaped
      .replace(comments, '<span class="syn-comment">$&</span>')
      .replace(strings, '<span class="syn-string">$&</span>')
      .replace(keywords, '<span class="syn-keyword">$&</span>')
      .replace(booleans, '<span class="syn-boolean">$&</span>')
      .replace(numbers, '<span class="syn-number">$&</span>');

    return highlighted;
  }

  static render(markdown) {
    if (!markdown) return '';

    let text = markdown;

    // 1. Extract and protect multi-line code blocks ```lang ... ```
    const codeBlocks = [];
    text = text.replace(/```([a-zA-Z0-9_\-\+]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      const id = 'CODE_BLOCK_' + codeBlocks.length;
      const cleanLang = lang.trim() || 'code';
      const isJavaScript = ['javascript', 'js'].includes(cleanLang.toLowerCase());
      
      const headerHtml = `
        <div class="code-header">
          <span class="code-lang-label">${cleanLang}</span>
          <div class="code-header-actions">
            ${isJavaScript ? `<button class="btn-code-action btn-run-code" onclick="MarkdownRenderer.runSnippet('${id}')">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg> Run
            </button>` : ''}
            <button class="btn-code-action btn-copy-code" onclick="MarkdownRenderer.copySnippet('${id}', this)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> Copy code
            </button>
          </div>
        </div>
      `;

      const highlighted = MarkdownRenderer.highlightSyntax(code.trimEnd(), cleanLang);
      const blockHtml = `
        <div class="code-block-wrapper" id="${id}">
          ${headerHtml}
          <div class="code-content">
            <pre><code>${highlighted}</code></pre>
          </div>
          <div class="code-runner-output" style="display:none;" id="${id}-output"></div>
        </div>
      `;

      codeBlocks.push({ id, rawCode: code.trimEnd(), html: blockHtml });
      return `\n\n__${id}__\n\n`;
    });

    // 2. Headings
    text = text.replace(/^#### (.*$)/gim, '<h4>$1</h4>');
    text = text.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    text = text.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    text = text.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 3. Horizontal rules
    text = text.replace(/^---$/gim, '<hr>');

    // 4. Blockquotes
    text = text.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>');

    // 5. Bold & Italic
    text = text.replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>');
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/__(.*?)__/g, '<strong>$1</strong>');
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    text = text.replace(/_(.*?)_/g, '<em>$1</em>');
    text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');

    // 6. Inline code
    text = text.replace(/`([^`\n]+)`/g, (match, inline) => {
      return `<code>${MarkdownRenderer.escapeHtml(inline)}</code>`;
    });

    // 7. Links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#38bdf8; text-decoration:underline;">$1</a>');

    // 8. Markdown Tables
    text = text.replace(/((?:\|[^\n]+\|\r?\n)+)/g, (match) => {
      const rows = match.trim().split('\n');
      if (rows.length < 2) return match;

      let tableHtml = '<div class="markdown-table-wrapper"><table>';
      let isHeader = true;

      rows.forEach((row) => {
        // Skip separator line |---|---|
        if (/^\|[\s\-:|]+\|$/.test(row.trim())) {
          isHeader = false;
          return;
        }

        const cols = row.split('|').filter((col, idx, arr) => idx > 0 && idx < arr.length - 1);
        const tag = isHeader ? 'th' : 'td';
        tableHtml += '<tr>';
        cols.forEach((col) => {
          tableHtml += `<${tag}>${col.trim()}</${tag}>`;
        });
        tableHtml += '</tr>';
      });

      tableHtml += '</table></div>';
      return tableHtml;
    });

    // 9. Lists
    // Unordered
    text = text.replace(/^\s*[\-\*]\s+(.*$)/gim, '<li>$1</li>');
    // Wrap adjacent <li> in <ul>
    text = text.replace(/(<li>(?:.*?)<\/li>(\s*<li>(?:.*?)<\/li>)*)/gim, '<ul>$1</ul>');

    // Paragraphs: wrap standalone lines in <p>
    const lines = text.split(/\n{2,}/);
    const parsed = lines.map((para) => {
      const trimmed = para.trim();
      if (!trimmed) return '';
      // If starts with block tag, don't wrap in <p>
      if (
        trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul>') ||
        trimmed.startsWith('<ol>') ||
        trimmed.startsWith('<blockquote>') ||
        trimmed.startsWith('<hr>') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('__CODE_BLOCK_')
      ) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    // 10. Restore code blocks
    let finalHtml = parsed;
    codeBlocks.forEach((item) => {
      finalHtml = finalHtml.replace(`__${item.id}__`, item.html);
      // Store in memory for copy/run actions
      MarkdownRenderer._snippets = MarkdownRenderer._snippets || {};
      MarkdownRenderer._snippets[item.id] = item.rawCode;
    });

    return finalHtml;
  }

  static copySnippet(id, btn) {
    const code = MarkdownRenderer._snippets?.[id] || '';
    if (!code) return;

    navigator.clipboard.writeText(code).then(() => {
      const original = btn.innerHTML;
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> <span style="color:#34d399">Copied!</span>`;
      setTimeout(() => {
        btn.innerHTML = original;
      }, 2000);
    }).catch(err => {
      console.error('Copy failed', err);
    });
  }

  static runSnippet(id) {
    const code = MarkdownRenderer._snippets?.[id] || '';
    const outBox = document.getElementById(`${id}-output`);
    if (!code || !outBox) return;

    outBox.style.display = 'flex';
    outBox.innerHTML = '<span class="output-title">Console Output:</span>';

    // Intercept console.log
    const logs = [];
    const origLog = console.log;
    console.log = function(...args) {
      logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
      origLog.apply(console, args);
    };

    try {
      const runner = new Function(code);
      const result = runner();
      if (result !== undefined) {
        logs.push(`↳ Return: ${typeof result === 'object' ? JSON.stringify(result) : result}`);
      }
      if (logs.length === 0) {
        logs.push('✓ Executed successfully (no console output).');
      }
      outBox.innerHTML += `<pre style="margin:4px 0; color:#4ade80;">${MarkdownRenderer.escapeHtml(logs.join('\n'))}</pre>`;
    } catch (err) {
      outBox.innerHTML += `<pre style="margin:4px 0; color:#f87171;">✕ Runtime Error: ${MarkdownRenderer.escapeHtml(err.message)}</pre>`;
    } finally {
      console.log = origLog;
    }
  }
}

window.MarkdownRenderer = MarkdownRenderer;
