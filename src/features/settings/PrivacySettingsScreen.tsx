import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Ban } from '../../components/icons'
import { Button, Card } from '../../components/ui'
import Switch from '../../components/Switch'
import { useProfile, useUpdateProfile } from '../../api/profile'
import { isFaceIdSupported, isFaceIdEnabled, registerFaceId, disableFaceId } from '../../lib/faceId'
import { PIN_LENGTH, clearPin, isPinEnabled, setPin } from '../../lib/appLock'
import { toastError } from '../../lib/toast'
import SettingsSubHeader from './SettingsSubHeader'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-[var(--text)] outline-none focus:border-[var(--accent)]'

function Row({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--text)]">{title}</p>
        {description && <p className="text-xs text-[var(--text-muted)]">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">{children}</h2>
}

function LocationCard() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()
  const [country, setCountry] = useState('')
  const [city, setCity] = useState('')

  useEffect(() => {
    if (!profile) return
    setCountry(profile.country ?? '')
    setCity(profile.city ?? '')
  }, [profile])

  const dirty = (profile?.country ?? '') !== country || (profile?.city ?? '') !== city

  return (
    <Card className="space-y-2">
      <Row title="Mostrar país e cidade no perfil" description="Opcional. Só aparece se estiver ligado.">
        <Switch checked={profile?.showLocation ?? false} onChange={(v) => updateProfile.mutate({ showLocation: v })} />
      </Row>
      <div className="grid grid-cols-2 gap-2">
        <input value={country} onChange={(e) => setCountry(e.target.value)} maxLength={60} placeholder="País" className={inputClass} />
        <input value={city} onChange={(e) => setCity(e.target.value)} maxLength={60} placeholder="Cidade" className={inputClass} />
      </div>
      {dirty && (
        <Button
          className="w-full"
          disabled={updateProfile.isPending}
          onClick={() =>
            updateProfile.mutate(
              { country: country.trim() || null, city: city.trim() || null },
              { onError: (err) => toastError(err, 'Não foi possível salvar.') },
            )
          }
        >
          Salvar localização
        </Button>
      )}
    </Card>
  )
}

function AppLockCard() {
  const [faceIdSupported, setFaceIdSupported] = useState(false)
  const [faceIdOn, setFaceIdOn] = useState(isFaceIdEnabled)
  const [pinOn, setPinOn] = useState(isPinEnabled)
  const [busy, setBusy] = useState(false)
  const [choosingPin, setChoosingPin] = useState(false)
  const [pin, setPinValue] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  useEffect(() => {
    isFaceIdSupported().then(setFaceIdSupported)
  }, [])

  async function toggleFaceId(next: boolean) {
    setBusy(true)
    try {
      if (!next) {
        disableFaceId()
        setFaceIdOn(false)
      } else {
        setFaceIdOn(await registerFaceId())
      }
    } finally {
      setBusy(false)
    }
  }

  async function savePin() {
    setPinError(null)
    if (!new RegExp(`^\\d{${PIN_LENGTH}}$`).test(pin)) return setPinError(`O PIN tem ${PIN_LENGTH} números.`)
    if (pin !== pinConfirm) return setPinError('Os dois PINs não são iguais.')
    await setPin(pin)
    setPinOn(true)
    setChoosingPin(false)
    setPinValue('')
    setPinConfirm('')
  }

  const digits = (v: string) => v.replace(/\D/g, '').slice(0, PIN_LENGTH)

  return (
    <Card className="space-y-2">
      <p className="text-xs text-[var(--text-muted)]">Pede pra desbloquear sempre que o app abrir neste aparelho. Esqueceu? Dá pra sair e entrar de novo com email e senha.</p>
      {faceIdSupported ? (
        <Row title="Face ID / Touch ID" description="Biometria do aparelho.">
          <Switch checked={faceIdOn} onChange={toggleFaceId} disabled={busy} />
        </Row>
      ) : (
        <p className="py-1 text-xs text-[var(--text-muted)]">Face ID/Touch ID não está disponível neste navegador — use o PIN.</p>
      )}
      <Row title="PIN" description={`Senha de ${PIN_LENGTH} números só pra abrir o app.`}>
        <Switch
          checked={pinOn || choosingPin}
          onChange={(v) => {
            if (v) setChoosingPin(true)
            else {
              clearPin()
              setPinOn(false)
              setChoosingPin(false)
            }
          }}
        />
      </Row>
      {choosingPin && !pinOn && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input inputMode="numeric" type="password" value={pin} onChange={(e) => setPinValue(digits(e.target.value))} placeholder="Novo PIN" className={inputClass} />
            <input inputMode="numeric" type="password" value={pinConfirm} onChange={(e) => setPinConfirm(digits(e.target.value))} placeholder="Repita" className={inputClass} />
          </div>
          {pinError && <p className="text-sm text-red-400">{pinError}</p>}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setChoosingPin(false)}>
              Cancelar
            </Button>
            <Button className="flex-1" onClick={savePin}>
              Salvar PIN
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}

export default function PrivacySettingsScreen() {
  const { data: profile } = useProfile()
  const updateProfile = useUpdateProfile()

  return (
    <div className="space-y-4">
      <SettingsSubHeader title="Privacidade e segurança" />

      <SectionTitle>Privacidade</SectionTitle>
      <Card>
        <Row title="Conta privada" description="Só quem você aprovar consegue seguir e ver seus posts e estatísticas.">
          <Switch checked={profile?.isPrivate ?? false} onChange={(v) => updateProfile.mutate({ isPrivate: v })} />
        </Row>
      </Card>

      <Card className="space-y-1">
        <p className="pb-1 text-xs text-[var(--text-muted)]">O que aparece no seu perfil pra quem te segue:</p>
        <Row title="Humor médio">
          <Switch checked={profile?.shareAvgMood ?? false} onChange={(v) => updateProfile.mutate({ shareAvgMood: v })} />
        </Row>
        <Row title="Libido média">
          <Switch checked={profile?.shareLibido ?? false} onChange={(v) => updateProfile.mutate({ shareLibido: v })} />
        </Row>
        <Row title="O que toma" description="Medicamentos ativos">
          <Switch checked={profile?.shareMedications ?? false} onChange={(v) => updateProfile.mutate({ shareMedications: v })} />
        </Row>
        <Row title="Tempo de hormonioterapia">
          <Switch checked={profile?.shareHrtDuration ?? false} onChange={(v) => updateProfile.mutate({ shareHrtDuration: v })} />
        </Row>
      </Card>

      <LocationCard />

      <Link to="/settings/bloqueios" className="block">
        <Card className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
            <Ban size={18} />
          </span>
          <span className="flex-1 font-medium text-[var(--text)]">Contas bloqueadas</span>
          <ChevronRight size={18} className="text-[var(--text-muted)]" />
        </Card>
      </Link>

      <SectionTitle>Segurança</SectionTitle>
      <AppLockCard />
    </div>
  )
}
