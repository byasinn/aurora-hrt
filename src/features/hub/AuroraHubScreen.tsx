import { Link } from 'react-router-dom'
import { ChevronRight, Users } from '../../components/icons'
import type { ReactNode } from 'react'
import { Card } from '../../components/ui'
import Avatar from '../../components/Avatar'
import AppIcon from '../../components/AppIcon'
import { Coins, Gem, Star, Store } from '../../components/icons'
import { useProfile } from '../../api/profile'
import { useShop } from '../../api/shop'
import { playSound } from '../../lib/sounds'
import { SHOP_ITEMS, ownsItem } from '../../../shared/shopCatalog'

function HubCard({
  to,
  icon,
  title,
  description,
  badge,
  background,
}: {
  to: string
  icon: ReactNode
  title: string
  description: string
  badge?: ReactNode
  background: string
}) {
  return (
    <Link to={to} onClick={() => playSound('tap')} className="block">
      <Card className="btn-press-soft flex h-full flex-col gap-3 p-4 transition active:translate-y-0.5">
        <div className="flex items-start justify-between">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background }}>
            {icon}
          </span>
          {badge}
        </div>
        <div className="flex-1">
          <p className="text-lg font-extrabold leading-tight text-[var(--text)]">{title}</p>
          <p className="mt-0.5 text-sm text-[var(--text-muted)]">{description}</p>
        </div>
        <ChevronRight size={18} className="self-end text-[var(--text-muted)]" />
      </Card>
    </Link>
  )
}

/** Central do Aurora: o botão grande do meio da barra de baixo leva pra cá — o que antes não cabia
 * na barra (Comunidades, Lojinha, Meus itens, Pontos) fica a um toque. */
export default function AuroraHubScreen() {
  const { data: profile } = useProfile()
  const { data: shop } = useShop()
  const firstName = profile?.displayName?.trim().split(/\s+/)[0]
  const ownedCount = SHOP_ITEMS.filter((i) => i.kind !== 'bundle' && i.price > 0 && ownsItem(shop?.owned ?? [], i.key)).length

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 pt-5">
        <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={56} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-extrabold text-[var(--text)]">Oi{firstName ? `, ${firstName}` : ''}!</h1>
          <p className="text-sm text-[var(--text-muted)]">O que vamos ver hoje?</p>
        </div>
        <Link to="/loja" className="flex shrink-0 items-center gap-1.5 rounded-full bg-[var(--surface)] px-3 py-1.5 [box-shadow:var(--shadow)]">
          <Coins size={16} className="text-amber-500" />
          <span className="font-pixel text-lg font-bold text-[var(--text)]">{shop?.balance ?? '–'}</span>
        </Link>
      </div>

      {/* de fora a fora e com outra cor de propósito: é a porta de entrada da personalização */}
      <Link to="/personalizar" onClick={() => playSound('pop')} className="block">
        <div
          className="btn-press-soft relative overflow-hidden rounded-3xl p-5 text-white [box-shadow:var(--shadow)] transition active:translate-y-0.5"
          style={{ background: 'linear-gradient(120deg, var(--accent-3), var(--accent-2) 55%, var(--accent))' }}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0 rounded-full bg-white/20 p-1.5">
              <Avatar src={profile?.avatarUrl} icon={profile?.avatarIcon} name={profile?.displayName} frame={profile?.equippedAvatarFrame} size={52} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-extrabold leading-tight">Personalizar app</p>
              <p className="text-sm text-white/85">Tema, visual, moldura, borda, calendário e mais</p>
            </div>
            <ChevronRight size={22} className="shrink-0 text-white/90" />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {['Tema', 'Clean ou 8-bit', 'Moldura', 'Ícone e sons'].map((chip) => (
              <span key={chip} className="rounded-full bg-white/20 px-2.5 py-1 text-xs font-bold">
                {chip}
              </span>
            ))}
          </div>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <HubCard
          to="/comunidades"
          icon={<AppIcon icon={Users} pixel="usersColor" size={26} className="text-[var(--accent)]" />}
          background="var(--accent-soft)"
          title="Comunidades"
          description="Grupos pra conversar sobre o que importa"
        />
        <HubCard
          to="/loja"
          icon={<Store size={26} className="text-[var(--accent)]" />}
          background="var(--accent-soft)"
          title="Lojinha"
          description="Molduras, cards, temas e pacotes"
          badge={
            <span className="flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5">
              <Coins size={12} className="text-amber-500" />
              <span className="font-pixel text-sm font-bold text-[var(--text)]">{shop?.balance ?? '–'}</span>
            </span>
          }
        />
        <HubCard
          to="/meus-itens"
          icon={<Gem size={26} className="text-[var(--accent)]" />}
          background="var(--accent-soft)"
          title="Meus itens"
          description="Escolha o que usar no perfil, nos posts e no app"
          badge={
            ownedCount > 0 ? (
              <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-bold text-[var(--accent-contrast)]">{ownedCount}</span>
            ) : undefined
          }
        />
        <HubCard
          to="/pontos"
          icon={<Star size={24} className="text-amber-500" />}
          background="var(--accent-soft)"
          title="Pontos"
          description="Seu Brilho, títulos e coleção"
        />
      </div>
    </div>
  )
}
