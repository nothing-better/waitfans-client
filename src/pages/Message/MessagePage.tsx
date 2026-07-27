import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  Avatar,
  Button,
  Empty,
  Input,
  List,
  Spin,
  Switch,
  message,
} from 'antd'
import {
  BellOutlined,
  CheckOutlined,
  CommentOutlined,
  HeartOutlined,
  MessageOutlined,
  SearchOutlined,
  SendOutlined,
  SettingOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  clearUnread,
  createChat,
  getRecentChats,
  setChatOffline,
  setChatOnline,
  type ChatItem,
} from '@/api/message'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { clearUnreadLocal, sendIm } from '@/store/slices/messageSlice'
import { handleDate } from '@/utils/format'

const navItems = [
  ['reply', '回复我的', <CommentOutlined key="reply" />],
  ['at', '@ 我的', <TeamOutlined key="at" />],
  ['love', '收到的赞', <HeartOutlined key="love" />],
  ['system', '系统通知', <BellOutlined key="system" />],
  ['whisper', '我的消息', <MessageOutlined key="whisper" />],
  ['config', '消息设置', <SettingOutlined key="config" />],
] as const

type MessageSection = typeof navItems[number][0]
type UnreadKey = Exclude<MessageSection, 'config'>

const notificationCopy: Record<Exclude<UnreadKey, 'whisper'>, {
  title: string
  description: string
}> = {
  reply: {
    title: '回复我的',
    description: '有人回复你的评论时，未读数量会在这里同步。',
  },
  at: {
    title: '@ 我的',
    description: '视频、评论或动态中提到你的提醒会汇总到这里。',
  },
  love: {
    title: '收到的赞',
    description: '查看作品与评论收到的新点赞。',
  },
  system: {
    title: '系统通知',
    description: '账号安全、稿件审核和平台通知会在这里提示。',
  },
}

function ChatDialog({ chat }: { chat: ChatItem }) {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector((state) => state.user.current)
  const [content, setContent] = useState('')
  const [messages, setMessages] = useState(chat.detail?.list || [])
  const messageEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(chat.detail?.list || [])
    setChatOnline(chat.user.uid).catch(() => undefined)
    return () => {
      if (currentUser?.uid) {
        setChatOffline(chat.user.uid, currentUser.uid).catch(() => undefined)
      }
    }
  }, [chat, currentUser?.uid])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages])

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
      <header>
        <Avatar src={chat.user.avatar_url} icon={<UserOutlined />} />
        <div><strong>{chat.user.nickname}</strong><span>私信会话</span></div>
      </header>
      <div className="chat-messages">
        {messages.length === 0 ? <Empty description="打个招呼，开始聊天吧" /> : null}
        {messages.map((item) => {
          const mine = Number(item.userId) === Number(currentUser?.uid)
          return (
            <div key={item.id} className={`chat-bubble ${mine ? 'mine' : ''}`}>
              {!mine ? <Avatar src={chat.user.avatar_url} icon={<UserOutlined />} /> : null}
              <div>
                <span>{item.withdraw ? '消息已撤回' : item.content}</span>
                <time>{item.createTime ? handleDate(item.createTime) : ''}</time>
              </div>
            </div>
          )
        })}
        <div ref={messageEndRef} />
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
          autoSize={{ minRows: 2, maxRows: 5 }}
          maxLength={500}
          placeholder="输入消息，Enter 发送"
        />
        <Button type="primary" icon={<SendOutlined />} onClick={submit}>发送</Button>
      </div>
    </div>
  )
}

function NotificationCenter({
  section,
  count,
  onClear,
}: {
  section: Exclude<UnreadKey, 'whisper'>
  count: number
  onClear: () => Promise<void>
}) {
  const copy = notificationCopy[section]
  const [clearing, setClearing] = useState(false)

  const markRead = async () => {
    setClearing(true)
    try {
      await onClear()
      message.success('已标记为已读')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="notification-page">
      <header>
        <div><h2>{copy.title}</h2><p>{copy.description}</p></div>
        {count > 0 ? (
          <Button loading={clearing} icon={<CheckOutlined />} onClick={markRead}>全部已读</Button>
        ) : null}
      </header>
      <section className="notification-summary">
        <div>
          <span>当前未读</span>
          <strong>{count}</strong>
          <small>数量来自后端未读消息接口</small>
        </div>
        <div>
          <span>同步状态</span>
          <strong className="is-online">已连接</strong>
          <small>登录后自动同步消息状态</small>
        </div>
      </section>
      <div className="notification-empty">
        <Empty
          description={count > 0
            ? `有 ${count} 条未读提醒，标记已读后角标会同步清除`
            : `暂时没有新的${copy.title}`}
        />
      </div>
    </div>
  )
}

interface MessagePreferences {
  browser: boolean
  sound: boolean
  reply: boolean
  love: boolean
}

const preferenceKey = 'waitfans:message-preferences'
const defaultPreferences: MessagePreferences = {
  browser: true,
  sound: true,
  reply: true,
  love: true,
}

function MessageSettings() {
  const [preferences, setPreferences] = useState<MessagePreferences>(() => {
    try {
      return {
        ...defaultPreferences,
        ...JSON.parse(localStorage.getItem(preferenceKey) || '{}'),
      }
    } catch {
      return defaultPreferences
    }
  })

  const update = (key: keyof MessagePreferences, value: boolean) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value }
      localStorage.setItem(preferenceKey, JSON.stringify(next))
      return next
    })
  }

  const items: Array<[keyof MessagePreferences, string, string]> = [
    ['browser', '浏览器通知', '允许在页面处于后台时显示新消息提醒。'],
    ['sound', '消息提示音', '收到私信时播放提示音。'],
    ['reply', '回复与 @ 提醒', '接收评论回复和提及通知。'],
    ['love', '点赞提醒', '接收视频与评论的新点赞通知。'],
  ]

  return (
    <div className="message-settings">
      <header><h2>消息设置</h2><p>设置保存在当前浏览器中，即时生效。</p></header>
      {items.map(([key, label, description]) => (
        <div className="message-setting-row" key={key}>
          <div><strong>{label}</strong><span>{description}</span></div>
          <Switch checked={preferences[key]} onChange={(value) => update(key, value)} />
        </div>
      ))}
    </div>
  )
}

