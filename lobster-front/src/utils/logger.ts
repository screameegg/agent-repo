import { ENV } from '../config/env';

const logger = {
  info: (...args: unknown[]) => {
    if (ENV.IS_DEV) console.info('[Info]', ...args);
  },
  error: (...args: unknown[]) => {
    if (ENV.IS_DEV) console.error('[Error]', ...args);
  },
  warn: (...args: unknown[]) => {
    if (ENV.IS_DEV) console.warn('[Warn]', ...args);
  },
};

export default logger;
