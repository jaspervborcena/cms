import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { GlobalThemeSettings } from '../../models/cms.models';

@Component({
  selector: 'app-global-theme-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="global-theme-container">
      <h2>Global Theme Settings</h2>
      <p>Customize colors, fonts, and spacing for all sites</p>

      <!-- LIVE PREVIEW -->
      <div class="preview-section">
        <h3>Live Preview</h3>
        <div class="theme-preview" [style]="getPreviewStyles()">
          <nav class="preview-top-nav">
            <a href="#" class="nav-link">Home</a>
            <a href="#" class="nav-link">About</a>
            <a href="#" class="nav-link">Contact</a>
          </nav>

          <div class="preview-logo">
            <p class="logo-text">My Site</p>
          </div>

          <nav class="preview-secondary">
            <span class="nav-item">Menu</span>
            <span class="nav-item">Gallery</span>
            <span class="nav-item">Store</span>
          </nav>

          <div class="preview-content">
            <h1>Welcome</h1>
            <p>This is how your sites will look with these theme settings.</p>
            <button>Click Me</button>
          </div>
        </div>
      </div>

      <!-- CONFIGURATION PANEL -->
      <div class="config-section">
        <!-- COLORS -->
        <div class="config-group">
          <h4>Colors</h4>
          <div class="color-grid">
            <div class="color-input">
              <label>Primary Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.primary" />
                <input type="text" [(ngModel)]="settings.colors.primary" class="color-text" />
              </div>
            </div>
            <div class="color-input">
              <label>Secondary Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.secondary" />
                <input type="text" [(ngModel)]="settings.colors.secondary" class="color-text" />
              </div>
            </div>
            <div class="color-input">
              <label>Text Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.text" />
                <input type="text" [(ngModel)]="settings.colors.text" class="color-text" />
              </div>
            </div>
            <div class="color-input">
              <label>Background Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.background" />
                <input type="text" [(ngModel)]="settings.colors.background" class="color-text" />
              </div>
            </div>
            <div class="color-input">
              <label>Accent Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.accent" />
                <input type="text" [(ngModel)]="settings.colors.accent" class="color-text" />
              </div>
            </div>
            <div class="color-input">
              <label>Muted Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.muted" />
                <input type="text" [(ngModel)]="settings.colors.muted" class="color-text" />
              </div>
            </div>
            <div class="color-input">
              <label>Border Color</label>
              <div class="color-wrapper">
                <input type="color" [(ngModel)]="settings.colors.border" />
                <input type="text" [(ngModel)]="settings.colors.border" class="color-text" />
              </div>
            </div>
          </div>
        </div>

        <!-- FONTS -->
        <div class="config-group">
          <h4>Typography</h4>
          <label>
            Font Family
            <input type="text" [(ngModel)]="settings.fonts.family" placeholder="e.g., Arial, sans-serif" class="input-field" />
          </label>
          <label>
            Heading Size
            <input type="text" [(ngModel)]="settings.fonts.headingSize" placeholder="e.g., 2rem" class="input-field" />
          </label>
          <label>
            Body Size
            <input type="text" [(ngModel)]="settings.fonts.bodySize" placeholder="e.g., 1rem" class="input-field" />
          </label>
          <label>
            Font Weight
            <input type="text" [(ngModel)]="settings.fonts.fontWeight" placeholder="e.g., 600" class="input-field" />
          </label>
        </div>

        <!-- SPACING -->
        <div class="config-group">
          <h4>Spacing & Layout</h4>
          <label>
            Border Radius
            <input type="text" [(ngModel)]="settings.spacing.borderRadius" placeholder="e.g., 0.25rem" class="input-field" />
          </label>
          <label>
            Padding
            <input type="text" [(ngModel)]="settings.spacing.padding" placeholder="e.g., 1rem" class="input-field" />
          </label>
          <label>
            Gap (spacing between items)
            <input type="text" [(ngModel)]="settings.spacing.gap" placeholder="e.g., 1rem" class="input-field" />
          </label>
        </div>

        <!-- CUSTOM CSS -->
        <div class="config-group">
          <h4>Custom CSS</h4>
          <p class="info-text">Add any additional CSS rules here. They will be applied to all sites.</p>
          <textarea
            [(ngModel)]="settings.customCss"
            class="css-editor"
            placeholder=".custom-class { color: red; }"
          ></textarea>
        </div>

        <!-- GENERATED CSS PREVIEW -->
        <div class="config-group">
          <h4>Generated CSS</h4>
          <div class="css-preview">
            <pre>{{ generatedCss }}</pre>
          </div>
        </div>

        <!-- ACTIONS -->
        <div class="action-buttons">
          <button (click)="saveSettings()" class="btn btn-primary">Save Settings</button>
          <button (click)="resetToDefaults()" class="btn btn-secondary">Reset to Defaults</button>
          <button (click)="cancel()" class="btn btn-cancel">Cancel</button>
        </div>
      </div>
    </section>
  `,
  styles: [
    `.global-theme-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }`,
    `.global-theme-container h2 { margin: 0 0 0.5rem 0; font-size: 1.8rem; font-weight: 700; }`,
    `.global-theme-container > p { color: #666; margin-bottom: 2rem; }`,

    `.preview-section { margin-bottom: 3rem; }`,
    `.preview-section h3 { font-size: 1.2rem; font-weight: 700; margin-bottom: 1rem; }`,
    `.theme-preview { border: 2px solid #ddd; border-radius: 0.5rem; overflow: hidden; }`,

    `.preview-top-nav { display: flex; gap: 1.5rem; background: #2b2b2b; padding: 0.75rem 1rem; }`,
    `.preview-top-nav .nav-link { color: #fff; text-decoration: none; font-weight: 600; font-size: 0.9rem; }`,

    `.preview-logo { padding: 2rem 1rem; text-align: center; background: #f5f5f5; }`,
    `.logo-text { margin: 0; font-size: 2rem; font-weight: bold; font-style: italic; }`,

    `.preview-secondary { display: flex; gap: 1rem; background: #1a1a1a; padding: 0.75rem 1rem; }`,
    `.preview-secondary .nav-item { color: #fff; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; }`,

    `.preview-content { padding: 2rem; }`,
    `.preview-content h1 { margin: 0 0 1rem 0; font-size: 2rem; }`,
    `.preview-content p { margin: 0 0 1rem 0; line-height: 1.6; }`,
    `.preview-content button { padding: 0.75rem 1.5rem; cursor: pointer; font-weight: 700; }`,

    `.config-section { background: #fff; border: 1px solid #ddd; border-radius: 0.5rem; padding: 2rem; }`,
    `.config-group { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid #eee; }`,
    `.config-group:last-of-type { border-bottom: none; }`,
    `.config-group h4 { margin: 0 0 1rem 0; font-size: 1.1rem; font-weight: 600; }`,

    `.color-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem; }`,
    `.color-input label { display: block; font-weight: 600; margin-bottom: 0.5rem; }`,
    `.color-wrapper { display: flex; gap: 0.5rem; align-items: center; }`,
    `.color-wrapper input[type="color"] { width: 50px; height: 40px; border: none; border-radius: 0.3rem; cursor: pointer; }`,
    `.color-text { flex: 1; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.3rem; font-family: monospace; }`,

    `label { display: block; margin-bottom: 1rem; font-weight: 600; }`,
    `.input-field { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.4rem; }`,

    `.info-text { color: #666; font-size: 0.9rem; margin-bottom: 1rem; }`,

    `.css-editor { width: 100%; height: 200px; padding: 1rem; border: 1px solid #ddd; border-radius: 0.4rem; font-family: monospace; font-size: 0.9rem; resize: vertical; }`,

    `.css-preview { background: #f5f5f5; border: 1px solid #ddd; border-radius: 0.4rem; padding: 1rem; max-height: 400px; overflow-y: auto; }`,
    `.css-preview pre { margin: 0; font-family: monospace; font-size: 0.85rem; line-height: 1.4; color: #333; }`,

    `.action-buttons { display: flex; gap: 1rem; margin-top: 2rem; flex-wrap: wrap; }`,
    `.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.4rem; cursor: pointer; font-weight: 600; }`,
    `.btn-primary { background: #1d4ed8; color: white; }`,
    `.btn-primary:hover { background: #1e40af; }`,
    `.btn-secondary { background: #6b7280; color: white; }`,
    `.btn-secondary:hover { background: #4b5563; }`,
    `.btn-cancel { background: #e5e7eb; color: #374151; }`,
    `.btn-cancel:hover { background: #d1d5db; }`,

    `@media (max-width: 768px) { .color-grid { grid-template-columns: 1fr; } .action-buttons { flex-direction: column; } }`
  ]
})
export class GlobalThemeConfigComponent implements OnInit {
  private readonly cms = inject(CmsService);

