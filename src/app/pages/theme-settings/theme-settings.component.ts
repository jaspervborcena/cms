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
          <select [(ngModel)]="selected">
            <option value="default">Default</option>
            <option value="minimal">Minimal</option>
            <option value="modern">Modern</option>
            <option value="contempo">Contempo (Left-sidebar)</option>
          </select>
        </label>
        <div style="margin-top:1rem">
          <button class="btn" (click)="save(blog.id)">Save theme</button>
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
  selected = 'default';

  save(blogId: string) {
    this.cms.setBlogTheme(blogId, this.selected).then(() => {
      // reload active blog
      this.cms.setActiveBlogById(blogId);
      // navigate back to dashboard
      this.router.navigate(['/dashboard', blogId]);
    });
  }
}
