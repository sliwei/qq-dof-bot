import { Context, Next } from 'koa'

/**
 * @swagger
 * /api/test/get:
 *   get:
 *     tags:
 *       - test
 *     summary: 测试GET
 *     description: 说明
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: query
 *         name: a
 *         type: string
 *         description: 入参
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
const get = async (ctx: Context, next: Next) => {
  ctx.DATA.data = ctx.WxAccessToken
  ctx.DATA.msg = 'This is the GET test.'
  ctx.body = ctx.DATA
}

/**
 * @swagger
 * /api/test/post:
 *   post:
 *     tags:
 *       - test
 *     summary: 测试POST
 *     description: 说明
 *     requestBody:
 *       description: Pet object that needs to be added to the store
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               a:
 *                 type: string
 *                 description: 参数a
 *               b:
 *                 type: number
 *                 description: 参数b
 *     responses:
 *       '200':
 *         description: 成功说明
 *       '400':
 *         description: 失败说明
 */
const post = async (ctx: Context, next: Next) => {
  // ctx.DATA.data = ctx.request.body
  // ctx.DATA.msg = 'This is the POST test.'
  ctx.body = ctx.DATA
}

export { get, post }
