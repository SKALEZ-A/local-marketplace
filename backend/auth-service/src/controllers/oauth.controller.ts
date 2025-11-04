import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, generateRefreshToken } from '../utils/jwt';
import { redisClient } from '../config/redis';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export const oauthCallback = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const oauthUser = req.user as any;

    if (!oauthUser) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: oauthUser.email }
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email: oauthUser.email,
          firstName: oauthUser.firstName,
          lastName: oauthUser.lastName,
          isVerified: true,
          password: '', // OAuth users don't have password
          role: 'buyer'
        }
      });

      // Create OAuth account link
      await prisma.oAuthAccount.create({
        data: {
          userId: user.id,
          provider: oauthUser.provider,
          providerUserId: oauthUser.providerId,
          accessToken: oauthUser.accessToken,
          refreshToken: oauthUser.refreshToken
        }
      });

      logger.info(`New user created via OAuth: ${user.email}`);
    } else {
      // Check if OAuth account already linked
      const existingOAuth = await prisma.oAuthAccount.findFirst({
        where: {
          userId: user.id,
          provider: oauthUser.provider
        }
      });

      if (!existingOAuth) {
        // Link OAuth account to existing user
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider: oauthUser.provider,
            providerUserId: oauthUser.providerId,
            accessToken: oauthUser.accessToken,
            refreshToken: oauthUser.refreshToken
          }
        });
      } else {
        // Update OAuth tokens
        await prisma.oAuthAccount.update({
          where: { id: existingOAuth.id },
          data: {
            accessToken: oauthUser.accessToken,
            refreshToken: oauthUser.refreshToken
          }
        });
      }
    }

    // Generate tokens
    const accessToken = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });
    const refreshToken = generateRefreshToken({ userId: user.id });

    // Store refresh token in Redis
    await redisClient.setEx(
      `refresh_token:${user.id}`,
      7 * 24 * 60 * 60,
      refreshToken
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    logger.info(`User logged in via OAuth: ${user.email}`);

    // Redirect to frontend with tokens
    res.redirect(
      `${process.env.FRONTEND_URL}/auth/callback?accessToken=${accessToken}&refreshToken=${refreshToken}`
    );
  } catch (error) {
    logger.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};
