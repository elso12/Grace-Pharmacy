import { Request, Response, NextFunction } from 'express';

// ─── Constants & Configuration ──────────────────────────────────────────────
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'creditCard', 'cardNumber', 'cvv', 'jwt'];
const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Helper: Masking ────────────────────────────────────────────────────────
/**
 * Recursively redacts sensitive fields from objects.
 */
function maskSensitiveData(data: any): any {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  
  if (Array.isArray(data)) {
    return data.map(maskSensitiveData);
  }

  const masked = { ...data };
  for (const key of Object.keys(masked)) {
    if (SENSITIVE_KEYS.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      masked[key] = '[REDACTED]';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  return masked;
}

// ─── Formatter functions ────────────────────────────────────────────────────
function formatLog(level: 'INFO' | 'WARN' | 'ERROR', message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  let logStr = `${timestamp} [${level}] ${message}`;

  if (meta) {
    const maskedMeta = maskSensitiveData(meta);
    if (level === 'ERROR' && meta instanceof Error) {
      logStr += ` | ${meta.message}`;
      if (IS_DEV && meta.stack) {
        logStr += `\n${meta.stack}`;
      }
    } else {
      logStr += ` | ${JSON.stringify(maskedMeta)}`;
    }
  }

  return logStr;
}

// ─── Logger Interface ───────────────────────────────────────────────────────
export const logger = {
  info: (message: string, meta?: any) => console.log(formatLog('INFO', message, meta)),
  warn: (message: string, meta?: any) => console.warn(formatLog('WARN', message, meta)),
  error: (message: string, meta?: any) => console.error(formatLog('ERROR', message, meta)),
};

// ─── Express Middleware ─────────────────────────────────────────────────────
/**
 * Express middleware to log incoming requests and response times.
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  // Mask headers
  const safeHeaders = maskSensitiveData(req.headers);

  // We only log the request start if it's a mutation to keep logs clean,
  // but we always log the response completion.
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const level = statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';
    const message = `${method} ${originalUrl} ${statusCode} ${duration}ms`;
    
    if (level === 'ERROR' || level === 'WARN') {
      // For errors, include the body and query for debugging
      const safeBody = maskSensitiveData(req.body);
      const safeQuery = maskSensitiveData(req.query);
      logger[level.toLowerCase() as 'error' | 'warn'](message, { body: safeBody, query: safeQuery, headers: safeHeaders });
    } else {
      logger.info(message);
    }
  });

  next();
};
