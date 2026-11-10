import type { PixelIconName } from '../../components/PixelIcon'
import type { ShopKind } from '../../../shared/shopCatalog'

// Departamentos da lojinha: cada tipo de item é uma "loja" com sua vendedora (no visual 8-bit).
// A paleta troca cabelo (h), pele (f) e roupa (u/j) do mesmo desenho base.

export interface Department {
  slug: string
  kind: ShopKind
  title: string
  blurb: string
  keeper: { name: string; sprite: PixelIconName; palette: Record<string, string>; greeting: string }
}

export const DEPARTMENTS: Department[] = [
  {
    slug: 'pacotes',
    kind: 'bundle',
    title: 'Pacotes',
    blurb: 'Conjuntos completos, mais baratos que separado',
    keeper: {
      name: 'Lua',
      sprite: 'keeperLong',
      palette: { h: '#7c3aed', f: '#f5c6a5', u: '#f5c542', j: '#b7791f' },
      greeting: 'Pacote sai mais barato que comprar tudo separado, viu?',
    },
  },
  {
    slug: 'molduras',
    kind: 'avatarFrame',
    title: 'Molduras',
    blurb: 'Em volta da sua foto, em todo lugar',
    keeper: {
      name: 'Kiki',
      sprite: 'keeperBun',
      palette: { h: '#f472b6', f: '#e0ac85', u: '#22d3ee', j: '#0891b2' },
      greeting: 'Uma moldura nova e seu avatar brilha no feed inteiro!',
    },
  },
  {
    slug: 'cards',
    kind: 'cardSkin',
    title: 'Cards de post',
    blurb: 'O fundo dos seus posts de texto',
    keeper: {
      name: 'Rafa',
      sprite: 'keeperShort',
      palette: { h: '#1f2937', f: '#8d5524', u: '#a78bfa', j: '#7c3aed' },
      greeting: 'Você escolhe o card na hora de postar, um diferente por post.',
    },
  },
  {
    slug: 'bordas',
    kind: 'postFrame',
    title: 'Bordas de post',
    blurb: 'Uma moldura em volta de tudo que você posta',
    keeper: {
      name: 'Nic',
      sprite: 'keeperLong',
      palette: { h: '#f59e0b', f: '#ffdbac', u: '#34d399', j: '#059669' },
      greeting: 'Borda aparece em todos os seus posts, pra todo mundo ver.',
    },
  },
  {
    slug: 'temas',
    kind: 'theme',
    title: 'Temas',
    blurb: 'As cores e o fundo do app inteiro',
    keeper: {
      name: 'Sol',
      sprite: 'keeperBun',
      palette: { h: '#ef4444', f: '#c68642', u: '#60a5fa', j: '#2563eb' },
      greeting: 'Tema muda as cores do app todinho — só pra você.',
    },
  },
  {
    slug: 'calendarios',
    kind: 'calendarSkin',
    title: 'Calendários',
    blurb: 'O visual do seu Histórico',
    keeper: {
      name: 'Teo',
      sprite: 'keeperShort',
      palette: { h: '#5bcefa', f: '#f1c27d', u: '#f9a8d4', j: '#db2777' },
      greeting: 'Calendário bonito dá vontade de registrar todo dia!',
    },
  },
]

export const DEPARTMENT_BY_SLUG = new Map(DEPARTMENTS.map((d) => [d.slug, d]))
export const DEPARTMENT_BY_KIND = new Map(DEPARTMENTS.map((d) => [d.kind, d]))
