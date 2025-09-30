let handler = async (m, { conn, text, usedPrefix, command }) => {
    let tags = {}
    for (let plugin of Object.values(global.plugins)) {
        if (plugin.tags && plugin.help) {
            for (let tag of plugin.tags) {
                if (!tags[tag]) tags[tag] = []
                tags[tag].push(plugin)
            }
        }
    }

    let txt = `Hi @${m.sender.split('@')[0]}!\nI am a WhatsApp Bot.\n\n`
    
    Object.keys(tags).sort().forEach(tag => {
        txt += `*${tag.toUpperCase()} MENU*\n`
        tags[tag].forEach(plugin => {
            for (let command of [].concat(plugin.command)) {
                txt += `› ${usedPrefix + command}\n`
            }
        })
        txt += `\n`
    })
    
    conn.reply(m.chat, txt, m)
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = /^(menu|help)$/i
export default handler
