/**
 * 以下仅为用法示意，详情请参照文档：https://bot.q.qq.com/wiki/develop/nodesdk/
 * 其中对官方逻辑扩展，添加了诸多功能，修复了许多问题
 */
import { createOpenAPI, createWebsocket, AvailableIntentsEventsEnum } from 'qq-bot-sdk' // es引用方法
import conf from './config'
import { redisClient } from './utils/redis'

const testConfigWs = {
  appID: conf.appID,
  token: conf.token,
  intents: [AvailableIntentsEventsEnum.GROUP_AND_C2C_EVENT]
}

const client = createOpenAPI(testConfigWs)

const ws = createWebsocket(testConfigWs)
ws.on('READY', (wsdata: any) => {
  console.log('[READY] 事件接收 :', wsdata)
})

ws.on('ERROR', (data) => {
  console.log('[ERROR] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.GUILDS, (data) => {
  console.log('[GUILDS] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.GUILD_MEMBERS, (data) => {
  console.log('[GUILD_MEMBERS] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGES, (data) => {
  console.log('[GUILD_MESSAGES] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.GUILD_MESSAGE_REACTIONS, (data) => {
  console.log('[GUILD_MESSAGE_REACTIONS] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.DIRECT_MESSAGE, (data) => {
  console.log('[DIRECT_MESSAGE] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.INTERACTION, (data) => {
  console.log('[INTERACTION] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.MESSAGE_AUDIT, (data) => {
  console.log('[MESSAGE_AUDIT] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.FORUMS_EVENT, (data) => {
  console.log('[FORUMS_EVENT] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.AUDIO_ACTION, (data) => {
  console.log('[AUDIO_ACTION] 事件接收 :', data)
})
ws.on(AvailableIntentsEventsEnum.PUBLIC_GUILD_MESSAGES, async (data) => {
  console.log('[PUBLIC_GUILD_MESSAGES] 事件接收 :', data)

  // ===== 下方为发送消息接口，请按需取消注释 ======

  // await client.messageApi.postMessage(data.msg.channel_id, {
  //     content: '测试信息'
  // }); // 发送频道消息
})

ws.on(AvailableIntentsEventsEnum.GROUP_AND_C2C_EVENT, async (data) => {
  console.log('[GROUP_AND_C2C_EVENT] 事件接收 :', data)

  // ===== 下方为发送消息接口，请按需取消注释 ======

  // /帮助
  // /签到
  // /查询绑定
  // /绑定角色
  // /解除绑定
  const command = data.msg.content.replace(/^\s+|\s+$/g, '')
  const cmd = command.split(' ')[0]
  const agrs1 = command.split(' ')[1]
  switch (cmd) {
    case '/帮助':
      await client.groupApi.postMessage(data.msg.group_id, {
        msg_type: 0,
        content: '\n/帮助\n/签到\n/查询绑定\n/绑定角色 角色名\n/解除绑定 角色名',
        msg_id: data.msg.id,
        msg_seq: Math.round(Math.random() * (1 << 30))
      })
      break
    case '/签到':
      await redisClient.connect()
      const value0 = await redisClient.get(data.msg.author.id)
      if (!value0) {
        await client.groupApi.postMessage(data.msg.group_id, {
          msg_type: 0,
          content: '签到失败，未绑定角色',
          msg_id: data.msg.id,
          msg_seq: Math.round(Math.random() * (1 << 30))
        })
      } else {
        const key = `${data.msg.author.id}:${new Date().toLocaleDateString()}`
        const value01 = await redisClient.get(key)
        if (value01) {
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: '签到失败，今日已签到',
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        } else {
          await redisClient.set(key, '1')
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: '签到成功',
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        }
      }
      await redisClient.disconnect()
      break
    case '/查询绑定':
      await redisClient.connect()
      if (agrs1) {
        const value3 = await redisClient.get(agrs1)
        if (value3) {
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: `查询成功，角色：${agrs1} 已被绑定`,
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        } else {
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: `查询成功，角色：${agrs1} 未被绑定`,
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        }
      } else {
        const value = await redisClient.get(data.msg.author.id)
        if (value) {
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: `查询成功，你绑定的角色为：${value}`,
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        } else {
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: '你还未绑定角色',
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        }
      }
      await redisClient.disconnect()
      break
    case '/绑定角色':
      if (!agrs1) {
        await client.groupApi.postMessage(data.msg.group_id, {
          msg_type: 0,
          content: '绑定角色失败，未输入角色名',
          msg_id: data.msg.id,
          msg_seq: Math.round(Math.random() * (1 << 30))
        })
        break
      }
      await redisClient.connect()
      const value4 = await redisClient.get(data.msg.author.id)
      if (value4) {
        await client.groupApi.postMessage(data.msg.group_id, {
          msg_type: 0,
          content: `绑定角色失败，你已绑定角色：${value4}`,
          msg_id: data.msg.id,
          msg_seq: Math.round(Math.random() * (1 << 30))
        })
      } else {
        await redisClient.set(data.msg.author.id, agrs1)
        await redisClient.set(agrs1, data.msg.author.id)
        await redisClient.disconnect()
        await client.groupApi.postMessage(data.msg.group_id, {
          msg_type: 0,
          content: `绑定角色成功，绑定角色为：${agrs1}`,
          msg_id: data.msg.id,
          msg_seq: Math.round(Math.random() * (1 << 30))
        })
      }
      await redisClient.disconnect()
      break
    case '/解除绑定':
      if (!agrs1) {
        await client.groupApi.postMessage(data.msg.group_id, {
          msg_type: 0,
          content: '解除绑定失败，未输入角色名',
          msg_id: data.msg.id,
          msg_seq: Math.round(Math.random() * (1 << 30))
        })
      } else {
        await redisClient.connect()
        const value2 = await redisClient.get(agrs1)
        if (!value2) {
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: `解除绑定失败，角色：${agrs1} 未被绑定`,
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        } else {
          const value5 = await redisClient.get(agrs1)
          await redisClient.del(value5)
          await redisClient.del(agrs1)
          await client.groupApi.postMessage(data.msg.group_id, {
            msg_type: 0,
            content: `解除绑定成功，角色为：${agrs1}`,
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
        }
        await redisClient.disconnect()
      }
      break
  }

  // await client.c2cApi.postMessage(data.msg.author.id, {
  //     content: "测试文本",
  //     msg_id: data.msg.id,
  // });

  // await client.groupApi.postMessage(data.msg.group_id, {
  //     content: "测试文本",
  //     msg_id: data.msg.id,
  //     msg_seq: Math.round(Math.random() * (1 << 30)), // 回复消息的序号，与 msg_id 联合使用，避免相同消息id回复重复发送，不填默认是1。相同的 msg_id + msg_seq 重复发送会失败。
  // }).then(res => {
  //     console.log(res.data);
  // }); // 发送群消息

  // await client.groupApi.postFile(data.msg.group_id, {
  //     file_type: 1, // 参数: 1.图片 2.视频 3.语音 4.文件（暂不开放）// 文件格式: 图片png/jpg 视频mp4 语音silk
  //     url: "https://www.w3school.com.cn/i/eg_tulip.jpg",
  //     srv_send_msg: true, // 为 true 时，消息会直接发送到目标端，占用主动消息频次，超频会发送失败。
  // }).then(res => {
  //     console.log(res.data);
  // }); // 主动发送群文件

  // const fileRes = await client.groupApi.postFile(data.msg.group_id, {
  //     file_type: 1, // 参数见上文
  //     url: "https://www.w3school.com.cn/i/eg_tulip.jpg",
  //     srv_send_msg: false, // 设置为 false 不发送到目标端，仅拿到文件信息
  // }); // 拿到文件信息
  // console.log(fileRes.data);
  // await client.groupApi.postMessage(data.msg.group_id, {
  //     msg_type: 7, // 发送富媒体
  //     content: "这是图文混排消息", // 当且仅当文件为图片时，才能实现图文混排，其余类型文件 content 会被忽略
  //     media: { file_info: fileRes.data.file_info },
  //     msg_id: data.msg.id,
  // }).then(res => console.log(res.data)); // 通过文件信息发送文件
})
