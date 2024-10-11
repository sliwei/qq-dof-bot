import { Context } from 'koa'

const index = async (ctx: Context) => {
  await ctx.render('index')
}

export { index }
