import { createClient } from 'redis'
import conf from '../../config'

const redisClient = createClient({
  // redis[s]://[[username][:password]@][host][:port][/db-number]
  url: conf.redis
})

export { redisClient }
