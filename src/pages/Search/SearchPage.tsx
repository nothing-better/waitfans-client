import { useEffect, useState } from 'react'
import { Alert, Avatar, Button, Empty, Input, Pagination, Skeleton, Tabs } from 'antd'
import { DeleteOutlined, FireOutlined, HistoryOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { addSearchWord, getSearchCount, searchUsers, searchVideos } from '@/api/content'
import VideoCard from '@/components/VideoCard/VideoCard'
import { useAppSelector } from '@/store/hooks'
import { handleLevel, handleNum } from '@/utils/format'
import type { User, UserCardData } from '@/types/user'
import type { VideoFeedItem } from '@/types/video'

function useKeyword() {
  return new URLSearchParams(useLocation().search).get('keyword') || ''
}

function unwrapUser(item: UserCardData | User): User {
  return 'user' in item ? item.user : item
}

export default function SearchPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const keyword = useKeyword()
  const active = location.pathname.endsWith('/user') ? 'user' : 'video'
  const trendings = useAppSelector((state) => state.content.trendings)
  const [input, setInput] = useState(keyword)
  const [histories, setHistories] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('historiesSearch') || '[]')
    } catch {
      return []
    }
  })
  const [page, setPage] = useState(1)
  const [counts, setCounts] = useState<[number, number]>([0, 0])
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [users, setUsers] = useState<Array<UserCardData | User>>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    setInput(keyword)
    setPage(1)
    if (!keyword) {
      setCounts([0, 0])
      setVideos([])
      setUsers([])
      return
    }
    addSearchWord(keyword).catch(() => undefined)
    getSearchCount(keyword).then((value) => setCounts(value || [0, 0])).catch(() => undefined)
  }, [keyword])

  useEffect(() => {
    if (!keyword) return
    setLoading(true)
    setLoadError(false)
    const query = active === 'video' ? searchVideos(keyword, page) : searchUsers(keyword, page)
    query.then((result) => {
      if (active === 'video') setVideos(result as VideoFeedItem[])
      else setUsers(result as Array<UserCardData | User>)
    }).catch(() => {
      setLoadError(true)
      if (active === 'video') setVideos([])
      else setUsers([])
    }).finally(() => setLoading(false))
  }, [active, keyword, page])

  const submit = () => {
    const next = input.trim()
    if (!next) return
    const nextHistories = [next, ...histories.filter((item) => item !== next)].slice(0, 12)
    setHistories(nextHistories)
    localStorage.setItem('historiesSearch', JSON.stringify(nextHistories))
    navigate(`/search/${active}?keyword=${encodeURIComponent(next)}`)
  }

  const searchKeyword = (value: string) => {
    setInput(value)
    const nextHistories = [value, ...histories.filter((item) => item !== value)].slice(0, 12)
    setHistories(nextHistories)
    localStorage.setItem('historiesSearch', JSON.stringify(nextHistories))
    navigate(`/search/${active}?keyword=${encodeURIComponent(value)}`)
  }

  return (
    <main className="surface-page search-page">
      <div className="search-shell page-container surface-panel">
        <div className="search-titlebar">
          <Input
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onPressEnter={submit}
            suffix={<SearchOutlined onClick={submit} />}
            placeholder="搜索视频或用户"
          />
          <p>{keyword ? <>“{keyword}” 的搜索结果</> : '搜索感兴趣的内容'}</p>
        </div>
        <Tabs
          activeKey={active}
          onChange={(key) => navigate(`/search/${key}?keyword=${encodeURIComponent(keyword)}`)}
          items={[
            { key: 'video', label: `视频 ${counts[0] || ''}` },
            { key: 'user', label: `用户 ${counts[1] || ''}` },
          ]}
        />
        {!keyword ? (
          <section className="search-discovery">
            {histories.length ? (
              <div>
                <header>
                  <h2><HistoryOutlined /> 搜索历史</h2>
                  <Button
                    type="text"
                    size="small"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setHistories([])
                      localStorage.removeItem('historiesSearch')
                    }}
                  >
                    清空
                  </Button>
                </header>
                <div className="search-keyword-list">
                  {histories.map((item) => (
                    <button key={item} type="button" onClick={() => searchKeyword(item)}>{item}</button>
                  ))}
                </div>
              </div>
            ) : null}
            <div>
              <header><h2><FireOutlined /> 热门搜索</h2></header>
              <ol className="search-hot-list">
                {trendings.slice(0, 10).map((item, index) => (
                  <li key={item}>
                    <button type="button" onClick={() => searchKeyword(item)}>
                      <em>{index + 1}</em><span>{item}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        ) : null}
        {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : null}
        {!loading && keyword && loadError ? (
          <Alert
            type="error"
            showIcon
            message="搜索服务暂时不可用"
            description="请确认后端、Elasticsearch 和数据库服务可用后重试。"
            action={<Button size="small" onClick={() => navigate(0)}>重试</Button>}
          />
        ) : null}
        {!loading && keyword && !loadError && active === 'video' ? (
          videos.length ? (
            <div className="search-video-grid">
              {videos.map((item) => <VideoCard key={item.video.vid} item={item} />)}
            </div>
          ) : <Empty description={keyword ? '没有找到相关视频' : '输入关键词开始搜索'} />
        ) : null}
        {!loading && keyword && !loadError && active === 'user' ? (
          users.length ? (
            <div className="search-user-list">
              {users.map((item) => {
                const user = unwrapUser(item)
                const extra = 'user' in item ? item : undefined
                return (
                  <button key={user.uid} type="button" onClick={() => navigate(`/space/${user.uid}`)}>
                    <Avatar size={64} src={user.avatar_url || user.avatar} icon={<UserOutlined />} />
                    <span>
                      <strong>{user.nickname}</strong>
                      <small>Lv.{handleLevel(user.exp || 0)}</small>
                      <p>{user.description || '这个人很神秘，什么都没有写。'}</p>
                    </span>
                    <em>{handleNum(extra?.fansCount || user.fansCount || 0)} 粉丝</em>
                  </button>
                )
              })}
            </div>
          ) : <Empty description={keyword ? '没有找到相关用户' : '输入关键词开始搜索'} />
        ) : null}
        {(active === 'video' ? videos.length : users.length) > 0 ? (
          <Pagination current={page} onChange={setPage} total={Math.max(counts[active === 'video' ? 0 : 1], 10)} pageSize={10} showSizeChanger={false} />
        ) : null}
      </div>
    </main>
  )
}
