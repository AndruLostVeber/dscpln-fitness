import { Bot, InlineKeyboard } from 'grammy'

let bot: Bot | null = null

export function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const miniAppUrl = process.env.MINI_APP_URL

  if (!token) {
    console.warn('[Bot] TELEGRAM_BOT_TOKEN not set, bot disabled')
    return
  }
  if (!miniAppUrl) {
    console.warn('[Bot] MINI_APP_URL not set, bot disabled')
    return
  }

  bot = new Bot(token)

  bot.command('start', async ctx => {
    const keyboard = new InlineKeyboard().webApp('💪 Открыть Fitness AI', miniAppUrl)
    await ctx.reply(
      `Привет, ${ctx.from?.first_name ?? 'спортсмен'}! 👋\n\nTвой персональный AI-тренер готов к работе.\nЖми кнопку ниже чтобы начать!`,
      { reply_markup: keyboard }
    )
  })

  bot.command('help', async ctx => {
    await ctx.reply(
      '💪 *Fitness AI* — твой персональный тренер\n\n' +
      '• Подбирает питание под КБЖУ\n' +
      '• Генерирует тренировки по группам мышц\n' +
      '• Ведёт дневник рациона и тренировок\n' +
      '• Даёт персональные советы\n\n' +
      'Используй /start чтобы открыть приложение.',
      { parse_mode: 'Markdown' }
    )
  })

  bot.catch(err => {
    console.error('[Bot] Error:', err.message)
  })

  bot.start({
    onStart: info => console.log(`[Bot] Started as @${info.username}`),
  })
}

export function stopBot() {
  bot?.stop()
}
