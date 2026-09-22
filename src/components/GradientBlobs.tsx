/** Blobs de gradiente decorativos, fixos atrás do conteúdo — só estética, sem interação. */
export default function GradientBlobs() {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-app overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      <div
        className="absolute -top-24 -left-20 h-72 w-72 rounded-full opacity-30 blur-3xl"
        style={{ background: 'var(--accent)' }}
      />
      <div
        className="absolute top-1/3 -right-24 h-80 w-80 rounded-full opacity-20 blur-3xl"
        style={{ background: 'var(--accent-2)' }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full opacity-15 blur-3xl"
        style={{ background: 'var(--accent)' }}
      />
    </div>
  )
}
