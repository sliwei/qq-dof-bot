# qq-dof-bot
q群机器人-dof互动

> 基于koa/ts/sequelize/mariadb/redis/swagger,node@18

## 开发/运行

src/config/index.ts是变量信息,开发使用默认变量,生产环境运行时,先赋值需要修改的变量

```
# 安装依赖
yarn
# 开发
yarn dev
# 编译
yarn build

# 运行
export env1=xxx
export env2=xxx
node dist/index.js
```

## 部署

使用drone自动部署到服务器docker容器,配置看.drone.jsonnet文件