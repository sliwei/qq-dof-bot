/**
 * 以下仅为用法示意，详情请参照文档：https://bot.q.qq.com/wiki/develop/nodesdk/
 * 其中对官方逻辑扩展，添加了诸多功能，修复了许多问题
 */
import { createOpenAPI, createWebsocket, AvailableIntentsEventsEnum } from 'qq-bot-sdk' // es引用方法
import conf from './config'
import { redisClient } from './utils/redis'
import { createConnection } from 'mysql2/promise'
import OpenAI from 'openai'

const OpenAIclient = new OpenAI({
  apiKey: conf.AIKEY,
  baseURL: 'https://free.v36.cm/v1'
})

// 删除指定列表下所有键的函数
const deleteKeys = async (pattern: string) => {
  // 查找所有与模式匹配的键
  const keys = await redisClient.keys(pattern)
  for (const key of keys) {
    // 删除键
    await redisClient.del(key)
  }
}

const askQuestion = async (model = 'gpt-4o-mini', question: string, id: string) => {
  let conversationHistory = []
  const value0 = await redisClient.get(`gpt:${id}`)
  if (value0) {
    conversationHistory = JSON.parse(value0)
  }
  conversationHistory.push({ role: 'user', content: question })

  const chatCompletion = await OpenAIclient.chat.completions.create({
    messages: conversationHistory,
    model
    // model: 'gpt-3.5-turbo'
  })
  const answer = chatCompletion.choices[0].message.content
  conversationHistory.push({ role: 'assistant', content: answer })

  // Function to calculate total character length of the conversation history
  const calculateTotalLength = (history: any[]) => {
    return history.reduce((total, message) => total + message.content.length, 0)
  }

  // Ensure the total content length does not exceed 5000 characters
  while (calculateTotalLength(conversationHistory) > 5000) {
    conversationHistory.shift() // Remove the oldest message
  }

  await redisClient.set(`gpt:${id}`, JSON.stringify(conversationHistory))
  // console.log('Assistant:', answer)
  return answer
}

// async function main() {
//   await askQuestion('你好，你是谁？')
//   await askQuestion('你能做什么？')
//   await askQuestion('你好，你是谁？')
//   await askQuestion('你能做什么？')
//   await askQuestion('西瓜有哪些品种?')
//   // 继续提问...
// }

// main().catch(console.error)

const executeAndCommit = async (database: string, sql: string, params: any[]) => {
  try {
    const connection = await createConnection({ host: conf.db.host, user: conf.db.username, password: conf.db.password, database: database })
    await connection.execute(sql, params)
    await connection.commit()
    await connection.end()
  } catch (error) {}
}

const executeAndFetch = async (database: string, sql: string, params?: any[]) => {
  try {
    const connection = await createConnection({ host: conf.db.host, user: conf.db.username, password: conf.db.password, database: database })
    const [rows, fields] = await connection.query(sql, params)
    await connection.end()
    return rows
  } catch (error) {}
}

// 查询角色名称 taiwan_cain charac_info
const select = async (charac_info: string) => {
  const selectSql = `SELECT CONVERT (BINARY (CONVERT (charac_name USING latin1)) USING utf8) AS converted_charac_name,m_id,charac_no FROM charac_info WHERE charac_name=CONVERT (BINARY (CONVERT (? USING utf8)) USING latin1)`
  const result = await executeAndFetch('taiwan_cain', selectSql, [charac_info])
  return result
}

// 查询LetterId
const selectLetterId = async () => {
  const selectSql = `SELECT letter_id FROM postal ORDER BY letter_id DESC LIMIT 1`
  const result: any = await executeAndFetch('taiwan_cain_2nd', selectSql)
  console.log(result[0].letter_id)
  return result[0].letter_id + 1
}

// /8237,4438,490000133,2675336,888520,2029888,2680738,123020
// /1,20,1,5,300,1,1,20

