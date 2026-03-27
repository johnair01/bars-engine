#!/usr/bin/env tsx
/**
 * Coverage Dashboard Generator
 *
 * Generates an interactive HTML dashboard showing annotation quality metrics.
 * Uses the analyze-annotations.ts output to create visualizations.
 *
 * Usage:
 *   npm run coverage:dashboard
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const OUTPUT_FILE = path.join(process.cwd(), 'public/coverage-dashboard.html');

// Get analysis data
const analysisJson = execSync('npx tsx scripts/analyze-annotations.ts --json', {
  encoding: 'utf-8',
});

const report = JSON.parse(analysisJson);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Route Annotation Coverage Dashboard</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: #09090b;
      color: #e4e4e7;
      padding: 2rem;
      line-height: 1.6;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
      background: linear-gradient(135deg, #a78bfa 0%, #ec4899 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .subtitle {
      color: #71717a;
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    .stat-value {
      font-size: 2.5rem;
      font-weight: bold;
      color: #a78bfa;
      margin-bottom: 0.25rem;
    }
    .stat-label {
      color: #a1a1aa;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .section {
      background: #18181b;
      border: 1px solid #27272a;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
    }
    .section-title {
      font-size: 1.25rem;
      margin-bottom: 1rem;
      color: #fafafa;
    }
    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .bar-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .bar-label {
      min-width: 120px;
      font-size: 0.875rem;
      color: #a1a1aa;
    }
    .bar-track {
      flex: 1;
      height: 24px;
      background: #27272a;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #a78bfa 0%, #ec4899 100%);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 0.5rem;
    }
    .bar-value {
      font-size: 0.75rem;
      font-weight: bold;
      color: #fafafa;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    th {
      text-align: left;
      padding: 0.75rem;
      background: #27272a;
      color: #a1a1aa;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 0.75rem;
    }
    td {
      padding: 0.75rem;
      border-bottom: 1px solid #27272a;
    }
    tr:hover {
      background: #27272a50;
    }
    .badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-high { background: #dc262680; color: #fca5a5; }
    .badge-medium { background: #ea580c80; color: #fdba74; }
    .badge-entity { background: #a78bfa20; color: #c4b5fd; }
    .completeness {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .completeness-bar {
      width: 60px;
      height: 6px;
      background: #27272a;
      border-radius: 3px;
      overflow: hidden;
    }
    .completeness-fill {
      height: 100%;
      background: linear-gradient(90deg, #a78bfa 0%, #ec4899 100%);
    }
    .file-path {
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.75rem;
      color: #71717a;
    }
    .recommendations {
      margin-top: 0.5rem;
      padding-left: 1rem;
      font-size: 0.75rem;
      color: #a1a1aa;
    }
    .recommendations li {
      margin-bottom: 0.25rem;
    }
    footer {
      text-align: center;
      padding: 2rem 0;
      color: #52525b;
      font-size: 0.875rem;
    }
    .entity-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }
    .entity-card {
      background: #27272a;
      padding: 1rem;
      border-radius: 0.5rem;
      text-align: center;
    }
    .entity-count {
      font-size: 2rem;
      font-weight: bold;
      color: #a78bfa;
    }
    .entity-name {
      font-size: 0.75rem;
      color: #a1a1aa;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 0.25rem;
    }
    .entity-percent {
      font-size: 0.875rem;
      color: #71717a;
      margin-top: 0.25rem;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Route Annotation Coverage</h1>
    <div class="subtitle">
      Deep Linking & API Registration System | Generated ${new Date().toLocaleString()}
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${report.totalRoutes}</div>
        <div class="stat-label">Total Routes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.averageCompleteness}%</div>
        <div class="stat-label">Avg Completeness</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.agentDiscoverableCount}</div>
        <div class="stat-label">Agent Discoverable</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${Object.keys(report.entityDistribution).length}</div>
        <div class="stat-label">Entity Types</div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">🏷️ Entity Distribution</div>
      <div class="entity-grid">
        ${Object.entries(report.entityDistribution)
          .sort((a: any, b: any) => b[1] - a[1])
          .map(([entity, count]: [string, any]) => {
            const percent = Math.round((count / report.totalRoutes) * 100);
            return `
              <div class="entity-card">
                <div class="entity-count">${count}</div>
                <div class="entity-name">${entity}</div>
                <div class="entity-percent">${percent}%</div>
              </div>
            `;
          })
          .join('')}
      </div>
    </div>

    <div class="section">
      <div class="section-title">📋 Field Coverage</div>
      <div class="bar-chart">
        ${Object.entries(report.fieldCoverage)
          .sort((a: any, b: any) => b[1] - a[1])
          .map(([field, percentage]: [string, any]) => `
            <div class="bar-item">
              <div class="bar-label">${field}</div>
              <div class="bar-track">
                <div class="bar-fill" style="width: ${percentage}%">
                  <span class="bar-value">${percentage}%</span>
                </div>
              </div>
            </div>
          `)
          .join('')}
      </div>
    </div>

    ${report.highPriorityImprovements.length > 0 ? `
    <div class="section">
      <div class="section-title">🔴 High Priority Improvements (${report.highPriorityImprovements.length})</div>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Entity</th>
            <th>Completeness</th>
            <th>Recommendations</th>
          </tr>
        </thead>
        <tbody>
          ${report.highPriorityImprovements.slice(0, 20).map((quality: any) => `
            <tr>
              <td>
                <div class="file-path">${quality.file}:${quality.lineNumber}</div>
              </td>
              <td>
                <span class="badge badge-entity">${quality.entity}</span>
              </td>
              <td>
                <div class="completeness">
                  <span>${quality.completeness}%</span>
                  <div class="completeness-bar">
                    <div class="completeness-fill" style="width: ${quality.completeness}%"></div>
                  </div>
                </div>
              </td>
              <td>
                <ul class="recommendations">
                  ${quality.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${report.highPriorityImprovements.length > 20 ? `
        <div style="padding: 1rem; text-align: center; color: #71717a; font-size: 0.875rem;">
          ... and ${report.highPriorityImprovements.length - 20} more routes
        </div>
      ` : ''}
    </div>
    ` : ''}

    ${report.mediumPriorityImprovements.length > 0 ? `
    <div class="section">
      <div class="section-title">🟡 Medium Priority Improvements (${report.mediumPriorityImprovements.length})</div>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Entity</th>
            <th>Completeness</th>
            <th>Recommendations</th>
          </tr>
        </thead>
        <tbody>
          ${report.mediumPriorityImprovements.slice(0, 10).map((quality: any) => `
            <tr>
              <td>
                <div class="file-path">${quality.file}:${quality.lineNumber}</div>
              </td>
              <td>
                <span class="badge badge-entity">${quality.entity}</span>
              </td>
              <td>
                <div class="completeness">
                  <span>${quality.completeness}%</span>
                  <div class="completeness-bar">
                    <div class="completeness-fill" style="width: ${quality.completeness}%"></div>
                  </div>
                </div>
              </td>
              <td>
                <ul class="recommendations">
                  ${quality.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${report.mediumPriorityImprovements.length > 10 ? `
        <div style="padding: 1rem; text-align: center; color: #71717a; font-size: 0.875rem;">
          ... and ${report.mediumPriorityImprovements.length - 10} more routes
        </div>
      ` : ''}
    </div>
    ` : ''}

    ${report.topQualityRoutes.length > 0 ? `
    <div class="section">
      <div class="section-title">✨ Top Quality Routes (100% Complete) - ${report.topQualityRoutes.length} Total</div>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Entity</th>
            <th>Route</th>
          </tr>
        </thead>
        <tbody>
          ${report.topQualityRoutes.map((quality: any) => `
            <tr>
              <td>
                <div class="file-path">${quality.file}:${quality.lineNumber}</div>
              </td>
              <td>
                <span class="badge badge-entity">${quality.entity}</span>
              </td>
              <td style="font-family: 'Monaco', 'Menlo', monospace; font-size: 0.75rem;">
                ${quality.route}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
    ` : ''}

    <footer>
      Generated by scripts/generate-coverage-dashboard.ts<br/>
      BARs Engine Deep Linking System | Phase 2
    </footer>
  </div>
</body>
</html>
`;

fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

console.log(`✅ Dashboard generated: ${OUTPUT_FILE}`);
console.log(`📂 Open file://${OUTPUT_FILE} in your browser`);
