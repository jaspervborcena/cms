import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-theme-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="theme-settings">
      <h2>Theme & Template settings</h2>
      <p>Customize the appearance and layout of your blog.</p>
      <div *ngIf="cms.activeBlogSignal() as blog; else noBlog">
        <label>Theme
          <select [(ngModel)]="selectedTheme">
            <option *ngFor="let theme of themes" [value]="theme.id">{{ theme.label }}</option>
          </select>
        </label>

        <label style="display:block; margin-top:1rem">Template
          <select [(ngModel)]="selectedTemplate">
            <option *ngFor="let template of templates" [value]="template.id">{{ template.label }}</option>
          </select>
        </label>

        <div style="margin-top:1rem; display: flex; gap: 1rem;">
          <button class="btn" (click)="save(blog.id)">Save settings</button>
          <button class="btn btn-secondary" (click)="navigateToTemplateConfig(blog.id)">Configure Template</button>
        </div>
      </div>
      <ng-template #noBlog>
        <p>No active blog selected.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.theme-settings { max-width: 600px; }`,
    `label { display: block; margin-bottom: 1rem; font-weight: 600; }`,
    `select { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.5rem; }`,
    `.btn { padding: 0.75rem 1.5rem; background: #1d4ed8; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: 600; }`,
    `.btn:hover { background: #1e40af; }`,
    `.btn-secondary { background: #6b7280; }`,
    `.btn-secondary:hover { background: #4b5563; }`
  ]
})
export class ThemeSettingsComponent {
  readonly cms = inject(CmsService);
  private router = inject(Router);
  themes = this.cms.getAvailableThemes();
  templates = this.cms.getAvailableTemplates();
  selectedTheme = this.cms.defaultTheme;
  selectedTemplate = this.cms.defaultTemplate;

  constructor() {
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      this.selectedTheme = blog.theme ?? this.cms.defaultTheme;
      this.selectedTemplate = blog.template ?? this.cms.defaultTemplate;
    }
  }

  async save(blogId: string) {
    await Promise.all([
      this.cms.setBlogTheme(blogId, this.selectedTheme),
      this.cms.setBlogTemplate(blogId, this.selectedTemplate)
    ]);

    this.cms.setActiveBlogById(blogId);
    this.router.navigate(['/dashboard', blogId]);
  }

  navigateToTemplateConfig(blogId: string): void {
    this.router.navigate(['/dashboard', blogId, 'template-config']);
  }
}
