import type { ShopKind } from '../../../shared/shopCatalog'
import type { KeeperLook, SceneLook } from './pixelArt'

// Departamentos da lojinha: cada tipo de item é uma "loja". No visual 8-bit cada uma tem sua
// vendedora (meio RPG, meio mágica), com fundo, balcão, voz e falas próprias.

export type DepartmentKind = ShopKind | 'potion'

export interface Keeper {
  name: string
  role: string
  look: KeeperLook
  /** tom base do "blá-blá" (Hz) */
  voice: number
  greeting: string
  /** falas soltas de vez em quando */
  lines: string[]
}

export interface Department {
  slug: string
  kind: DepartmentKind
  title: string
  blurb: string
  keeper: Keeper
  scene: SceneLook
}

export const DEPARTMENTS: Department[] = [
  {
    slug: 'pacotes',
    kind: 'bundle',
    title: 'Pacotes',
    blurb: 'Conjuntos completos, mais baratos que separado',
    keeper: {
      name: 'Lua',
      role: 'mercadora viajante',
      look: { skin: '#f5c6a5', hair: '#7c3aed', eyes: '#d97706', outfit: '#e0a526', trim: '#9a3412', hairStyle: 'long', hat: 'cap', hatColor: '#b45309', extras: ['earrings', 'scarf'] },
      voice: 520,
      greeting: 'Bem-vinde à minha tenda! Pacote sai mais barato que comprar tudo separado, viu?',
      lines: ['Trouxe esses lá do outro lado do mapa!', 'Pacote é o melhor negócio da vila, confia.', 'Se já tem um pedaço, eu desconto o que falta!'],
    },
    scene: {
      wall: '#f1d4a8',
      wallStyle: 'planks',
      shelf: '#8b5a2b',
      items: 'boxes',
      itemColors: ['#f472b6', '#60a5fa', '#34d399', '#a78bfa'],
      bunting: true,
      counter: '#a0642c',
      counterTrim: '#be185d',
      prop: 'plant',
    },
  },
  {
    slug: 'molduras',
    kind: 'avatarFrame',
    title: 'Molduras',
    blurb: 'Em volta da sua foto, em todo lugar',
    keeper: {
      name: 'Kiki',
      role: 'artista de molduras',
      look: { skin: '#e0ac85', hair: '#f472b6', eyes: '#0e7490', outfit: '#22d3ee', trim: '#fef3c7', hairStyle: 'bob', hat: 'beret', hatColor: '#be185d', extras: ['freckles'] },
      voice: 680,
      greeting: 'Oiii! Uma moldura nova e seu avatar brilha no feed inteiro!',
      lines: ['Pintei essa ontem à noite, tá até quentinha.', 'Moldura combina com tudo, juro.', 'Ai, você ia ficar linde nessa dourada!'],
    },
    scene: {
      wall: '#fbcfe8',
      wallStyle: 'wallpaper',
      shelf: '#9d5c63',
      items: 'frames',
      itemColors: ['#93c5fd', '#fde68a', '#c4b5fd', '#86efac'],
      counter: '#b06a4a',
      counterTrim: '#0891b2',
      prop: 'candle',
    },
  },
  {
    slug: 'cards',
    kind: 'cardSkin',
    title: 'Cards de post',
    blurb: 'O fundo dos seus posts de texto',
    keeper: {
      name: 'Rafa',
      role: 'escriba do correio',
      look: { skin: '#8d5524', hair: '#1f2937', eyes: '#7c3aed', outfit: '#a78bfa', trim: '#fde68a', hairStyle: 'curly', extras: ['glasses'] },
      voice: 430,
      greeting: 'Salve! Você escolhe o card na hora de postar, um diferente por post.',
      lines: ['Cada carta que sai daqui leva um pedacinho de coração.', 'Esse de galáxia é o mais pedido.', 'Já viu o card com a bandeira lésbica? Ficou lindo.'],
    },
    scene: {
      wall: '#cbd5e1',
      wallStyle: 'bricks',
      shelf: '#6b4f3a',
      items: 'cards',
      itemColors: ['#f472b6', '#60a5fa', '#facc15', '#a78bfa'],
      counter: '#7c5a3c',
      counterTrim: '#7c3aed',
      prop: 'scroll',
    },
  },
  {
    slug: 'bordas',
    kind: 'postFrame',
    title: 'Bordas de post',
    blurb: 'Uma moldura em volta de tudo que você posta',
    keeper: {
      name: 'Nic',
      role: 'costureira de bordas',
      look: { skin: '#ffdbac', hair: '#f59e0b', eyes: '#16a34a', outfit: '#34d399', trim: '#fce7f3', hairStyle: 'twin', hat: 'flower', extras: ['freckles'] },
      voice: 610,
      greeting: 'Bordinha aparece em todos os seus posts, pra todo mundo ver!',
      lines: ['Costurei essa com linha de arco-íris.', 'Cuidado com o novelo, o gato da vizinha adora.', 'Borda neon brilha até no escuro!'],
    },
    scene: {
      wall: '#bbf7d0',
      wallStyle: 'wallpaper',
      shelf: '#8b5a2b',
      items: 'rolls',
      itemColors: ['#f472b6', '#fde047', '#60a5fa', '#c084fc'],
      counter: '#9a6b3f',
      counterTrim: '#db2777',
      prop: 'yarn',
    },
  },
  {
    slug: 'temas',
    kind: 'theme',
    title: 'Temas',
    blurb: 'As cores e o fundo do app inteiro',
    keeper: {
      name: 'Sol',
      role: 'pintora de cores',
      look: { skin: '#c68642', hair: '#ef4444', eyes: '#92400e', outfit: '#60a5fa', trim: '#fde047', hairStyle: 'bun', extras: ['earrings', 'scarf'] },
      voice: 560,
      greeting: 'Tema muda as cores do app todinho — só pra você ver!',
      lines: ['Misturei esse azul com um pouquinho de céu.', 'O tema galáxia tem estrelas de verdade, quase.', 'Cor certa muda o humor do dia, sabia?'],
    },
    scene: {
      wall: '#ddd6fe',
      wallStyle: 'planks',
      shelf: '#7c5a3c',
      items: 'paints',
      itemColors: ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7'],
      window: 'day',
      counter: '#8b5e34',
      counterTrim: '#2563eb',
      prop: 'palette',
    },
  },
  {
    slug: 'calendarios',
    kind: 'calendarSkin',
    title: 'Calendários',
    blurb: 'O visual do seu Histórico',
    keeper: {
      name: 'Teo',
      role: 'astrônomo do tempo',
      look: { skin: '#f1c27d', hair: '#5bcefa', eyes: '#1e3a8a', outfit: '#312e81', trim: '#fde68a', hairStyle: 'short', hat: 'starcap', hatColor: '#4338ca', extras: ['glasses'] },
      voice: 470,
      greeting: 'Olá, viajante do tempo. Calendário bonito dá vontade de registrar todo dia!',
      lines: ['As estrelas dizem que hoje é um bom dia pra registrar o humor.', 'Esse relógio de areia nunca atrasa.', 'Lua cheia combina com o calendário estrelado.'],
    },
    scene: {
      wall: '#1e1b4b',
      wallStyle: 'night',
      shelf: '#4c3a6b',
      items: 'calendars',
      itemColors: ['#ef4444', '#fde68a', '#60a5fa'],
      window: 'night',
      counter: '#4a3a5c',
      counterTrim: '#fbbf24',
      prop: 'hourglass',
    },
  },
  {
    slug: 'pocoes',
    kind: 'potion',
    title: 'Poções',
    blurb: 'Poção do tempo pra salvar um dia esquecido',
    keeper: {
      name: 'Mags',
      role: 'bruxa das poções',
      look: { skin: '#b5835a', hair: '#34d399', eyes: '#a21caf', outfit: '#6d28d9', trim: '#fbbf24', hairStyle: 'long', hat: 'witch', hatColor: '#4c1d95', extras: ['earrings'] },
      voice: 400,
      greeting: 'Hihi... bem-vinde! A Poção do tempo faz um dia esquecido valer de novo. É cara, mas é mágica.',
      lines: ['Cuidado, essa do frasco roxo borbulha!', 'O gato? É o Biscoito. Ele não vende nada, só julga.', 'Uma gota e o seu streak volta inteirinho.', 'Ingrediente secreto: carinho. E um pouquinho de pó de estrela.'],
    },
    scene: {
      wall: '#3b2f4a',
      wallStyle: 'stone',
      shelf: '#5b3b2a',
      items: 'potions',
      itemColors: ['#a855f7', '#22d3ee', '#f472b6', '#4ade80', '#fbbf24'],
      window: 'night',
      counter: '#5b3b2a',
      counterTrim: '#7c3aed',
      prop: 'cat',
    },
  },
]

export const DEPARTMENT_BY_SLUG = new Map(DEPARTMENTS.map((d) => [d.slug, d]))
export const DEPARTMENT_BY_KIND = new Map<DepartmentKind, Department>(DEPARTMENTS.map((d) => [d.kind, d]))
