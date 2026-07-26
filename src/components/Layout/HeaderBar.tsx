import { useEffect, useMemo, useState } from 'react'
import { Avatar, Badge, Dropdown, Input, Popover } from 'antd'
import {
  BulbOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  CrownOutlined,
  DownloadOutlined,
  HomeOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  SearchOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getMatchingWords } from '@/api/content'
import { useDebounce } from '@/hooks/useDebounce'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { logoutUser } from '@/store/slices/userSlice'
import LoginRegister from '@/components/Login/LoginRegister'

const primaryLinks = [
  { label: '首页', to: '/', icon: <HomeOutlined /> },
  { label: '番剧', to: '/search/video?keyword=番剧', icon: null },
  { label: '直播', to: '/search/video?keyword=直播', icon: null },
  { label: '游戏中心', to: '/search/video?keyword=游戏', icon: null },
  { label: '会员购', to: '/search/video?keyword=会员购', icon: null },
  { label: '漫画', to: '/search/video?keyword=漫画', icon: null },
  { label: '赛事', to: '/search/video?keyword=赛事', icon: null },
  { label: 'B萌', to: '/search/video?keyword=B萌', icon: null },
  { label: '下载客户端', to: '/search/video?keyword=客户端', icon: <DownloadOutlined /> },
] as const

export default function HeaderBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { current: user, authenticated } = useAppSelector((state) => state.user)
  const unread = useAppSelector((state) =>
    Object.values(state.message.unread).reduce((sum, value) => sum + value, 0),
  )
  const trendings = useAppSelector((state) => state.content.trendings)
  const [loginOpen, setLoginOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [searchOpen, setSearchOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const debouncedKeyword = useDebounce(keyword)
  const isHome = location.pathname === '/'
  const solidHeader = !isHome || scrolled

  useEffect(() => {
    if (!debouncedKeyword.trim()) {
      setSuggestions([])
      return
    }
    getMatchingWords(debouncedKeyword)
      .then(setSuggestions)
      .catch(() => setSuggestions([]))
  }, [debouncedKeyword])

  useEffect(() => {
    if (!isHome) {
      setScrolled(true)
      return
    }
    const update = () => setScrolled(window.scrollY > 150)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [isHome])

  const submitSearch = (value = keyword) => {
    const normalized = value.trim()
    const histories = JSON.parse(localStorage.getItem('historiesSearch') || '[]') as string[]
    if (normalized) {
      localStorage.setItem(
        'historiesSearch',
        JSON.stringify([normalized, ...histories.filter((item) => item !== normalized)].slice(0, 12)),
      )
    }
    setSearchOpen(false)
    navigate(`/search/video?keyword=${encodeURIComponent(normalized)}`)
  }

  const userMenu = useMemo(
    () => ({
      items: [
        { key: 'space', label: <Link to={`/space/${user?.uid ?? ''}`}>个人空间</Link> },
        { key: 'account', label: <Link to="/account/home">账号设置</Link> },
        {
          key: 'logout',
          danger: true,
          label: '退出登录',
          onClick: () => dispatch(logoutUser()),
        },
      ],
    }),
    [dispatch, user?.uid],
  )

  const searchContent = (
    <div className="search-popover">
      {suggestions.length > 0 ? (
        suggestions.slice(0, 8).map((item) => (
          <button key={item} type="button" onClick={() => submitSearch(item)}>
            <SearchOutlined />
            <span>{item}</span>
          </button>
        ))
      ) : (
        <p>{keyword.trim() ? '暂无相关建议' : '输入关键词开始搜索'}</p>
      )}
    </div>
  )

  const loginGuide = (
    <div className="login-guide">
      <strong>登录后你可以：</strong>
      <div>
        <span><CrownOutlined /> 免费观看高清视频</span>
        <span><ClockCircleOutlined /> 多端同步播放记录</span>
        <span><MessageOutlined /> 发表弹幕/评论</span>
        <span><PlayCircleOutlined /> 热门番剧影视看不停</span>
      </div>
      <button type="button" onClick={() => setLoginOpen(true)}>立即登录</button>
      <p>首次使用？<button type="button" onClick={() => setLoginOpen(true)}>点我注册</button></p>
    </div>
  )

  return (
    <>
      <header className={`site-header ${solidHeader ? 'site-header--solid' : 'site-header--hero'}`}>
        <div className="site-header__left">
          <Link className="site-logo" to="/">
            <img src="/assets/bilibili-home/bilibili-blue-logo.svg" alt="bilibili" />
          </Link>
          <nav className="site-nav" aria-label="主导航">
            {primaryLinks.map(({ label, to, icon }) => (
              <Link key={label} to={to}>{icon}{label}</Link>
            ))}
          </nav>
        </div>
        <Popover
          content={searchContent}
          open={searchOpen}
          onOpenChange={setSearchOpen}
          trigger="click"
          placement="bottom"
          overlayClassName="header-search-popover"
        >
          <Input
            className="header-search"
            value={keyword}
            onChange={(event) => setKeyword(event.target.value)}
            onPressEnter={() => submitSearch()}
            onFocus={() => setSearchOpen(true)}
            placeholder={trendings[0] || '特厨隋坡'}
            suffix={<SearchOutlined onClick={() => submitSearch()} />}
          />
        </Popover>
        <div className="site-actions">
          {authenticated ? (
            <Dropdown menu={userMenu} placement="bottomRight">
              <Avatar
                className="site-avatar"
                src={user?.avatar_url || user?.avatar}
                icon={<UserOutlined />}
              />
            </Dropdown>
          ) : (
            <Popover content={loginGuide} placement="bottom" trigger="hover">
              <button className="login-button" type="button" onClick={() => setLoginOpen(true)}>
                登录
              </button>
            </Popover>
          )}
          <Link className="header-action optional-action" to="/search/video?keyword=大会员">
            <CrownOutlined />
            <span>大会员</span>
          </Link>
          <Link className="header-action" to="/message/reply">
            <Badge count={unread} size="small">
              <MessageOutlined />
            </Badge>
            <span>消息</span>
          </Link>
          <Link
            className="header-action optional-action"
            to={authenticated ? `/space/${user?.uid}/dynamic` : '/'}
            onClick={(event) => {
              if (!authenticated) {
                event.preventDefault()
                setLoginOpen(true)
              }
            }}
          >
            <PlayCircleOutlined />
            <span>动态</span>
          </Link>
          <Link
            className="header-action optional-action"
            to={authenticated ? `/space/${user?.uid}/favlist` : '/'}
            onClick={(event) => {
              if (!authenticated) {
                event.preventDefault()
                setLoginOpen(true)
              }
            }}
          >
            <StarOutlined />
            <span>收藏</span>
          </Link>
          <Link className="header-action optional-action" to="/search/video?keyword=历史">
            <ClockCircleOutlined />
            <span>历史</span>
          </Link>
          <Link className="header-action optional-action" to="/platform/home">
            <BulbOutlined />
            <span>创作中心</span>
          </Link>
          <Link className="upload-button" to="/platform/upload/video">
            <CloudUploadOutlined />
            投稿
          </Link>
        </div>
      </header>
      <LoginRegister open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
