import { useState } from 'react'
import { Button, Input, List, message } from 'antd'
import type { Danmu } from '@/types/danmu'

interface DanmuBoxProps {
  items: Danmu[]
  onSend: (content: string) => boolean
}

export default function DanmuBox({ items, onSend }: DanmuBoxProps) {
  const [content, setContent] = useState('')

  const submit = () => {
    if (!content.trim()) return
    if (onSend(content.trim())) {
      setContent('')
      message.success('弹幕已发送')
    }
  }

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
        renderItem={(item) => (
          <List.Item>
            <span>{item.content}</span>
            <time>{Math.floor(Number(item.timePoint ?? item.time ?? 0))}s</time>
          </List.Item>
        )}
      />
      <div className="danmu-input">
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
