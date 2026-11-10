// Catálogo da lojinha — compartilhado entre o app (vitrine) e o Worker (preço e validação de compra).
// O visual de cada item fica em src/lib/shopVisuals.ts; aqui só o que o servidor precisa saber.
//
// Preços calibrados pelo Brilho real em nov/2026: mediana 0, p90 ≈ 4, p99 ≈ 40, máximo ≈ 175.
// Uma semana de uso normal (dose + humor todo dia + um post) rende ~30, então os itens mais baratos
// saem em uma semana e os pacotes são meta de meses. Os 4 temas base e alguns enfeites são grátis.

export type ShopKind = 'bundle' | 'cardSkin' | 'avatarFrame' | 'postFrame' | 'theme' | 'calendarSkin'

export interface ShopItem {
  key: string
  kind: ShopKind
  name: string
  description: string
  price: number
  /** item com cara de pixel art — ganha selo na vitrine */
  pixel?: boolean
  /** só pacotes: keys dos itens que vêm junto */
  items?: string[]
}

export const SHOP_KIND_LABEL: Record<ShopKind, string> = {
  bundle: 'Pacotes',
  cardSkin: 'Cards de post',
  avatarFrame: 'Molduras',
  postFrame: 'Bordas de post',
  theme: 'Temas',
  calendarSkin: 'Calendários',
}

export const SHOP_KINDS: ShopKind[] = ['bundle', 'avatarFrame', 'cardSkin', 'postFrame', 'theme', 'calendarSkin']

/** Tema usado quando a pessoa ainda não escolheu nenhum (segue o modo que ela já usava). */
export const DEFAULT_THEME = { light: 'theme-aurora-claro', dark: 'theme-aurora-escuro' } as const

