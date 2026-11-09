// Dica do dia (Home). Textos escritos com ajuda de IA e NÃO revisados por profissional de saúde —
// por isso a dica só aparece depois que a pessoa liga em Preferências e vê esse aviso. Nada aqui
// pode virar orientação de dose: são lembretes gerais que sempre mandam conversar com quem acompanha.

export type TipCategory = 'general' | 'mental_health' | 'injection' | 'oral' | 'patch_gel' | 'feminizing' | 'masculinizing'

export interface Tip {
  category: TipCategory
  icon: string
  text: string
}

export const TIPS: Tip[] = [
  { category: 'general', icon: '🩺', text: 'Exames de sangue de rotina ajudam a acompanhar como seu corpo está reagindo. Combine com quem te acompanha a frequência certa pra você.' },
  { category: 'general', icon: '📓', text: 'Anotar como você se sente nos dias de dose ajuda a perceber padrões — e leva informação concreta pra próxima consulta.' },
  { category: 'general', icon: '💧', text: 'Beber água ao longo do dia ajuda em quase tudo: pele, disposição e até na hora de tirar sangue pros exames.' },
  { category: 'general', icon: '😴', text: 'Sono regular faz diferença no humor e na energia. Se puder, tente dormir e acordar perto do mesmo horário.' },
  { category: 'general', icon: '⏰', text: 'Tomar a medicação sempre no mesmo horário ajuda a não esquecer. Os lembretes do Aurora podem dar uma força.' },
  { category: 'general', icon: '🧾', text: 'Guarde os resultados dos seus exames num lugar só (dá pra registrar em Saúde → Exames). Facilita comparar ao longo do tempo.' },
  { category: 'general', icon: '🚫', text: 'Mudar dose por conta própria pode trazer riscos. Qualquer ajuste é melhor conversado com quem te acompanha.' },
  { category: 'general', icon: '🧳', text: 'Vai viajar? Leve medicação a mais do que o necessário e mantenha na bagagem de mão.' },
  { category: 'general', icon: '🏃', text: 'Movimento leve já conta: caminhada, alongamento, dança no quarto. O corpo agradece e o humor também.' },
  { category: 'general', icon: '🦴', text: 'Saúde dos ossos importa em qualquer transição. Vale perguntar na consulta sobre cálcio, vitamina D e exames.' },

  { category: 'mental_health', icon: '💜', text: 'Transição tem dias bons e dias difíceis. Os dois fazem parte — você não está atrasade nem fazendo nada errado.' },
  { category: 'mental_health', icon: '🫂', text: 'Ter com quem conversar faz diferença. As comunidades do Aurora são um lugar pra isso, no seu ritmo.' },
  { category: 'mental_health', icon: '📵', text: 'Se as redes estão pesando, tudo bem dar uma pausa. Silenciar e bloquear é cuidado, não é grosseria.' },
  { category: 'mental_health', icon: '🌱', text: 'Mudanças da terapia hormonal levam meses ou anos. Comparar seu caminho com o de outra pessoa costuma ser injusto com você.' },
  { category: 'mental_health', icon: '🆘', text: 'Se a barra estiver pesada demais, procure ajuda. No Brasil, o CVV atende 24h pelo 188 ou em cvv.org.br.' },
  { category: 'mental_health', icon: '✨', text: 'Celebre as pequenas conquistas: um dia de euforia, uma foto que você gostou, uma conversa em que te trataram certo.' },
  { category: 'mental_health', icon: '🧠', text: 'Hormônios podem mexer com o humor nos primeiros meses. Registrar o humor ajuda a ver se é fase ou se vale conversar com alguém.' },

  { category: 'injection', icon: '💉', text: 'Alternar o local da aplicação ajuda a evitar nódulos e dor. Anotar onde foi a última dá uma ajuda.' },
  { category: 'injection', icon: '🧼', text: 'Higienize as mãos e o local antes de aplicar, e use sempre agulha nova. Agulha usada vai em recipiente rígido, nunca no lixo comum.' },
  { category: 'injection', icon: '🌡️', text: 'Ampolas e frascos costumam ter recomendação de temperatura. Confira a bula e evite deixar no calor ou no sol.' },
  { category: 'injection', icon: '🤲', text: 'Se injeção te deixa ansiose, ter uma rotina (mesmo lugar, mesma música) pode deixar o momento mais tranquilo.' },
  { category: 'injection', icon: '📍', text: 'Vermelhidão, inchaço ou calor que não passam no local da aplicação merecem atenção de um profissional.' },

  { category: 'oral', icon: '💊', text: 'Esqueceu um comprimido? Veja na bula ou pergunte a quem te acompanha o que fazer — não dobre a dose por conta própria.' },
  { category: 'oral', icon: '🍽️', text: 'Alguns comprimidos têm orientação sobre tomar com ou sem comida. Vale conferir a bula do seu.' },
  { category: 'oral', icon: '📦', text: 'Guarde os comprimidos longe de umidade (banheiro costuma ser o pior lugar da casa pra isso).' },

  { category: 'patch_gel', icon: '🩹', text: 'Troque o lugar do adesivo a cada aplicação pra evitar irritação na pele.' },
  { category: 'patch_gel', icon: '🧴', text: 'Com gel, espere secar antes de vestir a roupa e evite contato de pele com outras pessoas logo depois da aplicação.' },
  { category: 'patch_gel', icon: '🚿', text: 'Banho, piscina e suor podem afetar adesivo e gel. Confira na bula quanto tempo esperar depois da aplicação.' },

  { category: 'feminizing', icon: '🌸', text: 'Desenvolvimento de mamas costuma ser gradual e às vezes sensível. Sutiã confortável e sem aro pode ajudar nas fases de sensibilidade.' },
  { category: 'feminizing', icon: '🧴', text: 'A pele pode ficar mais seca e fina com a terapia hormonal feminizante. Hidratante e protetor solar viram aliados.' },
  { category: 'feminizing', icon: '📏', text: 'Medidas mudam devagar. Medir sempre no mesmo horário e do mesmo jeito deixa a comparação mais justa.' },
  { category: 'feminizing', icon: '🗣️', text: 'Hormônios não mudam a voz depois da puberdade — treino vocal com fonoaudiologia é o caminho mais seguro, se for algo que você quer.' },

  { category: 'masculinizing', icon: '🧔', text: 'Pelos e barba aparecem no tempo de cada corpo, muitas vezes ao longo de anos. Paciência com você mesme.' },
  { category: 'masculinizing', icon: '🧼', text: 'Acne é comum no começo da terapia masculinizante. Lavar o rosto com sabonete suave e não espremer ajuda.' },
  { category: 'masculinizing', icon: '🗣️', text: 'A voz costuma mudar nos primeiros meses e pode falhar no caminho. Hidratação e não forçar a voz ajudam.' },
  { category: 'masculinizing', icon: '🩸', text: 'Hemograma (hematócrito) é um exame comum de acompanhar na terapia com testosterona. Pergunte na consulta.' },
  { category: 'masculinizing', icon: '🫁', text: 'Binder deve ser usado por períodos limitados e nunca pra dormir ou fazer exercício. Se doer ou faltar ar, tire.' },
]

const FEMININE_GENDERS = new Set(['trans_woman', 'travesti', 'transfeminine', 'woman', 'demigirl'])
const MASCULINE_GENDERS = new Set(['trans_man', 'transmasculine', 'man', 'demiboy'])

export function tipsFor(gender: string | null | undefined, activeRoutes: string[] = []): Tip[] {
  const categories = new Set<TipCategory>(['general', 'mental_health'])
  if (activeRoutes.includes('injection')) categories.add('injection')
  if (activeRoutes.includes('oral')) categories.add('oral')
  if (activeRoutes.includes('patch') || activeRoutes.includes('gel')) categories.add('patch_gel')
  if (!gender || !MASCULINE_GENDERS.has(gender)) categories.add('feminizing')
  if (!gender || !FEMININE_GENDERS.has(gender)) categories.add('masculinizing')
  return TIPS.filter((t) => categories.has(t.category))
}
