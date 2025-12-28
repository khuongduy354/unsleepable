# Test Plan - Unsleepable Project

## 2. Target Test Items

### 2.1 Functional Testing

#### 2.1.1 Authentication & Authorization
- User registration (email/password)
- User login (email/password, Google OAuth)
- Session management via Supabase (cookies, persistence, auto-refresh)
- Middleware-based route protection
- Logout functionality

#### 2.1.2 Post Management (CRUD Operations)
- **Create**: Post creation with title/content, user/community association
- **Read**: Get post by ID, get all posts, get posts by author ID
- **Update**: Edit post (title/content/shortUrl), owner authorization
- **Delete**: Delete post with authorization check
- **Tags**: Add tags to posts, get tags by post ID
- **Reactions**: Like/dislike posts

#### 2.1.3 Community Management (CRUD Operations)
- **Create**: Community creation with name/description/visibility
- **Read**: Get community by ID, get all communities (paginated), get owned communities
- **Update**: Edit community info (owner-only), visibility settings
- **Delete**: Delete community (owner-only)
- **Statistics**: Get community statistics (total posts, members, engagement rate) - owner/admin only

#### 2.1.4 Comment System
- **Create**: Comment creation on posts
- **Read**: Get comments by post ID, get comment by ID, get replies by comment ID
- **Update**: Edit comment (author-only)
- **Delete**: Delete comment (author-only)
- **Nested Replies**: Support for parent-child comment structure

#### 2.1.5 Direct Messaging System
- Send messages between users
- Get message history with a partner
- Store messages in database via API

#### 2.1.6 Notification System
- Push notification subscription/unsubscription
- Get VAPID public key for web push
- Send notifications to users
- Display notification list (likes, comments, messages)

#### 2.1.7 Search & File Upload
- Search posts and communities by query
- File upload to Supabase Storage

#### 2.1.8 Report System
- Submit reports for posts or comments
- Report validation (entity existence check)
- Report entity types (POST, COMMENT)
- Report status tracking (PENDING, RESOLVED, REJECTED)

#### 2.1.9 Navigation & Routing
- Page navigation (login, signup, posts, communities, chat, notifications)
- Next.js App Router with dynamic routes ([id], [partnerId])
- API route endpoints

### 2.2 Backend/Security Testing

#### 2.2.1 API Security
- Authentication enforcement via `requireAuth` middleware
- Authorization checks (post owner, community owner)
- User ID extraction from headers (`x-user-id`)
- Protected endpoints validation

#### 2.2.2 Data Validation & Sanitization
- Input validation (required fields: title, content, name, description)
- Empty/null data checks in services
- Post/comment/community not found handling
- Invalid ID format handling

#### 2.2.3 Database Security
- Supabase RLS policies enforcement
- Data integrity (foreign keys: user_id, community_id, post_id)
- Repository pattern abstraction (SupabasePostRepository, SupabaseCommunityRepository)
- Query error handling and propagation

#### 2.2.4 Session & Cookie Security
- Supabase SSR cookie management
- HttpOnly and Secure cookie flags
- Session refresh via middleware
- Token validation through Supabase client

#### 2.2.5 Service Layer Security
- Business logic validation (PostService, CommunityService, MessageService, NotificationService)
- Ownership verification before updates/deletes
- Error handling with appropriate status codes (400, 401, 403, 404, 500)

### 2.3 UI/UX Testing

#### 2.3.1 Page Components
- Login page with email/password and Google OAuth
- Signup page with form validation
- Post listing and detail pages
- Community listing and management page
- Chat interface with conversation list
- Notifications page with push notification support

#### 2.3.2 UI Component Library (Shadcn UI)
- Form components (Input, Label, Textarea, Select)
- Button components with variants (default, outline, ghost, destructive)
- Card components (Card, CardHeader, CardContent, CardFooter)
- Alert and Badge components
- Toast notifications for success/error feedback
- Tabs, Dropdown menus

#### 2.3.3 Layout & Navigation
- AppLayout with sidebar navigation
- Active route highlighting
- Responsive navigation menu
- User authentication state in UI (Login/Logout buttons)

#### 2.3.4 User Interaction
- Form submission with loading states
- Real-time validation feedback
- Success/error toast messages
- Modal dialogs for create/edit operations
- Pagination controls for lists

#### 2.3.5 Responsive Design
- Tailwind CSS responsive utilities
- Mobile-friendly touch targets
- Proper spacing and layout on different screen sizes

#### 2.3.6 Performance
- Loading indicators (Loader2 icons)
- Optimistic UI updates
- Smooth page transitions with Next.js App Router
