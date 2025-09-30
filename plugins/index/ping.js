let handler = async (m, { conn, text, usedPrefix, command }) => {
  let speed = new Date() * 1
  await m.reply('Pong!')
  let latency = new Date() * 1 - speed
  m.reply(`${latency} ms`)
}
handler.help = ['ping']
handler.tags = ['main']
handler.command = /^(ping|speed)$/i
export default handler
