import { Component, inject } from '@angular/core';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CmsService } from '../../services/cms.service';
import { Blog, Page, Post } from '../../models/cms.models';
import { DefaultSiteTemplateComponent } from '../default-site-template/default-site-template.component';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, DefaultSiteTemplateComponent],
  template: `
    <ng-container *ngIf="blog; else genericLanding">
      <app-default-site-template
        [blog]="blog"
        [pages]="pages"
        [publishedPosts]="publishedPosts"
        [themeCssUrl]="themeCssUrl"
      ></app-default-site-template>
    </ng-container>

    <ng-template #genericLanding>
      <section *ngIf="!focusPlans" class="hero">
        <p class="eyebrow">Tovrika CMS</p>
        <h1>Build your app with a polished editorial experience.</h1>
        <p class="lead">Launch a public marketing site, then switch to a protected dashboard for posts, pages, and workflow tools.</p>
        <div class="actions">
          <a routerLink="/register" class="btn primary">Register</a>
          <a routerLink="/login" class="btn secondary">Login</a>
        </div>
      </section>

      <section *ngIf="!focusPlans" class="grid">
      <article class="card featured">
        <h2>Create an account</h2>
        <p>Unlock the full potential of Tovrika CMS by registering today. Once you sign up, you gain access to a protected dashboard where you can manage posts, pages, and workflows with ease. Our editorial tools are designed to help you draft, review, and publish content seamlessly, while keeping everything organized in one place. Registration is the gateway to building a professional online presence that grows with your brand.</p>
      </article>
      <article class="card featured">
        <h2>Build your site</h2>
        <p>Launch a polished editorial site tailored to your vision. With Tovrika CMS, you can design layouts, create posts, and structure pages using Angular signals for instant updates. Your site evolves in real time as you edit, ensuring a smooth and responsive experience for both you and your audience. And when you’re ready, connect your own domain to showcase your brand with authority — no compromises, just a site that feels truly yours.</p>
      </article>
      <article class="card featured">
        <h2>Sell with your brand</h2>
        <p>Go beyond a simple website — transform your CMS into a complete storefront. Tovrika E‑commerce lets you add product listings, manage inventory, and process orders directly from your dashboard. With Firebase powering authentication, storage, and Firestore, you can securely handle customer accounts and transactions. Every sale reflects your brand identity, giving you the freedom to grow your business without relying on third-party marketplaces. This is where Tovrika becomes more than a CMS — it becomes your commerce engine.</p>
      </article>
    </section>

    <section id="plans" class="plans" [class.focused]="focusPlans">
      <h2>💳 Plans</h2>
      <div class="plans-grid">
        <article class="plan card">
          <h3>Free Trial</h3>
          <p class="muted">Get started at no cost.</p>
          <ul>
            <li>1‑month free access to the full CMS dashboard</li>
            <li>Create posts, pages, and explore themes</li>
            <li>Firebase Auth for secure login</li>
            <li>Real‑time updates with Angular signals</li>
            <li>Perfect for testing your brand’s editorial workflow</li>
          </ul>
        </article>

        <article class="plan card">
          <h3>Basic CMS Plan — <strong>$0.99/month</strong></h3>
          <p class="muted">Affordable publishing for growing creators.</p>
          <ul>
            <li>Up to <strong>50 pages</strong> per month</li>
            <li>Up to <strong>100 posts</strong> per month</li>
            <li>Media uploads via Firebase Storage</li>
            <li>Sidebar widgets for popular/recent posts</li>
            <li>Connect your own domain when ready</li>
            <li>Lightweight analytics to track engagement</li>
          </ul>
        </article>
      </div>
    </section>
  `,
  styles: [
    `.hero { padding: 3rem 0; max-width: 48rem; }`,
    `.eyebrow { text-transform: uppercase; letter-spacing: 0.2em; color: #2563eb; font-weight: 700; }`,
    `h1 { font-size: 2.6rem; margin: 0.2rem 0 0.8rem; }`,
    `.lead { font-size: 1.1rem; color: #4b5563; line-height: 1.7; }`,
    `.actions { display: flex; gap: 1rem; margin-top: 1.5rem; }`,
    `.btn { padding: 0.8rem 1.15rem; border-radius: 999px; text-decoration: none; font-weight: 700; }`,
    `.primary { background: #111827; color: white; }`,
    `.secondary { background: #e5e7eb; color: #111827; }`,
    `.grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); margin-top: 1.5rem; }`,
    `.card { padding: 1.5rem; border: 1px solid #e5e7eb; border-radius: 1rem; background: white; box-shadow: 0 18px 40px rgba(15, 23, 42, 0.05); }`,
    `.card h2 { margin-top: 0; font-size: 1.2rem; color: #111827; }`,
    `.card p { margin: 0.75rem 0 0; color: #4b5563; line-height: 1.7; }`,
    `.featured { background: linear-gradient(180deg, rgba(59,130,246,0.09), white 100%); border-color: #bfdbfe; }`
    ,`.plans { margin-top: 2.5rem; padding: 1.5rem 0; }
    .plans.focused { max-width:900px; margin:2.5rem auto; padding:2rem; background:white; border-radius:12px; box-shadow:0 20px 50px rgba(15,23,42,0.08); }
    .plans-grid { display:grid; gap:1rem; grid-template-columns:1fr 1fr; }
    .plan ul { margin:0.75rem 0 0; padding-left:1.25rem; color:#374151; }
    .plan h3 { margin:0 0 0.35rem 0; }
    .muted { color:#6b7280; margin:0 0 0.5rem 0; }
    @media (max-width:880px) { .plans-grid { grid-template-columns:1fr; } }`
  ]
})
export class LandingComponent {
  readonly auth = inject(AuthService);
  readonly cms = inject(CmsService);
  private route = inject(ActivatedRoute);
  focusPlans = false;

  blog: Blog | null = null;
  pages: Page[] = [];
  publishedPosts: Post[] = [];
  themeCssUrl = '';

  constructor() {
    this.route.fragment.subscribe((f) => {
      this.focusPlans = f === 'plans';
      if (this.focusPlans) {
        // scroll plans into view when focused
        setTimeout(() => {
          const el = document.getElementById('plans');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
      }
    });

    const blog = this.cms.findBlogByHostName(window.location.hostname);
    if (blog) {
      this.blog = blog;
      this.pages = this.cms.pagesSignal();
      this.publishedPosts = this.cms.postsSignal().filter((post) => post.blogId === blog.id && post.status === 'published');
      this.themeCssUrl = this.cms.getThemeCssUrl(blog.theme);
    }
  }
}

