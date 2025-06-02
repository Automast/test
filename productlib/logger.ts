// productlib/logger.ts
const isBrowser = typeof window !== 'undefined';

const logger = {
  info: (...args: any[]) => {
    if (isBrowser || process.env.NODE_ENV === 'development') {
      console.log('[FE_INFO]', ...args);
    }
  },
  warn: (...args: any[]) => {
    if (isBrowser || process.env.NODE_ENV === 'development') {
      console.warn('[FE_WARN]', ...args);
    }
  },
  error: (...args: any[]) => {
    if (isBrowser || process.env.NODE_ENV === 'development') {
      console.error('[FE_ERROR]', ...args);
    }
  },
};

export default logger;