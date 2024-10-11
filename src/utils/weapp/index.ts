import { Context, Next } from 'koa'
import createHttpError from 'http-errors'
import fetch from 'node-fetch'
import { redisClient } from '../redis'
import conf from '../../config'
import * as logs from '../log4js'

/**
 * 小程序access_token
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
export const wxAccessToken = async (ctx: Context, next: Next) => {
  try {
    await redisClient.connect()
    const value = await redisClient.get('WxAccessToken')
    if (value) {
      logs.info('redis access_token:', value)
      ctx.WxAccessToken = value
    } else {
      const response = await fetch(`https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${conf.weapp.appid}&secret=${conf.weapp.secret}`)
      const data: any = await response.json()
      logs.info('新access_token:', data)
      const { access_token, expires_in } = data
      ctx.WxAccessToken = access_token
      await redisClient.set('WxAccessToken', access_token)
      // redis过期时间,1小时59分钟
      await redisClient.expire('WxAccessToken', expires_in - 60)
    }
    await redisClient.disconnect()
  } catch (err) {
    throw createHttpError(401, 'checkToken error')
  }
  await next()
}
