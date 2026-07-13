import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="theme-editor">
      <h2>Theme CSS Editor</h2>
      <p>Modify the default theme CSS for your blog.</p>
      
      <div *ngIf="cms.activeBlogSignal() as blog; else noBlog" class="editor-container">
        <div class="editor-section">
          <h3>CSS Variables</h3>
          <div class="css-variables">
            <div class="variable-group">
              <label>Primary Color
                <input type="color" [(ngModel)]="themeVars.primaryColor" class="color-input" />
              </label>
              <input type="text" [(ngModel)]="themeVars.primaryColor" class="color-value" />
            </div>

            <div class="variable-group">
              <label>Secondary Color
                <input type="color" [(ngModel)]="themeVars.secondaryColor" class="color-input" />
              </label>
              <input type="text" [(ngModel)]="themeVars.secondaryColor" class="color-value" />
            </div>

            <div class="variable-group">
              <label>Accent Color
                <input type="color" [(ngModel)]="themeVars.accentColor" class="color-input" />
              </label>
              <input type="text" [(ngModel)]="themeVars.accentColor" class="color-value" />
            </div>

            <div class="variable-group">
              <label>Text Color
                <input type="color" [(ngModel)]="themeVars.textColor" class="color-input" />
              </label>
              <input type="text" [(ngModel)]="themeVars.textColor" class="color-value" />
            </div>

            <div class="variable-group">
              <label>Background Color
                <input type="color" [(ngModel)]="themeVars.backgroundColor" class="color-input" />
              </label>
              <input type="text" [(ngModel)]="themeVars.backgroundColor" class="color-value" />
            </div>

            <div class="variable-group">
              <label>Font Family
                <input type="text" [(ngModel)]="themeVars.fontFamily" placeholder="e.g., Arial, sans-serif" class="text-input" />
              </label>
            </div>

            <div class="variable-group">
              <label>Border Radius
                <input type="text" [(ngModel)]="themeVars.borderRadius" placeholder="e.g., 0.25rem" class="text-input" />
              </label>
            </div>
          </div>
        </div>

        <div class="editor-section">
          <h3>Custom CSS</h3>
          <textarea [(ngModel)]="customCss" class="css-editor" placeholder="Add custom CSS here..."></textarea>
        </div>

        <div class="preview-section">
          <h3>Live Preview</h3>
          <div class="preview" [style]="getPreviewStyles()">
            <nav class="preview-nav" [style.backgroundColor]="themeVars.secondaryColor">
              <a [style.color]="themeVars.textColor === '#1a1a1a' ? '#fff' : themeVars.textColor">HOME</a>
            </nav>
            <div class="preview-logo" [style.backgroundColor]="themeVars.backgroundColor">
              <p class="preview-logo-text" [style.color]="themeVars.primaryColor">{{ blog.name }}</p>
            </div>
            <div class="preview-content" [style.color]="themeVars.textColor">
              <h3>Sample Post</h3>
              <p>This is a preview of how your theme will look with the current CSS settings.</p>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button (click)="saveTheme(blog.id)" class="btn btn-primary">Save Theme</button>
          <button (click)="cancel()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>

      <ng-template #noBlog>
        <p>No active blog selected.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.theme-editor { max-width: 1000px; padding: 2rem; }`,
    `.editor-container { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }`,
    `.editor-section { background: #fff; border: 1px solid #ddd; border-radius: 0.5rem; padding: 1.5rem; }`,
    `.editor-section h3 { margin-top: 0; font-size: 1.1rem; font-weight: 600; margin-bottom: 1.5rem; }`,
    `.css-variables { display: grid; gap: 1rem; }`,
    `.variable-group { display: flex; flex-direction: column; gap: 0.5rem; }`,
    `.variable-group label { font-weight: 600; font-size: 0.9rem; }`,
    `.variable-group input { padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.3rem; }`,
    `.color-input { width: 60px; height: 40px; cursor: pointer; }`,
    `.color-value { font-family: monospace; }`,
    `.text-input { }`,
    `.css-editor { width: 100%; height: 400px; padding: 1rem; border: 1px solid #ddd; border-radius: 0.3rem; font-family: monospace; font-size: 0.85rem; resize: vertical; }`,
    `.preview-section { grid-column: 1 / -1; background: #fff; border: 1px solid #ddd; border-radius: 0.5rem; padding: 1.5rem; }`,
    `.preview { border: 1px solid #ddd; border-radius: 0.3rem; overflow: hidden; }`,
    `.preview-nav { padding: 1rem; display: flex; gap: 1rem; }`,
    `.preview-nav a { text-decoration: none; text-transform: uppercase; font-weight: 600; font-size: 0.8rem; }`,
    `.preview-logo { padding: 2rem 1rem; text-align: center; }`,
    `.preview-logo-text { margin: 0; font-size: 2rem; font-weight: bold; }`,
    `.preview-content { padding: 1.5rem; }`,
    `.preview-content h3 { margin-top: 0; }`,
    `.action-buttons { grid-column: 1 / -1; display: flex; gap: 1rem; margin-top: 1rem; }`,
    `.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.4rem; font-weight: 600; cursor: pointer; }`,
    `.btn-primary { background: #1d4ed8; color: white; }`,
    `.btn-primary:hover { background: #1e40af; }`,
    `.btn-secondary { background: #e5e7eb; color: #374151; }`,
    `.btn-secondary:hover { background: #d1d5db; }`,
    `@media (max-width: 768px) { .editor-container { grid-template-columns: 1fr; } }`
  ]
})
export class ThemeSettingsComponent implements OnInit {
  readonly cms = inject(CmsService);
  private router = inject(Router);

  themeVars = {
    primaryColor: '#d32f2f',
    secondaryColor: '#2b2b2b',
    accentColor: '#d32f2f',
    textColor: '#1a1a1a',
    backgroundColor: '#f5f5f5',
    fontFamily: 'Arial, sans-serif',
    borderRadius: '0.25rem'
  };

  customCss = '';

  ngOnInit() {
    this.loadTheme();
  }

  loadTheme() {
    // Load saved theme from storage or use defaults
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      // In a real app, load from Firestore
    }
  }

  getPreviewStyles() {
    return {
      'font-family': this.themeVars.fontFamily,
      'background-color': this.themeVars.backgroundColor
    };
  }

  async saveTheme(blogId: string) {
    // Save theme to Firestore
    console.log('Saving theme:', { themeVars: this.themeVars, customCss: this.customCss });
    this.router.navigate(['/dashboard', blogId]);
  }

  cancel() {
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      this.router.navigate(['/dashboard', blog.id]);
    }
  }
}
