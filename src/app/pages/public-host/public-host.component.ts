import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-public-host',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="public-host" *ngIf="loaded; else loading">
      <div *ngIf="post && blog; else missing">
        <header class="site-header">
          <div class="brand">{{ blog.name }}</div>
        </header>

        <main class="site-main">
          <article class="post-detail">
            <h1>{{ post.title }}</h1>
            <p class="meta">{{ post.category }} · {{ post.publishedAt | date }}</p>
            <div [innerHTML]="post.content" class="content"></div>
            <a [routerLink]="['/site', blog.id]">Back to site</a>
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
  blog: any = null;
  loaded = false;

  async ngOnInit(): Promise<void> {
    const params = this.route.snapshot.paramMap;
    const routeHostSlug = params.get('hostSlug');
    const slug = params.get('slug');
    const hostnameBlog = this.cms.findBlogByHostName(window.location.hostname);
    const hostSlug = routeHostSlug || hostnameBlog?.id;

    if (!hostSlug || !slug) {
      this.loaded = true;
      return;
    }

    const blog = routeHostSlug ? this.cms.findBlogByHostSlug(hostSlug) : hostnameBlog;
    if (!blog) {
      this.loaded = true;
      return;
    }

    this.blog = blog;
    // find published post by slug
    let post = this.cms.findPostBySlug(blog.id, slug) ?? null;
    if (!post) {
      post = await this.cms.loadPostBySlug(blog.id, slug);
    }

    if (post) {
      // ensure content is hydrated from Storage
      const hydrated = await this.cms.loadPostById(blog.id, post.id);
      this.post = hydrated ?? post;
      this.loaded = true;
      return;
    }

    this.loaded = true;
  }
}
