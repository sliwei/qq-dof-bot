import jwt from 'jsonwebtoken'
import conf from '../../config'
import { Context, Next } from 'koa'
import createHttpError from 'http-errors'

/**
 * 创建token
 * @param dat
 * @returns {*}
 */
export const createToken = (dat: any) => {
  return jwt.sign(dat, conf.encryptedCharacter, {
    expiresIn: conf.expirationDate / 1000 + 's'
  })
}

/**
 * 检测token合法性
 * @param ctx
 * @param next
 * @returns {Promise<void>}
 */
export const checkToken = async (ctx: Context, next: Next) => {
  let token = ctx.get('Authorization') || ctx.get('authorization') || ctx.get('token')
  token = token.replace(/Bearer /g, '')
  if (!token) {
    throw createHttpError(401, 'Authorization is empty')
  }
  try {
    jwt.verify(token, conf.encryptedCharacter, (err, decoded) => {
      if (err) {
        throw createHttpError(401, 'unauthorized')
      } else {
        ctx.USER = decoded
      }
    })
  } catch (err) {
    throw createHttpError(401, 'checkToken error')
  }
  await next()
}
