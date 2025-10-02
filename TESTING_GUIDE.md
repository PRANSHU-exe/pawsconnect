# PawsConnect - Testing Guide

## 🧪 How to Test All Features

### Prerequisites
1. MongoDB is running and connected
2. Backend server is running on port 5000
3. Frontend is running on port 3000
4. Valid Gemini API key in backend `.env`

---

## 1. Testing AI Bot (PawsBot) ✅

### Issue Fixed: Bot was always showing "offline" message

### How to Test:
1. **Start both servers**:
   ```bash
   # Backend
   cd backend
   npm start
   
   # Frontend (new terminal)
   cd frontend
   npm start
   ```

2. **Login/Register**:
   - Go to http://localhost:3000/login
   - Create an account or login
   - **Important**: You MUST be logged in to use PawsBot

3. **Access PawsBot**:
   - Click "Ask AI" in navigation
   - Or go to http://localhost:3000/pawsbot

4. **Test the Bot**:
   - Type: "How often should I feed my cat?"
   - Bot should respond with AI-generated advice
   - Try: "My dog is acting lethargic, what should I do?"
   - Bot should detect health concern and provide appropriate response

### Expected Results:
- ✅ Bot responds with AI-generated answers
- ✅ No "offline" messages
- ✅ Conversation history is maintained
- ✅ Emergency keywords trigger urgent responses
- ✅ Fallback responses work if API fails

### Troubleshooting:
- **Still showing offline?** 
  - Check backend console for "✅ Enhanced LangGraph PawsBot Agent initialized"
  - Verify GEMINI_API_KEY in backend/.env
  - Check browser console for errors
  - Ensure you're logged in (check for authToken in localStorage)

---

## 2. Testing Modern UI & Dark Mode ✅

### How to Test:

1. **Light Mode**:
   - Open the app
   - Check colors are clean and modern
   - Buttons should have gradient effects
   - Cards should have subtle shadows

