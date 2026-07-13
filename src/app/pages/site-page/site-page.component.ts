import { Component, inject, ViewContainerRef, ViewChild, AfterViewInit, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Page } from '../../models/cms.models';
import { CmsService } from '../../services/cms.service';
import { DefaultSiteTemplateComponent } from '../default-site-template/default-site-template.component';

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [CommonModule, DefaultSiteTemplateComponent],
  template: `
    <div *ngIf="blog(); else missing">
      <ng-container #templateContainer></ng-container>
    </div>

    <ng-template #missing>
      <p>Blog not found.</p>
    </ng-template>
  `,
  styles: []
})
export class SitePageComponent implements AfterViewInit, OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CmsService);
  @ViewChild('templateContainer', { read: ViewContainerRef }) templateContainer!: ViewContainerRef;

  private blogId = signal<string | null>(null);
  
  blog = computed(() => {
    const id = this.blogId();
    if (!id) return null;
    return this.service.blogsSignal().find((b) => b.id === id) ?? null;
  });

  pages = computed(() => {
    const id = this.blogId();
    if (!id) return [] as Page[];
    return this.service.pagesSignal().filter((page) => page.blogId === id);
  });

  publishedPosts = computed(() => {
    const id = this.blogId();
    if (!id) return [] as any[];
    return this.service.postsSignal().filter((post) => post.blogId === id && post.status === 'published');
  });

  themeCssUrl = computed(() => {
    const b = this.blog();
    return this.service.getThemeCssUrl(b?.theme);
  });

  constructor() {
    const blogId = this.route.snapshot.paramMap.get('blogId');
    if (blogId) {
      this.blogId.set(blogId);
    }

    // Watch for changes to blog, pages, or posts and reload template
    effect(() => {
      const b = this.blog();
      const p = this.pages();
      const posts = this.publishedPosts();
      const cssUrl = this.themeCssUrl();
      
      if (b && this.templateContainer) {
        this.loadTemplate();
      }
    });
  }

  ngOnInit(): void {
    const blogId = this.blogId();
    if (blogId) {
      this.service.setActiveBlogById(blogId);
    }
  }

  ngAfterViewInit(): void {
    this.loadTemplate();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private loadTemplate(): void {
    const b = this.blog();
    if (!b || !this.templateContainer) return;

    this.templateContainer.clear();
    const componentRef = this.templateContainer.createComponent(DefaultSiteTemplateComponent);

    // Pass data to the template component
    componentRef.instance.blog = b;
    componentRef.instance.pages = this.pages();
    componentRef.instance.publishedPosts = this.publishedPosts();
    componentRef.instance.themeCssUrl = this.themeCssUrl();
  }
}