export const SHOP_ITEMS: ShopItem[] = [
  // ---- Pacotes: um conjunto completo de cada estilo, mais barato que comprar separado ----
  {
    key: 'bundle-trans',
    kind: 'bundle',
    name: 'Pacote Trans',
    description: 'Card, moldura, borda, tema e calendário nas cores da bandeira trans',
    price: 150,
    items: ['card-trans', 'frame-trans', 'pframe-trans', 'theme-trans', 'cal-trans'],
  },
  {
    key: 'bundle-nb',
    kind: 'bundle',
    name: 'Pacote Não-binário',
    description: 'Tudo em amarelo, branco, roxo e preto',
    price: 150,
    items: ['card-nb', 'frame-nb', 'pframe-nb', 'theme-nb', 'cal-nb'],
  },
  {
    key: 'bundle-orgulho',
    kind: 'bundle',
    name: 'Pacote Orgulho',
    description: 'Card, moldura e borda com o arco-íris',
    price: 80,
    items: ['card-orgulho', 'frame-arco-iris', 'pframe-arco-iris'],
  },
  {
    key: 'bundle-bandeiras',
    kind: 'bundle',
    name: 'Pacote Bandeiras',
    description: 'Lésbica, bi e pan: card, moldura e borda de cada',
    price: 280,
    items: ['card-lesbica', 'frame-lesbica', 'pframe-lesbica', 'card-bi', 'frame-bi', 'pframe-bi', 'card-pan', 'frame-pan', 'pframe-pan'],
  },
  {
    key: 'bundle-pastel',
    kind: 'bundle',
    name: 'Pacote Pastel',
    description: 'Tons de bala, florzinhas e laços',
    price: 120,
    items: ['card-pastel', 'frame-pastel', 'pframe-pastel', 'theme-pastel', 'cal-pastel'],
  },
  {
    key: 'bundle-natal',
    kind: 'bundle',
    name: 'Pacote Natal Cute',
    description: 'Neve, arvorezinha e bengala de doce',
    price: 180,
    items: ['card-natal', 'frame-natal', 'pframe-natal', 'theme-natal', 'cal-natal'],
  },
  {
    key: 'bundle-gotico',
    kind: 'bundle',
    name: 'Pacote Gótico',
    description: 'Preto, vinho, lua e morceguinhos',
    price: 210,
    items: ['card-gotico', 'frame-gotico', 'pframe-gotico', 'theme-gotico', 'cal-gotico'],
  },
  {
    key: 'bundle-pixel',
    kind: 'bundle',
    name: 'Pacote Pixel Art',
    description: 'Tudo em 8 bits, de videogame antigo',
    price: 390,
    pixel: true,
    items: ['card-pixel', 'frame-pixel', 'pframe-pixel', 'theme-retro', 'cal-pixel'],
  },

  // ---- Molduras do avatar (aparecem pra todo mundo, no feed, comentários e perfil) ----
  { key: 'frame-brilho', kind: 'avatarFrame', name: 'Brilho', description: 'Anel rosa e azul com estrelinha', price: 0 },
  { key: 'frame-coracoes', kind: 'avatarFrame', name: 'Coraçõezinhos', description: 'Anel rosa com corações', price: 25 },
  { key: 'frame-gatinho', kind: 'avatarFrame', name: 'Gatinho', description: 'Orelhinhas de gato', price: 40 },
  { key: 'frame-arco-iris', kind: 'avatarFrame', name: 'Arco-íris', description: 'Anel com todas as cores e brilho', price: 30 },
  { key: 'frame-estrelas', kind: 'avatarFrame', name: 'Noite estrelada', description: 'Anel azul-noite com estrelas', price: 45 },
  { key: 'frame-neon', kind: 'avatarFrame', name: 'Neon', description: 'Anel que brilha no escuro', price: 60 },
  { key: 'frame-dourada', kind: 'avatarFrame', name: 'Coroa dourada', description: 'Anel de ouro com coroa, pra quem chegou longe', price: 120 },
  { key: 'frame-trans', kind: 'avatarFrame', name: 'Trans', description: 'Anel da bandeira trans com estrela', price: 40 },
  { key: 'frame-nb', kind: 'avatarFrame', name: 'Não-binária', description: 'Anel da bandeira NB com estrela', price: 40 },
  { key: 'frame-lesbica', kind: 'avatarFrame', name: 'Lésbica', description: 'Anel da bandeira lésbica com coração', price: 40 },
  { key: 'frame-bi', kind: 'avatarFrame', name: 'Bi', description: 'Anel da bandeira bi com coração', price: 40 },
  { key: 'frame-pan', kind: 'avatarFrame', name: 'Pan', description: 'Anel da bandeira pan com estrela', price: 40 },
  { key: 'frame-pastel', kind: 'avatarFrame', name: 'Jardim pastel', description: 'Anel de bala com florzinhas', price: 40 },
  { key: 'frame-natal', kind: 'avatarFrame', name: 'Natal', description: 'Bengala de doce com arvorezinha e neve', price: 60 },
  { key: 'frame-gotico', kind: 'avatarFrame', name: 'Gótica', description: 'Anel preto e vinho com morcego e lua', price: 70 },
  { key: 'frame-pixel', kind: 'avatarFrame', name: 'Pixel', description: 'Moldura quadrada de 8 bits', price: 120, pixel: true },

  // ---- Cards de post (fundo do texto quando o post é "card") ----
  { key: 'card-algodao', kind: 'cardSkin', name: 'Algodão-doce', description: 'Rosa e lilás bem clarinhos', price: 0 },
  { key: 'card-por-do-sol', kind: 'cardSkin', name: 'Pôr do sol', description: 'Laranja, rosa e dourado', price: 20 },
  { key: 'card-oceano', kind: 'cardSkin', name: 'Oceano', description: 'Azul profundo e verde-água', price: 20 },
  { key: 'card-morango', kind: 'cardSkin', name: 'Morango com leite', description: 'Rosa morango e creme', price: 20 },
  { key: 'card-menta', kind: 'cardSkin', name: 'Menta', description: 'Verde-menta fresquinho', price: 20 },
  { key: 'card-aurora', kind: 'cardSkin', name: 'Aurora boreal', description: 'Verde, azul e violeta', price: 30 },
  { key: 'card-holografico', kind: 'cardSkin', name: 'Holográfico', description: 'Furta-cor brilhante', price: 50 },
  { key: 'card-galaxia', kind: 'cardSkin', name: 'Galáxia', description: 'Céu escuro cheio de estrelinhas', price: 60 },
  { key: 'card-trans', kind: 'cardSkin', name: 'Bandeira trans', description: 'Azul, rosa e branco', price: 40 },
  { key: 'card-nb', kind: 'cardSkin', name: 'Bandeira não-binária', description: 'Amarelo, branco, roxo e preto', price: 40 },
  { key: 'card-orgulho', kind: 'cardSkin', name: 'Bandeira do orgulho', description: 'As seis cores do arco-íris', price: 40 },
  { key: 'card-lesbica', kind: 'cardSkin', name: 'Bandeira lésbica', description: 'Laranja, branco e rosa', price: 40 },
  { key: 'card-bi', kind: 'cardSkin', name: 'Bandeira bi', description: 'Rosa, roxo e azul', price: 40 },
  { key: 'card-pan', kind: 'cardSkin', name: 'Bandeira pan', description: 'Rosa, amarelo e azul', price: 40 },
  { key: 'card-pastel', kind: 'cardSkin', name: 'Arco-íris pastel', description: 'Todas as cores, bem clarinhas', price: 30 },
  { key: 'card-natal', kind: 'cardSkin', name: 'Noite de Natal', description: 'Vermelho com neve caindo', price: 40 },
  { key: 'card-gotico', kind: 'cardSkin', name: 'Gótico', description: 'Preto e vinho com lua', price: 50 },
  { key: 'card-pixel', kind: 'cardSkin', name: 'Xadrez pixel', description: 'Quadradinhos de videogame antigo', price: 80, pixel: true },

  // ---- Bordas dos seus posts (aparecem pra todo mundo) ----
  { key: 'pframe-suave', kind: 'postFrame', name: 'Suave', description: 'Borda rosa e lilás', price: 15 },
  { key: 'pframe-arco-iris', kind: 'postFrame', name: 'Arco-íris', description: 'Borda com todas as cores', price: 30 },
  { key: 'pframe-holografica', kind: 'postFrame', name: 'Holográfica', description: 'Borda furta-cor', price: 50 },
  { key: 'pframe-neon', kind: 'postFrame', name: 'Neon', description: 'Borda que brilha', price: 70 },
  { key: 'pframe-dourada', kind: 'postFrame', name: 'Dourada', description: 'Borda de ouro com estrela', price: 120 },
  { key: 'pframe-trans', kind: 'postFrame', name: 'Trans', description: 'Borda da bandeira trans com coração', price: 40 },
  { key: 'pframe-nb', kind: 'postFrame', name: 'Não-binária', description: 'Borda da bandeira NB com estrela', price: 40 },
  { key: 'pframe-lesbica', kind: 'postFrame', name: 'Lésbica', description: 'Borda da bandeira lésbica com coração', price: 40 },
  { key: 'pframe-bi', kind: 'postFrame', name: 'Bi', description: 'Borda da bandeira bi com coração', price: 40 },
  { key: 'pframe-pan', kind: 'postFrame', name: 'Pan', description: 'Borda da bandeira pan com estrela', price: 40 },
  { key: 'pframe-pastel', kind: 'postFrame', name: 'Pastel', description: 'Borda de bala com laço', price: 30 },
  { key: 'pframe-natal', kind: 'postFrame', name: 'Bengala de doce', description: 'Listrinhas de Natal com arvorezinha', price: 50 },
  { key: 'pframe-gotico', kind: 'postFrame', name: 'Gótica', description: 'Preto e vinho com morcego', price: 60 },
  { key: 'pframe-pixel', kind: 'postFrame', name: 'Pixel', description: 'Borda pixelada de videogame', price: 150, pixel: true },

  // ---- Temas (o seu app inteiro: modo, cores e fundo). Os 4 primeiros são grátis ----
  { key: 'theme-aurora-claro', kind: 'theme', name: 'Aurora clara', description: 'Rosa e azul no claro — o clássico', price: 0 },
  { key: 'theme-lavanda', kind: 'theme', name: 'Lavanda', description: 'Lilás e menta no claro', price: 0 },
  { key: 'theme-aurora-escuro', kind: 'theme', name: 'Aurora escura', description: 'Rosa e azul no escuro', price: 0 },
  { key: 'theme-meia-noite', kind: 'theme', name: 'Meia-noite', description: 'Azul e violeta no escuro', price: 0 },
  { key: 'theme-oceano', kind: 'theme', name: 'Oceano', description: 'Azul e verde-água, fundo fresquinho', price: 40 },
  { key: 'theme-por-do-sol', kind: 'theme', name: 'Pôr do sol', description: 'Coral e pêssego, fundo quentinho', price: 40 },
  { key: 'theme-floresta', kind: 'theme', name: 'Floresta', description: 'Verdes, fundo de folha', price: 40 },
  { key: 'theme-cereja', kind: 'theme', name: 'Flor de cerejeira', description: 'Rosa sakura com pétalas', price: 50 },
  { key: 'theme-galaxia', kind: 'theme', name: 'Galáxia', description: 'Escuro com estrelas no fundo', price: 100 },
  { key: 'theme-trans', kind: 'theme', name: 'Trans', description: 'Azul e rosa com corações no fundo', price: 60 },
  { key: 'theme-nb', kind: 'theme', name: 'Não-binário', description: 'Escuro, roxo e amarelo', price: 60 },
  { key: 'theme-pastel', kind: 'theme', name: 'Pastel', description: 'Tudo cor de bala, com florzinhas', price: 50 },
  { key: 'theme-natal', kind: 'theme', name: 'Natal', description: 'Vermelho e verde com neve caindo', price: 70 },
  { key: 'theme-gotico', kind: 'theme', name: 'Gótico', description: 'Preto e vinho com lua no fundo', price: 80 },
  { key: 'theme-retro', kind: 'theme', name: 'Retrô 8-bit', description: 'Fundo quadriculado de videogame', price: 150, pixel: true },

  // ---- Calendários (só no seu Histórico) ----
  { key: 'cal-pastel', kind: 'calendarSkin', name: 'Pastel', description: 'Dias em tons de bala', price: 25 },
  { key: 'cal-oceano', kind: 'calendarSkin', name: 'Oceano', description: 'Ondas em azul e verde-água', price: 30 },
  { key: 'cal-estrelado', kind: 'calendarSkin', name: 'Estrelado', description: 'Céu noturno com estrelas', price: 60 },
  { key: 'cal-trans', kind: 'calendarSkin', name: 'Trans', description: 'Dias em azul, rosa e branco', price: 40 },
  { key: 'cal-nb', kind: 'calendarSkin', name: 'Não-binário', description: 'Dias em amarelo, roxo e preto', price: 40 },
  { key: 'cal-natal', kind: 'calendarSkin', name: 'Natal', description: 'Vermelho e verde com neve', price: 50 },
  { key: 'cal-gotico', kind: 'calendarSkin', name: 'Gótico', description: 'Preto e vinho, dias redondinhos', price: 60 },
  { key: 'cal-pixel', kind: 'calendarSkin', name: 'Pixel', description: 'Números e bordas de 8 bits', price: 90, pixel: true },
]

