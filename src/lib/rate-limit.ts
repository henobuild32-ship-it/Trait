const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  key?: string
}

export function checkRateLimit(config: RateLimitConfig): { allowed: boolean; remaining: number; resetIn: number } {
  const { windowMs, maxRequests, key = 'global' } = config
  const now = Date.now()
  const record = rateLimitStore.get(key)

  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxRequests - 1, resetIn: windowMs }
  }

  if (record.count >= maxRequests) {
    const resetIn = Math.ceil((record.resetTime - now) / 1000)
    return { allowed: false, remaining: 0, resetIn }
  }

  record.count++
  return { allowed: true, remaining: maxRequests - record.count, resetIn: Math.ceil((record.resetTime - now) / 1000) }
}

export function rateLimitResponse(resetIn: number) {
  return new Response(
    JSON.stringify({
      success: false,
      message: `Trop de requêtes. Réessayez dans ${resetIn} secondes.`,
      retryAfter: resetIn,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(resetIn),
        'X-RateLimit-RetryAfter': String(resetIn),
      },
    }
  )
}
