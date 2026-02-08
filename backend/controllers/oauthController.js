const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        scope: ['profile', 'email']
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ oauthId: profile.id, oauthProvider: 'google' });

          if (user) {
            user.lastLogin = Date.now();
            await user.save();
            return done(null, user);
          }

          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            user.oauthProvider = 'google';
            user.oauthId = profile.id;
            user.authMethod = 'google';
            user.lastLogin = Date.now();
            await user.save();
            return done(null, user);
          }

          const newUser = await User.create({
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            email: profile.emails[0].value,
            authMethod: 'google',
            oauthProvider: 'google',
            oauthId: profile.id,
            profilePhotoUrl: profile.photos[0]?.value || '',
            isActive: true,
            lastLogin: Date.now()
          });

          done(null, newUser);
        } catch (error) {
          console.error('Erreur OAuth Google:', error);
          done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
}

exports.googleAuth = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({
      success: false,
      message: 'Google OAuth non configuré'
    });
  }
  
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
};

exports.googleCallback = (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_not_configured`);
  }

  passport.authenticate('google', { session: false }, async (err, user, info) => {
    try {
      if (err || !user) {
        console.error('Erreur callback Google:', err);
        return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
      }

      if (user.twoFactorEnabled) {
        return res.redirect(
          `${process.env.FRONTEND_URL}/auth/2fa?userId=${user._id}&provider=google`
        );
      }

      const token = user.getSignedJwtToken();

      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('Erreur traitement callback:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=server_error`);
    }
  })(req, res, next);
};

exports.getProviders = (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      providers: [
        {
          name: 'google',
          enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
          displayName: 'Google'
        }
      ]
    }
  });
};