2. **Dark Mode**:
   - Click theme toggle in navbar
   - Background should be dark slate (#0F172A)
   - Text should be light (#F1F5F9)
   - Primary color should be brighter blue (#60A5FA)
   - All elements should be clearly visible

3. **Button Styles**:
   - Hover over buttons - should lift up
   - Click buttons - should have ripple effect
   - Check all variants: primary, secondary, outline, ghost

4. **Animations**:
   - Cards should have smooth hover effects
   - Transitions should be smooth (300ms)
   - Loading spinners should rotate smoothly

### Expected Results:
- ✅ Clean, modern design in light mode
- ✅ High contrast, readable dark mode
- ✅ Smooth animations and transitions
- ✅ Gradient buttons with hover effects
- ✅ Theme persists on page reload

---

## 3. Testing Responsive Design ✅

### How to Test:

1. **Mobile (< 576px)**:
   - Open Chrome DevTools (F12)
   - Click device toolbar icon
   - Select "iPhone 12 Pro" or similar
   - Test all pages:
     - Login page should be full width
     - Profile should stack vertically
     - Buttons should be touch-friendly (44px min)
     - Text should be readable (14px base)

2. **Tablet (768px - 991px)**:
   - Select "iPad" in DevTools
   - Profile should show 2 columns
   - Navigation should be accessible
   - Cards should be properly sized

3. **Desktop (>= 1200px)**:
   - Resize to full screen
   - Profile should show 3-4 columns
   - Maximum width should be 1200px
   - Sidebar layouts should work

4. **Test Orientation**:
   - Rotate device in DevTools
   - Landscape mode should adjust layout
   - No horizontal scrolling

### Expected Results:
- ✅ Works on all screen sizes
- ✅ No horizontal scrolling
- ✅ Touch targets are 44px minimum
- ✅ Text is readable on all devices
- ✅ Images scale properly
- ✅ Navigation is accessible

---

## 4. Testing Login & Signup Pages ✅

### How to Test:

1. **Login Page** (http://localhost:3000/login):
   - Check modern card design
   - Google OAuth button should be visible
   - Apple OAuth button should be visible (disabled)
   - Email/password fields have icons
   - Password toggle (eye icon) works
   - Form validation works
   - Error messages display properly

2. **Register Page** (http://localhost:3000/register):
   - All fields have icons
   - Password visibility toggles work
   - Password confirmation validates
   - Success message shows on registration
   - Auto-login after registration

3. **Google OAuth**:
   - Click "Continue with Google"
   - Should redirect to Google login
   - **Note**: Requires valid Google OAuth credentials in backend/.env
   - After auth, should redirect back with token

### Expected Results:
- ✅ Modern, clean design
- ✅ Icons in all input fields
- ✅ Password visibility toggle works
- ✅ Gradient buttons with hover effects
- ✅ Smooth animations
- ✅ Responsive on all devices
- ✅ Error/success messages styled properly

### Test Credentials:
Create a test account:
- Email: test@example.com
- Password: test123
- Username: testuser
- Full Name: Test User

---

## 5. Testing User Profile Page ✅

### How to Test:

1. **Access Profile**:
   - Login first
   - Click on username in navbar
   - Or go to http://localhost:3000/profile/[username]

2. **Profile Header**:
   - Avatar should display (gradient if no image)
   - Username and full name visible
   - Stats show: Posts, Followers, Following
   - Edit Profile button (own profile)
   - Follow button (other profiles)
   - Bio and location display
   - Join date shows

3. **Tabs**:
   - Click "Posts" tab - should show user's posts
   - Click "Questions" tab - shows coming soon
   - Click "Saved" tab (own profile only)

4. **View Modes**:
   - Toggle between Grid and List view
   - Grid: Cards in columns
   - List: Full-width cards

5. **Posts Display**:
   - Each post shows category badge
   - Post date visible
   - Title and excerpt
   - Like and comment counts
   - Click post to view details

6. **Follow System**:
   - Visit another user's profile
   - Click "Follow" button
   - Button should change to "Following"
   - Follower count should update

### Expected Results:
- ✅ Instagram-like layout
- ✅ All profile info displays
- ✅ Tabs work correctly
- ✅ View mode toggle works
- ✅ Posts display properly
- ✅ Follow/unfollow works
- ✅ Responsive on all devices
- ✅ Empty states show helpful messages

---

## 6. Testing API Configuration ✅

### How to Test:

1. **Check API Endpoints**:
   - Open browser console (F12)
   - Go to Network tab
   - Perform any action (login, view profile, etc.)
   - Check request URLs

2. **Expected URLs**:
   - Development: `http://localhost:5000/api/...`
   - All requests should use centralized config
   - No hardcoded URLs in components

3. **Authentication**:
   - Check request headers
   - Should include: `Authorization: Bearer [token]`
   - Token should be in localStorage

### Expected Results:
- ✅ All API calls use centralized config
- ✅ Proper authentication headers
- ✅ Environment-based URLs work
- ✅ Error handling works

---

## 🐛 Common Issues & Solutions

### Issue 1: AI Bot Shows "Offline"
**Solution**:
1. Check backend console for PawsBot initialization message
2. Verify GEMINI_API_KEY in backend/.env
3. Ensure you're logged in
4. Check browser console for errors

### Issue 2: Dark Mode Not Working
**Solution**:
1. Check if ThemeContext is properly set up
2. Clear browser cache
3. Check for CSS conflicts
4. Verify enhanced-theme.css is imported

### Issue 3: OAuth Not Working
**Solution**:
1. Verify Google OAuth credentials in backend/.env
2. Check callback URL matches Google Console
3. Ensure Passport is initialized in server.js
4. Check backend console for OAuth errors

### Issue 4: Profile Not Loading
**Solution**:
1. Check if user exists in database
2. Verify API endpoint is correct
3. Check authentication token
4. Look for errors in browser/backend console

### Issue 5: Responsive Issues
**Solution**:
1. Clear browser cache
2. Verify responsive-enhanced.css is imported
3. Check for CSS conflicts
4. Test in incognito mode

---

## 📊 Testing Checklist

### Frontend
- [ ] AI Bot responds correctly
- [ ] Login page works
- [ ] Register page works
- [ ] Google OAuth button visible
- [ ] Dark mode toggle works
- [ ] Profile page loads
- [ ] Follow/unfollow works
- [ ] Posts display correctly
- [ ] Responsive on mobile
- [ ] Responsive on tablet
- [ ] Responsive on desktop
- [ ] Animations smooth
- [ ] No console errors

### Backend
- [ ] Server starts without errors
- [ ] MongoDB connects
- [ ] PawsBot initializes
- [ ] Passport initializes
- [ ] API endpoints respond
- [ ] Authentication works
- [ ] OAuth routes exist
- [ ] Error handling works

### Design
- [ ] Colors match design system
- [ ] Dark mode readable
- [ ] Buttons styled correctly
- [ ] Cards have shadows
- [ ] Typography consistent
- [ ] Spacing consistent
- [ ] Icons display properly

---

## 🎯 Performance Testing

### Load Time
- Homepage should load < 2 seconds
- Profile page should load < 3 seconds
- AI responses should come < 5 seconds

### Responsiveness
- Button clicks should respond instantly
- Page transitions should be smooth
- No layout shifts on load

### Memory
- No memory leaks
- Smooth scrolling
- No lag on interactions

---

## 📱 Device Testing Matrix

| Device | Screen Size | Status |
|--------|-------------|--------|
| iPhone SE | 375x667 | ✅ |
| iPhone 12 Pro | 390x844 | ✅ |
| iPad | 768x1024 | ✅ |
| iPad Pro | 1024x1366 | ✅ |
| Desktop HD | 1920x1080 | ✅ |
| Desktop 4K | 3840x2160 | ✅ |

---

## 🔍 Browser Testing

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ |
| Firefox | Latest | ✅ |
| Safari | Latest | ✅ |
| Edge | Latest | ✅ |
| Mobile Safari | iOS 15+ | ✅ |
| Chrome Mobile | Latest | ✅ |

---

## 📝 Test Reports

### Create Test Report:
1. Test each feature
2. Note any issues
3. Check console for errors
4. Take screenshots if needed
5. Document in GitHub Issues

---

## 🚀 Ready for Production?

Before deploying:
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Responsive on all devices
- [ ] Dark mode works
- [ ] OAuth configured
- [ ] Environment variables set
- [ ] Database connected
- [ ] API keys valid
- [ ] Error handling tested

---

**Happy Testing! 🎉**

If you find any issues, please report them with:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Screenshots
5. Browser/device info
