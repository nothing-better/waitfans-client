import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Empty, Input, Popconfirm, Segmented, Skeleton, message } from 'antd'
import {
  DeleteOutlined,
  DislikeOutlined,
  LikeOutlined,
  MessageOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  addComment,
  deleteComment,
  getCommentReactions,
  getComments,
  getMoreCommentReplies,
  getUpLikedComments,
  toggleCommentLove,
} from '@/api/comment'
import { useAppSelector } from '@/store/hooks'
import { handleDate, handleNum } from '@/utils/format'
import type { Comment } from '@/types/comment'

interface CommentTreeProps {
  vid: number | string
  ownerUid?: number | string
  total?: number
}

function commentId(comment: Comment) {
  return Number(comment.cid ?? comment.id ?? 0)
}

function commentUser(comment: Comment) {
  return {
    uid: Number(comment.user?.uid ?? comment.uid ?? comment.userId ?? 0),
    nickname: comment.user?.nickname ?? comment.nickname ?? '匿名用户',
    avatar: comment.user?.avatar_url ?? comment.user?.avatar ?? comment.avatar_url ?? comment.avatar,
  }
}

function commentLove(comment: Comment) {
  return Number(comment.love ?? comment.good ?? comment.likes ?? 0)
}

function commentBad(comment: Comment) {
  return Number(comment.bad ?? comment.dislikes ?? 0)
}

function updateTree(
  comments: Comment[],
  targetId: number,
  updater: (comment: Comment) => Comment | null,
): Comment[] {
  return comments.flatMap((comment) => {
    if (commentId(comment) === targetId) {
      const next = updater(comment)
      return next ? [next] : []
    }
    const replies = comment.replies || comment.children
    if (!replies?.length) return [comment]
    return [{
      ...comment,
      replies: updateTree(replies, targetId, updater),
    }]
  })
}

interface CommentItemProps {
  comment: Comment
  currentUid?: number
  ownerUid?: number
  likedIds: Set<number>
  dislikedIds: Set<number>
  upLikedIds: Set<number>
  onReply: (comment: Comment) => void
  onReact: (comment: Comment, isLike: boolean) => void
  onDelete: (comment: Comment) => void
  onLoadMore?: (comment: Comment) => void
  loadingMore?: boolean
  depth?: number
}

function CommentItem({
  comment,
  currentUid,
  ownerUid,
  likedIds,
  dislikedIds,
  upLikedIds,
  onReply,
  onReact,
  onDelete,
  onLoadMore,
  loadingMore,
  depth = 0,
}: CommentItemProps) {
  const user = commentUser(comment)
  const replies = comment.replies || comment.children || []
  const canDelete = currentUid === user.uid || currentUid === ownerUid
  const totalReplies = Number(comment.count ?? replies.length)
  const time = comment.commentDate || comment.createTime
  const id = commentId(comment)
  const liked = likedIds.has(id)
  const disliked = dislikedIds.has(id)

  return (
    <article className={`comment-entry ${depth > 0 ? 'comment-entry--reply' : ''}`}>
      <Avatar src={user.avatar} icon={<UserOutlined />} size={depth > 0 ? 34 : 42} />
      <div className="comment-entry__body">
        <header>
          <strong>{user.nickname}</strong>
          {comment.isTop ? <span className="comment-top-mark">置顶</span> : null}
          {upLikedIds.has(id) ? <span className="comment-up-mark">UP主觉得很赞</span> : null}
        </header>
        <p className="comment-content">
          {comment.toUser?.nickname ? (
            <span className="comment-reply-to">@{comment.toUser.nickname} </span>
          ) : null}
          {comment.isDeleted ? '该评论已删除' : comment.content}
        </p>
        <div className="comment-meta">
          <time>{time ? handleDate(time) : '刚刚'}</time>
          <button
            className={liked ? 'active' : ''}
            type="button"
            aria-label={liked ? '取消点赞' : '点赞评论'}
            onClick={() => onReact(comment, true)}
          >
            <LikeOutlined /> {handleNum(commentLove(comment))}
          </button>
          <button
            className={disliked ? 'active' : ''}
            type="button"
            aria-label={disliked ? '取消点踩' : '点踩评论'}
            onClick={() => onReact(comment, false)}
          >
            <DislikeOutlined /> {commentBad(comment) || ''}
          </button>
          <button type="button" onClick={() => onReply(comment)}>
            <MessageOutlined /> 回复
          </button>
          {canDelete ? (
            <Popconfirm
              title="删除这条评论？"
              description={depth === 0 ? '根评论及其所有回复都会被删除。' : undefined}
              onConfirm={() => onDelete(comment)}
              okButtonProps={{ danger: true }}
            >
              <button type="button"><DeleteOutlined /> 删除</button>
            </Popconfirm>
          ) : null}
        </div>
        {replies.length > 0 ? (
          <div className="comment-replies">
            {replies.map((reply) => (
              <CommentItem
                key={commentId(reply)}
                comment={reply}
                currentUid={currentUid}
                ownerUid={ownerUid}
                likedIds={likedIds}
                dislikedIds={dislikedIds}
                upLikedIds={upLikedIds}
                onReply={onReply}
                onReact={onReact}
                onDelete={onDelete}
                depth={depth + 1}
              />
            ))}
          </div>
        ) : null}
        {depth === 0 && totalReplies > replies.length && onLoadMore ? (
          <Button type="link" loading={loadingMore} onClick={() => onLoadMore(comment)}>
            展开其余 {totalReplies - replies.length} 条回复
          </Button>
        ) : null}
      </div>
    </article>
  )
}

