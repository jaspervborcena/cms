import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="hero">
      <h1>Editorial CMS starter</h1>
      <p>Manage posts and pages from a clean Angular shell with Firebase-ready services and signals.</p>
    </section>
    <section class="grid">
      <article class="card" *ngFor="let post of service.postsSignal()">
        <span class="tag">{{ post.category }}</span>
        <h2>{{ post.title }}</h2>
        <p>{{ post.excerpt }}</p>
        <a [routerLink]="['/posts', post.slug]">Read more</a>
      </article>
    </section>
  `,
  styles: [
    `.hero { margin-bottom:1.5rem; }`,
    `.hero h1 { margin:0 0 0.5rem; font-size:2rem; }`,
    `.hero p { color:#4b5563; max-width:42rem; }`,
    `.grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); }`,
    `.card { padding:1rem; border:1px solid #e5e7eb; border-radius:0.75rem; background:white; box-shadow:0 1px 3px rgba(0,0,0,0.05); }`,
    `.tag { display:inline-block; margin-bottom:0.5rem; font-size:0.8rem; text-transform:uppercase; color:#2563eb; }`,
    `a { color:#2563eb; font-weight:600; text-decoration:none; }`
  ]
})
export class HomePageComponent {
  readonly service = inject(CmsService);
}
