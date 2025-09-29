# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Development Commands

### Starting the Application
- **Both servers**: `.\run-both-servers.ps1` (PowerShell) or `start-both.bat` (CMD)
- **Backend only**: `cd backend && npm start`
- **Frontend only**: `cd frontend && npm start`
- **Backend development**: `cd backend && npm run dev` (with nodemon)

### Testing
- **Test authentication**: `node test-auth.js`
- **Test PawsBot**: `node test-pawsbot.js`
- **Test group chat**: Test endpoints `/api/chat/group/:category`
- **API health check**: Visit `http://localhost:5000/api/health`

### Building
- **Frontend build**: `cd frontend && npm run build`
- **Frontend test**: `cd frontend && npm test`
- **Install new packages**: Use commands as shown in implementation for FontAwesome, infinite scroll, etc.

## Architecture Overview

### Project Structure
This is a **MERN stack** application with MongoDB Atlas, Express.js, React.js, and Node.js:

```
backend/              # Express.js API server
├── ai-agents/       # Advanced AI system with conversation state management
├── middleware/      # JWT authentication, file uploads, admin/ownership checks
├── models/          # Mongoose schemas (User, Pet, Post, Comment)
├── routes/          # RESTful API endpoints organized by feature
└── utils/           # Passport OAuth configuration

frontend/            # React.js application
├── src/contexts/    # React Context for auth and theme management
├── src/pages/       # Route components
├── src/components/  # Reusable UI components
└── src/styles/      # CSS with CSS custom properties for theming
```

### Key Architectural Patterns

**Backend (Express.js)**:
- **Modular route organization**: Each feature (auth, posts, pets, chat) has dedicated route files
- **Layered authentication**: JWT tokens with `authenticateToken` (required), `optionalAuth` (optional), `requireAdmin`, and `requireOwnership` middleware
- **Advanced AI system**: PawsBot uses conversation state management with urgency analysis and contextual responses
- **MongoDB integration**: Mongoose models with pre-save hooks, virtuals, and relationship references

**Frontend (React.js)**:
- **Context-based state**: `AuthContext` for user state, `ThemeContext` for dark/light mode
- **React Query**: For API state management and caching
- **Protected routing**: `ProtectedRoute` component wraps authenticated pages
- **CSS Custom Properties**: Theme variables enable dynamic dark/light mode switching

### API Architecture
The backend follows RESTful conventions with these endpoint patterns:
- `GET /api/posts` - Paginated posts with category/trending filters
- `POST /api/posts/:postId/like` - Social actions
- `POST /api/chat/pawsbot` - AI chat with conversation history
- `POST /api/comments` - Nested comments with accepted answers

### Authentication Flow
1. JWT tokens stored in localStorage with 7-day expiration
2. `AuthContext` verifies tokens on app load via `/api/auth/me`
3. Middleware validates tokens and attaches user to `req.user`
4. OAuth support for Google (Apple ready but needs credentials)

### Enhanced AI System (PawsBot v2.0 with LangGraph)
- **LangGraph Architecture**: State-based conversation flow with node transitions
- **Advanced State Management**: Tracks conversation context and user history
- **Intelligent Urgency Analysis**: Real-time assessment of emergency keywords and health concerns
- **Multi-modal Responses**: Emergency triage, health guidance, behavior training, nutrition advice
- **Context-Aware Processing**: Leverages user info, pet details, and conversation history
- **Fallback System**: Intelligent error handling with contextual backup responses

### Group Chat System
- **Real-time Messaging**: Category-based group chats (general, health, behavior, etc.)
- **User Mentions**: @username functionality with user lookup
- **Message Reactions**: Emoji reactions system with user tracking
- **Message Management**: Edit, delete, and moderation capabilities
- **Active User Tracking**: Real-time display of active users per category

### Instagram-like Timeline
- **Category-based Feeds**: Dedicated timelines for each pet care category
- **Advanced Filtering**: Sort by recent, trending, popular with content type filters
- **Infinite Scroll**: Performance-optimized loading with pagination
- **Grid/List Views**: Flexible display modes with responsive design
- **Search Integration**: Real-time search with debouncing

### Comprehensive User Profiles
- **Instagram-style Layout**: Modern profile design with tabs and stats
- **Follow System**: Complete follower/following functionality
- **Profile Management**: Bio, location, verification badges
- **Content Organization**: Posts, pets, saved, and liked content tabs
- **Social Features**: Share profiles, view followers/following lists

## Environment Configuration

