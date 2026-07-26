import { useEffect, useState } from 'react'
import { Avatar, Empty, Input, Pagination, Skeleton, Tabs } from 'antd'
import { SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { addSearchWord, getSearchCount, searchUsers, searchVideos } from '@/api/content'
import VideoCard from '@/components/VideoCard/VideoCard'
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
  const [input, setInput] = useState(keyword)
  const [page, setPage] = useState(1)
  const [counts, setCounts] = useState<[number, number]>([0, 0])
  const [videos, setVideos] = useState<VideoFeedItem[]>([])
  const [users, setUsers] = useState<Array<UserCardData | User>>([])
  const [loading, setLoading] = useState(false)

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
    const query = active === 'video' ? searchVideos(keyword, page) : searchUsers(keyword, page)
    query.then((result) => {
      if (active === 'video') setVideos(result as VideoFeedItem[])
      else setUsers(result as Array<UserCardData | User>)
    }).finally(() => setLoading(false))
  }, [active, keyword, page])

  const submit = () => {
    const next = input.trim()
    navigate(`/search/${active}?keyword=${encodeURIComponent(next)}`)
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
        {loading ? <Skeleton active paragraph={{ rows: 8 }} /> : null}
        {!loading && active === 'video' ? (
          videos.length ? (
            <div className="search-video-grid">
              {videos.map((item) => <VideoCard key={item.video.vid} item={item} />)}
            </div>
          ) : <Empty description={keyword ? '没有找到相关视频' : '输入关键词开始搜索'} />
        ) : null}
        {!loading && active === 'user' ? (
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
