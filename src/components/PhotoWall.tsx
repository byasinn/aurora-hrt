import { usePosts } from '../api/posts'

/** Grade de fotos dos posts, estilo mural — se reajusta sozinha com o viewport. */
export default function PhotoWall() {
  const { data: posts } = usePosts()
  const images = (posts ?? []).flatMap((p) => (p.images as string[]) ?? [])

  if (images.length === 0) return null

  return (
    <div className="grid grid-cols-3 gap-1">
      {images.slice(0, 9).map((src, i) => (
        <img key={i} src={src} alt="" className="aspect-square w-full rounded-md object-cover" />
      ))}
    </div>
  )
}
