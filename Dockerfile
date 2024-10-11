FROM node:20.17.0-alpine

ENV TZ "Asia/Shanghai"

COPY dist /www/dist
COPY views /www/views
COPY public /www/public
COPY node_modules /www/node_modules

# 设置变量，其他变量在启动时传入
# xxx1=xxx1
# xxx2=xxx2

WORKDIR /www

EXPOSE 3000

CMD ["node", "dist/index.js"]
