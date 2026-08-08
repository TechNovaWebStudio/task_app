# TodoApp Frontend — Complete Setup Guide

## Project Overview

TodoApp is a professional task management system with a React/Next.js frontend and Node.js/Express backend. This document covers the frontend setup and integration.

## Technology Stack

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS v4
- **Authentication**: JWT with Context API
- **API Client**: Axios with interceptors
- **Forms**: React Hook Form
- **Charts**: Chart.js
- **Animations**: Framer Motion
- **UI Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── (app)/             # Protected routes (auth required)
│   │   ├── dashboard/     # Dashboard with statistics
│   │   ├── tasks/         # Task management (CRUD)
│   │   ├── calendar/      # Calendar view
│   │   ├── reports/       # Analytics and reports
│   │   ├── categories/    # Category CRUD
│   │   ├── tags/          # Tags view
│   │   ├── activity/      # Activity log
│   │   ├── notifications/ # Notifications
│   │   ├── profile/       # User profile
│   │   └── settings/      # Settings
│   ├── login/             # Login page (public)
│   └── layout.js          # Root layout with AuthProvider
├── components/            # Reusable components
│   ├── Navbar.jsx        # Header with notifications
│   ├── Sidebar.jsx       # Side navigation
│   ├── TaskModal.jsx     # Add/edit task form
│   ├── TaskTable.jsx     # Tasks table (desktop)
│   ├── TaskCard.jsx      # Task card (mobile)
│   └── ...               # Other UI components
├── contexts/             # React contexts
│   └── AuthContext.jsx   # Global auth state
├── services/             # API service modules
│   ├── api.js           # Base Axios instance
│   ├── authApi.js       # Auth API calls
│   ├── taskApi.js       # Task API calls
│   ├── dashboardApi.js  # Dashboard API
│   └── ...              # Other API services
└── public/              # Static files
```

## Setup Instructions

### 1. Prerequisites

Required:
- Node.js 18+ and npm
- Backend server (localhost:5000)
- MongoDB (for backend)

### 2. Installation

```bash
cd frontend
npm install
```

### 3. Environment Configuration

Create `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

**Note**: The `.env.local.example` file already contains this value.

### 4. Start Development Server

```bash
npm run dev
```

Visit: http://localhost:3000

## API Integration

### Service Modules

All API calls go through service modules in `/services`:

| Module | Purpose |
|--------|---------|
| `api.js` | Base Axios instance with auth interceptors |
| `authApi.js` | Login, logout, getMe |
| `taskApi.js` | Task CRUD, status updates, bulk operations |
| `dashboardApi.js` | Dashboard stats, trends, activity |
| `reportApi.js` | Reports, charts data |
| `categoryApi.js` | Category CRUD |
| `profileApi.js` | Profile, password change |
| `notificationApi.js` | Notifications, mark as read |
| `settingsApi.js` | User settings |
| `activityApi.js` | Activity logs |

### Authentication Flow

```
1. User enters email/password on /login
2. AuthContext calls authApi.login()
3. Backend returns token + user data
4. Token stored in localStorage
5. All future requests include token via Axios interceptor
6. 401 errors trigger auto-logout + redirect to /login
7. Authenticated routes protected by AuthProvider
```

### Making API Calls

```jsx
import { taskApi } from '@/services/taskApi';

// In a component:
const fetchTasks = async () => {
  const { data } = await taskApi.getTasks({ page: 1, limit: 10 });
  // data.data contains tasks array
  // data.meta contains pagination info
};
```

## Features Implementation

### Task Management
- ✅ Create task (TaskModal)
- ✅ Read tasks with pagination (TaskTable)
- ✅ Update task (TaskModal + edit mode)
- ✅ Delete task (DeleteModal confirmation)
- ✅ Complete task (checkbox)
- ✅ Search tasks (debounced)
- ✅ Filter by status, priority, category
- ✅ Sort by multiple fields
- ✅ Bulk operations (delete, complete)

### Dashboard
- ✅ Task statistics (total, completed, pending, overdue)
- ✅ Monthly trend charts
- ✅ Today's tasks list
- ✅ Upcoming tasks
- ✅ Recent activity feed

### Calendar
- ✅ Month view with task indicators
- ✅ Date selection
- ✅ Navigate between months
- ✅ Show tasks for selected date