// occ_time 邮件发送时间，
// send_charac_name 邮件发送人
// receive_charac_no 接收人的ID，
// amplify_option 是否是红字装备 分别对应 0 1 2 3 4 1为体力，2为精神，3为力量，4为智力
// amplify_value 附加的数值，填几就是增加几红字的属性
// seperate_upgrade 锻造等级
// seal_flag 是否封装 0不封，1封
// item_id 顾名思义，物品代码
// add_info 物品数量
// upgrade 强化等级
// gold 发送的金币数量
// unlimit_flag 多个
// letter_id 最后的id，他是自增+1，如果不填会出现收不到邮件情况，一般做个查询后做个变量记录即可
const sendMail = async (send_charac_name: string, letter_id: number, receive_charac_no: number, item_id: number, add_info: number, unlimit_flag: number) => {
  const insertSql = `INSERT INTO postal (occ_time, send_charac_name, receive_charac_no, amplify_option, amplify_value, seperate_upgrade, seal_flag, item_id, add_info, receive_time, upgrade, gold, unlimit_flag, letter_id) VALUES (NOW(), CONVERT (BINARY (CONVERT (? USING utf8)) USING latin1), ?, 0, 0, 0, 0, ?, ?, NOW(), 0, 0, ?, ?)`
  await executeAndCommit('taiwan_cain_2nd', insertSql, [send_charac_name, receive_charac_no, item_id, add_info, unlimit_flag, letter_id])
}

// /8237,4438,490000133,2675336,888520,2029888,2680738,123020
// /1,20,1,5,300,1,1,20
// const mailItem = [
//   [8237, 1],
//   [4438, 20],
//   [490000133, 1],
//   [2675336, 5],
//   [888520, 300],
//   [2029888, 1],
//   [2680738, 1],
//   [123020, 20]
// ]

// const mailItem = [
//   [3036, 1],
//   [3037, 1],
// ]

// const mian = async () => {
//   select('旧可')
//   selectLetterId()
//   const letter_id = await selectLetterId()
//   for (const item of mailItem) {
//     await sendMail('GMGM', letter_id, 23, item[0], item[1], 1)
//   }
//   console.log('邮件发送成功')

//   await redisClient.connect()
//   const value0 = await redisClient.get('mailItem')
//   console.log(JSON.parse(value0))
// }
// mian()

