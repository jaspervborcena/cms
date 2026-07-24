import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <aside class="sidebar">
      <section *ngIf="service.activeStoreSignal(); else noStoreSelected">
        <h3>Popular posts</h3>
        <ul>
          <li *ngFor="let post of service.popularPostsSignal()">
            <a [routerLink]="['/site', service.activeStoreSignal()?.id, post.slug]">{{ post.title }}</a>
            <span>{{ post.views }} views</span>
          </li>
        </ul>
      </section>
      <section *ngIf="service.activeStoreSignal()">
        <h3>Recent posts</h3>
        <ul>
          <li *ngFor="let post of service.recentPostsSignal()">
            <a [routerLink]="['/site', service.activeStoreSignal()?.id, post.slug]">{{ post.title }}</a>
            <span>{{ post.category }}</span>
          </li>
        </ul>
      </section>
      <ng-template #noStoreSelected>
        <div class="hint">Select a store to see popular and recent posts.</div>
      </ng-template>
    </aside>
  `,
  styles: [
    `.sidebar { display:flex; flex-direction:column; gap:1.5rem; }`,
    `h3 { margin:0 0 0.75rem; font-size:1rem; }`,
    `ul { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:0.75rem; }`,
    `li { display:flex; flex-direction:column; gap:0.2rem; padding:0.75rem; background:#f9fafb; border-radius:0.5rem; }`,
    `a { color:#111827; font-weight:600; text-decoration:none; }`,
    `span { color:#6b7280; font-size:0.9rem; }`
  ]
})
export class SidebarComponent {
  readonly service = inject(CmsService);
}