  settings: GlobalThemeSettings = this.cms['getDefaultThemeSettings']();
  generatedCss = '';

  async ngOnInit(): Promise<void> {
    this.settings = await this.cms.getGlobalThemeSettings();
    this.updateCssPreview();
  }

  getPreviewStyles(): { [key: string]: string } {
    return {
      '--primary-color': this.settings.colors.primary,
      '--secondary-color': this.settings.colors.secondary,
      '--text-color': this.settings.colors.text,
      '--bg-color': this.settings.colors.background,
      '--accent-color': this.settings.colors.accent,
      '--muted-color': this.settings.colors.muted,
      '--border-color': this.settings.colors.border,
      '--font-family': this.settings.fonts.family,
      '--heading-size': this.settings.fonts.headingSize,
      '--body-size': this.settings.fonts.bodySize,
      '--font-weight': this.settings.fonts.fontWeight,
      '--border-radius': this.settings.spacing.borderRadius,
      '--padding': this.settings.spacing.padding,
      '--gap': this.settings.spacing.gap,
      'color': this.settings.colors.text,
      'background-color': this.settings.colors.background,
      'font-family': this.settings.fonts.family,
      'font-size': this.settings.fonts.bodySize
    } as any;
  }

  updateCssPreview(): void {
    this.generatedCss = this.cms.generateThemeCss(this.settings);
  }

  async saveSettings(): Promise<void> {
    try {
      this.updateCssPreview();
      await this.cms.updateGlobalThemeSettings(this.settings);
      alert('Global theme settings saved successfully!');
    } catch (error) {
      alert('Error saving theme settings: ' + error);
    }
  }

  resetToDefaults(): void {
    if (confirm('Are you sure you want to reset to default theme settings?')) {
      this.settings = this.cms['getDefaultThemeSettings']();
      this.updateCssPreview();
    }
  }

  cancel(): void {
    location.href = '/dashboard';
  }
}
