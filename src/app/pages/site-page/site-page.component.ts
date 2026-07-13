import { Component, inject, ViewContainerRef, ViewChild, AfterViewInit } from '@angular/core';
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
    <div *ngIf="blog; else missing">
      <ng-container #templateContainer></ng-container>
    </div>

    <ng-template #missing>
      <p>Blog not found.</p>
    </ng-template>
  `,
  styles: []
})
export class SitePageComponent implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CmsService);
  @ViewChild('templateContainer', { read: ViewContainerRef }) templateContainer!: ViewContainerRef;
  
  pages: Page[] = [];
  publishedPosts = [] as any[];
  blog: any = null;
  themeCssUrl = '';

  constructor() {
    const blogId = this.route.snapshot.paramMap.get('blogId');
    if (!blogId) return;

    this.blog = this.service.blogsSignal().find((b) => b.id === blogId) ?? null;
    this.pages = this.service.pagesSignal().filter((page) => page.blogId === blogId);
    this.publishedPosts = this.service.postsSignal().filter((post) => post.blogId === blogId && post.status === 'published');
    this.themeCssUrl = this.service.getThemeCssUrl(this.blog?.theme);
  }

  ngAfterViewInit(): void {
    this.loadTemplate();
  }

  private loadTemplate(): void {
    if (!this.blog || !this.templateContainer) return;

    this.templateContainer.clear();
    const componentRef = this.templateContainer.createComponent(DefaultSiteTemplateComponent);

    // Pass data to the template component
    componentRef.instance.blog = this.blog;
    componentRef.instance.pages = this.pages;
    componentRef.instance.publishedPosts = this.publishedPosts;
    componentRef.instance.themeCssUrl = this.themeCssUrl;
  }
}
