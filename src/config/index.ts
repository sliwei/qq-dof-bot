import * as logs from '../utils/log4js'

/**
 * 配置文件
 */
const config = {
  title: 'qq-dof-bot',
  env: process.env.NODE_ENV || 'development', // development || production
  port: 3000, // 端口
  appID: process.env.APPID || 'xxx',
  token: process.env.TOKEN || 'xxx',
  expirationDate: 1000 * 3600 * 24 * 7, // 7天
  encryptedCharacter: 'JcqlC3eT', // 验证码加盐
  svgCaptchaExpire: 60, // 验证码Redis过期时间
  mail: {
    from: process.env.MAIL_FROM || 'xxx@xxx.com', // 标题发件人
    user: process.env.MAIL_USER || 'xxx@xxx.com', // 登录人
    pass: process.env.MAIL_PASS || 'xxx' // 密码
  },
  db: {
    database: process.env.DB_database || 'xx',
    username: process.env.DB_username || 'xx',
    password: process.env.DB_password || 'xx',
    host: process.env.DB_host || 'xx.cn',
    port: process.env.DB_port || '3306'
  },
  redis: process.env.RD_url || 'redis://default:xx@xx.cn:6379/0',
  weapp: {
    appid: 'xx',
    secret: 'xx'
  }
}

logs.info('ENV:', config.env)
// logs.info('DB_HOST:', config.db.host)
// logs.info('DB_DATABASE:', config.db.database)

export default config
