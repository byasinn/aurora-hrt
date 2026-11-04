// Catálogo da lojinha — compartilhado entre o app (vitrine) e o Worker (preço e validação de compra).
// O visual de cada item fica em src/lib/shopVisuals.ts; aqui só o que o servidor precisa saber.
//
// Preços calibrados pelo Brilho real em nov/2026: mediana 0, p90 ≈ 4, p99 ≈ 40, máximo ≈ 175.
// Uma semana de uso normal (dose + humor todo dia + um post) rende ~30, então os itens mais baratos
// saem em uma semana e os mais caros são meta de meses. Alguns grátis pra lojinha não abrir vazia.

export type ShopKind = 'cardSkin' | 'avatarFrame' | 'postFrame' | 'theme' | 'calendarSkin'

export interface ShopItem {
  key: string
  kind: ShopKind
  name: string
  description: string
  price: number
  /** item com cara de pixel art — ganha selo na vitrine */
  pixel?: boolean
}

export const SHOP_KIND_LABEL: Record<ShopKind, string> = {
  cardSkin: 'Cards de post',
  avatarFrame: 'Molduras de perfil',
  postFrame: 'Bordas de post',
  theme: 'Temas',
  calendarSkin: 'Calendários',
}

export const SHOP_KINDS: ShopKind[] = ['cardSkin', 'avatarFrame', 'postFrame', 'theme', 'calendarSkin']

export const SHOP_ITEMS: ShopItem[] = [
  // Cards de post (fundo do texto quando o post é "card")
  { key: 'card-algodao', kind: 'cardSkin', name: 'Algodão-doce', description: 'Rosa e lilás bem clarinhos', price: 0 },
  { key: 'card-por-do-sol', kind: 'cardSkin', name: 'Pôr do sol', description: 'Laranja, rosa e dourado', price: 20 },
  { key: 'card-aurora', kind: 'cardSkin', name: 'Aurora boreal', description: 'Verde, azul e violeta', price: 30 },
  { key: 'card-trans', kind: 'cardSkin', name: 'Bandeira trans', description: 'Azul, rosa e branco', price: 40 },
  { key: 'card-nb', kind: 'cardSkin', name: 'Bandeira não-binária', description: 'Amarelo, branco, roxo e preto', price: 40 },
  { key: 'card-galaxia', kind: 'cardSkin', name: 'Galáxia', description: 'Céu escuro cheio de estrelinhas', price: 60 },
  { key: 'card-pixel', kind: 'cardSkin', name: 'Xadrez pixel', description: 'Quadradinhos de videogame antigo', price: 80, pixel: true },

  // Molduras do avatar (aparecem pra todo mundo, no feed e no perfil)
  { key: 'frame-brilho', kind: 'avatarFrame', name: 'Brilho', description: 'Anel rosa e azul', price: 0 },
  { key: 'frame-arco-iris', kind: 'avatarFrame', name: 'Arco-íris', description: 'Anel com todas as cores', price: 30 },
  { key: 'frame-trans', kind: 'avatarFrame', name: 'Trans', description: 'Anel nas cores da bandeira trans', price: 30 },
  { key: 'frame-nb', kind: 'avatarFrame', name: 'Não-binária', description: 'Anel nas cores da bandeira NB', price: 30 },
  { key: 'frame-dourada', kind: 'avatarFrame', name: 'Dourada', description: 'Anel de ouro, pra quem chegou longe', price: 100 },
  { key: 'frame-pixel', kind: 'avatarFrame', name: 'Pixel', description: 'Moldura quadrada de 8 bits', price: 120, pixel: true },

  // Bordas dos seus posts (aparecem pra todo mundo)
  { key: 'pframe-suave', kind: 'postFrame', name: 'Suave', description: 'Borda rosa e lilás', price: 15 },
  { key: 'pframe-trans', kind: 'postFrame', name: 'Trans', description: 'Borda nas cores da bandeira trans', price: 40 },
  { key: 'pframe-neon', kind: 'postFrame', name: 'Neon', description: 'Borda que brilha', price: 70 },
  { key: 'pframe-dourada', kind: 'postFrame', name: 'Dourada', description: 'Borda de ouro', price: 120 },
  { key: 'pframe-pixel', kind: 'postFrame', name: 'Pixel', description: 'Borda pixelada de videogame', price: 150, pixel: true },

  // Temas (só no seu app: cores + fundo)
  { key: 'theme-oceano', kind: 'theme', name: 'Oceano', description: 'Azul e verde-água, fundo fresquinho', price: 40 },
  { key: 'theme-por-do-sol', kind: 'theme', name: 'Pôr do sol', description: 'Coral e pêssego, fundo quentinho', price: 40 },
  { key: 'theme-floresta', kind: 'theme', name: 'Floresta', description: 'Verdes, fundo de folha', price: 40 },
  { key: 'theme-galaxia', kind: 'theme', name: 'Galáxia', description: 'Modo escuro com estrelas no fundo', price: 100 },
  { key: 'theme-retro', kind: 'theme', name: 'Retrô 8-bit', description: 'Fundo quadriculado de videogame', price: 150, pixel: true },

  // Calendários (só no seu Histórico)
  { key: 'cal-pastel', kind: 'calendarSkin', name: 'Pastel', description: 'Dias em tons de bala', price: 25 },
  { key: 'cal-estrelado', kind: 'calendarSkin', name: 'Estrelado', description: 'Céu noturno com estrelas', price: 60 },
  { key: 'cal-pixel', kind: 'calendarSkin', name: 'Pixel', description: 'Números e bordas de 8 bits', price: 90, pixel: true },
]

export const SHOP_ITEM_BY_KEY = new Map(SHOP_ITEMS.map((i) => [i.key, i]))

/** Coluna do perfil onde fica o item equipado de cada tipo (cardSkin é por post, não equipa). */
export type EquippableKind = Exclude<ShopKind, 'cardSkin'>

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
}

/** Grátis conta como "tem" sem precisar comprar. */
export function ownsItem(owned: Iterable<string>, key: string): boolean {
  const item = SHOP_ITEM_BY_KEY.get(key)
  if (!item) return false
  if (item.price === 0) return true
  for (const k of owned) if (k === key) return true
  return false
}
