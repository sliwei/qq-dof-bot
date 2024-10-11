import log4js from 'log4js'

const levels = {
  trace: log4js.levels.TRACE,
  debug: log4js.levels.DEBUG,
  info: log4js.levels.INFO,
  warn: log4js.levels.WARN,
  error: log4js.levels.ERROR,
  fatal: log4js.levels.FATAL
}

// log4js配置
log4js.configure({
  appenders: {
    console: { type: 'console' },
    info: {
      type: 'dateFile',
      filename: 'logs/log',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true // 设置文件名称为 filename + pattern
    },
    error: {
      type: 'dateFile',
      filename: 'logs/err',
      pattern: 'yyyy-MM-dd.log',
      alwaysIncludePattern: true // 设置文件名称为 filename + pattern
    }
  },
  categories: {
    default: {
      appenders: ['console'],
      level: 'debug'
    },
    info: {
      appenders: ['info', 'console'],
      level: 'info'
    },
    error: {
      appenders: ['error', 'console'],
      level: 'error'
    }
  }
})

/**
 * 日志输出 level为bug
 * @param { string } message: any, ...args: any[]
 */
const debug = (message: any, ...args: any[]) => {
  let logger = log4js.getLogger('debug')
  logger.level = levels.debug
  logger.debug(message, ...args)
}

/**
 * 日志输出 level为info
 * @param { string } message: any, ...args: any[]
 */
const info = (message: any, ...args: any[]) => {
  let logger = log4js.getLogger('info')
  logger.level = levels.info
  logger.info(message, ...args)
}

/**
 * 日志输出 level为error
 * @param { string } message: any, ...args: any[]
 */
const error = (message: any, ...args: any[]) => {
  let logger = log4js.getLogger('error')
  logger.level = levels.error
  logger.error(message, ...args)
}

export { debug, info, error }