### Reports
- ✅ Task status breakdown (doughnut chart)
- ✅ Category distribution (bar chart)
- ✅ Priority breakdown (pie chart)
- ✅ Daily/monthly trends (line chart)
- ✅ Detailed task table
- ✅ Filter by date range

### Categories
- ✅ List all categories
- ✅ Create category
- ✅ Edit category
- ✅ Delete category
- ✅ Color-coded categories
- ✅ Task count per category

### Notifications
- ✅ Fetch notifications
- ✅ Mark single as read
- ✅ Mark all as read
- ✅ Delete notification
- ✅ Unread count badge

### Activity Log
- ✅ Display user activities
- ✅ Filter by action type
- ✅ Pagination
- ✅ Timestamp formatting

### Profile
- ✅ View user profile
- ✅ Update profile info
- ✅ Change password
- ✅ View task statistics
- ✅ Recent activity

### Settings
- ✅ Account settings
- ✅ Notification preferences
- ✅ Appearance settings
- ✅ Regional settings

## Testing Locally

### Login
1. Start backend: `npm run dev` (in backend folder)
2. Start frontend: `npm run dev` (in frontend folder)
3. Visit http://localhost:3000
4. Enter test credentials (check backend seed data)
5. Should redirect to /dashboard

### Task Management
1. Click "Add Task" button
2. Fill in task form
3. Click "Create Task"
4. Should appear in tasks list
5. Edit, delete, or mark complete
6. Check dashboard stats update

### Navigation
- Use sidebar to navigate between pages
- Use bottom nav on mobile
- Click user avatar for profile/logout

## Build for Production

```bash
npm run build
npm start
```

Output optimized for production:
- Code splitting
- Image optimization
- CSS minification
- JavaScript minification

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Other Platforms
1. Build: `npm run build`
2. Upload to hosting platform
3. Set environment variable: `NEXT_PUBLIC_API_URL`
4. Start with: `npm start`

## Troubleshooting

### "Cannot find module" errors
```bash
npm install
rm -rf .next
npm run build
```

### Port 3000 in use
Dev server will use next available port (3001, 3002, etc.)

### API connection errors
- Verify backend is running on port 5000
- Check `.env.local` has correct URL
- Look at browser console for error details
- Verify MongoDB is running (backend requirement)

### Authentication errors
- Check localStorage for token corruption
- Clear browser cache/cookies
- Restart dev server
- Re-login

### Build errors
```bash
npm run lint
npm run build
```

## Performance Optimizations

- ✅ Code splitting with dynamic imports
- ✅ Image optimization
- ✅ Debounced search (500ms)
- ✅ API pagination
- ✅ Lazy loading components
- ✅ Minimal dependencies
- ✅ CSS-in-JS optimization

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Security

- ✅ JWT token-based auth
- ✅ HttpOnly cookies support
- ✅ CORS configured
- ✅ XSS protection (Next.js built-in)
- ✅ CSRF tokens (if backend supports)
- ✅ Rate limiting (backend enforced)

## Development Workflow

### Making Changes
1. Edit files in your editor
2. Hot reload happens automatically
3. Check browser console for errors
4. Test functionality

### Adding New Features
1. Create API service in `/services` if needed
2. Create component in `/components`
3. Import and use in relevant page
4. Test with backend running

### Code Quality
```bash
npm run lint          # Check code style
npm run build         # Full build test
npm run dev          # Development mode
```

## Useful Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm start` | Start prod server |
| `npm run lint` | Check code style |
| `rm -rf .next` | Clear build cache |

## Environment Variables

### Development
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Production
```
NEXT_PUBLIC_API_URL=https://your-backend-url/api
```

## Additional Resources

- **Backend Setup**: See backend/README.md
- **API Docs**: Backend provides endpoint documentation
- **Next.js Docs**: https://nextjs.org/docs
- **React Docs**: https://react.dev
- **Tailwind Docs**: https://tailwindcss.com

## Support

For issues:
1. Check console errors
2. Verify backend is running
3. Check environment variables
4. Clear cache and rebuild
5. Check API response in Network tab

---

**Last Updated**: 2026-08-08
**Version**: 1.0.0
**Status**: Production Ready
