// Pequenas frases de acolhimento, exibidas uma por dia (rotação determinística por dia do ano).
export const DAILY_MESSAGES = [
  'Um passo de cada vez já é progresso.',
  'Respira fundo — você está indo bem.',
  'Hoje também é um bom dia pra começar devagar.',
  'Seu ritmo é válido, mesmo nos dias mais lentos.',
  'Pausa também é produtividade.',
  'Você não precisa dar conta de tudo hoje.',
  'Um dia de cada vez, sem pressa.',
  'Cuide de você antes da lista de tarefas.',
  'Pequenas vitórias também contam.',
  'Tá tudo bem ir com calma.',
  'Você já fez o suficiente por hoje.',
  'Beba água, alongue, siga com carinho.',
  'O cansaço também merece ser ouvido.',
  'Feito é melhor que perfeito.',
  'Sua energia de hoje já é valiosa.',
  'Um chá, uma pausa, um recomeço.',
  'Você está construindo algo, mesmo devagar.',
  'Hoje é um bom dia pra ser gentil consigo.',
  'Nem todo dia precisa ser produtivo pra valer a pena.',
  'Confie no seu tempo.',
  'Registrar já é cuidar de você.',
  'Vá no seu passo — ele é o certo.',
  'Descansar também está na lista de hoje.',
  'Você é mais do que a sua jornada de trabalho.',
]

function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0)
  const diff = date - start
  return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getDailyMessage(date = new Date()) {
  const index = getDayOfYear(date) % DAILY_MESSAGES.length
  return DAILY_MESSAGES[index]
}
