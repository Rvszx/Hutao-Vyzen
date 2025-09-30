import {
    smsg
} from './lib/simple.js'
import {
    format
} from 'util'
import {
    fileURLToPath
} from 'url'
import path, {
    join
} from 'path'
import {
    unwatchFile,
    watchFile
} from 'fs'
import chalk from 'chalk'

const {
    proto
} = (await import('@whiskeysockets/baileys')).default
const isNumber = x => typeof x === 'number' && !isNaN(x)

export async function handler(chatUpdate) {
    this.msgqueque = this.msgqueque || []
    if (!chatUpdate)
        return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m)
        return
    if (global.db.data == null)
        await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m)
            return

        let user = global.db.data.users[m.sender]
        if (typeof user !== 'object')
            global.db.data.users[m.sender] = {}
        if (user) {
            if (!isNumber(user.afk)) user.afk = -1
            if (!('afkReason' in user)) user.afkReason = ''
        } else
            global.db.data.users[m.sender] = {
                afk: -1,
                afkReason: '',
            }

        let chat = global.db.data.chats[m.chat]
        if (typeof chat !== 'object')
            global.db.data.chats[m.chat] = {}
        if (chat) {
            if (!('isBanned' in chat))
                chat.isBanned = false
        } else
            global.db.data.chats[m.chat] = {
                isBanned: false,
            }

        if (opts['nyimak']) return
        if (!m.fromMe && opts['self']) return
        if (typeof m.text !== 'string')
            m.text = ''

        const isROwner = [this.decodeJid(this.user.id), ...global.owner.map(([number]) => number)].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isOwner = isROwner || m.fromMe
        const isMods = isOwner || global.mods.map(v => v.replace(/[^0-g]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isPrems = isROwner || global.prems.map(v => v.replace(/[^0-g]/g, '') + '@s.whatsapp.net').includes(m.sender)

        if (m.isBaileys) return
        if (m.chat.endsWith('broadcast')) return

        let usedPrefix
        let _user = global.db.data && global.db.data.users && global.db.data.users[m.sender]
        const ___dirname = path.join(path.dirname(fileURLToPath(import.meta.url)))
        
        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin) continue
            if (plugin.disabled) continue

            const str2Regex = str => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
            let _prefix = plugin.customPrefix ? plugin.customPrefix : this.prefix ? this.prefix : global.prefix
            let match = (_prefix instanceof RegExp ?
                [
                    [_prefix.exec(m.text), _prefix]
                ] :
                Array.isArray(_prefix) ?
                _prefix.map(p => {
                    let re = p instanceof RegExp ? p : new RegExp(str2Regex(p))
                    return [re.exec(m.text), re]
                }) :
                typeof _prefix === 'string' ?
                [
                    [new RegExp(str2Regex(_prefix)).exec(m.text), new RegExp(str2Regex(_prefix))]
                ] : [
                    [
                        [], new RegExp
                    ]
                ]
            ).find(p => p[1])
            if (typeof plugin !== 'function')
                continue
            if ((usedPrefix = (match[0] || '')[0])) {
                let noPrefix = m.text.replace(usedPrefix, '')
                let [command, ...args] = noPrefix.trim().split` `.filter(v => v)
                args = args || []
                let _args = noPrefix.trim().split` `.slice(1)
                let text = _args.join` `
                command = (command || '').toLowerCase()
                let fail = plugin.fail || global.dfail
                let isAccept = plugin.command instanceof RegExp ?
                    plugin.command.test(command) :
                    Array.isArray(plugin.command) ?
                    plugin.command.some(cmd => cmd instanceof RegExp ? cmd.test(command) : cmd === command) :
                    typeof plugin.command === 'string' ?
                    plugin.command === command :
                    false

                if (!isAccept)
                    continue

                m.plugin = name
                if (m.chat in global.db.data.chats || m.sender in global.db.data.users) {
                    let chat = global.db.data.chats[m.chat]
                    let user = global.db.data.users[m.sender]
                    if (name != 'owner-unbanchat.js' && chat?.isBanned) return
                    if (name != 'owner-unbanuser.js' && user?.banned) return
                }
                if (plugin.rowner && !isROwner) {
                    fail('rowner', m, this)
                    continue
                }
                if (plugin.owner && !isOwner) {
                    fail('owner', m, this)
                    continue
                }
                if (plugin.mods && !isMods) {
                    fail('mods', m, this)
                    continue
                }
                if (plugin.premium && !isPrems) {
                    fail('premium', m, this)
                    continue
                }
                if (plugin.group && !m.isGroup) {
                    fail('group', m, this)
                    continue
                }
                let extra = {
                    match,
                    usedPrefix,
                    noPrefix,
                    _args,
                    args,
                    command,
                    text,
                    conn: this,
                    isROwner,
                    isOwner,
                    isMods,
                    isPrems,
                    chatUpdate,
                }
                try {
                    await plugin.call(this, m, extra)
                } catch (e) {
                    m.error = e
                    console.error(e)
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    } finally {
        if (opts['queque'] && m.text) {
            const quequeIndex = this.msgqueque.indexOf(m.id || m.key.id)
            if (quequeIndex !== -1)
                this.msgqueque.splice(quequeIndex, 1)
        }
        if (opts['autoread']) {
            await this.readMessages([m.key])
        }
    }
}

export async function participantsUpdate({ id, participants, action }) {
    if (opts['self'])
        return
    if (this.isInit)
        return
    if (global.db.data == null)
        await loadDatabase()
    let chat = global.db.data.chats[id] || {}
    let text = ''
    switch (action) {
        case 'add':
        case 'remove':
            if (chat.welcome) {
                let groupMetadata = await this.groupMetadata(id)
                for (let user of participants) {
                    let pp = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
                    try {
                        pp = await this.profilePictureUrl(user, 'image')
                    } catch (e) {} finally {
                        text = (action === 'add' ? (chat.sWelcome || this.welcome || 'Welcome, @user!').replace('@subject', await this.getName(id)).replace('@desc', groupMetadata.desc?.toString() || 'unknow') :
                            (chat.sBye || this.bye || 'Bye, @user!')).replace('@user', '@' + user.split('@')[0])
                        this.sendMessage(id, {
                           text: text,
                           contextInfo: {
                             mentionedJid: [user],
                             externalAdReply: {
                               title: `${action === 'add' ? 'SELAMAT DATANG' : 'SELAMAT TINGGAL'}`,
                               body: global.namebot,
                               thumbnailUrl: pp,
                               sourceUrl: 'https://whatsapp.com/channel/0029VaF2S5v74Bwsb3cT2r0p',
                               mediaType: 1,
                               renderLargerThumbnail: true
}}})
                    }
                }
            }
            break
    }
}


let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright("Update 'handler.js'"))
    import(`${file}?update=${Date.now()}`)
})
