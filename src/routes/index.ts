import koaRouter from 'koa-router'
import swaggerJsdoc from 'swagger-jsdoc'
import { join } from 'path'
import conf from '../config'
import createHttpError from 'http-errors'
// 中间件
import { mailer } from '../utils/nodemailer' // 发邮件
import { checkToken } from '../utils/jwt' // jwt token校验
import { wxAccessToken } from '../utils/weapp' // 微信中间件
// controllers
import * as test from '../controllers/test'
import * as index from '../controllers/index'

const router = new koaRouter()

// test
router.get('/api/test/get', test.get)
router.post('/api/test/post', test.post)
// swagger json
const jsDoc = swaggerJsdoc({
  definition: {
    openapi: '3.0.1',
    info: {
      description: '服务端',
      version: '1.0.0',
      title: '服务端'
    },
    host: '',
    basePath: '/',
    // tags: [
    //   {
    //     name: 'test',
    //     description: 'auth'
    //   }
    // ],
    schemes: ['http', 'https'],
    // components: {
    //   schemas: {
    //     Order: {
    //       type: 'object'
    //     }
    //   },
    //   securitySchemes: {
    //     BasicAuth: { type: 'http', scheme: 'basic' }
    //   }
    // }
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [join(__dirname, '../controllers/*.js')]
})
router.get('/api/swagger.json', async (ctx) => {
  ctx.set('Content-Type', 'application/json')
  if (conf.env === 'development') {
    ctx.body = jsDoc
  } else {
    throw createHttpError(404)
  }
})
// index
router.get('/', index.index)

export default router
