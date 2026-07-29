import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Button,
  Empty,
  Form,
  Input,
  List,
  Popconfirm,
  Progress,
  Radio,
  Segmented,
  Select,
  Skeleton,
  Statistic,
  Space,
  Table,
  Tag,
  Upload,
  message,
} from 'antd'
import {
  BarChartOutlined,
  CheckCircleOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  HeartOutlined,
  HomeOutlined,
  InboxOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getComments } from '@/api/comment'
import {
  addVideo,
  changeVideoStatus,
  getUserWorks,
} from '@/api/video'
import { getDanmuList } from '@/api/comment'
import { useChunkUpload } from '@/hooks/useChunkUpload'
import { useAppSelector } from '@/store/hooks'
import { handleDate, handleNum } from '@/utils/format'
import { extractVideoFrames, type VideoFrame } from '@/utils/videoFrames'
import type { Comment } from '@/types/comment'
import type { Danmu } from '@/types/danmu'
import type { User } from '@/types/user'
import type { VideoFeedItem } from '@/types/video'

type CreatorSection =
  | 'home'
  | 'upload'
  | 'manuscript'
  | 'appeal'
  | 'data'
  | 'comment'
  | 'danmu'

const navItems = [
  { key: 'home', path: '/platform/home', label: '首页', icon: <HomeOutlined /> },
  { key: 'upload', path: '/platform/upload/video', label: '投稿', icon: <CloudUploadOutlined /> },
  { key: 'manuscript', path: '/platform/upload-manager/manuscript', label: '稿件管理', icon: <FileTextOutlined /> },
  { key: 'appeal', path: '/platform/upload-manager/appeal', label: '稿件状态', icon: <InboxOutlined /> },
  { key: 'data', path: '/platform/data-up', label: '数据中心', icon: <BarChartOutlined /> },
  { key: 'comment', path: '/platform/comment', label: '评论管理', icon: <CommentOutlined /> },
  { key: 'danmu', path: '/platform/danmu', label: '弹幕管理', icon: <MessageOutlined /> },
] satisfies Array<{
  key: CreatorSection
  path: string
  label: string
  icon: React.ReactNode
}>

const statusMeta: Record<number, { label: string; color: string }> = {
  0: { label: '审核中', color: 'processing' },
  1: { label: '已发布', color: 'success' },
  2: { label: '需整改', color: 'warning' },
  3: { label: '已下架', color: 'error' },
}

interface UploadValues {
  title: string
  type: number
  auth: number
  category: string
  tags: string
  descr: string
}

interface VideoUploadFormProps {
  onSubmitted: () => void
}

async function getDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const video = document.createElement('video')
    const url = URL.createObjectURL(file)
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('无法读取视频时长'))
    }
    video.src = url
  })
}

