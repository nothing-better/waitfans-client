import { useMemo, useState } from 'react'
import {
  Button,
  Empty,
  Form,
  Input,
  Progress,
  Radio,
  Select,
  Upload,
  message,
} from 'antd'
import {
  BarChartOutlined,
  CloudUploadOutlined,
  CommentOutlined,
  FileTextOutlined,
  HomeOutlined,
  InboxOutlined,
} from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { addVideo } from '@/api/video'
import { useChunkUpload } from '@/hooks/useChunkUpload'
import { useAppSelector } from '@/store/hooks'

const navItems = [
  ['/platform/home', '首页', <HomeOutlined key="home" />],
  ['/platform/upload/video', '投稿', <CloudUploadOutlined key="upload" />],
  ['/platform/upload-manager/manuscript', '稿件管理', <FileTextOutlined key="manuscript" />],
  ['/platform/upload-manager/appeal', '申诉管理', <InboxOutlined key="appeal" />],
  ['/platform/data-up', '数据中心', <BarChartOutlined key="data" />],
  ['/platform/comment', '评论管理', <CommentOutlined key="comment" />],
  ['/platform/danmu', '弹幕管理', <CommentOutlined key="danmu" />],
] as const

interface UploadValues {
  title: string
  type: number
  auth: number
  category: [number, number]
  tags: string
  descr: string
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

function VideoUploadForm() {
  const channels = useAppSelector((state) => state.content.channels)
  const { upload, progress, status } = useChunkUpload()
  const [video, setVideo] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [hash, setHash] = useState('')
  const [duration, setDuration] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const categoryOptions = useMemo(
    () =>
      channels.map((channel) => ({
        value: channel.mcId,
        label: channel.mcName,
        children: (channel.children || []).map((child) => ({
          value: child.scId,
          label: child.scName,
        })),
      })),
    [channels],
  )

  const selectVideo = async (file: File) => {
    setVideo(file)
    setDuration(await getDuration(file))
    const nextHash = await upload(file)
    setHash(nextHash)
    return false
  }

  const submit = async (values: UploadValues) => {
    if (!video || !cover || !hash || status !== 'done') {
      message.warning('请先选择并上传视频和封面')
      return
    }
    setSubmitting(true)
    try {
      const data = new FormData()
      data.append('cover', cover)
      data.append('hash', hash)
      data.append('title', values.title)
      data.append('type', String(values.type))
      data.append('auth', String(values.auth))
      data.append('duration', String(duration))
      data.append('mcid', String(values.category?.[0] || 0))
      data.append('scid', String(values.category?.[1] || 0))
      data.append('tags', values.tags.split(/[,，]/).map((tag) => tag.trim()).filter(Boolean).join('\r\n'))
      data.append('descr', values.descr || '')
      await addVideo(data)
      message.success('投稿已提交审核')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="platform-upload">
      <h2>视频投稿</h2>
      <Upload.Dragger
        accept="video/*"
        maxCount={1}
        beforeUpload={selectVideo}
        showUploadList={Boolean(video)}
      >
        <p className="ant-upload-drag-icon"><CloudUploadOutlined /></p>
        <p>点击或拖拽视频到这里</p>
        <small>支持分片上传，上传过程中请勿关闭页面</small>
      </Upload.Dragger>
      {status !== 'idle' ? (
        <div className="upload-progress">
          <span>{status === 'hashing' ? '正在校验文件…' : status === 'done' ? '视频上传完成' : '正在上传视频…'}</span>
          <Progress percent={progress} status={status === 'error' ? 'exception' : undefined} />
        </div>
      ) : null}
      <Form<UploadValues>
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
            options={categoryOptions.flatMap((main) =>
              main.children.length
                ? main.children.map((child) => ({ value: [main.value, child.value], label: `${main.label} / ${child.label}` }))
                : [{ value: [main.value, 0], label: main.label }],
            )}
          />
        </Form.Item>
        <Form.Item name="tags" label="标签" rules={[{ required: true, message: '请输入至少一个标签' }]}>
          <Input placeholder="多个标签用逗号分隔" />
        </Form.Item>
        <Form.Item label="封面" required>
          <Upload accept="image/*" maxCount={1} beforeUpload={(file) => { setCover(file); return false }}>
            <Button>选择封面</Button>
          </Upload>
        </Form.Item>
        <Form.Item name="descr" label="简介">
          <Input.TextArea rows={5} maxLength={1000} showCount />
        </Form.Item>
        <Button type="primary" htmlType="submit" loading={submitting}>提交投稿</Button>
      </Form>
    </div>
  )
}

export default function PlatformPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const isUpload = location.pathname.includes('/upload/')
  const activeItem = navItems.find(([path]) => location.pathname.startsWith(path))

  return (
    <main className="surface-page platform-page">
      <div className="platform-shell page-container">
        <aside className="surface-panel">
          <h1>创作中心</h1>
          <nav>
            {navItems.map(([path, label, icon]) => (
              <button
                key={path}
                className={activeItem?.[0] === path ? 'active' : ''}
                type="button"
                onClick={() => navigate(path)}
              >
                {icon}{label}
              </button>
            ))}
          </nav>
        </aside>
        <section className="surface-panel platform-content">
          {isUpload ? <VideoUploadForm /> : (
            <div className="feature-placeholder">
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={`${activeItem?.[1] || '创作中心'} 已迁入 React`}
              />
              <p>页面结构和路由已完成，数据将在对应后端接口返回后自动展示。</p>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
