let handler = async (m, { conn, isROwner }) => {
    if (!isROwner) throw 'Hanya Pemilik Utama Bot yang dapat menggunakan perintah ini.'
    await m.reply('Merestart Bot...')
    process.send('reset')
}
handler.help = ['restart']
handler.tags = ['owner']
handler.command = ['restart', 'reboot']
handler.rowner = true

export default handler