export default function MessagePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { '*': path = '' } = useParams()
  const mid = path.split('/')[1]
  const dispatch = useAppDispatch()
  const unread = useAppSelector((state) => state.message.unread)
  const rawActive = location.pathname.split('/')[2] as MessageSection | undefined
  const active = navItems.some(([key]) => key === rawActive) ? rawActive! : 'reply'
  const [chats, setChats] = useState<ChatItem[]>([])
  const [loading, setLoading] = useState(false)
  const [more, setMore] = useState(false)
  const [query, setQuery] = useState('')

  const loadChats = useCallback(async (offset = 0) => {
    setLoading(true)
    try {
      const result = await getRecentChats(offset)
      setChats((current) => offset > 0 ? [...current, ...(result?.list || [])] : (result?.list || []))
      setMore(Boolean(result?.more))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (active === 'whisper') {
      loadChats(0).catch(() => undefined)
      clearUnread('whisper').then(() => dispatch(clearUnreadLocal('whisper'))).catch(() => undefined)
    }
  }, [active, dispatch, loadChats])

  useEffect(() => {
    if (!mid || active !== 'whisper' || chats.some((item) => Number(item.user.uid) === Number(mid))) {
      return
    }
    createChat(mid)
      .then((created) => {
        if (created) setChats((items) => [created, ...items])
      })
      .catch(() => undefined)
  }, [active, chats, mid])

  const selected = useMemo(
    () => chats.find((item) => Number(item.user.uid) === Number(mid)) || null,
    [chats, mid],
  )
  const filteredChats = useMemo(
    () => chats.filter((item) => {
      const details = item.detail?.list || []
      const latest = details[details.length - 1]
      return `${item.user.nickname}${latest?.content || ''}`
        .toLowerCase()
        .includes(query.trim().toLowerCase())
    }),
    [chats, query],
  )

  const markCategoryRead = async (section: Exclude<UnreadKey, 'whisper'>) => {
    await clearUnread(section)
    dispatch(clearUnreadLocal(section))
  }

  let content
  if (active === 'whisper') {
    content = (
      <div className="whisper-layout">
        <div className="conversation-panel">
          <div className="conversation-search">
            <Input
              allowClear
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              prefix={<SearchOutlined />}
              placeholder="搜索对话"
            />
          </div>
          <List
            className="chat-list"
            loading={loading && chats.length === 0}
            dataSource={filteredChats}
            locale={{ emptyText: '还没有私信会话' }}
            renderItem={(item) => {
              const details = item.detail?.list || []
              const lastMessage = details[details.length - 1]
              return (
                <List.Item
                  className={selected?.user.uid === item.user.uid ? 'selected' : ''}
                  onClick={() => navigate(`/message/whisper/${item.user.uid}`)}
                >
                  <List.Item.Meta
                    avatar={<Avatar src={item.user.avatar_url} icon={<UserOutlined />} />}
                    title={item.user.nickname}
                    description={lastMessage?.content || '开始聊天'}
                  />
                  <time>{item.chat.latestTime ? handleDate(item.chat.latestTime) : ''}</time>
                  {item.chat.unread > 0 ? <em>{item.chat.unread}</em> : null}
                </List.Item>
              )
            }}
          />
          {more ? (
            <Button className="conversation-more" loading={loading} onClick={() => loadChats(chats.length)}>
              加载更多会话
            </Button>
          ) : null}
        </div>
        {loading && !selected && chats.length === 0
          ? <Spin />
          : selected
            ? <ChatDialog chat={selected} />
            : <div className="chat-welcome"><MessageOutlined /><h2>选择一个会话</h2><p>从左侧联系人开始聊天</p></div>}
      </div>
    )
  } else if (active === 'config') {
    content = <MessageSettings />
  } else {
    content = (
      <NotificationCenter
        section={active}
        count={unread[active] || 0}
        onClear={() => markCategoryRead(active)}
      />
    )
  }

  return (
    <main className="message-page">
      <div className="message-shell page-container">
        <aside className="message-nav surface-panel">
          <h1>消息中心</h1>
          {navItems.map(([key, label, icon]) => (
            <button
              key={key}
              className={active === key ? 'active' : ''}
              type="button"
              onClick={() => navigate(`/message/${key}`)}
            >
              {icon}<span>{label}</span>
              {key !== 'config' && unread[key as keyof typeof unread] > 0
                ? <em>{unread[key as keyof typeof unread]}</em>
                : null}
            </button>
          ))}
        </aside>
        <section className="message-content surface-panel">{content}</section>
      </div>
    </main>
  )
}
