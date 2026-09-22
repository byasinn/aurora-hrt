import CommentThread from './CommentThread'
import { useCreateComment, useDeleteComment, usePostComments, useLikeComment, useUnlikeComment } from '../api/social'
import { useMe } from '../api/auth'
import { toastError } from '../lib/toast'

export default function PostComments({ postId }: { postId: number }) {
  const { data: comments, isLoading } = usePostComments(postId)
  const { data: me } = useMe(true)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()
  const likeComment = useLikeComment()
  const unlikeComment = useUnlikeComment()

  return (
    <CommentThread
      comments={comments}
      isLoading={isLoading}
      meId={me?.id}
      isAdmin={me?.isAdmin}
      commentTargetType="comment"
      creating={createComment.isPending}
      onCreate={(input) =>
        createComment.mutate(
          { postId, text: input.text, parentCommentId: input.parentCommentId },
          { onError: (err) => toastError(err, 'Não foi possível comentar. Tenta de novo.') },
        )
      }
      onDelete={(id) => deleteComment.mutate(id)}
      onLike={(id) => likeComment.mutate(id)}
      onUnlike={(id) => unlikeComment.mutate(id)}
    />
  )
}
