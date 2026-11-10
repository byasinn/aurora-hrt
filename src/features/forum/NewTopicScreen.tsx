import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft } from '../../components/icons'
import { Button, Card, ScreenTitle } from '../../components/ui'
import { useCreateTopic } from '../../api/forum'
import { useMe } from '../../api/auth'
import { FORUM_TAGS, MAX_TOPIC_TAGS, TOPIC_BODY_MAX, TOPIC_TITLE_MAX } from '../../../shared/forum'
import { TagChip } from './ForumScreen'
import { playSound } from '../../lib/sounds'
import { toastError } from '../../lib/toast'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-sm text-[var(--text)] outline-none focus:border-[var(--accent)]'

export default function NewTopicScreen() {
  const navigate = useNavigate()
  const create = useCreateTopic()
  const { data: me } = useMe(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const available = FORUM_TAGS.filter((t) => !t.staff || me?.isAdmin)

  function toggle(key: string) {
    setTags((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : cur.length >= MAX_TOPIC_TAGS ? cur : [...cur, key]))
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    create.mutate(
      { title: title.trim(), body: body.trim(), tags },
      {
        onSuccess: (r) => {
          playSound('success')
          navigate(`/comunidades/t/${r.id}`, { replace: true })
        },
        onError: (err) => toastError(err),
      },
    )
  }

  const ready = title.trim().length >= 3 && body.trim().length > 0 && tags.length > 0

  return (
    <div className="space-y-4">
      <Link to="/comunidades" className="flex items-center gap-1 text-sm text-[var(--text-muted)]">
        <ArrowLeft size={16} /> Comunidade
      </Link>
      <ScreenTitle>Novo tópico</ScreenTitle>
      <Card>
        <form onSubmit={submit} className="space-y-4">
          <label className="block space-y-1.5 text-xs font-medium text-[var(--text-muted)]">
            Título
            <input className={inputClass} value={title} maxLength={TOPIC_TITLE_MAX} onChange={(e) => setTitle(e.target.value)} placeholder="Sobre o que você quer falar?" />
          </label>
          <label className="block space-y-1.5 text-xs font-medium text-[var(--text-muted)]">
            Texto
            <textarea
              className={inputClass + ' user-text resize-y'}
              rows={7}
              value={body}
              maxLength={TOPIC_BODY_MAX}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Conta com detalhes — quanto mais contexto, melhor as respostas."
            />
          </label>
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-[var(--text-muted)]">
              Tags (até {MAX_TOPIC_TAGS}) — ajudam a pessoa certa a achar seu tópico
            </p>
            <div className="flex flex-wrap gap-1.5">
              {available.map((t) => (
                <TagChip key={t.key} tag={t.key} active={tags.includes(t.key)} onClick={() => toggle(t.key)} />
              ))}
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Lembra: aqui é espaço seguro. Nada de dados pessoais de ninguém, e conselho médico é troca de experiência — não substitui consulta.
          </p>
          <Button type="submit" className="w-full" disabled={!ready || create.isPending}>
            Publicar tópico
          </Button>
        </form>
      </Card>
    </div>
  )
}
