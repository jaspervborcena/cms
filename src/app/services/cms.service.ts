import { Injectable, computed, inject, signal } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, addDoc, setDoc, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page, Post } from '../models/cms.models';
import { Blog } from '../models/cms.models';
import { AuthService } from './auth.service';

const mockPosts: Post[] = [
  {
    id: 'post-1',
    title: 'Launching the Tovrika CMS starter',
    slug: 'launching-the-tovrika-cms-starter',
    excerpt: 'A quick look at the structure for a modern Angular and Firebase-powered editorial experience.',
    content: 'This starter app combines Angular signals, Firebase Firestore, and a classic editorial layout for posts, pages, and site widgets.',
    category: 'Product',
    status: 'published',
    views: 432,
    createdAt: '2026-07-08T09:30:00.000Z',
    publishedAt: '2026-07-08T10:00:00.000Z'
  },
  {
    id: 'post-2',
    title: 'Designing content workflows for growth',
    slug: 'designing-content-workflows-for-growth',
    excerpt: 'Editorial teams need a clear rhythm of drafting, review, and publication.',
    content: 'A CMS should feel calm and composable so editors can focus on content rather than wrangling UI.',
    category: 'Workflow',
    status: 'published',
    views: 281,
    createdAt: '2026-07-07T15:50:00.000Z',
    publishedAt: '2026-07-07T16:30:00.000Z'
  },
  {
    id: 'post-3',
    title: 'Using signals for instant UI updates',
    slug: 'using-signals-for-instant-ui-updates',
    excerpt: 'Signals help the sidebar and post lists react instantly as content changes.',
    content: 'Signals keep your local state simple and predictable while Firebase supplies the content source.',
    category: 'Engineering',
    status: 'published',
    views: 198,
    createdAt: '2026-07-06T08:45:00.000Z',
    publishedAt: '2026-07-06T09:15:00.000Z'
  }
];

