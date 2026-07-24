import { Injectable, computed, inject, signal } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, where, getDocs, addDoc, setDoc, doc, getDoc, updateDoc, deleteDoc, limit } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadString } from '@angular/fire/storage';
import { catchError, map, of } from 'rxjs';
import { Page, Post, Store, TemplateConfig, NavigationItem, GlobalThemeSettings } from '../models/cms.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly auth = inject(AuthService);

  readonly postsSignal = signal<Post[]>([]);
  readonly pagesSignal = signal<Page[]>([]);
  readonly storesSignal = signal<Store[]>([]);
  readonly blogsLoadedSignal = signal(false);
  readonly activeStoreSignal = signal<Store | null>(null);
  readonly draftSignal = signal<Post | null>(null);
  readonly previewSignal = signal<Post | null>(null);
  readonly globalThemeSignal = signal<GlobalThemeSettings | null>(null);
  readonly hostStoreSignal = computed(() => this.findStoreByHostName(this.getCurrentHostname()));

  readonly filteredPostsSignal = computed(() => {
    const store = this.activeStoreSignal();
    if (!store) return [] as Post[];
    return this.postsSignal().filter((post) => post.storeId === store.id);
  });

  readonly publishedPostsSignal = computed(() => {
    const store = this.activeStoreSignal();
    if (!store) return [] as Post[];
    return this.postsSignal().filter((post) => post.storeId === store.id && post.status === 'published');
  });

  private readonly primaryPageOrder = ['data-privacy', 'about'];

  isPrimaryMenuPage(page: Page): boolean {
    return this.primaryPageOrder.includes(page.slug.toLowerCase());
  }

  getPrimaryMenuPages(pages: Page[]): Page[] {
    return pages
      .filter((page) => this.isPrimaryMenuPage(page))
      .sort((a, b) => this.primaryPageOrder.indexOf(a.slug.toLowerCase()) - this.primaryPageOrder.indexOf(b.slug.toLowerCase()));
  }

  getSecondaryMenuPages(pages: Page[]): Page[] {
    return pages.filter((page) => !this.isPrimaryMenuPage(page));
  }

  readonly draftPostsSignal = computed(() => {
    const store = this.activeStoreSignal();
    if (!store) return [] as Post[];
    return this.postsSignal().filter((post) => post.storeId === store.id && post.status === 'draft');
  });

  readonly popularPostsSignal = computed(() => [...this.postsSignal()].sort((a, b) => b.views - a.views).slice(0, 3));

  readonly recentPostsSignal = computed(() =>
    [...this.postsSignal()]
      .sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? '').getTime() - new Date(a.publishedAt ?? a.createdAt ?? '').getTime())
      .slice(0, 3)
  );

  readonly storePagesSignal = computed(() => {
    const store = this.activeStoreSignal();
    if (!store) return [] as Page[];
    return this.pagesSignal().filter((page) => page.storeId === store.id);
  });

  readonly hostBlogPagesSignal = computed(() => {
    const store = this.hostStoreSignal();
    if (!store) return [] as Page[];
    return this.pagesSignal().filter((page) => page.storeId === store.id);
  });

  constructor() {
    this.loadBlogs();
    this.loadPosts();
    this.loadPages();
  }

  readonly defaultTheme = 'modern';
  readonly defaultTemplate = 'default';

  // Root public domain used for generated store subdomains
  private readonly rootPublicDomain = 'gameoffortunes.com';

  private loadBlogs(): void {
    const blogsCollection = collection(this.firestore, 'stores');
    collectionData(query(blogsCollection, orderBy('createdAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) =>
          items.map((item) => ({
            id: String(item['id'] ?? ''),
            uid: item['uid'] ? String(item['uid']) : undefined,
            name: String(item['name'] ?? 'Untitled store'),
            slug: item['slug'] ? String(item['slug']) : this.slugify(String(item['name'] ?? '')),
            description: item['description'] ? String(item['description']) : undefined,
            category: item['category'] ? String(item['category']) : undefined,
            ownerUid: item['ownerUid'] ? String(item['ownerUid']) : null,
            createdAt: item['createdAt'] ? String(item['createdAt']) : undefined,
            updatedAt: item['updatedAt'] ? String(item['updatedAt']) : undefined,
            theme: item['theme'] ? String(item['theme']) : this.defaultTheme,
            template: item['template'] ? String(item['template']) : this.defaultTemplate,
            domain: item['domain'] ? String(item['domain']) : undefined,
            templateConfig: item['templateConfig'] ? (item['templateConfig'] as TemplateConfig) : undefined
          } as Store))
        ),
        catchError(() => of([] as Store[]))
      )
      .subscribe((stores) => {
        this.storesSignal.set(stores);
        this.blogsLoadedSignal.set(true);
      });
  }

  async createStore(data: { name: string; description?: string; category?: string; ownerUid?: string | null; slug?: string | null }): Promise<Store> {
    const now = new Date().toISOString();
    const requestedSlug = (data.slug ?? '').trim();

    const store: any = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      name: data.name,
      description: data.description,
      category: data.category,
      ownerUid: data.ownerUid ?? null,
      createdAt: now,
      updatedAt: now,
      theme: this.defaultTheme,
      template: this.defaultTemplate
    };

    if (requestedSlug) {
      store.slug = this.slugify(requestedSlug);
    }

    const blogsCollection = collection(this.firestore, 'stores');
    const docRef = await addDoc(blogsCollection, store as any);
    const newBlog: Store = { ...(store as Store), id: docRef.id, slug: store.slug ?? docRef.id };

    // set slug and default domain to a subdomain of the public root domain
    const defaultDomain = `${newBlog.slug}.${this.rootPublicDomain}`;
    await setDoc(docRef, { slug: newBlog.slug, domain: defaultDomain, template: this.defaultTemplate }, { merge: true });
    newBlog.domain = defaultDomain;
    newBlog.template = this.defaultTemplate;
    this.activeStoreSignal.set(newBlog);
    this.storesSignal.set([...this.storesSignal(), newBlog]);

    await this.createPage({
      title: 'About',
      slug: 'about',
      excerpt: 'Learn more about this store and the story behind the brand.',
      content: `
<h2>About</h2>
<p>Welcome to ${newBlog.name}! This is your custom store site powered by our CMS. Use this page to tell visitors who you are, what you do, and why your content matters.</p>
<p>Update the title and content as needed to match your brand and personality.</p>
`,
      storeId: newBlog.id
    });

    await this.createPage({
      title: 'Data Privacy',
      slug: 'data-privacy',
      excerpt: 'Understand how this site uses data and protects your privacy.',
      content: `
<h2>Data Privacy</h2>
<p>We respect your privacy. This site collects only the information needed to deliver content and improve your experience.</p>
<p>We do not sell your data, and we handle visitor information responsibly according to applicable privacy rules.</p>
`,
      storeId: newBlog.id
    });

    return newBlog;
  }

  async updateStore(storeId: string, data: Partial<Pick<Store, 'name' | 'slug' | 'description' | 'category' | 'domain' | 'ownerUid'>>): Promise<Store | null> {
    const store = this.storesSignal().find((item) => item.id === storeId);
    if (!store) return null;

    const updatedBlog: Store = {
      ...store,
      ...data,
      slug: data.slug ? this.slugify(data.slug) : store.slug,
      theme: this.defaultTheme,
      template: this.defaultTemplate,
      updatedAt: new Date().toISOString()
    };

    const blogDoc = doc(this.firestore, `stores/${storeId}`);
    await updateDoc(blogDoc, updatedBlog as any);

    const updatedBlogs = this.storesSignal().map((item) => (item.id === storeId ? updatedBlog : item));
    this.storesSignal.set(updatedBlogs);
    if (this.activeStoreSignal()?.id === storeId) {
      this.activeStoreSignal.set(updatedBlog);
    }

    return updatedBlog;
  }

  async deleteStore(storeId: string): Promise<void> {
    const blogDoc = doc(this.firestore, `stores/${storeId}`);
    await deleteDoc(blogDoc);

    const remaining = this.storesSignal().filter((item) => item.id !== storeId);
    this.storesSignal.set(remaining);
    if (this.activeStoreSignal()?.id === storeId) {
      this.activeStoreSignal.set(null);
    }
  }

  async deleteStoreWithCascade(storeId: string): Promise<void> {
    try {
      // Delete all posts in the store
      const postsCollection = collection(this.firestore, 'posts');
      const postsQuery = query(postsCollection, where('storeId', '==', storeId));
      const postsSnapshot = await getDocs(postsQuery);
      for (const postDoc of postsSnapshot.docs) {
        await deleteDoc(postDoc.ref);
      }

      // Delete all pages related to this store
      const allPages = this.pagesSignal();
      const blogPages = allPages.filter((p) => p.storeId === storeId);
      for (const page of blogPages) {
        if (page.id) {
          const pageDocRef = doc(this.firestore, `pages/${page.id}`);
          await deleteDoc(pageDocRef);
        }
      }

      // Delete the store itself
      const blogDoc = doc(this.firestore, `stores/${storeId}`);
      await deleteDoc(blogDoc);

      // Update signals
      const remaining = this.storesSignal().filter((item) => item.id !== storeId);
      this.storesSignal.set(remaining);

      const remainingPosts = this.postsSignal().filter((item) => item.storeId !== storeId);
      this.postsSignal.set(remainingPosts);

      const remainingPages = allPages.filter((p) => p.storeId !== storeId);
      this.pagesSignal.set(remainingPages);

      if (this.activeStoreSignal()?.id === storeId) {
        this.activeStoreSignal.set(null);
      }
    } catch (error) {
      console.error('Error deleting store with cascade:', error);
      throw error;
    }
  }

  setActiveBlogById(storeId: string): void {
    const found = this.storesSignal().find((b) => b.id === storeId);
    if (found) {
      this.activeStoreSignal.set(found);
      this.loadPostsForBlog(found.id);
      this.ensureStoreHasTheme(found.id).catch(() => {});
      return;
    }

    const blogDocRef = doc(this.firestore, `stores/${storeId}`);
    getDoc(blogDocRef)
      .then((snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as Record<string, unknown>;
        const store: Store = {
          id: snapshot.id,
          uid: data['uid'] ? String(data['uid']) : undefined,
          name: String(data['name'] ?? 'Untitled store'),
          slug: data['slug'] ? String(data['slug']) : this.slugify(String(data['name'] ?? '')),
          description: data['description'] ? String(data['description']) : undefined,
          category: data['category'] ? String(data['category']) : undefined,
          ownerUid: data['ownerUid'] ? String(data['ownerUid']) : null,
          createdAt: data['createdAt'] ? String(data['createdAt']) : undefined,
          updatedAt: data['updatedAt'] ? String(data['updatedAt']) : undefined,
          theme: data['theme'] ? String(data['theme']) : this.defaultTheme,
          template: data['template'] ? String(data['template']) : this.defaultTemplate,
          domain: data['domain'] ? String(data['domain']) : undefined,
          templateConfig: data['templateConfig'] ? (data['templateConfig'] as TemplateConfig) : undefined
        } as Store;

        this.activeStoreSignal.set(store);
        this.storesSignal.set([...this.storesSignal(), store]);
        this.loadPostsForBlog(store.id);
        this.ensureStoreHasTheme(store.id).catch(() => {});
      })
      .catch(() => {});
  }

  private async loadPostsForBlog(storeId: string): Promise<void> {
    const postsCollection = collection(this.firestore, 'posts');
    const postsQuery = query(postsCollection, where('storeId', '==', storeId));
    collectionData(postsQuery, { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) =>
          items
            .map((item) => ({ ...this.normalizePost(item), storeId } as Post))
            .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? '').getTime() - new Date(a.updatedAt ?? a.createdAt ?? '').getTime())
        ),
        catchError(() => of([] as Post[]))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  /**
   * Fetch posts for a store directly from Firestore (no Storage hydration).
   * If `limitCount` is provided and > 0, the query will be limited.
   */
  async fetchPostsForBlog(storeId: string, limitCount?: number): Promise<Post[]> {
    const postsCollection = collection(this.firestore, 'posts');
    const q = query(postsCollection, where('storeId', '==', storeId));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const posts = snapshot.docs
      .map((docSnap) => ({ ...this.normalizePost({ ...docSnap.data(), id: docSnap.id }), storeId } as Post))
      .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? '').getTime() - new Date(a.updatedAt ?? a.createdAt ?? '').getTime());

    const results = limitCount && limitCount > 0 ? posts.slice(0, limitCount) : posts;
    const others = this.postsSignal().filter((p) => p.storeId !== storeId);
    this.postsSignal.set([...results, ...others]);
    return results;
  }

  /**
   * Fetch a post document by id from Firestore (no Storage hydration).
   */
  async fetchPostDocById(storeId: string, postId: string): Promise<Post | null> {
    const postDoc = doc(this.firestore, `posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;

    const post = { ...this.normalizePost({ ...snapshot.data(), id: snapshot.id }), storeId } as Post;
    if (post.storeId !== storeId) return null;
    // update in-memory signal but do not hydrate content from storage
    this.postsSignal.set([post, ...this.postsSignal().filter((p) => p.id !== post.id)]);
    return post;
  }

  async createPost(storeId: string, data: { title: string; excerpt?: string; content?: string; category?: string; status?: 'draft' | 'published' }): Promise<Post> {
    const now = new Date().toISOString();
    const status = data.status ?? 'draft';
    await this.ensureStoreHasTheme(storeId);

    const postMeta: any = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: data.excerpt ?? '',
      category: data.category ?? 'Uncategorized',
      storeId,
      status,
      views: 0,
      createdAt: now,
      updatedAt: now
    };

    if (status === 'published') {
      postMeta.publishedAt = now;
    }

    const postsCollection = collection(this.firestore, 'posts');
    const docRef = await addDoc(postsCollection, postMeta as any);

    const content = data.content ?? '';
    let contentUrl: string | undefined;

    if (content.trim().length) {
      contentUrl = await this.uploadPostContent(docRef.id, content);
      const postDoc = doc(this.firestore, `posts/${docRef.id}`);
      await updateDoc(postDoc, { contentUrl } as any);
    }

    const newPost: Post = { ...(postMeta as Post), id: docRef.id, content, contentUrl };
    this.postsSignal.set([newPost, ...this.postsSignal()]);
    return newPost;
  }

  async updatePost(storeId: string, postId: string, data: Partial<Pick<Post, 'title' | 'excerpt' | 'content' | 'category' | 'status' | 'publishedAt'>>): Promise<Post | null> {
    const post = this.postsSignal().find((item) => item.id === postId && item.storeId === storeId);
    if (!post) return null;

    const now = new Date().toISOString();
    const updated: Post = {
      ...post,
      ...data,
      publishedAt: data.status === 'published' ? data.publishedAt ?? now : post.publishedAt,
      createdAt: post.createdAt ?? new Date().toISOString(),
      updatedAt: now,
      content: data.content ?? post.content,
      contentUrl: post.contentUrl
    };

    const updateData: any = {
      title: updated.title,
      excerpt: updated.excerpt,
      category: updated.category,
      status: updated.status,
      publishedAt: updated.publishedAt,
      updatedAt: updated.updatedAt
    };

    if (data.content !== undefined) {
      const content = data.content ?? '';
      updated.content = content;

      if (content.trim().length) {
        updated.contentUrl = await this.uploadPostContent(postId, content);
        updateData.contentUrl = updated.contentUrl;
      } else {
        updated.contentUrl = undefined;
        updateData.contentUrl = null;
      }
    } else if (updated.contentUrl !== undefined) {
      updateData.contentUrl = updated.contentUrl;
    }

    // Remove keys with undefined values to avoid Firestore rejecting the update
    Object.keys(updateData).forEach((k) => {
      if (updateData[k] === undefined) delete updateData[k];
    });

    const postDoc = doc(this.firestore, `posts/${postId}`);
    if (Object.keys(updateData).length > 0) {
      await updateDoc(postDoc, updateData as any);
    }

    this.postsSignal.set(this.postsSignal().map((item) => (item.id === postId ? updated : item)));
    return updated;
  }

  async deletePost(storeId: string, postId: string): Promise<void> {
    const postDoc = doc(this.firestore, `posts/${postId}`);
    await deleteDoc(postDoc);
    this.postsSignal.set(this.postsSignal().filter((item) => item.id !== postId));
  }

  async publishPost(storeId: string, postId: string): Promise<Post | null> {
    const post = this.postsSignal().find((item) => item.id === postId && item.storeId === storeId);
    if (!post) return null;

    const publishedAt = new Date().toISOString();
    const updated: Post = { ...post, status: 'published', publishedAt, updatedAt: publishedAt };

    const postDoc = doc(this.firestore, `posts/${postId}`);
    await updateDoc(postDoc, { status: updated.status, publishedAt: updated.publishedAt, updatedAt: updated.updatedAt } as any);

    this.postsSignal.set(this.postsSignal().map((item) => (item.id === postId ? updated : item)));
    return updated;
  }

  async loadPreviewPost(storeId: string, postId: string): Promise<Post | null> {
    const existing = this.postsSignal().find((item) => item.id === postId && item.storeId === storeId);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.previewSignal.set(hydrated);
      return hydrated;
    }

    const postDoc = doc(this.firestore, `posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as Record<string, unknown>;
    const post = await this.hydratePostContent({ ...this.normalizePost({ ...data, id: snapshot.id }), storeId });
    if (post.storeId !== storeId) return null;
    this.previewSignal.set(post);
    return post;
  }

  getPostById(storeId: string, postId: string): Post | undefined {
    return this.postsSignal().find((item) => item.id === postId && item.storeId === storeId);
  }

  async loadPostById(storeId: string, postId: string): Promise<Post | null> {
    const existing = this.getPostById(storeId, postId);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.postsSignal.set(this.postsSignal().map((item) => (item.id === hydrated.id ? hydrated : item)));
      return hydrated;
    }

    const postDoc = doc(this.firestore, `posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;

    const post = await this.hydratePostContent({ ...this.normalizePost({ ...snapshot.data(), id: snapshot.id }), storeId });
    if (post.storeId !== storeId) return null;
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  async loadPostBySlug(storeId: string, slug: string): Promise<Post | null> {
    const existing = this.findPostBySlug(storeId, slug);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.postsSignal.set(this.postsSignal().map((item) => (item.id === hydrated.id ? hydrated : item)));
      return hydrated;
    }

    const postsCollection = collection(this.firestore, 'posts');
    const slugQuery = query(postsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(slugQuery);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs.find((s) => (s.data() as Record<string, unknown>)['storeId'] === storeId);
    if (!docSnap) return null;

    const post = await this.hydratePostContent({ ...this.normalizePost({ ...docSnap.data(), id: docSnap.id }), storeId });
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  findPostBySlug(storeId: string, slug: string): Post | undefined {
    return this.postsSignal().find((item) => item.storeId === storeId && item.slug === slug);
  }

  findStoreByHostSlug(hostSlug: string): Store | undefined {
    const normalized = hostSlug.toLowerCase();
    const byDomain = this.storesSignal().find((b) => b.domain && b.domain.replace(/^(https?:\/\/)?/, '').toLowerCase() === normalized);
    if (byDomain) return byDomain;

    const byId = this.storesSignal().find((b) => b.id === hostSlug || b.id.toLowerCase() === normalized);
    if (byId) return byId;

    const bySlug = this.storesSignal().find((b) => (b.slug ? b.slug.toLowerCase() === normalized : false));
    if (bySlug) return bySlug;

    const byName = this.storesSignal().find((b) => this.slugify(b.name || '') === normalized);
    if (byName) return byName;

    return undefined;
  }

  findStoreByHostName(hostname: string): Store | undefined {
    const normalized = hostname.toLowerCase().trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');

    // Exact domain match first for configured custom or generated domains.
    const byDomain = this.storesSignal().find(
      (b) => b.domain && b.domain.trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '').toLowerCase() === normalized
    );
    if (byDomain) return byDomain;

    const parts = normalized.split('.');
    if (parts.length < 3) {
      return undefined;
    }

    const rootDomain = parts.slice(-2).join('.');
    if (rootDomain !== this.rootPublicDomain) {
      return undefined;
    }

    let slug: string | undefined;
    if (parts.length === 3) {
      slug = parts[0];
    } else if (parts.length === 4 && parts[0] === 'www') {
      slug = parts[1];
    }

    if (!slug) {
      return undefined;
    }

    return this.findStoreByHostSlug(slug);
  }

  private normalizeHost(host: string): string {
    return host.trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private getPostContentPath(postId: string): string {
    return `posts/${postId}.html`;
  }

  private getPageContentPath(pageId: string): string {
    return `pages/${pageId}.html`;
  }

  private async uploadPostContent(postId: string, content: string): Promise<string> {
    const storageRef = ref(this.storage, this.getPostContentPath(postId));
    await uploadString(storageRef, content, 'raw', { contentType: 'text/html' });
    return getDownloadURL(storageRef);
  }

  private async uploadPageContent(pageId: string, content: string): Promise<string> {
    const storageRef = ref(this.storage, this.getPageContentPath(pageId));
    await uploadString(storageRef, content, 'raw', { contentType: 'text/html' });
    return getDownloadURL(storageRef);
  }

  private async loadPostContent(contentUrl: string): Promise<string> {
    const response = await fetch(contentUrl);
    if (!response.ok) {
      return '';
    }
    return await response.text();
  }

  private async hydratePostContent(post: Post): Promise<Post> {
    if (post.content) {
      return post;
    }

    if (!post.contentUrl) {
      return { ...post, content: '' };
    }

    const content = await this.loadPostContent(post.contentUrl).catch(() => '');
    return { ...post, content };
  }

  private async ensureStoreHasTheme(storeId: string): Promise<void> {
    const store = this.storesSignal().find((item) => item.id === storeId);
    if (!store || store.theme) {
      return;
    }

    await this.setStoreTheme(storeId, this.defaultTheme);
  }

  private isLocalDevelopmentHost(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    return ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(hostname);
  }

  private getLocalPreviewUrl(path: string): string {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//127.0.0.1${port}${path}`;
  }

  private getCurrentOrigin(): string {
    return window.location.origin.replace(/\/$/, '');
  }

  private getCurrentHostname(): string {
    return window.location.hostname.toLowerCase().trim();
  }

  getPublicHostForStore(store: Store): string {
    if (store.domain) {
      let host = this.normalizeHost(store.domain);
      if (!host) {
        return window.location.host;
      }

      if (!host.includes('.') && !host.includes(':')) {
        host = `${host}.${this.rootPublicDomain}`;
      }

      return host;
    }

    if (store.slug) {
      return `${this.normalizeHost(store.slug)}.${this.rootPublicDomain}`;
    }

    return window.location.host;
  }

  private buildPublicUrl(store: Store, path: string): string {
    const host = this.getPublicHostForStore(store);
    return `https://${host}${path}`;
  }

  getPublicSiteUrl(store: Store): string {
    if (!store) {
      return this.getCurrentOrigin();
    }

    if (this.isLocalDevelopmentHost() && !store.domain) {
      return this.getLocalPreviewUrl(`/site/${store.id}`);
    }

    return this.buildPublicUrl(store, '');
  }

  getPublicPostUrl(store: Store, postSlug: string): string {
    if (!store) {
      return this.getCurrentOrigin();
    }

    if (this.isLocalDevelopmentHost() && !store.domain) {
      return this.getLocalPreviewUrl(`/site/${store.id}/${postSlug}`);
    }

    return this.buildPublicUrl(store, `/${postSlug}`);
  }

  getThemeCssUrl(themeId?: string): string {
    const id = themeId || this.defaultTheme;
    return `/assets/themes/${id}/theme.css`;
  }

  async loadPageById(pageId: string): Promise<Page | null> {
    const existing = this.pagesSignal().find((item) => item.id === pageId);
    if (existing) {
      return existing;
    }

    const pageDoc = doc(this.firestore, `pages/${pageId}`);
    const snapshot = await getDoc(pageDoc);
    if (!snapshot.exists()) return null;

    const page = this.normalizePage({ ...snapshot.data(), id: snapshot.id });
    this.pagesSignal.set([page, ...this.pagesSignal()]);
    return page;
  }

  async createPage(data: { title: string; slug?: string; excerpt?: string; content?: string; storeId?: string }): Promise<Page> {
    const now = new Date().toISOString();
    const page: Omit<Page, 'id'> = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      title: data.title,
      slug: data.slug ? this.slugify(data.slug) : this.slugify(data.title),
      excerpt: data.excerpt ?? '',
      content: data.content ?? '',
      storeId: data.storeId,
      createdAt: now,
      updatedAt: now
    };

    const pagesCollection = collection(this.firestore, 'pages');
    const docRef = await addDoc(pagesCollection, page as any);
    let contentUrl: string | undefined;
    const content = page.content ?? '';

    if (content.trim().length) {
      contentUrl = await this.uploadPageContent(docRef.id, content);
      const pageDoc = doc(this.firestore, `pages/${docRef.id}`);
      await updateDoc(pageDoc, { contentUrl } as any);
    }

    const newPage: Page = { ...(page as Page), id: docRef.id, contentUrl };
    this.pagesSignal.set([newPage, ...this.pagesSignal()]);
    return newPage;
  }

  async updatePage(pageId: string, data: Partial<Pick<Page, 'title' | 'slug' | 'excerpt' | 'content'>>): Promise<Page | null> {
    const page = this.pagesSignal().find((item) => item.id === pageId);
    if (!page) return null;

    const updatedPage: Page = {
      ...page,
      ...data,
      slug: data.slug ? this.slugify(data.slug) : page.slug,
      updatedAt: new Date().toISOString()
    };

    const updateData: any = {
      title: updatedPage.title,
      slug: updatedPage.slug,
      excerpt: updatedPage.excerpt,
      updatedAt: updatedPage.updatedAt
    };

    if (data.content !== undefined) {
      const content = data.content ?? '';
      updatedPage.content = content;

      if (content.trim().length) {
        const contentUrl = await this.uploadPageContent(pageId, content);
        updateData.contentUrl = contentUrl;
        updatedPage.contentUrl = contentUrl;
      } else {
        updateData.contentUrl = null;
        updatedPage.contentUrl = undefined;
      }
    } else if (updatedPage.contentUrl !== undefined) {
      updateData.contentUrl = updatedPage.contentUrl;
    }

    const pageDoc = doc(this.firestore, `pages/${pageId}`);
    await updateDoc(pageDoc, updateData as any);
    this.pagesSignal.set(this.pagesSignal().map((item) => (item.id === pageId ? updatedPage : item)));
    return updatedPage;
  }

  async deletePage(pageId: string): Promise<void> {
    const pageDoc = doc(this.firestore, `pages/${pageId}`);
    await deleteDoc(pageDoc);
    this.pagesSignal.set(this.pagesSignal().filter((item) => item.id !== pageId));
  }

  getPageBySlug(slug: string): Page | undefined {
    return this.pagesSignal().find((item) => item.slug === slug);
  }

  async setStoreTheme(storeId: string, theme: string): Promise<void> {
    const blogDoc = doc(this.firestore, `stores/${storeId}`);
    await setDoc(blogDoc, { theme }, { merge: true });

    const current = this.activeStoreSignal();
    if (current && current.id === storeId) {
      this.activeStoreSignal.set({ ...current, theme });
    }
  }

  async setStoreTemplate(storeId: string, template: string): Promise<void> {
    const blogDoc = doc(this.firestore, `stores/${storeId}`);
    await setDoc(blogDoc, { template }, { merge: true });

    const current = this.activeStoreSignal();
    if (current && current.id === storeId) {
      this.activeStoreSignal.set({ ...current, template });
    }
  }

  getStoreTemplateId(store?: Store): string {
    return store?.template || this.defaultTemplate;
  }

  getAvailableThemes(): Array<{ id: string; label: string }> {
    return [
      { id: 'default', label: 'Default' },
      { id: 'minimal', label: 'Minimal' },
      { id: 'modern', label: 'Modern' },
      { id: 'contempo', label: 'Contempo' }
    ];
  }

  getAvailableTemplates(): Array<{ id: string; label: string }> {
    return [{ id: 'default', label: 'Default' }];
  }

  async setStoreDomain(storeId: string, domain: string): Promise<void> {
    const blogDoc = doc(this.firestore, `stores/${storeId}`);
    await setDoc(blogDoc, { domain }, { merge: true });

    const current = this.activeStoreSignal();
    if (current && current.id === storeId) {
      this.activeStoreSignal.set({ ...current, domain });
    }
  }

  async getTemplateConfig(storeId: string): Promise<TemplateConfig | null> {
    const store = this.storesSignal().find((b) => b.id === storeId);
    return store?.templateConfig || null;
  }

  async setTemplateConfig(storeId: string, config: TemplateConfig): Promise<void> {
    const normalized: TemplateConfig = {
      topNavPageIds: config?.topNavPageIds ?? [],
      secondaryNavItems: (config?.secondaryNavItems ?? []).map((item) => {
        const copy: any = { ...item };
        Object.keys(copy).forEach((k) => {
          if (copy[k] === undefined) delete copy[k];
        });
        return copy as NavigationItem;
      }),
      sidebarPageIds: config?.sidebarPageIds ?? [],
      // Firestore rejects `undefined` values — convert missing strings to `null`
      logoText: config?.logoText ?? null,
      logoColor: config?.logoColor ?? null
    } as TemplateConfig;

    const blogDoc = doc(this.firestore, `stores/${storeId}`);
    await setDoc(blogDoc, { templateConfig: normalized }, { merge: true });

    const current = this.activeStoreSignal();
    if (current?.id === storeId) {
      this.activeStoreSignal.set({ ...current, templateConfig: normalized });
    }

    const stores = this.storesSignal();
    const updated = stores.map((b) => (b.id === storeId ? { ...b, templateConfig: normalized } : b));
    this.storesSignal.set(updated);
  }

  async addSecondaryNavItem(storeId: string, item: NavigationItem): Promise<void> {
    const config = await this.getTemplateConfig(storeId);
    const secondaryNavItems = config?.secondaryNavItems || [];
    const maxOrder = secondaryNavItems.length > 0 ? Math.max(...secondaryNavItems.map((i) => i.order)) : 0;
    const newItem = { ...item, order: item.order || maxOrder + 1 };
    await this.setTemplateConfig(storeId, {
      ...config,
      secondaryNavItems: [...secondaryNavItems, newItem]
    });
  }

  async updateSecondaryNavItem(storeId: string, itemId: string, updated: Partial<NavigationItem>): Promise<void> {
    const config = await this.getTemplateConfig(storeId);
    const secondaryNavItems = config?.secondaryNavItems || [];
    const newItems = secondaryNavItems.map((i) => (i.id === itemId ? { ...i, ...updated } : i));
    await this.setTemplateConfig(storeId, {
      ...config,
      secondaryNavItems: newItems
    });
  }

  async deleteSecondaryNavItem(storeId: string, itemId: string): Promise<void> {
    const config = await this.getTemplateConfig(storeId);
    const secondaryNavItems = config?.secondaryNavItems || [];
    const newItems = secondaryNavItems.filter((i) => i.id !== itemId);
    await this.setTemplateConfig(storeId, {
      ...config,
      secondaryNavItems: newItems
    });
  }

  // Global Theme Settings Methods
  async getGlobalThemeSettings(): Promise<GlobalThemeSettings> {
    const cached = this.globalThemeSignal();
    if (cached) return cached;

    try {
      const settingsDoc = doc(this.firestore, 'settings/global-theme');
      const snapshot = await getDoc(settingsDoc);
      
      if (!snapshot.exists()) {
        return this.getDefaultThemeSettings();
      }

      const data = snapshot.data() as GlobalThemeSettings;
      this.globalThemeSignal.set(data);
      return data;
    } catch {
      return this.getDefaultThemeSettings();
    }
  }

  async updateGlobalThemeSettings(settings: GlobalThemeSettings): Promise<void> {
    const settingsDoc = doc(this.firestore, 'settings/global-theme');
    const data = {
      ...settings,
      updatedAt: new Date().toISOString()
    };
    await setDoc(settingsDoc, data, { merge: true });
    this.globalThemeSignal.set(data);
  }

  generateThemeCss(settings: GlobalThemeSettings): string {
    const vars = `
      --primary-color: ${settings.colors.primary};
      --secondary-color: ${settings.colors.secondary};
      --text-color: ${settings.colors.text};
      --bg-color: ${settings.colors.background};
      --accent-color: ${settings.colors.accent};
      --muted-color: ${settings.colors.muted};
      --border-color: ${settings.colors.border};
      --font-family: ${settings.fonts.family};
      --heading-size: ${settings.fonts.headingSize};
      --body-size: ${settings.fonts.bodySize};
      --font-weight: ${settings.fonts.fontWeight};
      --border-radius: ${settings.spacing.borderRadius};
      --padding: ${settings.spacing.padding};
      --gap: ${settings.spacing.gap};
    `;

    const defaultCss = `
      :root {
        ${vars}
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        color: var(--text-color);
        background: var(--bg-color);
        font-family: var(--font-family);
        font-size: var(--body-size);
        line-height: 1.6;
      }
      
      h1, h2, h3, h4, h5, h6 {
        font-size: var(--heading-size);
        font-weight: var(--font-weight);
      }
      
      a {
        color: var(--accent-color);
        text-decoration: none;
      }
      
      a:hover {
        text-decoration: underline;
      }
      
      button {
        background: var(--primary-color);
        color: white;
        border: none;
        padding: var(--padding);
        border-radius: var(--border-radius);
        cursor: pointer;
        font-weight: var(--font-weight);
      }
      
      button:hover {
        opacity: 0.9;
      }
      
      input, select, textarea {
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        padding: var(--padding);
        font-family: var(--font-family);
      }
      
      .site-page {
        color: var(--text-color);
        background: var(--bg-color);
        font-family: var(--font-family);
      }
      
      .top-nav {
        background: var(--secondary-color);
        padding: var(--padding);
      }
      
      .top-nav a {
        color: white;
        margin-right: var(--gap);
      }
      
      .logo-text {
        color: var(--primary-color);
      }
      
      .secondary-nav {
        background: var(--secondary-color);
        padding: var(--padding);
      }
      
      .nav-item {
        color: white;
        margin-right: var(--gap);
      }
      
      .nav-item:hover {
        color: var(--accent-color);
      }
      
      ${settings.customCss || ''}
    `;

    return defaultCss;
  }

  private getDefaultThemeSettings(): GlobalThemeSettings {
    return {
      colors: {
        primary: '#d32f2f',
        secondary: '#1a1a1a',
        text: '#1a1a1a',
        background: '#f5f5f5',
        accent: '#d32f2f',
        muted: '#888',
        border: '#ddd'
      },
      fonts: {
        family: 'Arial, sans-serif',
        headingSize: '2rem',
        bodySize: '1rem',
        fontWeight: '600'
      },
      spacing: {
        borderRadius: '0.25rem',
        padding: '1rem',
        gap: '1rem'
      },
      customCss: ''
    };
  }

  private loadPosts(): void {
    const postsCollection = collection(this.firestore, 'posts');
    collectionData(query(postsCollection), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) =>
          items
            .map((item) => this.normalizePost(item))
            .sort((a, b) => new Date(b.updatedAt ?? b.createdAt ?? '').getTime() - new Date(a.updatedAt ?? a.createdAt ?? '').getTime())
        ),
        catchError(() => of([] as Post[]))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  private loadPages(): void {
    const pagesCollection = collection(this.firestore, 'pages');
    collectionData(query(pagesCollection, orderBy('title', 'asc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => this.normalizePage(item))),
        catchError(() => of([] as Page[]))
      )
      .subscribe((pages) => this.pagesSignal.set(pages));
  }

  private normalizePost(item: Record<string, unknown>): Post {
    return {
      id: String(item['id'] ?? ''),
      uid: item['uid'] ? String(item['uid']) : undefined,
      title: String(item['title'] ?? 'Untitled post'),
      slug: String(item['slug'] ?? 'untitled-post'),
      excerpt: String(item['excerpt'] ?? ''),
      content: String(item['content'] ?? ''),
      contentUrl: item['contentUrl'] ? String(item['contentUrl']) : undefined,
      category: String(item['category'] ?? 'General'),
      status: (item['status'] as 'draft' | 'published') ?? 'draft',
      views: Number(item['views'] ?? 0),
      createdAt: String(item['createdAt'] ?? new Date().toISOString()),
      publishedAt: item['publishedAt'] ? String(item['publishedAt']) : undefined,
      featuredImage: item['featuredImage'] ? String(item['featuredImage']) : undefined,
      storeId: item['storeId'] ? String(item['storeId']) : undefined
    };
  }

  private normalizePage(item: Record<string, unknown>): Page {
    return {
      id: String(item['id'] ?? ''),
      uid: item['uid'] ? String(item['uid']) : undefined,
      title: String(item['title'] ?? 'Untitled page'),
      slug: String(item['slug'] ?? 'untitled-page'),
      excerpt: item['excerpt'] ? String(item['excerpt']) : undefined,
      content: String(item['content'] ?? ''),
      contentUrl: item['contentUrl'] ? String(item['contentUrl']) : undefined,
      storeId: item['storeId'] ? String(item['storeId']) : undefined,
      createdAt: item['createdAt'] ? String(item['createdAt']) : undefined,
      updatedAt: item['updatedAt'] ? String(item['updatedAt']) : undefined
    };
  }

  async saveBlogThemeSettings(storeId: string, themeVars: any): Promise<void> {
    try {
      const blogDoc = doc(this.firestore, `stores/${storeId}`);
      await setDoc(blogDoc, { themeSettings: themeVars }, { merge: true });
    } catch (error) {
      console.error('Error saving store theme settings:', error);
      throw error;
    }
  }

  async loadBlogThemeSettings(storeId: string): Promise<Record<string, unknown>> {
    try {
      const blogDoc = doc(this.firestore, `stores/${storeId}`);
      const snapshot = await getDoc(blogDoc);
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data['themeSettings'] || {};
      }
      return {};
    } catch (error) {
      console.error('Error loading store theme settings:', error);
      return {};
    }
  }
}