export const SHOP_ITEM_BY_KEY = new Map(SHOP_ITEMS.map((i) => [i.key, i]))

// Categorias pros filtros da lojinha (cada departamento mostra só as que têm item). Sai do key do
// item — item novo com "natal", "trans", "gotico" etc. no key já cai no filtro certo.
export type ShopTag = 'padrao' | 'fofo' | 'natureza' | 'estiloso' | 'retro' | 'comemorativo' | 'genero' | 'sexualidade'

export const SHOP_TAGS: { key: ShopTag; label: string }[] = [
  { key: 'padrao', label: 'Padrão' },
  { key: 'fofo', label: 'Fofos' },
  { key: 'natureza', label: 'Natureza' },
  { key: 'estiloso', label: 'Estilosos' },
  { key: 'retro', label: '8-bit' },
  { key: 'comemorativo', label: 'Comemorativos' },
  { key: 'genero', label: 'Gênero' },
  { key: 'sexualidade', label: 'Sexualidade' },
]

const TAG_RULES: [ShopTag, RegExp][] = [
  ['genero', /trans|-nb\b/],
  ['sexualidade', /arco-iris|orgulho|lesbica|-bi\b|-pan\b|bandeiras/],
  ['comemorativo', /natal/],
  ['estiloso', /gotico|neon|holograf|galaxia|dourada|estrel|meia-noite/],
  ['fofo', /pastel|coracoes|gatinho|algodao|morango|cereja|suave|lavanda/],
  ['natureza', /oceano|floresta|menta|por-do-sol|aurora-boreal|card-aurora/],
]

