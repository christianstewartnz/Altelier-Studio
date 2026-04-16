import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const generateRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "24 h"),
  analytics: true,
  prefix: "atelier_generate"
})

export const refineRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "24 h"),
  analytics: true,
  prefix: "atelier_refine"
})
