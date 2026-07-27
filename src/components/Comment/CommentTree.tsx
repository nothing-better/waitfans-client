import { useCallback, useEffect, useState } from 'react'
import { Avatar, Button, Empty, Input, List, message } from 'antd'
import { LikeOutlined, UserOutlined } from '@ant-design/icons'
import { addComment, getComments, toggleCommentLove } from '@/api/comment'
import { useAppSelector } from '@/store/hooks'
import { handleDate } from '@/utils/format'
import type { Comment } from '@/types/comment'

interface CommentTreeProps {
  vid: number | string
}

function commentId(comment: Comment) {
  return comment.cid ?? comment.id ?? 0
}

export default function CommentTree({ vid }: CommentTreeProps) {
  const user = useAppSelector((state) => state.user.current)
  const [comments, setComments] = useState<Comment[]>([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const result = await getComments(vid)
      setComments(result?.comments || [])
    } finally {
      setLoading(false)
    }
  }, [vid])

  useEffect(() => { load() }, [load])

  const submit = async () => {
    if (!user) {
      message.warning('请先登录')
      return
    }
    if (!content.trim()) return
    const data = new FormData()
    data.append('vid', String(vid))
    data.append('root_id', '0')
    data.append('parent_id', '0')
    data.append('to_user_id', '0')
    data.append('content', content.trim())
    const created = await addComment(data)
    setComments((current) => [created, ...current])
    setContent('')
  }

  const like = async (comment: Comment) => {
    if (!user) {
      message.warning('请先登录')
      return
    }
    const data = new FormData()
    data.append('cid', String(commentId(comment)))
    data.append('isLove', 'true')
    data.append('isSet', 'true')
    await toggleCommentLove(data)
    setComments((current) =>
      current.map((item) =>
        commentId(item) === commentId(comment)
          ? { ...item, good: Number(item.good ?? item.likes ?? 0) + 1 }
          : item,
      ),
    )
  }

  return (
    <section className="comment-section">
      <h2>评论 <small>{comments.length}</small></h2>
      <div className="comment-composer">
        <Avatar src={user?.avatar_url || user?.avatar} icon={<UserOutlined />} />
        <Input.TextArea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={500}
          placeholder={user ? '发一条友善的评论' : '登录后参与评论'}
        />
        <Button type="primary" onClick={submit}>发表评论</Button>
      </div>
      {comments.length === 0 && !loading ? <Empty description="还没有评论，来抢沙发吧" /> : null}
      <List
        loading={loading}
        dataSource={comments}
        renderItem={(comment) => (
          <List.Item className="comment-item">
            <List.Item.Meta
              avatar={<Avatar src={comment.avatar_url || comment.avatar} icon={<UserOutlined />} />}
              title={comment.nickname || `用户 ${comment.uid ?? comment.userId ?? ''}`}
              description={
                <>
                  <p className="comment-content">{comment.content}</p>
                  <div className="comment-meta">
                    <time>{comment.commentDate || comment.createTime ? handleDate(comment.commentDate || comment.createTime || '') : '刚刚'}</time>
                    <button type="button" onClick={() => like(comment)}>
                      <LikeOutlined /> {comment.good ?? comment.likes ?? 0}
                    </button>
                  </div>
                </>
              }
            />
          </List.Item>
        )}
      />
    </section>
  )
}