export function itemTags(item: ShopItem): ShopTag[] {
  const tags = TAG_RULES.filter(([, re]) => re.test(item.key)).map(([t]) => t)
  if (item.pixel) tags.push('retro')
  if (tags.length === 0 || item.price === 0) tags.unshift('padrao')
  return [...new Set(tags)]
}

/** Coluna do perfil onde fica o item equipado de cada tipo (card é por post e pacote não equipa). */
export type EquippableKind = Exclude<ShopKind, 'cardSkin' | 'bundle'>

export interface ShopEquipped {
  avatarFrame: string | null
  postFrame: string | null
  theme: string | null
  calendarSkin: string | null
}

export interface ShopState {
  /** Brilho total já ganho (o que conta pros títulos — nunca diminui por compra) */
  earned: number
  spent: number
  balance: number
  owned: string[]
  equipped: ShopEquipped
  /** desconto valendo agora em cada item (key do item ou da poção) */
  promos: Record<string, { percent: number; label: string; endsAt: string | null }>
  /** poções do tempo disponíveis agora */
  potions: number
}

/** Grátis conta como "tem" sem comprar; pacote conta se foi comprado ou se já tem tudo dele. */
export function ownsItem(owned: Iterable<string>, key: string): boolean {
  const item = SHOP_ITEM_BY_KEY.get(key)
  if (!item) return false
  if (item.price === 0) return true
  const set = owned instanceof Set ? (owned as Set<string>) : new Set(owned)
  if (set.has(key)) return true
  if (item.kind === 'bundle') return (item.items ?? []).every((k) => ownsItem(set, k))
  return false
}

/** Soma dos itens do pacote comprados um a um — pra mostrar o desconto. */
export function bundleFullPrice(bundle: ShopItem): number {
  return (bundle.items ?? []).reduce((sum, k) => sum + (SHOP_ITEM_BY_KEY.get(k)?.price ?? 0), 0)
}

/**
 * Preço do pacote pra quem já tem parte dele: desconta proporcionalmente o que já foi comprado,
 * pra ninguém pagar duas vezes pelo mesmo item.
 */
export function bundlePriceFor(bundle: ShopItem, owned: Iterable<string>): number {
  const full = bundleFullPrice(bundle)
  if (full === 0) return 0
  const set = new Set(owned)
  const missing = (bundle.items ?? []).reduce(
    (sum, k) => sum + (ownsItem(set, k) ? 0 : (SHOP_ITEM_BY_KEY.get(k)?.price ?? 0)),
    0,
  )
  return Math.round((bundle.price * missing) / full)
}
