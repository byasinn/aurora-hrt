export default function MediaCollage({ images }: { images: string[] }) {
  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <img
        src={images[0]}
        alt=""
        className="max-h-96 w-full rounded-xl object-cover"
      />
    )
  }

  if (images.length === 2) {
    return (
      <div className="grid grid-cols-2 gap-1 overflow-hidden rounded-xl">
        {images.map((src, i) => (
          <img key={i} src={src} alt="" className="aspect-square w-full object-cover" />
        ))}
      </div>
    )
  }

  if (images.length === 3) {
    return (
      <div className="grid h-72 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">
        <img src={images[0]} alt="" className="row-span-2 h-full w-full object-cover" />
        <img src={images[1]} alt="" className="h-full w-full object-cover" />
        <img src={images[2]} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  const extra = images.length - 4
  return (
    <div className="grid h-72 grid-cols-2 grid-rows-2 gap-1 overflow-hidden rounded-xl">
      {images.slice(0, 4).map((src, i) => (
        <div key={i} className="relative h-full w-full">
          <img src={src} alt="" className="h-full w-full object-cover" />
          {i === 3 && extra > 0 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-semibold text-white">
              +{extra}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
