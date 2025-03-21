import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

/**
 * Welcome dashboard component
 */
@customElement('web-debugger-welcome')
export class WelcomeDashboard extends LitElement {
    static styles = css`
    :host {
      display: block;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    }
    
    h1 {
      font-size: 24px;
      margin-top: 0;
      margin-bottom: 16px;
      color: var(--wdt-panel-text-color);
    }
    
    p {
      line-height: 1.5;
      margin-bottom: 16px;
      color: var(--wdt-panel-text-color);
    }
    
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-top: 24px;
    }
    
    .feature-card {
      border: 1px solid var(--wdt-panel-border-color);
      border-radius: 6px;
      padding: 16px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .feature-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.08);
    }
    
    .feature-card h3 {
      margin-top: 0;
      margin-bottom: 8px;
      font-size: 16px;
      color: var(--wdt-panel-text-color);
    }
    
    .feature-card p {
      margin: 0;
      font-size: 14px;
      color: var(--wdt-panel-text-color);
      opacity: 0.8;
    }
    
    .version {
      margin-top: 32px;
      font-size: 12px;
      opacity: 0.6;
      text-align: right;
      color: var(--wdt-panel-text-color);
    }
  `;

    render() {
        return html`
      <div class="welcome-container">
        <h1>Web Debugger</h1>
        <p>
          Welcome to Web Debugger, a comprehensive tool for web development debugging and design.
          This extension provides various tools to help you analyze and manipulate web elements.
        </p>
        
        <div class="feature-grid">
          <div class="feature-card">
            <h3>DOM Inspector</h3>
            <p>Inspect and manipulate DOM elements with detailed information.</p>
          </div>
          
          <div class="feature-card">
            <h3>Color Tools</h3>
            <p>Pick colors, generate palettes, and check contrast ratios.</p>
          </div>
          
          <div class="feature-card">
            <h3>Layout Grid</h3>
            <p>Visualize layout grids and analyze spacing.</p>
          </div>
          
          <div class="feature-card">
            <h3>Typography</h3>
            <p>Analyze fonts, check readability, and inspect text styles.</p>
          </div>
        </div>
        
        <div class="version">
          Version 0.1.0
        </div>
      </div>
    `;
    }
} 