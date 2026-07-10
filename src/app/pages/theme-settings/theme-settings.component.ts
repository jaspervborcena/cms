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
      <h2>Theme settings</h2>
      <p>Select a theme for the active blog.</p>
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

        <div style="margin-top:1rem">
          <button class="btn" (click)="save(blog.id)">Save settings</button>
        </div>
      </div>
      <ng-template #noBlog>
        <p>No active blog selected.</p>
      </ng-template>
    </section>
  `
})
export class ThemeSettingsComponent {
  readonly cms = inject(CmsService);
  private router = inject(Router);
  themes = this.cms.getAvailableThemes();
  templates = this.cms.getAvailableTemplates();
  selectedTheme = 'default';
  selectedTemplate = 'default';

  constructor() {
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      this.selectedTheme = blog.theme ?? 'default';
      this.selectedTemplate = blog.template ?? 'default';
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
}
