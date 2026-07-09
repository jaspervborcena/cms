import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <p>© 2026 Tovrika. Built with Angular and Firebase.</p>
    </footer>
  `,
  styles: [
    `.footer { padding:1.25rem 1.5rem; background:#f3f4f6; color:#374151; border-top:1px solid #e5e7eb; margin-top:2rem; }`
  ]
})
export class FooterComponent {}
