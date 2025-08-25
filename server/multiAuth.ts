import * as client from "openid-client";
import { Strategy as OpenIDStrategy, type VerifyFunction } from "openid-client/passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-ignore
import { Strategy as AppleStrategy } from "passport-apple";
// @ts-ignore
import { Strategy as MicrosoftStrategy } from "passport-microsoft";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

// Configuration for multiple OAuth providers
interface OAuthConfig {
  google?: {
    clientId: string;
    clientSecret: string;
  };
  apple?: {
    clientId: string;
    teamId: string;
    keyId: string;
    privateKey: string;
  };
  microsoft?: {
    clientId: string;
    clientSecret: string;
  };
  replit?: boolean;
}

// Enhanced user session with provider information
interface UserSession {
  claims: any;
  access_token?: string;
  refresh_token?: string;
  expires_at?: number;
  provider: string;
  providerId: string;
}

// Get OAuth configuration from environment
function getOAuthConfig(): OAuthConfig {
  const config: OAuthConfig = {};

  // Google OAuth config
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    config.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  // Apple OAuth config
  if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && 
      process.env.APPLE_KEY_ID && process.env.APPLE_PRIVATE_KEY) {
    config.apple = {
      clientId: process.env.APPLE_CLIENT_ID,
      teamId: process.env.APPLE_TEAM_ID,
      keyId: process.env.APPLE_KEY_ID,
      privateKey: process.env.APPLE_PRIVATE_KEY,
    };
  }

  // Microsoft OAuth config
  if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    config.microsoft = {
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
    };
  }

  // Replit OAuth (existing)
  if (process.env.REPLIT_DOMAINS) {
    config.replit = true;
  }

  return config;
}

