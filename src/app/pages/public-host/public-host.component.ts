import { CommonModule } from '@angular/common';
import { Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-public-host',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="public-host" *ngIf="loaded; else loading">
      <link rel="stylesheet" [attr.href]="themeCssUrl" *ngIf="themeCssUrl">

      <div *ngIf="post && store; else missing">
        <header class="site-header">
          <div>
            <p class="brand">{{ store.name }}</p>
            <p class="tagline">{{ store.description || 'A simple public store powered by your CMS.' }}</p>
          </div>
          <nav class="site-nav">
            <a [href]="homeLink">Home</a>
          </nav>
        </header>

        <main class="site-main">
          <article class="post-detail">
            <h1>{{ post.title }}</h1>
            <p class="meta">{{ post.category }} · {{ post.publishedAt | date }}</p>
            <div [innerHTML]="post.content" class="content"></div>
            <a [href]="homeLink">Back to site</a>
          </article>
        </main>
      </div>
      <ng-template #missing>
        <p>Not found.</p>
      </ng-template>
    </section>

    <ng-template #loading>
      <p>Loading…</p>
    </ng-template>
  `
})
export class PublicHostComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cms = inject(CmsService);
  post: any = null;
  store: any = null;
  themeCssUrl = '';
  homeLink = '/';
  loaded = false;

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.paramMap;
    const routeHostSlug = params.get('hostSlug');
    const slug = params.get('slug');
    const hostnameStore = this.cms.hostStoreSignal() ?? this.cms.findStoreByHostName(window.location.hostname);
    const hostSlug = routeHostSlug || hostnameStore?.id;

    if (!hostSlug || !slug) {
      this.loaded = true;
      return;
    }

    const store = routeHostSlug ? this.cms.findStoreByHostSlug(hostSlug) : hostnameStore;
    if (!store) {
      this.loaded = true;
      return;
    }

    this.store = store;
    this.themeCssUrl = this.cms.getThemeCssUrl(store.theme);
    this.homeLink = this.storeHostHomeLink(store);

    // find published post by slug
    let post = this.cms.findPostBySlug(store.id, slug) ?? null;
    if (!post) {
      post = await this.cms.loadPostBySlug(store.id, slug);
    }

    if (post) {
      // ensure content is hydrated from Storage
      const hydrated = await this.cms.loadPostById(store.id, post.id);
      this.post = hydrated ?? post;
      this.loaded = true;
      return;
    }

    this.loaded = true;
  }

  private storeHostHomeLink(store: any): string {
    const host = this.cms.getPublicHostForStore(store);
    if (!host) {
      return `/site/${store.id}`;
    }

    return `https://${host}`;
  }
}