function VideoUploadForm({ onSubmitted }: VideoUploadFormProps) {
  const { channels, channelsLoading } = useAppSelector((state) => state.content)
  const { upload, cancel, reset, progress, status, error } = useChunkUpload()
  const [form] = Form.useForm<UploadValues>()
  const [video, setVideo] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [frames, setFrames] = useState<VideoFrame[]>([])
  const [selectedFrameTime, setSelectedFrameTime] = useState<number | null>(null)
  const [hash, setHash] = useState('')
  const [duration, setDuration] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const categoryOptions = useMemo(
    () =>
      channels.flatMap((channel) => {
        const children = channel.children || []
        return children.length > 0
          ? children.map((child) => ({
            value: `${channel.mcId}:${child.scId}`,
            label: `${channel.mcName} / ${child.scName}`,
          }))
          : [{ value: `${channel.mcId}:0`, label: channel.mcName }]
      }),
    [channels],
  )

  useEffect(() => {
    if (!cover) {
      setCoverPreview('')
      return
    }
    const url = URL.createObjectURL(cover)
    setCoverPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [cover])

  useEffect(
    () => () => frames.forEach((frame) => URL.revokeObjectURL(frame.url)),
    [frames],
  )

  const selectVideo = async (file: File) => {
    setVideo(file)
    setCover(null)
    setFrames([])
    setSelectedFrameTime(null)
    setHash('')
    if (!form.getFieldValue('title')) {
      form.setFieldValue('title', file.name.replace(/\.[^.]+$/, '').slice(0, 80))
    }
    try {
      const [nextDuration, nextHash, nextFrames] = await Promise.all([
        getDuration(file),
        upload(file),
        extractVideoFrames(file, 4).catch(() => []),
      ])
      setDuration(nextDuration)
      setHash(nextHash)
      setFrames(nextFrames)
      if (nextFrames[0]) {
        setCover(nextFrames[0].file)
        setSelectedFrameTime(nextFrames[0].time)
      } else {
        message.info('当前浏览器未能读取视频画面，请上传自定义封面')
      }
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        message.error(reason instanceof Error ? reason.message : '视频上传失败')
      }
    }
    return false
  }

  const clearFiles = () => {
    setVideo(null)
    setCover(null)
    setFrames([])
    setSelectedFrameTime(null)
    setHash('')
    setDuration(0)
    reset()
  }

  const submit = async (values: UploadValues) => {
    if (!video || !cover || !hash || status !== 'done') {
      message.warning('请先完成视频和封面的上传')
      return
    }
    const [mcid = '0', scid = '0'] = values.category.split(':')
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('cover', cover)
      data.append('hash', hash)
      data.append('title', values.title)
      data.append('type', String(values.type))
      data.append('auth', String(values.auth))
      data.append('duration', String(duration))
      data.append('mcid', mcid)
      data.append('scid', scid)
      data.append(
        'tags',
        values.tags
          .split(/[,，]/)
          .map((tag) => tag.trim())
          .filter(Boolean)
          .join('\r\n'),
      )
      data.append('descr', values.descr || '')
      await addVideo(data)
      message.success('投稿已提交，后台正在合并视频并进入审核')
      form.resetFields()
      clearFiles()
      onSubmitted()
    } finally {
      setSubmitting(false)
    }
  }

  const statusText = {
    idle: '等待选择视频',
    hashing: '正在计算文件指纹…',
    uploading: '正在分片上传，可从已上传分片继续',
    done: '视频分片上传完成',
    error: '上传中断',
    cancelled: '上传已取消',
  }[status]

  return (
    <div className="platform-upload">
      <header className="creator-section-heading">
        <div>
          <h2>视频投稿</h2>
          <p>视频先分片上传到服务端，提交后由服务端合并并写入对象存储。</p>
        </div>
      </header>
      <Upload.Dragger
        accept="video/*"
        maxCount={1}
        beforeUpload={selectVideo}
        showUploadList={Boolean(video)}
        disabled={status === 'hashing' || status === 'uploading'}
      >
        <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p>
        <p>点击或拖拽视频到这里</p>
        <small>支持断点续传；刷新后重新选择同一文件即可继续</small>
      </Upload.Dragger>
      {status !== 'idle' ? (
        <div className="upload-progress">
          <div>
            <span>{statusText}</span>
            {(status === 'hashing' || status === 'uploading') ? (
              <Button size="small" danger onClick={cancel}>取消上传</Button>
            ) : null}
          </div>
          <Progress
            percent={progress}
            status={status === 'error' ? 'exception' : status === 'done' ? 'success' : undefined}
          />
          {error ? <Alert type="error" showIcon message={error} /> : null}
        </div>
      ) : null}
      <Form<UploadValues>
        form={form}
        layout="vertical"
        initialValues={{ type: 1, auth: 0 }}
        onFinish={submit}
      >
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
          <Input maxLength={80} showCount />
        </Form.Item>
        <div className="form-row">
          <Form.Item name="type" label="投稿类型">
            <Radio.Group options={[{ label: '自制', value: 1 }, { label: '转载', value: 2 }]} />
          </Form.Item>
          <Form.Item name="auth" label="声明">
            <Radio.Group options={[{ label: '普通投稿', value: 0 }, { label: '未经许可禁止转载', value: 1 }]} />
          </Form.Item>
        </div>
        <Form.Item name="category" label="分区" rules={[{ required: true, message: '请选择分区' }]}>
          <Select
            showSearch
            optionFilterProp="label"
            options={categoryOptions}
            placeholder={channelsLoading ? '分区数据加载中...' : categoryOptions.length ? '请选择内容分区' : '分区加载失败，请刷新页面重试'}
            disabled={!channelsLoading && categoryOptions.length === 0}
          />
        </Form.Item>
        <Form.Item name="tags" label="标签" rules={[{ required: true, message: '请输入至少一个标签' }]}>
          <Input placeholder="多个标签用逗号分隔" />
        </Form.Item>
        <Form.Item label="封面" required>
          <div className="cover-editor">
            <div className="cover-preview">
              {coverPreview ? <img src={coverPreview} alt="当前视频封面" /> : (
                <span>{video ? '正在从视频中提取画面…' : '选择视频后自动生成封面'}</span>
              )}
              {cover ? (
                <small>
                  {selectedFrameTime === null
                    ? '自定义封面'
                    : `视频 ${Math.round(selectedFrameTime)} 秒画面`}
                </small>
              ) : null}
            </div>
            <div className="cover-options">
              <strong>从视频中选择</strong>
              <div className="cover-frame-grid">
                {frames.map((frame) => (
                  <button
                    key={frame.url}
                    className={selectedFrameTime === frame.time ? 'active' : ''}
                    type="button"
                    onClick={() => {
                      setCover(frame.file)
                      setSelectedFrameTime(frame.time)
                    }}
                  >
                    <img src={frame.url} alt={`${Math.round(frame.time)} 秒画面`} />
                    <span>{Math.round(frame.time)}s</span>
                  </button>
                ))}
              </div>
              <Upload
                accept="image/jpeg,image/png,image/webp"
                maxCount={1}
                showUploadList={false}
                beforeUpload={(file) => {
                  setCover(file)
                  setSelectedFrameTime(null)
                  return false
                }}
              >
                <Button>上传自定义封面</Button>
              </Upload>
            </div>
          </div>
        </Form.Item>
        <Form.Item name="descr" label="简介">
          <Input.TextArea rows={5} maxLength={2000} showCount />
        </Form.Item>
        <div className="creator-form-actions">
          <Button onClick={clearFiles}>清空</Button>
          <Button type="primary" htmlType="submit" loading={submitting}>提交投稿</Button>
        </div>
      </Form>
    </div>
  )
}

