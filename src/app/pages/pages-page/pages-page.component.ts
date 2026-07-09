import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-pages-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <h1>Pages</h1>
    <div class="list">
      <article class="card" *ngFor="let page of service.pagesSignal()">
        <h2>{{ page.title }}</h2>
        <p>{{ page.excerpt }}</p>
        <a [routerLink]="['/pages', page.slug]">Open page</a>
      </article>
    </div>
  `,
  styles: [
    `.list { display:grid; gap:1rem; }`,
    `.card { padding:1rem; border:1px solid #e5e7eb; border-radius:0.75rem; background:white; }`,
    `a { color:#2563eb; font-weight:600; text-decoration:none; }`
  ]
})
export class PagesPageComponent {
  readonly service = inject(CmsService);
}