export default function CommentTree({ vid, ownerUid, total }: CommentTreeProps) {
  const user = useAppSelector((state) => state.user.current)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [replying, setReplying] = useState<Comment | null>(null)
  const [sort, setSort] = useState<1 | 2>(1)
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [likedIds, setLikedIds] = useState<Set<number>>(new Set())
  const [dislikedIds, setDislikedIds] = useState<Set<number>>(new Set())
  const [upLikedIds, setUpLikedIds] = useState<Set<number>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [result, reactions, upLikes] = await Promise.all([
        getComments(vid, 0, sort),
        user
          ? getCommentReactions().catch(() => ({ userLike: [], userDislike: [] }))
          : Promise.resolve({ userLike: [] as number[], userDislike: [] as number[] }),
        ownerUid ? getUpLikedComments(ownerUid).catch(() => []) : Promise.resolve([]),
      ])
      setComments(result?.comments || [])
      setMore(Boolean(result?.more))
      setLikedIds(new Set((reactions.userLike || []).map(Number)))
      setDislikedIds(new Set((reactions.userDislike || []).map(Number)))
      setUpLikedIds(new Set((upLikes || []).map(Number)))
    } finally {
      setLoading(false)
    }
  }, [ownerUid, sort, user, vid])

  useEffect(() => {
    load()
  }, [load])

  const submitRoot = async () => {
    if (!user) {
      message.warning('请先登录')
      return
    }
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('vid', String(vid))
      data.append('root_id', '0')
      data.append('parent_id', '0')
      data.append('to_user_id', '0')
      data.append('content', content.trim())
      const created = await addComment(data)
      setComments((current) => [{ ...created, user }, ...current])
      setContent('')
      message.success('评论已发布')
    } finally {
      setSubmitting(false)
    }
  }

  const submitReply = async () => {
    if (!user || !replying || !replyContent.trim()) return
    const parentId = commentId(replying)
    const rootId = Number(replying.rootId || parentId)
    const target = commentUser(replying)
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('vid', String(vid))
      data.append('root_id', String(rootId))
      data.append('parent_id', String(parentId))
      data.append('to_user_id', String(target.uid))
      data.append('content', replyContent.trim())
      const created = await addComment(data)
      setComments((current) => updateTree(current, rootId, (root) => ({
        ...root,
        count: Number(root.count || (root.replies || []).length) + 1,
        replies: [
          ...(root.replies || []),
          { ...created, user, toUser: { uid: target.uid, nickname: target.nickname } },
        ],
      })))
      setReplying(null)
      setReplyContent('')
      message.success('回复已发布')
    } finally {
      setSubmitting(false)
    }
  }

  const react = async (comment: Comment, isLike: boolean) => {
    if (!user) {
      message.warning('请先登录')
      return
    }
    const id = commentId(comment)
    const activeSet = isLike ? likedIds : dislikedIds
    const otherSet = isLike ? dislikedIds : likedIds
    const isSet = !activeSet.has(id)
    const data = new FormData()
    data.append('id', String(id))
    data.append('isLike', String(isLike))
    data.append('isSet', String(isSet))
    await toggleCommentLove(data)
    setComments((current) => updateTree(current, id, (target) => ({
      ...target,
      love: Math.max(0, commentLove(target) + (
        isLike ? (isSet ? 1 : -1) : isSet && otherSet.has(id) ? -1 : 0
      )),
      bad: Math.max(0, commentBad(target) + (
        !isLike ? (isSet ? 1 : -1) : isSet && otherSet.has(id) ? -1 : 0
      )),
    })))
    const update = (setter: typeof setLikedIds, current: Set<number>, set: boolean) => {
      const next = new Set(current)
      if (set) next.add(id)
      else next.delete(id)
      setter(next)
    }
    update(isLike ? setLikedIds : setDislikedIds, activeSet, isSet)
    if (isSet && otherSet.has(id)) {
      update(isLike ? setDislikedIds : setLikedIds, otherSet, false)
    }
  }

  const remove = async (comment: Comment) => {
    const id = commentId(comment)
    const data = new FormData()
    data.append('id', String(id))
    await deleteComment(data)
    setComments((current) => updateTree(current, id, () => null))
    message.success('评论已删除')
  }

  const expandReplies = async (comment: Comment) => {
    const id = commentId(comment)
    setLoadingMore(id)
    try {
      const fullTree = await getMoreCommentReplies(id)
      setComments((current) => updateTree(current, id, () => fullTree))
    } finally {
      setLoadingMore(null)
    }
  }

  const loadMoreRoots = async () => {
    const result = await getComments(vid, comments.length, sort)
    setComments((current) => [...current, ...(result.comments || [])])
    setMore(Boolean(result.more))
  }

  const displayTotal = useMemo(
    () => Number(total || comments.reduce((sum, item) => sum + 1 + Number(item.count || 0), 0)),
    [comments, total],
  )

  return (
    <section className="comment-section">
      <header className="comment-section__heading">
        <h2>评论 <small>{handleNum(displayTotal)}</small></h2>
        <Segmented
          size="small"
          value={sort}
          onChange={(value) => setSort(Number(value) as 1 | 2)}
          options={[
            { label: '最热', value: 1 },
            { label: '最新', value: 2 },
          ]}
        />
      </header>
      <div className="comment-composer">
        <Avatar src={user?.avatar_url || user?.avatar} icon={<UserOutlined />} />
        <Input.TextArea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={2000}
          placeholder={user ? '发一条友善的评论' : '登录后参与评论'}
        />
        <Button type="primary" loading={submitting} onClick={submitRoot}>发表评论</Button>
      </div>
      {replying ? (
        <div className="comment-reply-composer">
          <span>回复 @{commentUser(replying).nickname}</span>
          <Input.TextArea
            autoFocus
            value={replyContent}
            onChange={(event) => setReplyContent(event.target.value)}
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={2000}
            onPressEnter={(event) => {
              if (!event.shiftKey) {
                event.preventDefault()
                submitReply()
              }
            }}
          />
          <Button onClick={() => setReplying(null)}>取消</Button>
          <Button type="primary" loading={submitting} onClick={submitReply}>回复</Button>
        </div>
      ) : null}
      {loading ? <Skeleton active avatar paragraph={{ rows: 8 }} /> : null}
      {!loading && comments.length === 0 ? <Empty description="还没有评论，来抢沙发吧" /> : null}
      {!loading && comments.length > 0 ? (
        <div className="comment-list">
          {comments.map((comment) => (
            <CommentItem
              key={commentId(comment)}
              comment={comment}
              currentUid={Number(user?.uid)}
              ownerUid={Number(ownerUid)}
              likedIds={likedIds}
              dislikedIds={dislikedIds}
              upLikedIds={upLikedIds}
              onReply={(target) => {
                if (!user) {
                  message.warning('请先登录')
                  return
                }
                setReplying(target)
                setReplyContent('')
              }}
              onReact={react}
              onDelete={remove}
              onLoadMore={expandReplies}
              loadingMore={loadingMore === commentId(comment)}
            />
          ))}
        </div>
      ) : null}
      {more ? (
        <Button className="comment-load-more" onClick={loadMoreRoots}>加载更多评论</Button>
      ) : null}
    </section>
  )
}