function sumStats(works: VideoFeedItem[]) {
  return works.reduce(
    (total, item) => ({
      play: total.play + Number(item.stats.play || 0),
      good: total.good + Number(item.stats.good || 0),
      comment: total.comment + Number(item.stats.comment || 0),
      danmu: total.danmu + Number(item.stats.danmu || 0),
      collect: total.collect + Number(item.stats.collect || 0),
    }),
    { play: 0, good: 0, comment: 0, danmu: 0, collect: 0 },
  )
}

function CreatorHome({ user, works }: { user: User | null; works: VideoFeedItem[] }) {
  const totals = useMemo(() => sumStats(works), [works])
  return (
    <div className="creator-home">
      <div className="creator-home__topline">
        <section className="creator-profile">
          <Avatar size={68} src={user?.avatar_url || user?.avatar} icon={<UserOutlined />} />
          <div>
            <h2>{user?.nickname || '创作者'}</h2>
            <p>{user?.description || '记录创作，让更多人看到你的作品。'}</p>
          </div>
          <dl>
            <div><dt>粉丝</dt><dd>{handleNum(user?.fansCount || 0)}</dd></div>
            <div><dt>关注</dt><dd>{handleNum(user?.followCount || 0)}</dd></div>
            <div><dt>稿件</dt><dd>{works.length}</dd></div>
          </dl>
        </section>
        <section className="creator-upload-entry">
          <CloudUploadOutlined />
          <div><strong>发布你的下一个作品</strong><span>支持分片与断点续传</span></div>
          <Link to="/platform/upload/video">开始投稿</Link>
        </section>
      </div>
      <section className="creator-metrics">
        <Statistic title="总播放" value={totals.play} prefix={<PlayCircleOutlined />} />
        <Statistic title="获赞" value={totals.good} prefix={<HeartOutlined />} />
        <Statistic title="评论" value={totals.comment} prefix={<CommentOutlined />} />
        <Statistic title="弹幕" value={totals.danmu} prefix={<MessageOutlined />} />
        <Statistic title="收藏" value={totals.collect} prefix={<CheckCircleOutlined />} />
      </section>
      <section className="creator-recent">
        <header>
          <div><h3>近期稿件</h3><p>最近提交的作品及审核状态</p></div>
          <Link to="/platform/upload-manager/manuscript">查看全部</Link>
        </header>
        {works.length ? (
          <List
            dataSource={works.slice(0, 5)}
            renderItem={(item) => {
              const meta = statusMeta[item.video.status ?? 0] || statusMeta[0]
              return (
                <List.Item
                  actions={[
                    <Link key="view" to={`/video/${item.video.vid}`}>查看</Link>,
                    <Link key="data" to="/platform/data-up">数据</Link>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<img src={item.video.coverUrl || item.video.cover} alt="" />}
                    title={item.video.title}
                    description={item.video.uploadDate ? handleDate(item.video.uploadDate) : '刚刚提交'}
                  />
                  <Tag color={meta.color}>{meta.label}</Tag>
                </List.Item>
              )
            }}
          />
        ) : (
          <Empty description="还没有稿件，发布第一个作品吧" />
        )}
      </section>
    </div>
  )
}

function ManuscriptManager({
  works,
  onChanged,
}: {
  works: VideoFeedItem[]
  onChanged: () => void
}) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [deleting, setDeleting] = useState<number | string | null>(null)
  const filtered = useMemo(
    () => works.filter((item) => {
      const matchesText = item.video.title.toLowerCase().includes(query.trim().toLowerCase())
      const matchesStatus = status === 'all' || Number(item.video.status ?? 0) === Number(status)
      return matchesText && matchesStatus
    }),
    [query, status, works],
  )

  return (
    <div className="creator-manager">
      <header className="creator-section-heading">
        <div><h2>稿件管理</h2><p>查看真实稿件数据、审核状态和表现。</p></div>
        <Link className="creator-primary-link" to="/platform/upload/video">新建投稿</Link>
      </header>
      <div className="creator-toolbar">
        <Segmented
          value={status}
          onChange={(value) => setStatus(String(value))}
          options={[
            { label: `全部 ${works.length}`, value: 'all' },
            { label: '审核中', value: '0' },
            { label: '已发布', value: '1' },
            { label: '需整改', value: '2' },
            { label: '已下架', value: '3' },
          ]}
        />
        <Input
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          prefix={<SearchOutlined />}
          placeholder="搜索稿件标题"
        />
      </div>
      <Table<VideoFeedItem>
        rowKey={(item) => String(item.video.vid)}
        dataSource={filtered}
        locale={{ emptyText: <Empty description="没有符合条件的稿件" /> }}
        pagination={{ pageSize: 8, hideOnSinglePage: true }}
        columns={[
          {
            title: '稿件',
            key: 'video',
            render: (_, item) => (
              <div className="manuscript-cell">
                <img src={item.video.coverUrl || item.video.cover} alt="" />
                <div><strong>{item.video.title}</strong><span>{item.video.uploadDate ? handleDate(item.video.uploadDate) : '-'}</span></div>
              </div>
            ),
          },
          {
            title: '状态',
            key: 'status',
            width: 100,
            render: (_, item) => {
              const meta = statusMeta[item.video.status ?? 0] || statusMeta[0]
              return <Tag color={meta.color}>{meta.label}</Tag>
            },
          },
          {
            title: '播放 / 获赞',
            key: 'stats',
            width: 150,
            render: (_, item) => `${handleNum(item.stats.play || 0)} / ${handleNum(item.stats.good || 0)}`,
          },
          {
            title: '操作',
            key: 'actions',
            width: 170,
            render: (_, item) => (
              <Space>
                <Link to={`/video/${item.video.vid}`}><EyeOutlined /> 查看</Link>
                {Number(item.video.status) !== 3 ? (
                  <Popconfirm
                    title="确认删除这条稿件？"
                    description="视频、封面及关联内容会被移除，此操作无法撤销。"
                    okButtonProps={{ danger: true }}
                    onConfirm={async () => {
                      setDeleting(item.video.vid)
                      try {
                        await changeVideoStatus(item.video.vid, 3)
                        message.success('稿件已删除')
                        onChanged()
                      } finally {
                        setDeleting(null)
                      }
                    }}
                  >
                    <Button
                      type="link"
                      danger
                      size="small"
                      loading={deleting === item.video.vid}
                      icon={<DeleteOutlined />}
                    >
                      删除
                    </Button>
                  </Popconfirm>
                ) : null}
              </Space>
            ),
          },
        ]}
      />
    </div>
  )
}