const mockPages: Page[] = [
  {
    id: 'page-about',
    title: 'About',
    slug: 'about',
    excerpt: 'Learn more about the editorial platform.',
    content: 'This page is designed to host a simple company or project story with a polished layout.'
  },
  {
    id: 'page-contact',
    title: 'Contact',
    slug: 'contact',
    excerpt: 'Reach the team behind the CMS.',
    content: 'Use this page to surface your preferred contact channels and support details.'
  }
];

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly firestore = inject(Firestore, { optional: true });
  private readonly auth = inject(AuthService);
  readonly postsSignal = signal<Post[]>([]);
  readonly pagesSignal = signal<Page[]>([]);
  readonly blogsSignal = signal<Blog[]>([]);
  readonly activeBlogSignal = signal<Blog | null>(this.readStoredActiveBlog());
  readonly draftSignal = signal<Post | null>(null);
  readonly previewSignal = signal<Post | null>(null);
  private readonly localPostsKey = 'cms-local-posts';
  readonly filteredPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((p) => p.blogId === blog.id);
  });
  readonly publishedPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((p) => p.blogId === blog.id && p.status === 'published');
  });
  readonly draftPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((p) => p.blogId === blog.id && p.status === 'draft');
  });
  readonly popularPostsSignal = computed(() => [...this.postsSignal()].sort((a, b) => b.views - a.views).slice(0, 3));
  readonly recentPostsSignal = computed(() => [...this.postsSignal()].sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? '').getTime() - new Date(a.publishedAt ?? a.createdAt ?? '').getTime()).slice(0, 3));

  constructor() {
    this.loadPosts();
    this.loadPages();
    this.loadBlogs();
  }

  private loadBlogs(): void {
    if (!environment.firebase.projectId || !this.firestore) {
      const existing = this.activeBlogSignal();
      // ensure slug exists for local blog
      if (existing && !existing.slug) {
        const withSlug = { ...existing, slug: this.slugify(existing.name) };
        this.activeBlogSignal.set(withSlug);
        this.blogsSignal.set([withSlug]);
      } else {
        this.blogsSignal.set(existing ? [existing] : []);
      }
      return;
    }

    const blogsCollection = collection(this.firestore, 'blogs');
    collectionData(query(blogsCollection, orderBy('createdAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => ({
          id: String(item['id'] ?? ''),
          name: String(item['name'] ?? 'Untitled blog'),
          slug: item['slug'] ? String(item['slug']) : this.slugify(String(item['name'] ?? '')),
          description: String(item['description'] ?? ''),
          category: String(item['category'] ?? ''),
          ownerUid: item['ownerUid'] ? String(item['ownerUid']) : null,
          createdAt: String(item['createdAt'] ?? ''),
          theme: item['theme'] ? String(item['theme']) : undefined,
          domain: item['domain'] ? String(item['domain']) : undefined
        } as Blog))),
        catchError(() => of([] as Blog[]))
      )
      .subscribe((blogs) => this.blogsSignal.set(blogs));
  }

  async createBlog(data: { name: string; description?: string; category?: string; ownerUid?: string | null; slug?: string | null }): Promise<Blog> {
    const now = new Date().toISOString();
    const requestedSlug = (data.slug ?? '').trim();
    const blog: Omit<Blog, 'id'> = {
      name: data.name,
      slug: requestedSlug ? this.slugify(requestedSlug) : undefined,
      description: data.description,
      category: data.category,
      ownerUid: data.ownerUid ?? null,
      createdAt: now,
      theme: 'default'
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const localBlogId = `local-${Math.random().toString(36).slice(2,9)}`;
      const localBlog: Blog = { ...blog, id: localBlogId, slug: blog.slug ?? localBlogId } as Blog;
      this.activeBlogSignal.set(localBlog);
      this.persistActiveBlog(localBlog);
      // ensure blogsSignal contains this new blog locally
      const current = this.blogsSignal();
      this.blogsSignal.set([...current, localBlog]);
      return localBlog;
    }

    const blogsCollection = collection(this.firestore, 'blogs');
    const docRef = await addDoc(blogsCollection, blog as any);
    const newBlog: Blog = { ...(blog as Blog), id: docRef.id, slug: blog.slug ?? docRef.id };
    await setDoc(docRef, { slug: newBlog.slug }, { merge: true });
    this.activeBlogSignal.set(newBlog);
    this.persistActiveBlog(newBlog);
    // update blogsSignal cache
    const current = this.blogsSignal();
    this.blogsSignal.set([...current, newBlog]);
    return newBlog;
  }

  setActiveBlogById(blogId: string): void {
    const found = this.blogsSignal().find((b) => b.id === blogId);
    if (found) {
      this.activeBlogSignal.set(found);
      this.persistActiveBlog(found);
      // load posts for the newly active blog
      this.loadPostsForBlog(found.id);
      return;
    }

    // If not found locally, attempt to load from Firestore
    if (!this.firestore) {
      return;
    }

    const blogDocRef = doc(this.firestore, `blogs/${blogId}`);
    getDoc(blogDocRef).then((snapshot) => {
      if (!snapshot.exists()) return;
      const data = snapshot.data() as Record<string, unknown>;
      const blog: Blog = {
        id: snapshot.id,
        name: String(data['name'] ?? 'Untitled blog'),
        slug: data['slug'] ? String(data['slug']) : this.slugify(String(data['name'] ?? '')),
        description: data['description'] ? String(data['description']) : undefined,
        category: data['category'] ? String(data['category']) : undefined,
        ownerUid: data['ownerUid'] ? String(data['ownerUid']) : null,
        createdAt: data['createdAt'] ? String(data['createdAt']) : undefined,
        theme: data['theme'] ? String(data['theme']) : undefined,
        domain: data['domain'] ? String(data['domain']) : undefined
      } as Blog;

      this.activeBlogSignal.set(blog);
      this.persistActiveBlog(blog);
      const current = this.blogsSignal();
      this.blogsSignal.set([...current, blog]);
      this.loadPostsForBlog(blog.id);
    }).catch(() => {});
  }

  private async loadPostsForBlog(blogId: string): Promise<void> {
    if (!this.firestore) {
      // local mode: filter existing posts by blogId
      const localPosts = this.readLocalPosts();
      this.postsSignal.set(localPosts.filter((p) => p.blogId === blogId));
      return;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    collectionData(query(postsCollection, orderBy('publishedAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => ({ ...this.normalizePost(item), blogId } as Post)) ),
        catchError(() => of([] as Post[]))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  async createPost(blogId: string, data: { title: string; excerpt?: string; content?: string; category?: string; status?: 'draft' | 'published' }): Promise<Post> {
    const now = new Date().toISOString();
    const status = data.status ?? 'draft';
    const post: Omit<Post, 'id'> = {
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: data.excerpt ?? '',
      content: data.content ?? '',
      category: data.category ?? 'Uncategorized',
      blogId,
      status,
      views: 0,
      createdAt: now,
      publishedAt: status === 'published' ? now : undefined
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const localPost: Post = { ...(post as Post), id: `local-post-${Math.random().toString(36).slice(2,9)}` };
      const updatedPosts = [localPost, ...this.postsSignal()];
      this.postsSignal.set(updatedPosts);
      this.saveLocalPosts(updatedPosts);
      return localPost;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    const docRef = await addDoc(postsCollection, post as any);
    const newPost: Post = { ...(post as Post), id: docRef.id };
    this.postsSignal.set([newPost, ...this.postsSignal()]);
    return newPost;
  }

  async updatePost(blogId: string, postId: string, data: Partial<Pick<Post, 'title' | 'excerpt' | 'content' | 'category' | 'status' | 'publishedAt'>>): Promise<Post | null> {
    const now = new Date().toISOString();
    const post = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (!post) return null;

    const updated: Post = {
      ...post,
      ...data,
      publishedAt: data.status === 'published' ? data.publishedAt ?? now : post.publishedAt,
      createdAt: post.createdAt ?? now
    };

    if (!environment.firebase.projectId || !this.firestore) {
      const updatedPosts = this.postsSignal().map((item) => (item.id === postId ? updated : item));
      this.postsSignal.set(updatedPosts);
      this.saveLocalPosts(updatedPosts);
      return updated;
    }

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    await updateDoc(postDoc, updated as any);
    this.postsSignal.set(this.postsSignal().map((item) => (item.id === postId ? updated : item)));
    return updated;
  }

  async publishPost(blogId: string, postId: string): Promise<Post | null> {
    return this.updatePost(blogId, postId, { status: 'published', publishedAt: new Date().toISOString() });
  }

  async loadPreviewPost(blogId: string, postId: string): Promise<Post | null> {
    const existing = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (existing) {
      this.previewSignal.set(existing);
      return existing;
    }

    if (!this.firestore) {
      const localPosts = this.readLocalPosts();
      const fallback = localPosts.find((item) => item.id === postId && item.blogId === blogId) ?? null;
      if (fallback) {
        this.previewSignal.set(fallback);
      }
      return fallback;
    }
    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as Record<string, unknown>;
    const post = this.normalizePost({ ...data, id: snapshot.id });
    this.previewSignal.set(post);
    return post;
  }

  getPostById(blogId: string, postId: string): Post | undefined {
    return this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
  }

  findPostBySlug(blogId: string, slug: string): Post | undefined {
    return this.postsSignal().find((item) => item.blogId === blogId && item.slug === slug);
  }

  findBlogByHostSlug(hostSlug: string): Blog | undefined {
    const normalized = hostSlug.toLowerCase();
    // match domain exactly
    const byDomain = this.blogsSignal().find((b) => b.domain && b.domain.replace(/^(https?:\/\/)?/, '').toLowerCase() === normalized);
    if (byDomain) return byDomain;

    // match id directly
    const byId = this.blogsSignal().find((b) => b.id === hostSlug || b.id.toLowerCase() === normalized);
    if (byId) return byId;

    // match explicit slug
    const bySlug = this.blogsSignal().find((b) => (b.slug ? b.slug.toLowerCase() === normalized : false));
    if (bySlug) return bySlug;

    // match slugified name as fallback
    const byName = this.blogsSignal().find((b) => this.slugify(b.name || '') === normalized);
    if (byName) return byName;

    return undefined;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  private isLocalDevelopmentHost(): boolean {
    const hostname = window.location.hostname.toLowerCase();
    return ['localhost', '127.0.0.1', '::1', '[::1]', '0.0.0.0'].includes(hostname);
  }

  private getLocalPreviewUrl(path: string): string {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//127.0.0.1${port}${path}`;
  }

  private getBlogPublicHost(blog: Blog): string {
    const slug = (blog.slug || blog.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `www.${slug}.cms.tovrika.com`;
  }

  private getPublicHostForBlog(blog: Blog): string {
    if (!blog.domain) {
      return this.getBlogPublicHost(blog);
    }

    const host = blog.domain.trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
    if (!host) {
      return this.getBlogPublicHost(blog);
    }

    const looksLikeFqdn = host.includes('.') || host.includes(':');
    return looksLikeFqdn ? host : this.getBlogPublicHost(blog);
  }

  getPublicSiteUrl(blog: Blog): string {
    if (blog.domain) {
      const host = this.getPublicHostForBlog(blog);
      const looksLikeFqdn = host.includes('.') || host.includes(':');
      if (!looksLikeFqdn && this.isLocalDevelopmentHost()) {
        return this.getLocalPreviewUrl(`/site/${blog.id}`);
      }
      return `https://${host}`;
    }

    if (this.isLocalDevelopmentHost()) {
      return this.getLocalPreviewUrl(`/site/${blog.id}`);
    }

    return `https://${this.getBlogPublicHost(blog)}`;
  }

  getPublicPostUrl(blog: Blog, postSlug: string): string {
    if (blog.domain) {
      const host = this.getPublicHostForBlog(blog);
      const looksLikeFqdn = host.includes('.') || host.includes(':');
      if (!looksLikeFqdn && this.isLocalDevelopmentHost()) {
        return this.getLocalPreviewUrl(`/site/${blog.id}/${postSlug}`);
      }
      return `https://${host}/${postSlug}`;
    }

    if (this.isLocalDevelopmentHost()) {
      return this.getLocalPreviewUrl(`/site/${blog.id}/${postSlug}`);
    }

    return `https://${this.getBlogPublicHost(blog)}/${postSlug}`;
  }

  getThemeCssUrl(themeId?: string): string {
    const id = themeId || 'default';
    return `/assets/themes/${id}/theme.css`;
  }

  async loadPostById(blogId: string, postId: string): Promise<Post | null> {
    const existing = this.getPostById(blogId, postId);
    if (existing) return existing;
    if (!this.firestore) return null;

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;
    const data = snapshot.data() as Record<string, unknown>;
    const post = this.normalizePost({ ...data, id: snapshot.id });
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  async setBlogTheme(blogId: string, theme: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const current = this.activeBlogSignal();
      if (current && current.id === blogId) {
        const updated = { ...current, theme };
        this.activeBlogSignal.set(updated);
        this.persistActiveBlog(updated);
      }
      return;
    }

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await setDoc(blogDoc, { theme }, { merge: true });
    const current = this.activeBlogSignal();
    if (current && current.id === blogId) {
      const updated = { ...current, theme };
      this.activeBlogSignal.set(updated);
      this.persistActiveBlog(updated);
    }
  }

  async setBlogDomain(blogId: string, domain: string): Promise<void> {
    if (!environment.firebase.projectId || !this.firestore) {
      const current = this.activeBlogSignal();
      if (current && current.id === blogId) {
        const updated = { ...current, domain };
        this.activeBlogSignal.set(updated);
        this.persistActiveBlog(updated);
      }
      return;
    }

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await setDoc(blogDoc, { domain }, { merge: true });
    const current = this.activeBlogSignal();
    if (current && current.id === blogId) {
      const updated = { ...current, domain };
      this.activeBlogSignal.set(updated);
      this.persistActiveBlog(updated);
    }
  }

  private persistActiveBlog(blog: Blog | null): void {
    if (blog) {
      localStorage.setItem('cms-active-blog', JSON.stringify(blog));
      // persist to Firestore under user doc if available
      try {
        const uid = this.auth?.authSignal()?.uid;
        if (uid && this.firestore) {
          const userDoc = doc(this.firestore, `users/${uid}`);
          setDoc(userDoc, { lastActiveBlogId: blog.id }, { merge: true });
        }
      } catch {}
      return;
    }

    localStorage.removeItem('cms-active-blog');
    try {
      const uid = this.auth?.authSignal()?.uid;
      if (uid && this.firestore) {
        const userDoc = doc(this.firestore, `users/${uid}`);
        setDoc(userDoc, { lastActiveBlogId: null }, { merge: true });
      }
    } catch {}
  }

  private readStoredActiveBlog(): Blog | null {
    const v = localStorage.getItem('cms-active-blog');
    if (!v) return null;
    try { return JSON.parse(v) as Blog; } catch { return null; }
  }

  private loadPosts(): void {
    if (!environment.firebase.projectId || !this.firestore) {
      const localPosts = this.readLocalPosts();
      this.postsSignal.set(localPosts.length ? localPosts : mockPosts);
      return;
    }

    const postsCollection = collection(this.firestore, 'posts');
    collectionData(query(postsCollection, orderBy('publishedAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => this.normalizePost(item))),
        catchError(() => of(mockPosts))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  private loadPages(): void {
    if (!environment.firebase.projectId || !this.firestore) {
      this.pagesSignal.set(mockPages);
      return;
    }

    const pagesCollection = collection(this.firestore, 'pages');
    collectionData(query(pagesCollection, orderBy('title', 'asc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => this.normalizePage(item))),
        catchError(() => of(mockPages))
      )
      .subscribe((pages) => this.pagesSignal.set(pages));
  }

  private saveLocalPosts(posts: Post[]): void {
    try {
      localStorage.setItem(this.localPostsKey, JSON.stringify(posts));
    } catch {}
  }

  private readLocalPosts(): Post[] {
    const raw = localStorage.getItem(this.localPostsKey);
    if (!raw) return [];
    try {
      const posts = JSON.parse(raw) as Post[];
      return Array.isArray(posts) ? posts : [];
    } catch {
      return [];
    }
  }

  private normalizePost(item: Record<string, unknown>): Post {
    return {
      id: String(item['id'] ?? ''),
      title: String(item['title'] ?? 'Untitled post'),
      slug: String(item['slug'] ?? 'untitled-post'),
      excerpt: String(item['excerpt'] ?? ''),
      content: String(item['content'] ?? ''),
      category: String(item['category'] ?? 'General'),
      status: (item['status'] as 'draft' | 'published') ?? 'draft',
      views: Number(item['views'] ?? 0),
      createdAt: String(item['createdAt'] ?? new Date().toISOString()),
      publishedAt: item['publishedAt'] ? String(item['publishedAt']) : undefined,
      featuredImage: item['featuredImage'] ? String(item['featuredImage']) : undefined,
      blogId: item['blogId'] ? String(item['blogId']) : undefined
    };
  }

  private normalizePage(item: Record<string, unknown>): Page {
    return {
      id: String(item['id'] ?? ''),
      title: String(item['title'] ?? 'Untitled page'),
      slug: String(item['slug'] ?? 'untitled-page'),
      excerpt: item['excerpt'] ? String(item['excerpt']) : undefined,
      content: String(item['content'] ?? '')
    };
  }
}