// Replit OAuth setup (existing)
const getOidcConfig = memoize(
  async () => {
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET || "fallback-secret-for-dev",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

// Normalize user data from different providers
function normalizeUserData(profile: any, provider: string) {
  let userData: any = {};

  switch (provider) {
    case 'google':
      userData = {
        id: `google_${profile.id}`,
        email: profile.emails?.[0]?.value || null,
        firstName: profile.name?.givenName || null,
        lastName: profile.name?.familyName || null,
        profileImageUrl: profile.photos?.[0]?.value || null,
      };
      break;

    case 'apple':
      userData = {
        id: `apple_${profile.id}`,
        email: profile.email || null,
        firstName: profile.name?.firstName || null,
        lastName: profile.name?.lastName || null,
        profileImageUrl: null,
      };
      break;

    case 'microsoft':
      userData = {
        id: `microsoft_${profile.id}`,
        email: profile.emails?.[0]?.value || profile._json?.mail || null,
        firstName: profile.name?.givenName || null,
        lastName: profile.name?.familyName || null,
        profileImageUrl: profile.photos?.[0]?.value || null,
      };
      break;

    case 'replit':
      userData = {
        id: profile.sub,
        email: profile.email,
        firstName: profile.first_name,
        lastName: profile.last_name,
        profileImageUrl: profile.profile_image_url,
      };
      break;

    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  return userData;
}

// Update user session with token information
function updateUserSession(
  user: UserSession,
  tokens: any,
  provider: string,
  providerId: string
) {
  user.claims = tokens.claims ? tokens.claims() : tokens;
  user.access_token = tokens.access_token;
  user.refresh_token = tokens.refresh_token;
  user.expires_at = tokens.expires_at || (Date.now() / 1000) + 3600; // Default 1 hour
  user.provider = provider;
  user.providerId = providerId;
}

// Setup multiple OAuth providers
export async function setupMultiAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  const oauthConfig = getOAuthConfig();
  const baseUrl = process.env.NODE_ENV === "production" 
    ? `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost'}`
    : 'http://localhost:5000';

  // Passport serialization
  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  // Google OAuth Strategy
  if (oauthConfig.google) {
    passport.use(new GoogleStrategy({
      clientID: oauthConfig.google.clientId,
      clientSecret: oauthConfig.google.clientSecret,
      callbackURL: `${baseUrl}/api/auth/google/callback`,
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const userData = normalizeUserData(profile, 'google');
        await storage.upsertUser(userData);
        
        const user: UserSession = {} as UserSession;
        updateUserSession(user, {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Date.now() / 1000 + 3600,
        }, 'google', profile.id);
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Apple OAuth Strategy
  if (oauthConfig.apple) {
    passport.use(new AppleStrategy({
      clientID: oauthConfig.apple.clientId,
      teamID: oauthConfig.apple.teamId,
      keyID: oauthConfig.apple.keyId,
      privateKey: oauthConfig.apple.privateKey,
      callbackURL: `${baseUrl}/api/auth/apple/callback`,
      scope: ['name', 'email'],
    }, async (accessToken, refreshToken, idToken, profile, done) => {
      try {
        const userData = normalizeUserData(profile, 'apple');
        await storage.upsertUser(userData);
        
        const user: UserSession = {} as UserSession;
        updateUserSession(user, {
          access_token: accessToken,
          refresh_token: refreshToken,
          id_token: idToken,
          expires_at: Date.now() / 1000 + 3600,
        }, 'apple', profile.id);
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Microsoft OAuth Strategy
  if (oauthConfig.microsoft) {
    passport.use(new MicrosoftStrategy({
      clientID: oauthConfig.microsoft.clientId,
      clientSecret: oauthConfig.microsoft.clientSecret,
      callbackURL: `${baseUrl}/api/auth/microsoft/callback`,
      scope: ['user.read'],
    }, async (accessToken, refreshToken, profile, done) => {
      try {
        const userData = normalizeUserData(profile, 'microsoft');
        await storage.upsertUser(userData);
        
        const user: UserSession = {} as UserSession;
        updateUserSession(user, {
          access_token: accessToken,
          refresh_token: refreshToken,
          expires_at: Date.now() / 1000 + 3600,
        }, 'microsoft', profile.id);
        
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }));
  }

  // Replit OAuth Strategy (existing)
  if (oauthConfig.replit && process.env.REPLIT_DOMAINS) {
    const config = await getOidcConfig();

    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      try {
        const claims = tokens.claims();
        const userData = normalizeUserData(claims, 'replit');
        await storage.upsertUser(userData);
        
        const user: UserSession = {} as UserSession;
        updateUserSession(user, tokens, 'replit', claims.sub);
        verified(null, user);
      } catch (error) {
        verified(error, null);
      }
    };

    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      const strategy = new OpenIDStrategy(
        {
          name: `replitauth:${domain}`,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }
  }

  // OAuth Routes

  // Google routes
  if (oauthConfig.google) {
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login?error=google' }),
      (req, res) => res.redirect('/'));
  }

  // Apple routes
  if (oauthConfig.apple) {
    app.get('/api/auth/apple',
      passport.authenticate('apple'));
    
    app.get('/api/auth/apple/callback',
      passport.authenticate('apple', { failureRedirect: '/login?error=apple' }),
      (req, res) => res.redirect('/'));
  }

  // Microsoft routes
  if (oauthConfig.microsoft) {
    app.get('/api/auth/microsoft',
      passport.authenticate('microsoft'));
    
    app.get('/api/auth/microsoft/callback',
      passport.authenticate('microsoft', { failureRedirect: '/login?error=microsoft' }),
      (req, res) => res.redirect('/'));
  }

  // Replit routes (existing)
  if (oauthConfig.replit && process.env.REPLIT_DOMAINS) {
    app.get("/api/login", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        prompt: "login consent",
        scope: ["openid", "email", "profile", "offline_access"],
      })(req, res, next);
    });

    app.get("/api/callback", (req, res, next) => {
      passport.authenticate(`replitauth:${req.hostname}`, {
        successReturnToOrRedirect: "/",
        failureRedirect: "/api/login",
      })(req, res, next);
    });

    app.get("/api/logout", async (req, res) => {
      const config = await getOidcConfig();
      req.logout(() => {
        res.redirect(
          client.buildEndSessionUrl(config, {
            client_id: process.env.REPL_ID!,
            post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
          }).href
        );
      });
    });
  }

  // General logout route
  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  // Available providers endpoint
  app.get("/api/auth/providers", (req, res) => {
    const availableProviders = [];
    
    if (oauthConfig.google) availableProviders.push('google');
    if (oauthConfig.apple) availableProviders.push('apple');
    if (oauthConfig.microsoft) availableProviders.push('microsoft');
    if (oauthConfig.replit) availableProviders.push('replit');
    
    res.json({ providers: availableProviders });
  });
}

// Enhanced authentication middleware
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as UserSession;

  if (!req.isAuthenticated() || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Check token expiration
  const now = Math.floor(Date.now() / 1000);
  if (user.expires_at && now > user.expires_at) {
    // Try to refresh token if available
    if (user.refresh_token && user.provider === 'replit') {
      try {
        const config = await getOidcConfig();
        const tokenResponse = await client.refreshTokenGrant(config, user.refresh_token);
        updateUserSession(user, tokenResponse, user.provider, user.providerId);
        return next();
      } catch (error) {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  }

  return next();
};