function AppealManager({ works }: { works: VideoFeedItem[] }) {
  const abnormal = works.filter((item) => Number(item.video.status || 0) >= 2)
  return (
    <div className="creator-manager">
      <header className="creator-section-heading">
        <div><h2>稿件状态</h2><p>集中处理需整改或已下架的作品。</p></div>
      </header>
      {abnormal.length ? (
        <List
          className="appeal-list"
          dataSource={abnormal}
          renderItem={(item) => {
            const meta = statusMeta[item.video.status ?? 2] || statusMeta[2]
            return (
              <List.Item
                actions={[
                  <Link key="view" to={`/video/${item.video.vid}`}>查看稿件</Link>,
                  <Link key="retry" to="/platform/upload/video">重新投稿</Link>,
                ]}
              >
                <List.Item.Meta
                  avatar={<img src={item.video.coverUrl || item.video.cover} alt="" />}
                  title={item.video.title}
                  description={item.video.status === 2 ? '请根据审核要求调整信息后重新提交。' : '该稿件已下架，请检查内容规范。'}
                />
                <Tag color={meta.color}>{meta.label}</Tag>
              </List.Item>
            )
          }}
        />
      ) : (
        <Empty description="当前没有需要处理的稿件" />
      )}
    </div>
  )
}

function CreatorAnalytics({ works }: { works: VideoFeedItem[] }) {
  const totals = useMemo(() => sumStats(works), [works])
  const ranked = useMemo(
    () => [...works].sort((a, b) => Number(b.stats.play || 0) - Number(a.stats.play || 0)).slice(0, 8),
    [works],
  )
  const maxPlay = Math.max(...ranked.map((item) => Number(item.stats.play || 0)), 1)
  return (
    <div className="creator-analytics">
      <header className="creator-section-heading">
        <div><h2>数据中心</h2><p>数据来自当前账号的真实稿件聚合。</p></div>
      </header>
      <section className="creator-metrics">
        <Statistic title="稿件" value={works.length} />
        <Statistic title="总播放" value={totals.play} />
        <Statistic title="总互动" value={totals.good + totals.comment + totals.danmu} />
        <Statistic title="总收藏" value={totals.collect} />
      </section>
      <section className="creator-chart">
        <header><h3>稿件播放表现</h3><span>按播放量排序</span></header>
        {ranked.length ? ranked.map((item) => (
          <div className="creator-chart__row" key={item.video.vid}>
            <Link to={`/video/${item.video.vid}`}>{item.video.title}</Link>
            <div><i style={{ width: `${Math.max((Number(item.stats.play || 0) / maxPlay) * 100, 2)}%` }} /></div>
            <strong>{handleNum(item.stats.play || 0)}</strong>
          </div>
        )) : <Empty description="有稿件后即可查看数据" />}
      </section>
    </div>
  )
}

