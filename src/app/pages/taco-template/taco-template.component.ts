import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store, Page, Post } from '../../models/cms.models';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-taco-template',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="taco-site-page">
      <link rel="stylesheet" [attr.href]="themeCssUrl">

      <!-- TOP NAVIGATION BAR -->
      <nav class="top-nav">
        <a [routerLink]="['/site', store?.id]" class="nav-link">Home</a>
        <ng-container *ngFor="let page of primaryMenuPages">
          <a [routerLink]="['/pages', page.slug]" class="nav-link">{{ page.title | uppercase }}</a>
        </ng-container>
        <a href="https://facebook.com" target="_blank" rel="noopener" class="social-link">f</a>
      </nav>

      <!-- LOGO SECTION -->
      <div class="logo-section">
        <div class="logo-container">
          <p class="logo-text">{{ store?.name || 'Store' }}</p>
        </div>
      </div>

      <!-- SECONDARY NAVIGATION BAR -->
      <nav class="secondary-nav">
        <a href="#" class="nav-icon">⌂</a>
        <a href="#" class="nav-item">{{ store?.category || 'EXPERIENCE' }}</a>
        <a href="#" class="nav-item">Trending</a>
        <a href="#" class="nav-item">Foods</a>
        <a href="#" class="nav-item">Gallery</a>
        <div class="search-container">
          <input type="search" placeholder="" class="search-input" />
          <span class="search-icon">🔍</span>
        </div>
      </nav>

      <!-- MAIN CONTENT -->
      <main class="taco-main">
        <!-- UPDATE BUTTON -->
        <div class="update-banner">
          <button class="update-btn">Update</button>
        </div>

        <!-- CONTENT GRID -->
        <div class="taco-grid">
          <!-- POSTS SECTION -->
          <section class="posts-section">
            <div class="section-header">
              <div class="section-title">
                <span class="rss-icon">📡</span>
                <h2>Recent Posts</h2>
              </div>
              <a [routerLink]="['/site', store?.id]" class="view-more">View More</a>
            </div>

            <!-- FEATURED POST WITH IMAGE -->
            <article class="featured-post" *ngIf="featuredPost">
              <img src="https://via.placeholder.com/400x300?text=Featured" alt="Featured" class="featured-image" />
              <div class="featured-content">
                <h3>{{ featuredPost.title }}</h3>
                <p class="post-meta">
                  <span class="author">Bwset</span>
                  <span class="date">{{ featuredPost.publishedAt | date: 'y MMMM d' }}</span>
                </p>
                <p class="excerpt">{{ featuredPost.excerpt }}</p>
                <a [routerLink]="['/site', store?.id, featuredPost.slug]" class="read-more-btn">Read More »</a>
              </div>
            </article>

            <!-- PAGINATION/POST NUMBER -->
            <div class="post-pagination" *ngIf="publishedPosts.length > 0">
              <span class="page-number">1</span>
            </div>
          </section>

          <!-- SIDEBAR -->
          <aside class="taco-sidebar">
            <!-- FACEBOOK WIDGET -->
            <div class="sidebar-widget">
              <h3 class="widget-title">Facebook</h3>
              <a href="https://facebook.com" target="_blank" rel="noopener" class="widget-link">Visit our Facebook Page</a>
            </div>

            <!-- COMMENTS WIDGET -->
            <div class="sidebar-widget">
              <h3 class="widget-title">Comments</h3>
              <p class="widget-text">No comments yet.</p>
            </div>

            <!-- RECENT POSTS WIDGET -->
            <div class="sidebar-widget">
              <h3 class="widget-title">Recent Posts</h3>
              <ul class="widget-list">
                <li *ngFor="let post of otherPosts">
                  <a [routerLink]="['/site', store?.id, post.slug]">{{ post.title }}</a>
                </li>
                <li *ngIf="otherPosts.length === 0" class="empty">No posts yet.</li>
              </ul>
            </div>
          </aside>
        </div>
      </main>

      <!-- FOOTER -->
      <footer class="taco-footer">
        <section class="footer-columns">
          <div class="footer-column">
            <h4>Featured Posts</h4>
            <ul>
              <li *ngFor="let post of publishedPosts.slice(0, 3)">
                <a [routerLink]="['/site', store?.id, post.slug]">{{ post.title }}</a>
              </li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>Recent Posts</h4>
            <ul>
              <li *ngFor="let post of publishedPosts.slice(0, 3)">
                <a [routerLink]="['/site', store?.id, post.slug]">{{ post.title }}</a>
              </li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>Recent in News</h4>
            <ul>
              <li *ngFor="let post of publishedPosts.slice(0, 3)">
                <a [routerLink]="['/site', store?.id, post.slug]">{{ post.title }}</a>
              </li>
            </ul>
          </div>
        </section>
        <div class="footer-bottom">
          <p>Copyright © 2026 {{ store?.name || 'Your Store' }}</p>
          <div class="footer-social">
            <a href="https://facebook.com" target="_blank">f</a>
            <a href="#" target="_blank">↑</a>
          </div>
        </div>
      </footer>
    </section>
  `,
  styles: [
    `.taco-site-page { margin: 0; padding: 0; min-height: 100vh; font-family: Arial, sans-serif; }`,
    
    `.top-nav { display: flex; gap: 1.5rem; align-items: center; background: #2b2b2b; padding: 0.75rem 1rem; justify-content: flex-end; }`,
    `.nav-link { color: #fff; text-decoration: none; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.nav-link:hover { text-decoration: underline; }`,
    `.social-link { color: #fff; font-size: 1.25rem; text-decoration: none; font-weight: bold; }`,
    
    `.logo-section { background: #f5f5f5; padding: 2rem 1rem; text-align: center; }`,
    `.logo-container { display: flex; justify-content: center; }`,
    `.logo-text { margin: 0; font-size: 3rem; font-weight: bold; color: #d32f2f; font-style: italic; }`,
    
    `.secondary-nav { display: flex; gap: 1.5rem; align-items: center; background: #1a1a1a; padding: 0.75rem 1rem; }`,
    `.nav-icon { color: #fff; text-decoration: none; font-size: 1.25rem; }`,
    `.nav-item { color: #fff; text-decoration: none; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; }`,
    `.nav-item:hover { color: #d32f2f; }`,
    `.search-container { margin-left: auto; display: flex; align-items: center; }`,
    `.search-input { padding: 0.5rem 0.75rem; border: none; border-radius: 0.25rem; width: 180px; }`,
    `.search-icon { color: #fff; margin-left: 0.5rem; cursor: pointer; }`,
    
    `.taco-main { padding: 0; }`,
    `.update-banner { padding: 1rem; background: #efefef; }`,
    `.update-btn { padding: 0.5rem 1rem; background: #2b2b2b; color: #fff; border: none; cursor: pointer; font-weight: 700; border-radius: 0.25rem; }`,
    
    `.taco-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; padding: 1.5rem; background: #fff; }`,
    
    `.posts-section { }`,
    `.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }`,
    `.section-title { display: flex; align-items: center; gap: 0.75rem; }`,
    `.rss-icon { font-size: 1.25rem; background: #d32f2f; color: #fff; padding: 0.5rem; border-radius: 0.25rem; }`,
    `.section-title h2 { margin: 0; font-size: 1.4rem; font-weight: 700; text-transform: uppercase; color: #1a1a1a; }`,
    `.view-more { color: #d32f2f; text-decoration: none; font-weight: 700; font-size: 0.9rem; }`,
    
    `.featured-post { display: grid; grid-template-columns: 300px 1fr; gap: 1.5rem; margin-bottom: 2rem; }`,
    `.featured-image { width: 100%; height: 250px; object-fit: cover; border-radius: 0.25rem; }`,
    `.featured-content h3 { margin: 0 0 0.75rem 0; font-size: 1.5rem; color: #1a1a1a; }`,
    `.post-meta { font-size: 0.85rem; color: #888; margin: 0 0 0.75rem 0; }`,
    `.post-meta .author { font-weight: 600; }`,
    `.post-meta .date { margin-left: 1rem; }`,
    `.excerpt { color: #666; line-height: 1.6; margin: 0 0 1rem 0; }`,
    `.read-more-btn { display: inline-block; background: #d32f2f; color: #fff; padding: 0.5rem 1rem; text-decoration: none; font-weight: 700; border-radius: 0.25rem; }`,
    `.read-more-btn:hover { background: #b71c1c; }`,
    
    `.post-pagination { margin-top: 1rem; }`,
    `.page-number { display: inline-flex; align-items: center; justify-content: center; width: 32px; height: 32px; background: #d32f2f; color: #fff; font-weight: 700; border-radius: 0.25rem; }`,
    
    `.taco-sidebar { display: grid; gap: 1.5rem; }`,
    `.sidebar-widget { background: #1a1a1a; padding: 1rem; border-radius: 0.25rem; }`,
    `.widget-title { margin: 0 0 0.75rem 0; color: #fff; font-size: 0.9rem; font-weight: 700; text-transform: uppercase; border-bottom: 2px solid #d32f2f; padding-bottom: 0.5rem; }`,
    `.widget-link { color: #d32f2f; text-decoration: none; }`,
    `.widget-link:hover { text-decoration: underline; }`,
    `.widget-text { margin: 0; color: #aaa; font-size: 0.9rem; }`,
    `.widget-list { list-style: none; margin: 0; padding: 0; }`,
    `.widget-list li { padding: 0.5rem 0; border-bottom: 1px solid #333; }`,
    `.widget-list li.empty { color: #888; font-size: 0.9rem; }`,
    `.widget-list a { color: #aaa; text-decoration: none; font-size: 0.9rem; }`,
    `.widget-list a:hover { color: #d32f2f; }`,
    
    `.taco-footer { background: #1a1a1a; padding: 2rem 1rem; color: #aaa; }`,
    `.footer-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; margin-bottom: 2rem; }`,
    `.footer-column h4 { margin: 0 0 1rem 0; color: #fff; font-size: 0.95rem; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #d32f2f; padding-bottom: 0.5rem; }`,
    `.footer-column ul { list-style: none; margin: 0; padding: 0; }`,
    `.footer-column li { padding: 0.5rem 0; }`,
    `.footer-column a { color: #aaa; text-decoration: none; font-size: 0.9rem; }`,
    `.footer-column a:hover { color: #d32f2f; }`,
    `.footer-bottom { border-top: 1px solid #333; padding-top: 1.5rem; display: flex; justify-content: space-between; align-items: center; }`,
    `.footer-bottom p { margin: 0; font-size: 0.9rem; }`,
    `.footer-social { display: flex; gap: 1rem; }`,
    `.footer-social a { color: #aaa; text-decoration: none; font-size: 1.25rem; font-weight: bold; }`,
    `.footer-social a:hover { color: #d32f2f; }`,
    
    `@media (max-width: 768px) { .taco-grid { grid-template-columns: 1fr; } .featured-post { grid-template-columns: 1fr; } .footer-columns { grid-template-columns: 1fr; } .secondary-nav { flex-wrap: wrap; } }`
  ]
})
export class TacoTemplateComponent {
  private readonly cms = inject(CmsService);

  @Input() store: Store | null = null;
  @Input() pages: Page[] = [];
  @Input() publishedPosts: Post[] = [];
  @Input() themeCssUrl = '';

  get primaryMenuPages(): Page[] {
    return this.cms.getPrimaryMenuPages(this.pages);
  }

  get featuredPost(): Post | null {
    return this.publishedPosts.length > 0 ? this.publishedPosts[0] : null;
  }

  get otherPosts(): Post[] {
    return this.publishedPosts.length > 1 ? this.publishedPosts.slice(1, 4) : [];
  }
}
