import { useCallback, useEffect, useMemo, useState } from 'react'
import { Avatar, Button, Empty, Input, List, Spin } from 'antd'
import {
  BellOutlined,
  CommentOutlined,
  HeartOutlined,
  MessageOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { clearUnread, createChat, getRecentChats, type ChatItem } from '@/api/message'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearUnreadLocal, sendIm } from '@/store/slices/messageSlice'
import messageBg from '@/assets/img/message-bg.png'
import { handleDate } from '@/utils/format'

const navItems = [
  ['reply', '回复我的', <CommentOutlined key="reply" />],
  ['at', '@ 我的', <TeamOutlined key="at" />],
  ['love', '收到的赞', <HeartOutlined key="love" />],
  ['system', '系统通知', <BellOutlined key="system" />],
  ['whisper', '我的消息', <MessageOutlined key="whisper" />],
  ['config', '消息设置', <SettingOutlined key="config" />],
] as const

type UnreadKey = 'reply' | 'at' | 'love' | 'system' | 'whisper' | 'dynamic'

function ChatDialog({ chat }: { chat: ChatItem }) {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.user.current)
  const [content, setContent] = useState('')
  const [messages, setMessages] = useState(chat.detail?.list || [])

  useEffect(() => setMessages(chat.detail?.list || []), [chat])

  const submit = () => {
    const normalized = content.trim()
    if (!normalized || !currentUser) return
    const targetUid = chat.user.uid
    dispatch(sendIm({
      code: 101,
      content: {
        acceptId: targetUid,
        content: normalized,
      },
    }))
    setMessages((items) => [
      ...items,
      {
        id: Date.now(),
        userId: currentUser.uid,
        anotherId: targetUid,
        content: normalized,
        createTime: new Date().toISOString(),
      },
    ])
    setContent('')
  }

  return (
    <div className="chat-dialog">
      <header>{chat.user.nickname}</header>
      <div className="chat-messages">
        {messages.map((item) => {
          const mine = Number(item.userId) === Number(currentUser?.uid)
          return (
            <div key={item.id} className={`chat-bubble ${mine ? 'mine' : ''}`}>
              {!mine ? <Avatar src={chat.user.avatar_url} icon={<UserOutlined />} /> : null}
              <span>{item.withdraw ? '消息已撤回' : item.content}</span>
            </div>
          )
        })}
      </div>
      <div className="chat-composer">
        <Input.TextArea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onPressEnter={(event) => {
            if (!event.shiftKey) {
              event.preventDefault()
              submit()
            }
          }}
          placeholder="输入消息，Enter 发送"
          maxLength={500}
        />
        <Button type="primary" onClick={submit}>发送</Button>
      </div>
    </div>
  )
}

export default function MessagePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { mid } = useParams()
  const dispatch = useAppDispatch()
  const unread = useAppSelector((state) => state.message.unread)
  const active = useMemo(
    () => navItems.find(([key]) => location.pathname.includes(`/message/${key}`))?.[0] || 'reply',
    [location.pathname],
  )
  const [chats, setChats] = useState<ChatItem[]>([])
  const [selected, setSelected] = useState<ChatItem | null>(null)
  const [loading, setLoading] = useState(false)

  const loadChats = useCallback(async () => {
    setLoading(true)
    try {
      const list = (await getRecentChats()) || []
      setChats(list)
      if (mid) {
        const existing = list.find((item) => Number(item.user.uid) === Number(mid))
        setSelected(existing || await createChat(mid))
      } else {
        setSelected(list[0] || null)
      }
    } finally {
      setLoading(false)
    }
  }, [mid])

  useEffect(() => {
    if (active === 'whisper') {
      loadChats()
    } else if (['reply', 'at', 'love', 'system'].includes(active)) {
      clearUnread(active).catch(() => undefined)
      dispatch(clearUnreadLocal(active as UnreadKey))
    }
  }, [active, dispatch, loadChats])

  return (
    <main className="message-page" style={{ backgroundImage: `url(${messageBg})` }}>
      <div className="message-shell page-container">
        <aside className="message-nav surface-panel">
          <h1><MessageOutlined /> 消息中心</h1>
          {navItems.map(([key, label, icon]) => (
            <button
              key={key}
              className={active === key ? 'active' : ''}
              type="button"
              onClick={() => navigate(`/message/${key}`)}
            >
              {icon}<span>{label}</span>
              {key in unread && unread[key as keyof typeof unread] > 0
                ? <em>{unread[key as keyof typeof unread]}</em>
                : null}
            </button>
          ))}
        </aside>
        <section className="message-content surface-panel">
          {active === 'whisper' ? (
            <div className="whisper-layout">
              <List
                className="chat-list"
                loading={loading}
                dataSource={chats}
                locale={{ emptyText: '还没有私信' }}
                renderItem={(item) => (
                  <List.Item
                    className={selected?.user.uid === item.user.uid ? 'selected' : ''}
                    onClick={() => navigate(`/message/whisper/${item.user.uid}`)}
                  >
                    <List.Item.Meta
                      avatar={<Avatar src={item.user.avatar_url} icon={<UserOutlined />} />}
                      title={item.user.nickname}
                      description={item.detail?.list?.[item.detail.list.length - 1]?.content || '开始聊天'}
                    />
                    <time>{item.chat.latestTime ? handleDate(item.chat.latestTime) : ''}</time>
                  </List.Item>
                )}
              />
              {loading ? <Spin /> : selected ? <ChatDialog chat={selected} /> : <Empty description="选择一位联系人开始聊天" />}
            </div>
          ) : (
            <div className="notification-page">
              <h2>{navItems.find(([key]) => key === active)?.[1]}</h2>
              <Empty description={active === 'config' ? '消息设置已迁入 React' : '暂时没有新消息'} />
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