interface InteractionRecord {
  id: string
  content: string
  author: string
  time: string
  video: VideoFeedItem
}

function commentAuthor(comment: Comment) {
  return comment.nickname || `用户 ${comment.uid ?? comment.userId ?? '-'}`
}

function InteractionManager({
  mode,
  works,
}: {
  mode: 'comment' | 'danmu'
  works: VideoFeedItem[]
}) {
  const [records, setRecords] = useState<InteractionRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sourceWorks = works.slice(0, 10)
      if (mode === 'comment') {
        const pages = await Promise.all(
          sourceWorks.map((item) => getComments(item.video.vid).catch(() => ({ comments: [], more: false }))),
        )
        setRecords(pages.flatMap((page, index) =>
          page.comments.map((comment, commentIndex) => ({
            id: `comment-${sourceWorks[index].video.vid}-${comment.id ?? comment.cid ?? commentIndex}`,
            content: comment.content,
            author: commentAuthor(comment),
            time: comment.commentDate || comment.createTime || '',
            video: sourceWorks[index],
          })),
        ))
      } else {
        const lists = await Promise.all(
          sourceWorks.map((item) => getDanmuList(item.video.vid).catch(() => [])),
        )
        setRecords(lists.flatMap((items: Danmu[], index) =>
          items.map((danmu, danmuIndex) => ({
            id: `danmu-${sourceWorks[index].video.vid}-${danmu.id ?? danmuIndex}`,
            content: danmu.content,
            author: danmu.userId ? `用户 ${danmu.userId}` : '匿名用户',
            time: danmu.createTime || '',
            video: sourceWorks[index],
          })),
        ))
      }
    } finally {
      setLoading(false)
    }
  }, [mode, works])

  useEffect(() => { load() }, [load])

  const filtered = records.filter((record) =>
    `${record.content}${record.author}${record.video.video.title}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  )

  return (
    <div className="creator-interactions">
      <header className="creator-section-heading">
        <div>
          <h2>{mode === 'comment' ? '评论管理' : '弹幕管理'}</h2>
          <p>汇总最近稿件中的真实{mode === 'comment' ? '评论' : '弹幕'}内容。</p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </header>
      <Input
        allowClear
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        prefix={<SearchOutlined />}
        placeholder={`搜索${mode === 'comment' ? '评论' : '弹幕'}或稿件`}
      />
      <List
        loading={loading}
        dataSource={filtered}
        locale={{ emptyText: <Empty description={`暂无${mode === 'comment' ? '评论' : '弹幕'}`} /> }}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        renderItem={(record) => (
          <List.Item actions={[<Link key="view" to={`/video/${record.video.video.vid}`}>查看视频</Link>]}>
            <List.Item.Meta
              avatar={<Avatar icon={mode === 'comment' ? <CommentOutlined /> : <MessageOutlined />} />}
              title={<><strong>{record.author}</strong><span> · {record.video.video.title}</span></>}
              description={<><p>{record.content}</p><time>{record.time ? handleDate(record.time) : ''}</time></>}
            />
          </List.Item>
        )}
      />
    </div>
  )
}

function resolveSection(pathname: string): CreatorSection {
  return navItems.find((item) => pathname.startsWith(item.path))?.key || 'home'
}

export default function PlatformPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppSelector((state) => state.user.current)
  const [works, setWorks] = useState<VideoFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const active = resolveSection(location.pathname)

  const loadWorks = useCallback(async () => {
    if (!user?.uid) return
    setLoading(true)
    setLoadError('')
    try {
      const result = await getUserWorks(user.uid, 1, 1, 100)
      setWorks(result?.list || [])
    } catch {
      setLoadError('稿件数据加载失败，请确认后端、Redis 和数据库服务可用。')
    } finally {
      setLoading(false)
    }
  }, [user?.uid])

  useEffect(() => { loadWorks() }, [loadWorks])

  let content: React.ReactNode
  if (active !== 'upload' && loading) {
    content = <Skeleton active paragraph={{ rows: 12 }} />
  } else if (active !== 'upload' && loadError) {
    content = <Alert type="error" showIcon message={loadError} action={<Button onClick={loadWorks}>重试</Button>} />
  } else {
    content = {
      home: <CreatorHome user={user} works={works} />,
      upload: <VideoUploadForm onSubmitted={loadWorks} />,
      manuscript: <ManuscriptManager works={works} onChanged={loadWorks} />,
      appeal: <AppealManager works={works} />,
      data: <CreatorAnalytics works={works} />,
      comment: <InteractionManager mode="comment" works={works} />,
      danmu: <InteractionManager mode="danmu" works={works} />,
    }[active]
  }

  return (
    <main className="surface-page platform-page">
      <div className="platform-shell page-container">
        <aside className="surface-panel">
          <h1>创作中心</h1>
          <nav>
            {navItems.map((item) => (
              <button
                key={item.path}
                className={active === item.key ? 'active' : ''}
                type="button"
                onClick={() => navigate(item.path)}
              >
                {item.icon}{item.label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="surface-panel platform-content">{content}</section>
      </div>
    </main>
  )
}
