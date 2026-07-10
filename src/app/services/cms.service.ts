import { Injectable, computed, inject, signal } from '@angular/core';
import { collection, collectionData, Firestore, orderBy, query, where, getDocs, addDoc, setDoc, doc, getDoc, updateDoc, deleteDoc, limit } from '@angular/fire/firestore';
import { Storage, getDownloadURL, ref, uploadString } from '@angular/fire/storage';
import { catchError, map, of } from 'rxjs';
import { Page, Post, Blog } from '../models/cms.models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class CmsService {
  private readonly firestore = inject(Firestore);
  private readonly storage = inject(Storage);
  private readonly auth = inject(AuthService);

  readonly postsSignal = signal<Post[]>([]);
  readonly pagesSignal = signal<Page[]>([]);
  readonly blogsSignal = signal<Blog[]>([]);
  readonly activeBlogSignal = signal<Blog | null>(null);
  readonly draftSignal = signal<Post | null>(null);
  readonly previewSignal = signal<Post | null>(null);

  readonly filteredPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((post) => post.blogId === blog.id);
  });

  readonly publishedPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((post) => post.blogId === blog.id && post.status === 'published');
  });

  readonly draftPostsSignal = computed(() => {
    const blog = this.activeBlogSignal();
    if (!blog) return [] as Post[];
    return this.postsSignal().filter((post) => post.blogId === blog.id && post.status === 'draft');
  });

  readonly popularPostsSignal = computed(() => [...this.postsSignal()].sort((a, b) => b.views - a.views).slice(0, 3));

  readonly recentPostsSignal = computed(() =>
    [...this.postsSignal()]
      .sort((a, b) => new Date(b.publishedAt ?? b.createdAt ?? '').getTime() - new Date(a.publishedAt ?? a.createdAt ?? '').getTime())
      .slice(0, 3)
  );

  constructor() {
    this.loadBlogs();
    this.loadPosts();
    this.loadPages();
  }

  // Root public domain used for generated blog subdomains
  private readonly rootPublicDomain = 'gameoffortunes.com';

  private loadBlogs(): void {
    const blogsCollection = collection(this.firestore, 'blogs');
    collectionData(query(blogsCollection, orderBy('createdAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) =>
          items.map((item) => ({
            id: String(item['id'] ?? ''),
            uid: item['uid'] ? String(item['uid']) : undefined,
            name: String(item['name'] ?? 'Untitled blog'),
            slug: item['slug'] ? String(item['slug']) : this.slugify(String(item['name'] ?? '')),
            description: item['description'] ? String(item['description']) : undefined,
            category: item['category'] ? String(item['category']) : undefined,
            ownerUid: item['ownerUid'] ? String(item['ownerUid']) : null,
            createdAt: item['createdAt'] ? String(item['createdAt']) : undefined,
            updatedAt: item['updatedAt'] ? String(item['updatedAt']) : undefined,
            theme: item['theme'] ? String(item['theme']) : 'default',
            domain: item['domain'] ? String(item['domain']) : undefined
          } as Blog))
        ),
        catchError(() => of([] as Blog[]))
      )
      .subscribe((blogs) => this.blogsSignal.set(blogs));
  }

  async createBlog(data: { name: string; description?: string; category?: string; ownerUid?: string | null; slug?: string | null }): Promise<Blog> {
    const now = new Date().toISOString();
    const requestedSlug = (data.slug ?? '').trim();

    const blog: any = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      name: data.name,
      description: data.description,
      category: data.category,
      ownerUid: data.ownerUid ?? null,
      createdAt: now,
      updatedAt: now,
      theme: 'default'
    };

    if (requestedSlug) {
      blog.slug = this.slugify(requestedSlug);
    }

    const blogsCollection = collection(this.firestore, 'blogs');
    const docRef = await addDoc(blogsCollection, blog as any);
    const newBlog: Blog = { ...(blog as Blog), id: docRef.id, slug: blog.slug ?? docRef.id };

    // set slug and default domain to a subdomain of the public root domain
    const defaultDomain = `${newBlog.slug}.${this.rootPublicDomain}`;
    await setDoc(docRef, { slug: newBlog.slug, domain: defaultDomain }, { merge: true });
    newBlog.domain = defaultDomain;
    this.activeBlogSignal.set(newBlog);
    this.blogsSignal.set([...this.blogsSignal(), newBlog]);
    return newBlog;
  }

  async updateBlog(blogId: string, data: Partial<Pick<Blog, 'name' | 'slug' | 'description' | 'category' | 'theme' | 'domain' | 'ownerUid'>>): Promise<Blog | null> {
    const blog = this.blogsSignal().find((item) => item.id === blogId);
    if (!blog) return null;

    const updatedBlog: Blog = {
      ...blog,
      ...data,
      slug: data.slug ? this.slugify(data.slug) : blog.slug,
      theme: data.theme ?? blog.theme ?? 'default',
      updatedAt: new Date().toISOString()
    };

    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await updateDoc(blogDoc, updatedBlog as any);

    const updatedBlogs = this.blogsSignal().map((item) => (item.id === blogId ? updatedBlog : item));
    this.blogsSignal.set(updatedBlogs);
    if (this.activeBlogSignal()?.id === blogId) {
      this.activeBlogSignal.set(updatedBlog);
    }

    return updatedBlog;
  }

  async deleteBlog(blogId: string): Promise<void> {
    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await deleteDoc(blogDoc);

    const remaining = this.blogsSignal().filter((item) => item.id !== blogId);
    this.blogsSignal.set(remaining);
    if (this.activeBlogSignal()?.id === blogId) {
      this.activeBlogSignal.set(null);
    }
  }

  setActiveBlogById(blogId: string): void {
    const found = this.blogsSignal().find((b) => b.id === blogId);
    if (found) {
      this.activeBlogSignal.set(found);
      this.loadPostsForBlog(found.id);
      this.ensureBlogHasTheme(found.id).catch(() => {});
      return;
    }

    const blogDocRef = doc(this.firestore, `blogs/${blogId}`);
    getDoc(blogDocRef)
      .then((snapshot) => {
        if (!snapshot.exists()) return;
        const data = snapshot.data() as Record<string, unknown>;
        const blog: Blog = {
          id: snapshot.id,
          uid: data['uid'] ? String(data['uid']) : undefined,
          name: String(data['name'] ?? 'Untitled blog'),
          slug: data['slug'] ? String(data['slug']) : this.slugify(String(data['name'] ?? '')),
          description: data['description'] ? String(data['description']) : undefined,
          category: data['category'] ? String(data['category']) : undefined,
          ownerUid: data['ownerUid'] ? String(data['ownerUid']) : null,
          createdAt: data['createdAt'] ? String(data['createdAt']) : undefined,
          updatedAt: data['updatedAt'] ? String(data['updatedAt']) : undefined,
          theme: data['theme'] ? String(data['theme']) : 'default',
          domain: data['domain'] ? String(data['domain']) : undefined
        } as Blog;

        this.activeBlogSignal.set(blog);
        this.blogsSignal.set([...this.blogsSignal(), blog]);
        this.loadPostsForBlog(blog.id);
        this.ensureBlogHasTheme(blog.id).catch(() => {});
      })
      .catch(() => {});
  }

  private async loadPostsForBlog(blogId: string): Promise<void> {
    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    collectionData(query(postsCollection, orderBy('publishedAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => ({ ...this.normalizePost(item), blogId } as Post))),
        catchError(() => of([] as Post[]))
      )
      .subscribe((posts) => this.postsSignal.set(posts));
  }

  /**
   * Fetch posts for a blog directly from Firestore (no Storage hydration).
   * If `limitCount` is provided and > 0, the query will be limited.
   */
  async fetchPostsForBlog(blogId: string, limitCount?: number): Promise<Post[]> {
    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    const q = limitCount && limitCount > 0
      ? query(postsCollection, orderBy('publishedAt', 'desc'), limit(limitCount))
      : query(postsCollection, orderBy('publishedAt', 'desc'));

    const snapshot = await getDocs(q);
    if (snapshot.empty) return [];

    const posts = snapshot.docs.map((docSnap) => ({ ...this.normalizePost({ ...docSnap.data(), id: docSnap.id }), blogId } as Post));
    // replace in-memory list for this blog with freshly fetched items
    const others = this.postsSignal().filter((p) => p.blogId !== blogId);
    this.postsSignal.set([...posts, ...others]);
    return posts;
  }

  /**
   * Fetch a post document by id from Firestore (no Storage hydration).
   */
  async fetchPostDocById(blogId: string, postId: string): Promise<Post | null> {
    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;

    const post = { ...this.normalizePost({ ...snapshot.data(), id: snapshot.id }), blogId } as Post;
    // update in-memory signal but do not hydrate content from storage
    this.postsSignal.set([post, ...this.postsSignal().filter((p) => p.id !== post.id)]);
    return post;
  }

  async createPost(blogId: string, data: { title: string; excerpt?: string; content?: string; category?: string; status?: 'draft' | 'published' }): Promise<Post> {
    const now = new Date().toISOString();
    const status = data.status ?? 'draft';
    await this.ensureBlogHasTheme(blogId);

    const postMeta: any = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: data.excerpt ?? '',
      category: data.category ?? 'Uncategorized',
      blogId,
      status,
      views: 0,
      createdAt: now
    };

    if (status === 'published') {
      postMeta.publishedAt = now;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    const docRef = await addDoc(postsCollection, postMeta as any);

    const content = data.content ?? '';
    let contentUrl: string | undefined;

    if (content.trim().length) {
      contentUrl = await this.uploadPostContent(blogId, docRef.id, content);
      const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${docRef.id}`);
      await updateDoc(postDoc, { contentUrl } as any);
    }

    const newPost: Post = { ...(postMeta as Post), id: docRef.id, content, contentUrl };
    this.postsSignal.set([newPost, ...this.postsSignal()]);
    return newPost;
  }

  async updatePost(blogId: string, postId: string, data: Partial<Pick<Post, 'title' | 'excerpt' | 'content' | 'category' | 'status' | 'publishedAt'>>): Promise<Post | null> {
    const post = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (!post) return null;

    const updated: Post = {
      ...post,
      ...data,
      publishedAt: data.status === 'published' ? data.publishedAt ?? new Date().toISOString() : post.publishedAt,
      createdAt: post.createdAt ?? new Date().toISOString(),
      content: data.content ?? post.content,
      contentUrl: post.contentUrl
    };

    const updateData: any = {
      title: updated.title,
      excerpt: updated.excerpt,
      category: updated.category,
      status: updated.status,
      publishedAt: updated.publishedAt
    };

    if (data.content !== undefined) {
      const content = data.content ?? '';
      updated.content = content;

      if (content.trim().length) {
        updated.contentUrl = await this.uploadPostContent(blogId, postId, content);
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

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    if (Object.keys(updateData).length > 0) {
      await updateDoc(postDoc, updateData as any);
    }

    this.postsSignal.set(this.postsSignal().map((item) => (item.id === postId ? updated : item)));
    return updated;
  }

  async deletePost(blogId: string, postId: string): Promise<void> {
    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    await deleteDoc(postDoc);
    this.postsSignal.set(this.postsSignal().filter((item) => item.id !== postId));
  }

  async publishPost(blogId: string, postId: string): Promise<Post | null> {
    const post = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (!post) return null;

    const publishedAt = new Date().toISOString();
    const updated: Post = { ...post, status: 'published', publishedAt };

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    await updateDoc(postDoc, { status: updated.status, publishedAt: updated.publishedAt } as any);

    this.postsSignal.set(this.postsSignal().map((item) => (item.id === postId ? updated : item)));
    return updated;
  }

  async loadPreviewPost(blogId: string, postId: string): Promise<Post | null> {
    const existing = this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.previewSignal.set(hydrated);
      return hydrated;
    }

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;

    const data = snapshot.data() as Record<string, unknown>;
    const post = await this.hydratePostContent(this.normalizePost({ ...data, id: snapshot.id }));
    this.previewSignal.set(post);
    return post;
  }

  getPostById(blogId: string, postId: string): Post | undefined {
    return this.postsSignal().find((item) => item.id === postId && item.blogId === blogId);
  }

  async loadPostById(blogId: string, postId: string): Promise<Post | null> {
    const existing = this.getPostById(blogId, postId);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.postsSignal.set(this.postsSignal().map((item) => (item.id === hydrated.id ? hydrated : item)));
      return hydrated;
    }

    const postDoc = doc(this.firestore, `blogs/${blogId}/posts/${postId}`);
    const snapshot = await getDoc(postDoc);
    if (!snapshot.exists()) return null;

    const post = await this.hydratePostContent(this.normalizePost({ ...snapshot.data(), id: snapshot.id }));
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  async loadPostBySlug(blogId: string, slug: string): Promise<Post | null> {
    const existing = this.findPostBySlug(blogId, slug);
    if (existing) {
      const hydrated = await this.hydratePostContent(existing);
      this.postsSignal.set(this.postsSignal().map((item) => (item.id === hydrated.id ? hydrated : item)));
      return hydrated;
    }

    const postsCollection = collection(this.firestore, `blogs/${blogId}/posts`);
    const slugQuery = query(postsCollection, where('slug', '==', slug));
    const snapshot = await getDocs(slugQuery);
    if (snapshot.empty) return null;

    const docSnap = snapshot.docs[0];
    const post = await this.hydratePostContent(this.normalizePost({ ...docSnap.data(), id: docSnap.id }));
    this.postsSignal.set([post, ...this.postsSignal()]);
    return post;
  }

  findPostBySlug(blogId: string, slug: string): Post | undefined {
    return this.postsSignal().find((item) => item.blogId === blogId && item.slug === slug);
  }

  findBlogByHostSlug(hostSlug: string): Blog | undefined {
    const normalized = hostSlug.toLowerCase();
    const byDomain = this.blogsSignal().find((b) => b.domain && b.domain.replace(/^(https?:\/\/)?/, '').toLowerCase() === normalized);
    if (byDomain) return byDomain;

    const byId = this.blogsSignal().find((b) => b.id === hostSlug || b.id.toLowerCase() === normalized);
    if (byId) return byId;

    const bySlug = this.blogsSignal().find((b) => (b.slug ? b.slug.toLowerCase() === normalized : false));
    if (bySlug) return bySlug;

    const byName = this.blogsSignal().find((b) => this.slugify(b.name || '') === normalized);
    if (byName) return byName;

    return undefined;
  }

  findBlogByHostName(hostname: string): Blog | undefined {
    const normalized = hostname.toLowerCase().trim();
    const parts = normalized.split('.');
    // require exactly one subdomain: slug.gameoffortunes.com
    if (parts.length !== 3) {
      return undefined;
    }

    const rootDomain = parts.slice(-2).join('.');
    if (rootDomain !== this.rootPublicDomain) {
      return undefined;
    }

    const slug = parts[0];
    if (!slug || slug === 'www') {
      return undefined;
    }

    return this.findBlogByHostSlug(slug);
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private getPostContentPath(blogId: string, postId: string): string {
    return `blogs/${blogId}/posts/${postId}.html`;
  }

  private getPageContentPath(pageId: string): string {
    return `pages/${pageId}.html`;
  }

  private async uploadPostContent(blogId: string, postId: string, content: string): Promise<string> {
    const storageRef = ref(this.storage, this.getPostContentPath(blogId, postId));
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

  private async ensureBlogHasTheme(blogId: string): Promise<void> {
    const blog = this.blogsSignal().find((item) => item.id === blogId);
    if (!blog || blog.theme) {
      return;
    }

    await this.setBlogTheme(blogId, 'default');
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

  private getPublicHostForBlog(blog: Blog): string {
    if (!blog.domain) {
      return this.getCurrentOrigin();
    }

    const host = blog.domain.trim().replace(/^(https?:\/\/)?/, '').replace(/\/$/, '');
    if (!host) {
      return this.getCurrentOrigin();
    }

    const looksLikeFqdn = host.includes('.') || host.includes(':');
    return looksLikeFqdn ? host : this.getCurrentOrigin();
  }

  getPublicSiteUrl(blog: Blog): string {
    // If the blog has an explicit domain, prefer it for published URLs.
    if (blog && blog.domain) {
      const host = blog.domain.trim();
      if (host.startsWith('http')) return `${host.replace(/\/$/, '')}/site/${blog.id}`;
      return `https://${host}/site/${blog.id}`;
    }

    if (this.isLocalDevelopmentHost()) {
      return this.getLocalPreviewUrl(`/site/${blog.id}`);
    }

    const host = this.getPublicHostForBlog(blog);
    return host.startsWith('http') ? `${host}/site/${blog.id}` : `https://${host}/site/${blog.id}`;
  }

  getPublicPostUrl(blog: Blog, postSlug: string): string {
    // Prefer explicit blog domain for published post links
    if (blog && blog.domain) {
      const host = blog.domain.trim();
      if (host.startsWith('http')) return `${host.replace(/\/$/, '')}/site/${blog.id}/${postSlug}`;
      return `https://${host}/site/${blog.id}/${postSlug}`;
    }

    if (this.isLocalDevelopmentHost()) {
      return this.getLocalPreviewUrl(`/site/${blog.id}/${postSlug}`);
    }

    const host = this.getPublicHostForBlog(blog);
    return host.startsWith('http') ? `${host}/site/${blog.id}/${postSlug}` : `https://${host}/site/${blog.id}/${postSlug}`;
  }

  getThemeCssUrl(themeId?: string): string {
    const id = themeId || 'default';
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

  async createPage(data: { title: string; slug?: string; excerpt?: string; content?: string }): Promise<Page> {
    const now = new Date().toISOString();
    const page: Omit<Page, 'id'> = {
      uid: this.auth.authSignal()?.uid ?? undefined,
      title: data.title,
      slug: data.slug ? this.slugify(data.slug) : this.slugify(data.title),
      excerpt: data.excerpt ?? '',
      content: data.content ?? '',
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

  async setBlogTheme(blogId: string, theme: string): Promise<void> {
    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await setDoc(blogDoc, { theme }, { merge: true });

    const current = this.activeBlogSignal();
    if (current && current.id === blogId) {
      this.activeBlogSignal.set({ ...current, theme });
    }
  }

  async setBlogDomain(blogId: string, domain: string): Promise<void> {
    const blogDoc = doc(this.firestore, `blogs/${blogId}`);
    await setDoc(blogDoc, { domain }, { merge: true });

    const current = this.activeBlogSignal();
    if (current && current.id === blogId) {
      this.activeBlogSignal.set({ ...current, domain });
    }
  }

  private loadPosts(): void {
    const postsCollection = collection(this.firestore, 'posts');
    collectionData(query(postsCollection, orderBy('publishedAt', 'desc')), { idField: 'id' })
      .pipe(
        map((items: Array<Record<string, unknown>>) => items.map((item) => this.normalizePost(item))),
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
      blogId: item['blogId'] ? String(item['blogId']) : undefined
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
      createdAt: item['createdAt'] ? String(item['createdAt']) : undefined,
      updatedAt: item['updatedAt'] ? String(item['updatedAt']) : undefined
    };
  }
}