const testConfigWs = {
  appID: conf.appID,
  token: conf.token,
  intents: [AvailableIntentsEventsEnum.GROUP_AND_C2C_EVENT],
  sandbox: conf.env === 'development'
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
  // console.log('[GROUP_AND_C2C_EVENT] 事件接收 :', data)
  console.log(`[GROUP_AND_C2C_EVENT] 事件接收 :
  author_id: ${data.msg.author.id}
  group_id: ${data.msg.group_id}
  content: ${data.msg.content}
  `)
  const qqid = data.msg.author.id
  const qun_id = data.msg.group_id

  const postMessage = async (content: string) => {
    await client.groupApi.postMessage(qun_id, {
      msg_type: 0,
      content,
      msg_id: data.msg.id,
      msg_seq: Math.round(Math.random() * (1 << 30))
    })
  }

  try {
    // ===== 下方为发送消息接口，请按需取消注释 ======
    // /帮助
    // /签到
    // /查询绑定
    // /绑定角色
    // /解除绑定
    const command = data.msg.content.replace(/^\s+|\s+$/g, '')
    const cmd = command.split(' ')[0]
    const agrs1 = command.split(' ')[1]
    const agrs2 = command.split(' ').slice(2).join(' ')
    const gameName = agrs1
    let RD_gameName = ''
    switch (cmd) {
      case '/帮助':
        await redisClient.connect()
        const helpFc = async () => {
          const help = await redisClient.get('help')
          await postMessage(help)
        }
        switch (agrs1) {
          case 'gpt':
          case 'gpt0':
          case 'gpt1':
          case 'gpt2':
          case 'gpt3':
          case 'gpt4':
          case 'gpt5':
          case 'gpt6':
          case 'gpt7':
            if (agrs2) {
              const i = agrs1.split('gpt')[1] || '0'
              // 模型列表
              const modelListStr = await redisClient.get('modelList')
              const modelList = JSON.parse(modelListStr)
              const model = modelList[+i]
              const res = await askQuestion(model, agrs2, qun_id)
              await postMessage(`${agrs2}\nGPT(${model}): ${res}`)
            } else {
              await helpFc()
            }
            break
          case '查看模型':
            // 模型说明
            const modelListStr = await redisClient.get('modelInfo')
            await postMessage(modelListStr)
            break
          case '战力排行':
            const result: any = await executeAndFetch('d_baoyu', 'select * from zhanli ORDER BY ZLZ desc LIMIT 10')
            function getDisplayLength(str: any) {
              let length = 0
              for (let char of str) {
                // 判断是否是汉字，汉字的Unicode范围是[\u4e00-\u9fa5]
                if (char.charCodeAt(0) >= 0x4e00 && char.charCodeAt(0) <= 0x9fa5) {
                  length += 4
                } else {
                  length += 2
                }
              }
              return length
            }

            function padString(str: any, targetLength: number) {
              let currentLength = getDisplayLength(str)
              let paddedStr = str
              while (currentLength < targetLength) {
                paddedStr += ' '
                currentLength++
              }
              return paddedStr
            }

            function formatData(data: any[]) {
              // 获取名字的最大长度
              const maxLength = Math.max(...data.map((item) => getDisplayLength(item.ZName)))
              let str = `战力排行榜:\n`

              // 格式化每一行
              return (
                str +
                data
                  .map((item, index) => {
                    const paddedName = padString(item.ZName, maxLength)
                    return `${index < 9 ? ' ' : ''}${index + 1}. ${paddedName} ${item.ZLZ}`
                  })
                  .join('\n')
              )
            }
            await postMessage(formatData(result))
            break
          case '在线人数':
            const result1: any = await executeAndFetch('taiwan_login', 'SELECT COUNT(*) as num FROM login_account_3 WHERE login_status=1')
            console.log(result1)
            await postMessage(`现在游戏有 ${result1[0].num} 个老登在线~`)
            break
          case '二次元':
            // 二次元列表
            const list2Str = await redisClient.get('list2')
            // const list = ['https://cdn.seovx.com/?mom=302', 'https://cdn.seovx.com/d/?mom=302', 'https://cdn.seovx.com/ha/?mom=302', 'http://www.98qy.com/sjbz/api.php']
            const list2 = JSON.parse(list2Str)
            const fileRes = await client.groupApi.postFile(qun_id, {
              file_type: 1, // 参数见上文
              url: list2[Math.floor(Math.random() * list2.length)],
              srv_send_msg: false // 设置为 false 不发送到目标端，仅拿到文件信息
            }) // 拿到文件信息
            await client.groupApi.postMessage(qun_id, {
              msg_type: 7, // 发送富媒体
              // content: '二次元', // 当且仅当文件为图片时，才能实现图文混排，其余类型文件 content 会被忽略
              media: { file_info: fileRes.data.file_info },
              msg_id: data.msg.id
            }) // 通过文件信息发送文件
            break
          case '三次元':
            // 三次元列表
            const list3Str = await redisClient.get('list3')
            // const list3 = [
            //   'https://api.lolimi.cn/API/meizi/api.php?type=image',
            //   'https://api.asxe.vip/whitesilk.php',
            //   'https://v2.api-m.com/api/meinvpic?return=302',
            //   'https://v2.api-m.com/api/baisi?return=302',
            //   'https://v2.api-m.com/api/heisi?return=302',
            //   'https://img.moehu.org/pic.php?id=xjj'
            // ]
            const list3 = JSON.parse(list3Str)
            const fileRes3 = await client.groupApi.postFile(qun_id, {
              file_type: 1, // 参数见上文
              url: list3[Math.floor(Math.random() * list3.length)],
              srv_send_msg: false // 设置为 false 不发送到目标端，仅拿到文件信息
            }) // 拿到文件信息
            await client.groupApi.postMessage(qun_id, {
              msg_type: 7, // 发送富媒体
              // content: '三次元', // 当且仅当文件为图片时，才能实现图文混排，其余类型文件 content 会被忽略
              media: { file_info: fileRes3.data.file_info },
              msg_id: data.msg.id
            }) // 通过文件信息发送文件
            break
          case '领福利':
            // 根据QQID查询绑定角色
            RD_gameName = await redisClient.get('bind:' + qqid)
            if (!RD_gameName) {
              await postMessage(`${RD_gameName} 签到失败，未绑定角色`)
            } else {
              // 福利领取情况
              const key = `gift:${qqid}`
              const RD_fuli = await redisClient.get(key)
              if (RD_fuli) {
                await postMessage(`${RD_gameName} 领取失败，每人只能领取一次福利`)
              } else {
                // 福利物品配置
                const giftItemStr = await redisClient.get('giftItem')
                const giftItem = JSON.parse(giftItemStr)
                if (giftItem.length) {
                  await postMessage(`${RD_gameName} 福利邮件已发送，无邮件/空邮件重新选择角色或者小退`)
                  const charac_no: string = await redisClient.get('bind:' + qqid + 'charac_no')
                  const letter_id = await selectLetterId()
                  for (const item of giftItem) {
                    await sendMail('便捷小虞福利', letter_id, +charac_no, item[0], item[1], 1)
                  }
                  await redisClient.set(key, '1')
                  console.log(`${RD_gameName} ${charac_no} 邮件发送成功`)
                } else {
                  await postMessage(`还未开启福利哦~`)
                }
              }
            }
            break
          case 'set_gift':
            // 福利物品配置
            if (agrs2) {
              await redisClient.set('giftItem', agrs2)
              await postMessage(`set_gift success ${agrs2}`)
            } else {
              await postMessage(`格式: /帮助 set_gift [[物品代码,数量],[物品代码,数量]]`)
            }
            break
          case 'set_sign':
            // 签到物品配置
            if (agrs2) {
              await redisClient.set('signItem', agrs2)
              await postMessage(`set_sign success ${agrs2}`)
            } else {
              await postMessage(`格式: /帮助 set_sign [[物品代码,数量],[物品代码,数量]]`)
            }
            break
          case 'clear_gift':
            await deleteKeys('gift:*')
            await postMessage(`clear_gift success`)
            break
          case 'clear_sign':
            await deleteKeys('sign:*')
            await postMessage(`clear_sign success`)
            break
          case 'clear_sign_day':
            const key = `sign:${new Date().toLocaleDateString()}:*`
            await deleteKeys(key)
            await postMessage(`${key} success`)
            break
          default:
            await helpFc()
            break
        }
        await redisClient.disconnect()
        break
      case '/签到':
        await redisClient.connect()
        RD_gameName = await redisClient.get('bind:' + qqid)
        if (!RD_gameName) {
          await postMessage(`${RD_gameName} 签到失败，未绑定角色`)
        } else {
          // 获取今天签到情况
          const key = `sign:${new Date().toLocaleDateString()}:${qqid}`
          const RD_sign = await redisClient.get(key)
          if (RD_sign) {
            await postMessage(`${RD_gameName} 签到失败，今日已签到`)
          } else {
            // 签到物品配置
            const signItemStr = await redisClient.get('signItem')
            const signItem = JSON.parse(signItemStr)
            if (signItem.length) {
              await postMessage(`${RD_gameName} 签到成功，邮件已发送，无邮件/空邮件重新选择角色或者小退`)
              const charac_no: string = await redisClient.get('bind:' + qqid + 'charac_no')
              const letter_id = await selectLetterId()
              for (const item of signItem) {
                await sendMail('便捷小虞', letter_id, +charac_no, item[0], item[1], 1)
              }
              await redisClient.set(key, '1')
              console.log(`${RD_gameName} ${charac_no} 邮件发送成功`)
            } else {
              await postMessage(`还未开启签到哦~`)
            }
          }
        }
        await redisClient.disconnect()
        break
      case '/查询绑定':
        await redisClient.connect()
        if (gameName) {
          const RD_qqid = await redisClient.get('bind:' + gameName)
          if (RD_qqid) {
            await postMessage(`查询成功，角色：${gameName} 已被绑定`)
          } else {
            await postMessage(`查询成功，角色：${gameName} 未被绑定`)
          }
        } else {
          const value = await redisClient.get('bind:' + qqid)
          const charac_no = await redisClient.get('bind:' + qqid + 'charac_no')
          if (value) {
            await postMessage(`查询成功，你绑定的角色为：${value} ID:${charac_no}`)
          } else {
            await postMessage('你还未绑定角色色')
          }
        }
        await redisClient.disconnect()
        break
      case '/绑定角色':
        if (!gameName) {
          await client.groupApi.postMessage(qun_id, {
            msg_type: 0,
            content: '绑定角色失败，未输入角色名，仔细阅读帮助',
            msg_id: data.msg.id,
            msg_seq: Math.round(Math.random() * (1 << 30))
          })
          break
        }
        // 数据库查询角色
        const user: any = await select(gameName)
        if (user.length === 0) {
          await postMessage(`绑定角色失败，游戏角色：${gameName} 不存在`)
          break
        }
        const userinfo = user[0]
        await redisClient.connect()
        RD_gameName = await redisClient.get('bind:' + qqid)
        if (RD_gameName) {
          await postMessage(`绑定角色失败，你已绑定角色：${RD_gameName} ID:${userinfo.charac_no}`)
        } else {
          await redisClient.set('bind:' + qqid, gameName)
          await redisClient.set('bind:' + qqid + 'charac_no', userinfo.charac_no)
          await redisClient.set('bind:' + gameName, qqid)
          await redisClient.set('bind:' + gameName + 'charac_no', userinfo.charac_no)
          await redisClient.disconnect()
          await postMessage(`绑定角色成功，绑定角色为：${gameName} ID:${userinfo.charac_no}`)
        }
        await redisClient.disconnect()
        break
      case '/解除绑定':
        if (!gameName) {
          await postMessage('解除绑定失败，未输入角色名')
        } else {
          await redisClient.connect()
          const RD_qqid = await redisClient.get('bind:' + gameName)
          if (!RD_qqid) {
            await postMessage(`解除绑定失败，角色：${gameName} 未被绑定`)
          } else {
            const qqid = await redisClient.get('bind:' + gameName)
            await redisClient.del('bind:' + qqid) // QQID 存的 角色
            await redisClient.del('bind:' + gameName) // 角色 存的 QQID
            await redisClient.del('bind:' + qqid + 'charac_no') // QQID+charac_no 存的 角色ID
            await redisClient.del('bind:' + gameName + 'charac_no') // 角色+charac_no 存的 角色ID
            await postMessage(`解除绑定成功，角色为：${gameName}`)
          }
          await redisClient.disconnect()
        }
        break
    }
  } catch (error) {
    // ws.connect(testConfigWs, ws.session.sessionRecord)
    redisClient.disconnect()
    console.log('错误', error)
    await postMessage(`哎呀，出错了，${error.message}`)
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

// occ_time 邮件发送时间，
// send_charac_name 邮件发送人
// receive_charac_no 接收人的ID，
// amplify_option 是否是红字装备 分别对应 0 1 2 3 4 1为体力，2为精神，3为力量，4为智力
// amplify_value 附加的数值，填几就是增加几红字的属性
// seperate_upgrade 锻造等级
// seal_flag 是否封装 0不封，1封
// item_id 顾名思义，物品代码
// add_info 物品数量
// upgrade 强化等级
// gold 发送的金币数量
// unlimit_flag 多个
// letter_id 最后的id，他是自增+1，如果不填会出现收不到邮件情况，一般做个查询后做个变量记录即可

//   postal_id         2758
//   occ_time         2024-10-12 17:03:22 邮件发送时间，
//   send_charac_no         0
//   send_charac_name         ç®¡ç†å‘˜ 邮件发送人
//   receive_charac_no         43 接收人的ID，
//   item_id         888520 顾名思义，物品代码
//   add_info         300 物品数量
//   endurance         0
//   upgrade         0
//   amplify_option         0
//   amplify_value         0
//   gold         0
//   receive_time         2024-10-12 21:34:30
//   delete_flag         1
//   avata_flag         0
//   unlimit_flag         1
//   seal_flag         0
//   creature_flag         0
//   postal         0
//   letter_id         1827
//   extend_info         0
//   ipg_db_id         0
//   ipg_transaction_id         0
//   ipg_nexon_id
//   auction_id         0
//   random_option
//   seperate_upgrade         0
//   type         0
//   item_guid
// 23
