import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CmsService } from '../../services/cms.service';
import { Router } from '@angular/router';
import { Post } from '../../models/cms.models';

@Component({
  selector: 'app-template-designer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="template-designer">
      <div *ngIf="cms.activeBlogSignal() as blog; else noBlog" class="designer-container">
        <h2>Template Designer</h2>
        <p>Customize your blog template. Add, edit, or remove sections.</p>

        <div class="designer-layout">
          <!-- PREVIEW PANE -->
          <div class="preview-pane">
            <h3>Live Preview</h3>
            <div class="template-preview">
              <!-- TOP NAVIGATION -->
              <nav class="top-nav" *ngIf="sections.topNav.enabled">
                <a href="#" class="nav-link">HOME</a>
                <a href="https://facebook.com" target="_blank" class="social-link" style="margin-left: auto;">f</a>
              </nav>

              <!-- LOGO SECTION -->
              <div class="logo-section" *ngIf="sections.logo.enabled">
                <p class="logo-text">{{ sections.logo.label || blog.name }}</p>
              </div>

              <!-- SECONDARY NAVIGATION -->
              <nav class="secondary-nav" *ngIf="sections.secondaryNav.enabled">
                <a href="#" class="nav-icon">⌂</a>
                <div class="search-container">
                  <input type="search" placeholder="" class="search-input" />
                  <span class="search-icon">🔍</span>
                </div>
              </nav>

              <!-- UPDATE BUTTON -->
              <div class="update-banner" *ngIf="sections.updateButton.enabled">
                <button class="update-btn">Update</button>
              </div>

              <!-- POSTS SECTION -->
              <section class="posts-section" *ngIf="sections.posts.enabled">
                <div class="section-header">
                  <h2>{{ sections.posts.label }}</h2>
                  <a href="#" class="view-more">View More</a>
                </div>
                <ul class="post-list">
                  <li *ngFor="let post of samplePosts"><a href="#">{{ post.title }}</a></li>
                  <li *ngIf="samplePosts.length === 0" class="empty">No posts yet.</li>
                </ul>
              </section>

              <!-- FOOTER -->
              <footer class="site-footer" *ngIf="sections.footer.enabled">
                <p>© {{ blog.name }} · Content and layout are styled by your chosen theme and template.</p>
              </footer>
            </div>
          </div>

          <!-- EDITOR PANE -->
          <div class="editor-pane">
            <h3>Template Elements</h3>
            <div class="element-controls">
              <!-- TOP NAV -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.topNav.enabled" />
                    <span>Top Navigation</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('topNav')">Edit</button>
                </div>
              </div>

              <!-- LOGO -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.logo.enabled" />
                    <span>Logo Section</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('logo')">Edit</button>
                </div>
              </div>

              <!-- SECONDARY NAV -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.secondaryNav.enabled" />
                    <span>Secondary Navigation</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('secondaryNav')">Edit</button>
                </div>
              </div>

              <!-- UPDATE BUTTON -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.updateButton.enabled" />
                    <span>Update Button</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('updateButton')">Edit</button>
                </div>
              </div>

              <!-- POSTS SECTION -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.posts.enabled" />
                    <span>Posts Section</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('posts')">Edit</button>
                </div>
              </div>

              <!-- FOOTER -->
              <div class="element-control">
                <div class="element-header">
                  <label class="element-toggle">
                    <input type="checkbox" [(ngModel)]="sections.footer.enabled" />
                    <span>Footer</span>
                  </label>
                  <button class="btn-edit" (click)="editElement('footer')">Edit</button>
                </div>
              </div>
            </div>

            <!-- EDIT PANEL -->
            <div class="edit-panel" *ngIf="editingElement">
              <h4>{{ getElementLabel(editingElement) }}</h4>
              <div class="edit-fields">
                <label *ngIf="editingElement === 'logo'">
                  Logo Text
                  <input type="text" [(ngModel)]="sections.logo.label" placeholder="Blog name" />
                </label>
                <label *ngIf="editingElement === 'posts'">
                  Section Title
                  <input type="text" [(ngModel)]="sections.posts.label" placeholder="Recent Posts" />
                </label>
              </div>
              <button (click)="editingElement = null" class="btn-close">Done</button>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button (click)="saveTemplate(blog.id)" class="btn btn-primary">Save Template</button>
          <button (click)="cancel()" class="btn btn-secondary">Cancel</button>
        </div>
      </div>

      <ng-template #noBlog>
        <p>No active blog selected.</p>
      </ng-template>
    </section>
  `,
  styles: [
    `.template-designer { padding: 2rem; }`,
    `.designer-container { max-width: 1400px; margin: 0 auto; }`,
    `.designer-layout { display: grid; grid-template-columns: 1fr 350px; gap: 2rem; margin: 2rem 0; }`,
    `.preview-pane { }`,
    `.preview-pane h3 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }`,
    `.template-preview { border: 1px solid #ddd; border-radius: 0.5rem; overflow: hidden; background: #f9f9f9; }`,
    `.top-nav { display: flex; gap: 1rem; align-items: center; background: #2b2b2b; padding: 0.5rem 1rem; justify-content: flex-end; }`,
    `.nav-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.social-link { color: #fff; font-size: 1.25rem; text-decoration: none; font-weight: bold; }`,
    `.logo-section { background: #f5f5f5; padding: 2rem 1rem; text-align: center; }`,
    `.logo-text { margin: 0; font-size: 3rem; font-weight: bold; font-style: italic; color: #d32f2f; }`,
    `.secondary-nav { display: flex; gap: 1rem; align-items: center; background: #1a1a1a; padding: 0.5rem 1rem; }`,
    `.nav-icon { color: #fff; text-decoration: none; font-size: 1.25rem; }`,
    `.search-container { margin-left: auto; display: flex; align-items: center; }`,
    `.search-input { padding: 0.5rem 0.75rem; border: none; border-radius: 0.25rem; width: 180px; }`,
    `.search-icon { color: #fff; margin-left: 0.5rem; cursor: pointer; }`,
    `.update-banner { padding: 1rem; background: #efefef; }`,
    `.update-btn { padding: 0.5rem 1rem; background: #2b2b2b; color: #fff; border: none; cursor: pointer; font-weight: 700; border-radius: 0.25rem; }`,
    `.posts-section { padding: 1rem; background: #fff; }`,
    `.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }`,
    `.section-header h2 { margin: 0; font-size: 1.4rem; font-weight: 700; text-transform: uppercase; color: #1a1a1a; }`,
    `.view-more { color: #d32f2f; text-decoration: none; font-weight: 700; font-size: 0.9rem; }`,
    `.post-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.75rem; }`,
    `.post-list li { padding: 0.75rem 0; border-bottom: 1px solid #eee; }`,
    `.post-list li.empty { color: #999; font-size: 0.9rem; }`,
    `.post-list a { color: #1a1a1a; text-decoration: none; font-weight: 600; }`,
    `.post-list a:hover { color: #d32f2f; }`,
    `.site-footer { background: #1a1a1a; padding: 2rem 1rem; color: #aaa; text-align: center; font-size: 0.9rem; }`,
    `.site-footer p { margin: 0; }`,
    `.editor-pane { background: #fff; border: 1px solid #ddd; border-radius: 0.5rem; padding: 1.5rem; height: fit-content; }`,
    `.editor-pane h3 { margin-top: 0; font-size: 1rem; font-weight: 600; margin-bottom: 1.5rem; }`,
    `.element-controls { display: grid; gap: 0.75rem; margin-bottom: 1.5rem; }`,
    `.element-control { padding: 0.75rem; border: 1px solid #eee; border-radius: 0.3rem; background: #fafafa; }`,
    `.element-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }`,
    `.element-toggle { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-weight: 500; flex: 1; }`,
    `.element-toggle input { cursor: pointer; }`,
    `.btn-edit { padding: 0.4rem 0.8rem; background: #1d4ed8; color: white; border: none; border-radius: 0.3rem; font-size: 0.8rem; cursor: pointer; font-weight: 600; }`,
    `.btn-edit:hover { background: #1e40af; }`,
    `.edit-panel { background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 0.3rem; padding: 1rem; margin-top: 1rem; }`,
    `.edit-panel h4 { margin-top: 0; font-size: 0.9rem; margin-bottom: 0.75rem; }`,
    `.edit-fields { display: grid; gap: 0.75rem; margin-bottom: 1rem; }`,
    `.edit-fields label { display: block; font-size: 0.9rem; font-weight: 500; }`,
    `.edit-fields input { width: 100%; padding: 0.5rem; border: 1px solid #bfdbfe; border-radius: 0.3rem; margin-top: 0.25rem; }`,
    `.btn-close { padding: 0.5rem 1rem; background: #6b7280; color: white; border: none; border-radius: 0.3rem; cursor: pointer; font-size: 0.9rem; width: 100%; }`,
    `.btn-close:hover { background: #4b5563; }`,
    `.action-buttons { display: flex; gap: 1rem; margin-top: 2rem; }`,
    `.btn { padding: 0.75rem 1.5rem; border: none; border-radius: 0.4rem; font-weight: 600; cursor: pointer; }`,
    `.btn-primary { background: #1d4ed8; color: white; }`,
    `.btn-primary:hover { background: #1e40af; }`,
    `.btn-secondary { background: #e5e7eb; color: #374151; }`,
    `.btn-secondary:hover { background: #d1d5db; }`,
    `@media (max-width: 1024px) { .designer-layout { grid-template-columns: 1fr; } .editor-pane { height: auto; } }`
  ]
})
export class TemplateDesignerComponent implements OnInit {
  readonly cms = inject(CmsService);
  private router = inject(Router);