### Required Backend Environment Variables
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pawsconnect
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=AIzaSyAJ3_SQFane-vQgzT2KNsjfobcDQm1i8_4
PORT=5000
NODE_ENV=development
```

### OAuth Setup (Optional)
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## Database Schema

### Key Models Relationships
- **User** ↔ **Pet**: One-to-many (user.pets array, pet.owner reference)
- **User** ↔ **Post**: One-to-many (user.posts array, post.author reference)  
- **Post** ↔ **Comment**: One-to-many with nested replies
- **User** ↔ **User**: Many-to-many followers/following system

### Important Schema Features
- **User model**: Includes OAuth fields, social stats, account status flags
- **Password hashing**: bcrypt with 12-round salt in pre-save hook
- **Indexes**: Performance indexes on username, email, createdAt fields
- **Virtuals**: Computed fields like postsCount that don't store in DB

## Development Workflow

### When Adding New Features
1. **Backend**: Create route in `/routes`, add to `server.js`, implement middleware as needed
2. **Frontend**: Add page in `/pages`, component in `/components`, update routing in `App.js`
3. **Authentication**: Use existing middleware (`authenticateToken`, `optionalAuth`, etc.)
4. **Database**: Define Mongoose models with proper relationships and indexes

### Testing API Endpoints
Use the test files or curl commands:
```bash
# Test user registration
curl -X POST http://localhost:5000/api/auth/register -H "Content-Type: application/json" -d '{"username":"test","email":"test@example.com","password":"password123","fullName":"Test User"}'

# Test PawsBot (requires auth token)
curl -X POST http://localhost:5000/api/chat/pawsbot -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"message":"My dog is limping"}'
```

### Common Development Tasks
- **Add new API endpoint**: Create in appropriate route file, follow existing patterns
- **Add authentication**: Wrap route with `authenticateToken` middleware
- **Frontend API calls**: Use axios in React components, leverage React Query for state management
- **Theme customization**: Modify CSS custom properties in `/styles/modern.css`
- **AI responses**: Extend PawsBot by modifying the system prompt or adding new analysis patterns

## Deployment Architecture

### Production Setup
- **Frontend**: Deploy to Vercel from `/frontend` directory
- **Backend**: Deploy to Render with build command `cd backend && npm install`
- **Database**: MongoDB Atlas cluster (free tier available)
- **File Storage**: Static files served from `/uploads` directory on backend server

### Environment-Specific Behavior
- **CORS**: Configured for `localhost:3000` in development, production URLs in production
- **Error handling**: Detailed errors in development, generic messages in production
- **Rate limiting**: 100 requests per 15 minutes per IP on `/api/*` routes

## Security Considerations

### Implemented Security
- **Helmet.js**: Security headers with cross-origin resource policy
- **Rate limiting**: Express-rate-limit on API routes
- **Input validation**: Express-validator on user inputs
- **Password security**: bcrypt with 12-round salting
- **JWT tokens**: 7-day expiration with secure secret
- **Account status**: User banning/deactivation system

### File Uploads
- **Multer configuration**: Limited file sizes and types
- **Static serving**: Uploaded files served from `/uploads` with proper headers

## Recent Development Progress ✅

### Completed Features

**✅ Responsive Design System (COMPLETED)**
- Created comprehensive responsive.css with mobile-first design approach
- Added media queries for mobile (320px+), tablet (768px+), desktop (1024px+), large desktop (1200px+), and extra large screens (1400px+)
- Implemented responsive navigation, timeline, profile, chat, forms, and card layouts
- Added print styles, accessibility features, and motion reduction support
- All components now fully responsive across all device sizes

**✅ Enhanced Dark Mode System (COMPLETED)**
- Created advanced dark-mode.css with modern CSS variables and smooth transitions
- Implemented glass morphism effects, enhanced card styles, and gradient backgrounds
- Added modern button variants (primary, secondary, ghost) with hover animations
- Created floating input labels, improved scrollbars, and skeleton loading states
- Added theme toggle button, tooltips, badges, and notification styles
- Comprehensive dark mode support with automatic system preference detection

**✅ Modern UI Components (COMPLETED)**
- Created ThemeToggle component with smooth sun/moon icon transitions
- Built comprehensive Icon component system with specialized icons (LikeIcon, CommentIcon, etc.)
- Added animation utilities for heartbeat, wiggle, pulse, and other micro-interactions
- Created animations.css with fadeIn, slideUp, bounce, and hover effects
- Added stagger animations, loading states, and accessibility motion reduction

**✅ Enhanced Styling Integration (COMPLETED)**
- All new CSS files properly imported into App.js
- ThemeProvider already integrated into app architecture
- Consistent design system using CSS custom properties
- Mobile-optimized dark mode with enhanced shadows and effects

**✅ Default Pet Avatars & Cookie Consent (COMPLETED)**
- Created PetAvatarSelector component with cartoon pet avatars and custom upload support
- Implemented CookieConsent component with modern design and preference persistence
- Added js-cookie package for enhanced cookie management

### Remaining Tasks
- Complete backend 'coming soon' sections (requires backend development work)
- Further UI polish and icon enhancements as needed
- Testing and refinement of responsive design across different devices
