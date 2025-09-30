import { watchFile, unwatchFile } from 'fs'
import chalk from 'chalk'
import { fileURLToPath } from 'url'

global.owner = [
  ['6281234567890', 'Vyzen', true] 
]
global.mods = []
global.prems = []

global.namebot = 'Vyzen'
global.author = 'Vyzen Here'
global.packname = 'Vyzen Sticker Pack'
global.sessionName = 'session'
global.prefix = ['!', '.', '#']
global.sp = '⭔'
global.mess = {
    success: '✓ Success',
    admin: 'Perintah ini hanya untuk Admin Group!',
    botAdmin: 'Jadikan bot sebagai Admin terlebih dahulu!',
    owner: 'Perintah ini hanya untuk Owner!',
    group: 'Perintah ini hanya bisa digunakan di grup!',
    private: 'Perintah ini hanya bisa digunakan di Private Chat!',
    bot: 'Fitur khusus Pengguna Nomor Bot',
    wait: 'Loading...',
}

let file = fileURLToPath(import.meta.url)
watchFile(file, () => {
    unwatchFile(file)
    console.log(chalk.redBright(`Update'${file}'`))
    import(`${file}?update=${Date.now()}`)
})
