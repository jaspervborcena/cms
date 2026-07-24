import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CmsService } from '../../services/cms.service';
import { Product } from '../../models/cms.models';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="products-page">
      <div class="page-header">
        <div>
          <h1>Products</h1>
          <p>Browse the products available for this store.</p>
        </div>
        <button class="btn" (click)="newProduct()">New Product</button>
      </div>

      <div *ngIf="!cms.activeStoreSignal()" class="empty-state">
        <h3>No store selected</h3>
        <p>Select or create a store to manage products.</p>
        <a routerLink="/dashboard" class="btn">Manage stores</a>
      </div>

      <div *ngIf="cms.activeStoreSignal() && products.length === 0" class="empty-state">
        <h3>No products yet</h3>
        <p>Create your first product for <strong>{{ cms.activeStoreSignal()?.name }}</strong>.</p>
        <button class="btn" (click)="newProduct()">Create product</button>
      </div>

      <div *ngIf="products.length > 0" class="product-grid">
        <article *ngFor="let product of products" class="product-card">
          <img *ngIf="product.imageUrl" [src]="product.imageUrl" alt="{{ product.name }}" />
          <div class="product-content">
            <h2>{{ product.name }}</h2>
            <p>{{ product.description || 'No product description available.' }}</p>
            <p class="price">{{ product.price ? '$' + product.price.toFixed(2) : 'Price not set' }}</p>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [
    `.products-page { padding: 1.5rem; }`,
    `.page-header { display:flex; justify-content:space-between; align-items:center; gap:1rem; margin-bottom:1.5rem; }`,
    `.product-grid { display:grid; gap:1rem; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); }`,
    `.product-card { border:1px solid #e5e7eb; border-radius:1rem; overflow:hidden; background:white; display:flex; flex-direction:column; }`,
    `.product-card img { width:100%; height:180px; object-fit:cover; }`,
    `.product-content { padding:1rem; }`,
    `.product-content h2 { margin:0 0 0.5rem 0; }`,
    `.product-content p { margin:0.5rem 0; color:#4b5563; }`,
    `.price { font-weight:700; margin-top:1rem; }`,
    `.btn { border:none; padding:0.75rem 1rem; border-radius:0.75rem; background:#1d4ed8; color:white; cursor:pointer; }`,
    `.empty-state { padding:2rem; background:#f8fafc; border:1px solid #e2e8f0; border-radius:1rem; }`
  ]
})
export class ProductsPageComponent implements OnInit {
  readonly cms = inject(CmsService);
  products: Product[] = [];

  ngOnInit(): void {
    const store = this.cms.activeStoreSignal();
    if (store) {
      this.cms.fetchProductsForStore(store.id).then((items) => (this.products = items));
    }
  }

  newProduct() {
    // placeholder; you can wire this to a product creation flow later
    alert('Add product creation UI here.');
  }
}
