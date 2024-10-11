import nodemailer from 'nodemailer'
import conf from '../../config'
import { Context, Next } from 'koa'

/**
 * 邮箱注册
 */
export const mailer = async (ctx: Context, next: Next) => {
  ctx.mailer = nodemailer.createTransport({
    // @ts-ignore
    host: 'smtp.exmail.qq.com', // 这是腾讯的邮箱 host
    port: 465, // smtp 端口
    secureConnection: true,
    auth: {
      user: conf.mail.user, // 发送邮件的邮箱名
      pass: conf.mail.pass // 邮箱的授权码，也可以使用邮箱登陆密码
    }
  })
  await next()
}
