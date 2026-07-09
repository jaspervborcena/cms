
# Tovrika CMS

A lightweight Angular editorial CMS starter built with standalone components, Firebase-friendly data access, and reactive state using Angular signals.

## What’s Included

- Public landing page with marketing content and login/register access
- Authenticated editorial dashboard with a left admin sidebar
- Multi-blog support per account with blog selection in the sidebar
- Onboarding flow for first blog creation and setup
- `CmsService` using Angular signals for posts, blogs, and active blog state
- Posts page with `Create post` action and post listing
- Rich post editor with formatting toolbar, preview mode, and device image upload
- Local fallback mode when Firebase is not configured

## Current Status

### Completed

- Angular standalone app scaffold
- Authentication pages and protected routes
- Left admin navigation with blog list and post actions
- Sidebar `Posts` item routes to `/posts`
- `New Post` route and post editor page
- Rich text editor toolbar and preview toggle
- Image upload from device into the editor
- Posts list page with create button and empty-state messaging
- Header simplified to brand + account only (no dashboard/posts/pages nav links)

### Notes

- The editor stores HTML content in the `content` field.
- Uploaded images are inserted as base64 image data.
- If Firebase is not configured, the app falls back to local persistence.

## Editorial Workflow

The CMS is moving toward a full editorial workflow with draft, preview, and publish stages.

### Draft / Preview / Publish Flow

- **Save Draft**
  - `/posts/new` should save drafts with `status: "draft"` under `/blogs/{blogId}/posts/{postId}`.
  - Drafts remain private and editable.
- **Preview**
  - Preview should load at `/preview/:blogId/:postId`.
  - This route renders the post inside the blog theme layout with header, footer, sidebar, and widgets.
  - A preview should use the selected blog theme so the editor sees the real site styling.
- **Publish**
  - Published content should appear on the public site route `/site/:blogId`.
  - Only posts with `status: "published"` should be visible publicly.

### Recommended Signals

- `draftSignal = signal<Post | null>(null)`
- `previewSignal = signal<Post | null>(null)`
- `publishedPostsSignal = signal<Post[]>([])

Draft posts are saved privately.
Preview loads them in the theme layout.
Publish updates the post to `status: "published"` and exposes it publicly.

### Themes Integration

- Each blog has a `themeId` in Firestore.
- Preview route should load the theme HTML/CSS and inject the post content.
- Public site uses the same theme consistently for `/site/:blogId`.

### Editor Action Buttons

- **Save Draft** → create or update a post with `status: "draft"`.
- **Preview** → navigate to `/preview/:blogId/:postId`.
- **Publish** → set `status: "published"` and redirect to `/site/:blogId`.

## Key Files

- `src/app/services/cms.service.ts` — CMS state, post/blog CRUD, active blog management
- `src/app/services/auth.service.ts` — User auth state and login/register handling
- `src/app/components/admin-nav/admin-nav.component.ts` — Sidebar navigation and `+ New Post` control
- `src/app/pages/posts-list/posts-list.component.ts` — Posts list and create-post CTA
- `src/app/pages/new-post/new-post.component.ts` — Rich editor with preview, toolbar, and image upload
- `src/app/guards/ensure-blog.guard.ts` — Guard to ensure an active blog is selected before entering protected routes
- `src/app/app.routes.ts` — Routes for landing, onboarding, posts, and editor

## How to Run Locally

From the project root `cms`:

```bash
npm install
npm run start
```

Open:

```bash
http://localhost:4200/
```

## Build

```bash
npm run build
```

## Optional Commands

```bash
ng serve
ng test
ng e2e
```

## Next Improvements

- Add richer post list cards and preview links on `/posts`
- Filter dashboard content by the selected active blog
- Add `/dashboard/:blogId` deep links and blog switching in the UI
- Harden Firestore security rules for per-user blog ownership
- Improve editor styling to more closely match the admin screenshot

## Production Subdomain Routing

- Supports wildcard subdomain hosting for `cms.tovrika.com` in production.
- Uses hostname parsing so `www.slug.cms.tovrika.com/test` can resolve the correct blog and post.
- Local development still uses path-based routes, while production can use custom subdomains.
- Requires Firebase Hosting configured for `cms.tovrika.com` with wildcard SSL and a rewrite for `index.html`.
- Example routes:
  - `cms.tovrika.com/local-it741aj/test`
  - `www.local-it741aj.cms.tovrika.com/test`

## Summary

This README reflects the current state of the `Tovrika CMS` starter app and the latest editor enhancements. It is ready to be expanded as more production-ready CMS features are added.
