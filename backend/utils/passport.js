const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NODE_ENV === 'production' 
        ? 'https://your-backend-url.render.com/api/auth/google/callback'
        : 'http://localhost:5000/api/auth/google/callback'
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }

        // Check if user exists with the same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.isVerified = true; // Google accounts are verified
          user.lastLogin = new Date();
          
          // Update profile picture if user doesn't have one
          if (!user.profilePicture && profile.photos && profile.photos.length > 0) {
            user.profilePicture = profile.photos[0].value;
          }
          
          await user.save();
          return done(null, user);
        }

        // Create new user
        const newUser = new User({
          googleId: profile.id,
          username: await generateUniqueUsername(profile.displayName || profile.emails[0].value.split('@')[0]),
          email: profile.emails[0].value,
          fullName: profile.displayName || 'Google User',
          profilePicture: profile.photos && profile.photos.length > 0 ? profile.photos[0].value : '',
          isVerified: true,
          lastLogin: new Date()
        });

        const savedUser = await newUser.save();
        done(null, savedUser);
      } catch (error) {
        console.error('Google OAuth error:', error);
        done(error, null);
      }
    }
  )
);

// Generate unique username
async function generateUniqueUsername(baseName) {
  // Clean the base name
  let username = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  if (username.length < 3) {
    username = 'user' + Math.floor(Math.random() * 10000);
  }

  // Check if username is unique
  let isUnique = false;
  let counter = 0;
  let finalUsername = username;

  while (!isUnique) {
    const existingUser = await User.findOne({ username: finalUsername });
    
    if (!existingUser) {
      isUnique = true;
    } else {
      counter++;
      finalUsername = `${username}${counter}`;
      
      // Prevent infinite loop
      if (counter > 9999) {
        finalUsername = username + Date.now();
        isUnique = true;
      }
    }
  }

  return finalUsername;
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user._id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id).select('-password');
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;