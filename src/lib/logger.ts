const isDev = process.env.NODE_ENV !== 'production'

function safeStringify(obj: unknown) {
  try {
    return typeof obj === 'string' ? obj : JSON.stringify(obj)
  } catch {
    return String(obj)
  }
}

export function debug(...args: unknown[]) {
  if (!isDev) return
  try {
    console.debug('[debug]', ...args)
  } catch {}
}

export function info(...args: unknown[]) {
  try {
    console.info('[info]', ...args)
  } catch {}
}

export function error(message: string, meta?: Record<string, any> | Error | unknown) {
  try {
    if (meta) {
      console.error('[error]', message, safeStringify(meta))
    } else {
      console.error('[error]', message)
    }
  } catch {}
}

export function warn(message: string, meta?: Record<string, any> | Error | unknown) {
  try {
    if (meta) {
      console.warn('[warn]', message, safeStringify(meta))
    } else {
      console.warn('[warn]', message)
    }
  } catch {}
}

export default { debug, info, error, warn }
