import { Component, inject, ViewContainerRef, ViewChild, AfterViewInit, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Page } from '../../models/cms.models';
import { CmsService } from '../../services/cms.service';

@Component({
  selector: 'app-site-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="store(); else missing">
      <ng-container #templateContainer></ng-container>
    </div>

    <ng-template #missing>
      <p>Store not found.</p>
    </ng-template>
  `,
  styles: []
})
export class SitePageComponent implements AfterViewInit, OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CmsService);
  @ViewChild('templateContainer', { read: ViewContainerRef }) templateContainer!: ViewContainerRef;

  private storeId = signal<string | null>(null);
  
  store = computed(() => {
    const id = this.storeId();
    if (!id) return null;
    return this.service.storesSignal().find((b) => b.id === id) ?? null;
  });

  pages = computed(() => {
    const id = this.storeId();
    if (!id) return [] as Page[];
    return this.service.pagesSignal().filter((page) => page.storeId === id);
  });

  publishedPosts = computed(() => {
    const id = this.storeId();
    if (!id) return [] as any[];
    return this.service.postsSignal().filter((post) => post.storeId === id && post.status === 'published');
  });

  themeCssUrl = computed(() => {
    const b = this.store();
    return this.service.getThemeCssUrl(b?.theme);
  });

  constructor() {
    const storeId = this.route.snapshot.paramMap.get('storeId');
    if (storeId) {
      this.storeId.set(storeId);
    }

    // Watch for changes to store, pages, or posts and reload template
    effect(() => {
      const b = this.store();
      const p = this.pages();
      const posts = this.publishedPosts();
      const cssUrl = this.themeCssUrl();
      
      if (b && this.templateContainer) {
          // diagnostic: log template config and current pages/posts when loading template
          console.log('Loading site template for store', b.id, { templateConfig: b.templateConfig, pages: this.pages(), publishedPosts: this.publishedPosts() });
          void this.loadTemplate();
      }
    });
  }

  ngOnInit(): void {
    const storeId = this.storeId();
    if (storeId) {
      this.service.setActiveStoreById(storeId);
    }
  }

  ngAfterViewInit(): void {
    void this.loadTemplate();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private async loadTemplate(): Promise<void> {
    const b = this.store();
    if (!b || !this.templateContainer) return;

    const { DefaultSiteTemplateComponent } = await import('../default-site-template/default-site-template.component');

    this.templateContainer.clear();
    const componentRef = this.templateContainer.createComponent(DefaultSiteTemplateComponent);

    // Pass data to the template component
    const instance = componentRef.instance as InstanceType<typeof DefaultSiteTemplateComponent>;
    instance.store = b;
    instance.pages = this.pages();
    instance.publishedPosts = this.publishedPosts();
    instance.themeCssUrl = this.themeCssUrl();
  }
}
