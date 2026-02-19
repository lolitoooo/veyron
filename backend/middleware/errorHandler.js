const Sentry = require('@sentry/node');
const notificationService = require('../services/notificationService');

if (process.env.GLITCHTIP_DSN) {
  Sentry.init({
    dsn: process.env.GLITCHTIP_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
  console.log('[GlitchTip] Monitoring d\'erreurs activé');
} else {
  console.log('[GlitchTip] Monitoring désactivé (GLITCHTIP_DSN non configuré)');
}

const requestHandler = Sentry.Handlers.requestHandler();


const tracingHandler = Sentry.Handlers.tracingHandler();

const notFound = (req, res, next) => {
  const error = new Error(`Non trouvé - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = async (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  console.error('[Error Handler]', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    statusCode
  });

  if (process.env.GLITCHTIP_DSN) {
    Sentry.captureException(err, {
      tags: {
        endpoint: req.originalUrl,
        method: req.method,
      },
      user: req.user ? {
        id: req.user._id,
        email: req.user.email,
        role: req.user.role,
      } : undefined,
      extra: {
        body: req.body,
        query: req.query,
        params: req.params,
      }
    });
  }

  if (statusCode >= 500) {
    try {
      await notificationService.notifyCriticalError(err, `${req.method} ${req.originalUrl}`);
    } catch (notifError) {
      console.error('[Notification] Erreur envoi notification:', notifError.message);
    }
  }

  res.status(statusCode).json({
    success: false,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    ...(process.env.NODE_ENV === 'development' && {
      error: {
        name: err.name,
        code: err.code,
      }
    })
  });
};

const sentryErrorHandler = Sentry.Handlers.errorHandler({
  shouldHandleError(error) {
    return error.status >= 400;
  }
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  if (process.env.GLITCHTIP_DSN) {
    Sentry.captureException(reason);
  }
  
  notificationService.notifyCriticalError(
    new Error(`Unhandled Rejection: ${reason}`),
    'Process unhandledRejection'
  );
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  if (process.env.GLITCHTIP_DSN) {
    Sentry.captureException(error);
  }
  
  notificationService.notifyCriticalError(error, 'Process uncaughtException');
  
  process.exit(1);
});

module.exports = {
  Sentry,
  requestHandler,
  tracingHandler,
  sentryErrorHandler,
  notFound,
  errorHandler
};
