import { useState } from 'react'
import { Button, ColorPicker, Input, List, Popconfirm, Popover, Segmented, message } from 'antd'
import { BgColorsOutlined, DeleteOutlined } from '@ant-design/icons'
import type { DanmuStyle } from '@/hooks/useDanmuChannel'
import type { Danmu } from '@/types/danmu'

interface DanmuBoxProps {
  items: Danmu[]
  onSend: (content: string, style: DanmuStyle) => boolean
  currentUid?: number
  ownerUid?: number
  currentRole?: number
  onDelete: (item: Danmu) => Promise<void>
}

export default function DanmuBox({
  items,
  onSend,
  currentUid,
  ownerUid,
  currentRole,
  onDelete,
}: DanmuBoxProps) {
  const [content, setContent] = useState('')
  const [style, setStyle] = useState<DanmuStyle>({
    fontsize: 25,
    mode: 1,
    color: '#FFFFFF',
  })

  const submit = () => {
    if (!content.trim()) return
    if (onSend(content.trim(), style)) {
      setContent('')
      message.success('弹幕已发送')
    }
  }

  const stylePanel = (
    <div className="danmu-style-panel">
      <label>
        <span>位置</span>
        <Segmented
          size="small"
          value={style.mode}
          onChange={(value) => setStyle((current) => ({
            ...current,
            mode: Number(value) as DanmuStyle['mode'],
          }))}
          options={[
            { label: '滚动', value: 1 },
            { label: '顶部', value: 2 },
            { label: '底部', value: 3 },
          ]}
        />
      </label>
      <label>
        <span>字号</span>
        <Segmented
          size="small"
          value={style.fontsize}
          onChange={(value) => setStyle((current) => ({
            ...current,
            fontsize: Number(value) as DanmuStyle['fontsize'],
          }))}
          options={[
            { label: '小', value: 18 },
            { label: '标准', value: 25 },
          ]}
        />
      </label>
      <label>
        <span>颜色</span>
        <ColorPicker
          value={style.color}
          presets={[{
            label: '常用',
            colors: ['#FFFFFF', '#00AEEC', '#FB7299', '#FFD700', '#FF4D4F', '#52C41A'],
          }]}
          onChange={(color) => setStyle((current) => ({
            ...current,
            color: color.toHexString().toUpperCase(),
          }))}
        />
      </label>
    </div>
  )

  return (
    <aside className="danmu-box surface-panel">
      <div className="danmu-box__title">
        <strong>弹幕列表</strong>
        <span>{items.length} 条</span>
      </div>
      <List
        className="danmu-list"
        size="small"
        dataSource={items}
        locale={{ emptyText: '还没有弹幕' }}
        renderItem={(item) => {
          const canDelete = Boolean(item.id && currentUid && (
            Number(item.uid ?? item.userId) === currentUid
            || ownerUid === currentUid
            || currentRole === 1
            || currentRole === 2
          ))
          return (
            <List.Item>
              <span>{item.content}</span>
              <time>{Math.floor(Number(item.timePoint ?? item.time ?? 0))}s</time>
              {canDelete ? (
                <Popconfirm title="删除这条弹幕？" onConfirm={() => onDelete(item)}>
                  <Button type="text" size="small" danger aria-label="删除弹幕" icon={<DeleteOutlined />} />
                </Popconfirm>
              ) : null}
            </List.Item>
          )
        }}
      />
      <div className="danmu-input">
        <Popover content={stylePanel} title="弹幕样式" trigger="click" placement="topLeft">
          <Button
            aria-label="设置弹幕样式"
            icon={<BgColorsOutlined style={{ color: style.color === '#FFFFFF' ? '#61666d' : style.color }} />}
          />
        </Popover>
        <Input
          value={content}
          maxLength={80}
          onChange={(event) => setContent(event.target.value)}
          onPressEnter={submit}
          placeholder="发一条友善的弹幕"
        />
        <Button type="primary" onClick={submit}>发送</Button>
      </div>
    </aside>
  )
}
