import { useEffect, useMemo, useState } from 'react'
import { Button, Checkbox, Empty, Form, Input, Modal, Radio, Skeleton, message } from 'antd'
import {
  createFavorite,
  getCollectedFids,
  getFavorites,
  updateVideoCollections,
  type Favorite,
} from '@/api/content'

interface FavoriteSelectorProps {
  open: boolean
  uid: number | string
  vid: number | string
  onClose: () => void
  onSaved?: (selectedCount: number) => void
}

interface CreateValues {
  title: string
  description?: string
  visible: number
}

export default function FavoriteSelector({
  open,
  uid,
  vid,
  onClose,
  onSaved,
}: FavoriteSelectorProps) {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [initial, setInitial] = useState<Set<number>>(new Set())
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form] = Form.useForm<CreateValues>()

  useEffect(() => {
    if (!open) return
    let active = true
    setLoading(true)
    Promise.all([getFavorites(uid, true), getCollectedFids(vid)])
      .then(([nextFavorites, nextFids]) => {
        if (!active) return
        const collected = new Set((nextFids || []).map(Number))
        setFavorites(nextFavorites || [])
        setInitial(collected)
        setSelected(new Set(collected))
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [open, uid, vid])

  const changed = useMemo(() => {
    if (initial.size !== selected.size) return true
    return [...initial].some((fid) => !selected.has(fid))
  }, [initial, selected])

  const toggle = (fid: number, checked: boolean) => {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(fid)
      else next.delete(fid)
      return next
    })
  }

  const save = async () => {
    const adds = [...selected].filter((fid) => !initial.has(fid))
    const removes = [...initial].filter((fid) => !selected.has(fid))
    if (adds.length === 0 && removes.length === 0) {
      onClose()
      return
    }
    setSaving(true)
    try {
      await updateVideoCollections(vid, adds, removes)
      message.success(selected.size > 0 ? '收藏夹已更新' : '已取消收藏')
      onSaved?.(selected.size)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const submitCreate = async (values: CreateValues) => {
    setCreating(true)
    try {
      const created = await createFavorite(
        values.title.trim(),
        values.description?.trim() || '',
        values.visible,
      )
      setFavorites((current) => [created, ...current])
      setSelected((current) => new Set(current).add(created.fid))
      form.resetFields()
      message.success('收藏夹已创建并选中')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal
      title="添加到收藏夹"
      open={open}
      onCancel={onClose}
      onOk={save}
      okText="保存"
      cancelText="取消"
      confirmLoading={saving}
      okButtonProps={{ disabled: loading || (!changed && favorites.length > 0) }}
      className="favorite-selector-modal"
    >
      {loading ? <Skeleton active paragraph={{ rows: 4 }} /> : (
        <>
          <div className="favorite-selector-list">
            {favorites.length > 0 ? favorites.map((favorite) => (
              <label key={favorite.fid}>
                <Checkbox
                  checked={selected.has(favorite.fid)}
                  onChange={(event) => toggle(favorite.fid, event.target.checked)}
                />
                <span>
                  <strong>{favorite.title}</strong>
                  <small>
                    {favorite.count || 0} 个内容
                    {favorite.visible === 0 ? ' · 私密' : ''}
                  </small>
                </span>
              </label>
            )) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="还没有收藏夹" />}
          </div>
          <Form<CreateValues>
            form={form}
            layout="vertical"
            initialValues={{ visible: 1 }}
            onFinish={submitCreate}
            className="favorite-create-form"
          >
            <strong>新建收藏夹</strong>
            <Form.Item
              name="title"
              rules={[
                { required: true, message: '请输入收藏夹名称' },
                { max: 80, message: '名称不能超过 80 个字' },
              ]}
            >
              <Input placeholder="收藏夹名称" maxLength={80} />
            </Form.Item>
            <Form.Item name="description">
              <Input placeholder="简介（可选）" maxLength={200} />
            </Form.Item>
            <Form.Item name="visible">
              <Radio.Group
                options={[
                  { label: '公开', value: 1 },
                  { label: '私密', value: 0 },
                ]}
              />
            </Form.Item>
            <Button htmlType="submit" loading={creating}>创建收藏夹</Button>
          </Form>
        </>
      )}
    </Modal>
  )
}