  samplePosts: Post[] = [];
  editingElement: string | null = null;

  sections = {
    topNav: { enabled: true, label: 'Top Navigation' },
    logo: { enabled: true, label: 'Blog Name' },
    secondaryNav: { enabled: true, label: 'Secondary Navigation' },
    updateButton: { enabled: true, label: 'Update Button' },
    posts: { enabled: true, label: 'RECENT POSTS' },
    footer: { enabled: true, label: 'Footer' }
  };

  ngOnInit() {
    this.loadTemplate();
  }

  loadTemplate() {
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      this.samplePosts = this.cms.publishedPostsSignal().slice(0, 5);
    }
  }

  editElement(element: string) {
    this.editingElement = element;
  }

  getElementLabel(element: string): string {
    const labels: Record<string, string> = {
      topNav: 'Top Navigation',
      logo: 'Logo Section',
      secondaryNav: 'Secondary Navigation',
      updateButton: 'Update Button',
      posts: 'Posts Section',
      footer: 'Footer'
    };
    return labels[element] || element;
  }

  async saveTemplate(blogId: string) {
    // Save template configuration to Firestore
    console.log('Saving template:', this.sections);
    this.router.navigate(['/dashboard', blogId]);
  }

  cancel() {
    const blog = this.cms.activeBlogSignal();
    if (blog) {
      this.router.navigate(['/dashboard', blog.id]);
    }
  }
}
