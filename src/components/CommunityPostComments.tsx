import CommentThread from './CommentThread'
import {
  useCreateCommunityPostComment,
  useDeleteCommunityPostComment,
  useCommunityPostComments,
  useLikeCommunityComment,
  useUnlikeCommunityComment,
} from '../api/community'
import { useMe } from '../api/auth'
import { toastError } from '../lib/toast'

export default function CommunityPostComments({ postId }: { postId: number }) {
  const { data: comments, isLoading } = useCommunityPostComments(postId)
  const { data: me } = useMe(true)
  const createComment = useCreateCommunityPostComment()
  const deleteComment = useDeleteCommunityPostComment()
  const likeComment = useLikeCommunityComment()
  const unlikeComment = useUnlikeCommunityComment()

  return (
    <CommentThread
      comments={comments}
      isLoading={isLoading}
      meId={me?.id}
      isAdmin={me?.isAdmin}
      commentTargetType="community_comment"
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
