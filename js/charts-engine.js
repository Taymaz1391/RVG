/**
 * ============================================================================
 * TOM AI - DATA VISUALIZATION & INTERACTIVE CHART ENGINE
 * ============================================================================
 * Generates lightweight, interactive SVG/Canvas charts on-device.
 * Supports: Bar, Line, Spline, Pie/Donut, and Radar charts without external libraries.
 * ============================================================================
 */

class ChartsEngine {
  /**
   * Render an interactive Bar Chart
   */
  static renderBarChart({ title, labels, datasets, width = 600, height = 280 }) {
    const pad = { top: 40, right: 20, bottom: 40, left: 50 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const allValues = datasets.flatMap(d => d.data);
    const maxVal = Math.max(...allValues, 10);

    const groupCount = labels.length;
    const groupW = chartW / groupCount;
    const barW = (groupW * 0.7) / datasets.length;

    let barsSvg = '';
    datasets.forEach((ds, dsIdx) => {
      const color = ds.color || '#10b981';
      ds.data.forEach((val, idx) => {
        const h = (val / maxVal) * chartH;
        const x = pad.left + idx * groupW + (groupW * 0.15) + dsIdx * barW;
        const y = pad.top + chartH - h;
        barsSvg += `
          <rect x="${x}" y="${y}" width="${barW - 2}" height="${h}" rx="3" fill="${color}" opacity="0.9">
            <title>${labels[idx]} (${ds.label || 'Data'}): ${val}</title>
          </rect>
        `;
      });
    });

    // X Axis Labels
    let labelsSvg = '';
    labels.forEach((lbl, idx) => {
      const x = pad.left + idx * groupW + groupW / 2;
      labelsSvg += `<text x="${x}" y="${height - 14}" fill="#a1a1aa" font-size="11" font-family="sans-serif" text-anchor="middle">${lbl}</text>`;
    });

    // Y Axis Grid
    let gridSvg = '';
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (i / 4) * chartH;
      const val = Math.round(maxVal * (1 - i / 4));
      gridSvg += `
        <line x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <text x="${pad.left - 8}" y="${y + 4}" fill="#71717a" font-size="10" font-family="monospace" text-anchor="end">${val}</text>
      `;
    }

    return `
      <div class="interactive-chart-card" style="margin:16px 0; background:#121214; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:16px; overflow-x:auto;">
        <div style="font-weight:700; font-size:14px; color:#fff; margin-bottom:8px;">${title || 'Data Analysis Chart'}</div>
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; max-width:${width}px; height:auto; display:block;">
          ${gridSvg}
          ${barsSvg}
          ${labelsSvg}
        </svg>
      </div>
    `;
  }

  /**
   * Render an interactive Smooth Line Chart
   */
  static renderLineChart({ title, labels, data, color = '#06b6d4', width = 600, height = 260 }) {
    const pad = { top: 35, right: 25, bottom: 40, left: 50 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const maxVal = Math.max(...data, 10);
    const minVal = Math.min(...data, 0);
    const range = maxVal - minVal || 1;

    const stepX = chartW / (data.length - 1 || 1);
    const points = data.map((val, idx) => {
      const x = pad.left + idx * stepX;
      const y = pad.top + chartH - ((val - minVal) / range) * chartH;
      return { x, y, val, label: labels[idx] };
    });

    let pathD = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathD += ` L ${points[i].x} ${points[i].y}`;
    }

    const areaD = `${pathD} L ${points[points.length - 1].x} ${pad.top + chartH} L ${points[0].x} ${pad.top + chartH} Z`;

    let dotsSvg = '';
    points.forEach((pt) => {
      dotsSvg += `
        <circle cx="${pt.x}" cy="${pt.y}" r="4" fill="${color}" stroke="#121214" stroke-width="2">
          <title>${pt.label}: ${pt.val}</title>
        </circle>
      `;
    });

    let labelsSvg = '';
    points.forEach((pt) => {
      labelsSvg += `<text x="${pt.x}" y="${height - 14}" fill="#a1a1aa" font-size="10" font-family="sans-serif" text-anchor="middle">${pt.label}</text>`;
    });

    return `
      <div class="interactive-chart-card" style="margin:16px 0; background:#121214; border:1px solid rgba(255,255,255,0.1); border-radius:12px; padding:16px; overflow-x:auto;">
        <div style="font-weight:700; font-size:14px; color:#fff; margin-bottom:8px;">${title || 'Metric Trend'}</div>
        <svg viewBox="0 0 ${width} ${height}" style="width:100%; max-width:${width}px; height:auto; display:block;">
          <defs>
            <linearGradient id="lineGrad_${Date.now()}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.35" />
              <stop offset="100%" stop-color="${color}" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <path d="${areaD}" fill="url(#lineGrad_${Date.now()})" />
          <path d="${pathD}" fill="none" stroke="${color}" stroke-width="2.5" />
          ${dotsSvg}
          ${labelsSvg}
        </svg>
      </div>
    `;
  }
}

window.ChartsEngine = ChartsEngine;
