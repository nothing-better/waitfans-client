import { useEffect, useState } from 'react'
import { Avatar, Button, Form, Input, Radio, Tabs, Upload, message } from 'antd'
import { CameraOutlined, LockOutlined, UserOutlined } from '@ant-design/icons'
import { useLocation, useNavigate } from 'react-router-dom'
import { updateAvatar, updatePassword, updateProfile } from '@/api/user'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { updateCurrentUser } from '@/store/slices/userSlice'

interface ProfileValues {
  nickname: string
  description: string
  gender: number
}

interface PasswordValues {
  password: string
  newPassword: string
  confirmPassword: string
}

export default function AccountPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.user.current)
  const active = location.pathname.split('/').pop() || 'home'
  const [profileForm] = Form.useForm<ProfileValues>()
  const [passwordForm] = Form.useForm<PasswordValues>()
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || user?.avatar)

  useEffect(() => {
    profileForm.setFieldsValue({
      nickname: user?.nickname || '',
      description: user?.description || '',
      gender: user?.gender || 0,
    })
    setAvatarUrl(user?.avatar_url || user?.avatar)
  }, [profileForm, user])

  const saveProfile = async (values: ProfileValues) => {
    const data = new FormData()
    data.append('nickname', values.nickname)
    data.append('description', values.description)
    data.append('gender', String(values.gender))
    const updated = await updateProfile(data)
    dispatch(updateCurrentUser(updated || { ...user!, ...values }))
    message.success('资料已保存')
  }

  const savePassword = async (values: PasswordValues) => {
    const data = new FormData()
    data.append('pw', values.password)
    data.append('npw', values.newPassword)
    await updatePassword(data)
    passwordForm.resetFields()
    message.success('密码修改成功')
  }

  const uploadAvatar = async (file: File) => {
    const data = new FormData()
    data.append('file', file)
    const url = await updateAvatar(data)
    setAvatarUrl(url)
    if (user) dispatch(updateCurrentUser({ ...user, avatar_url: url }))
    message.success('头像已更新')
    return false
  }

  return (
    <main className="surface-page account-page">
      <div className="account-shell page-container surface-panel">
        <aside>
          <h1>账号中心</h1>
          <Tabs
            tabPosition="left"
            activeKey={active}
            onChange={(key) => navigate(`/account/${key}`)}
            items={[
              { key: 'home', label: '账号首页' },
              { key: 'info', label: '我的信息' },
              { key: 'avatar', label: '我的头像' },
              { key: 'security', label: '账号安全' },
            ]}
          />
        </aside>
        <section className="account-content">
          {active === 'home' ? (
            <div className="account-overview">
              <Avatar size={96} src={avatarUrl} icon={<UserOutlined />} />
              <div><h2>{user?.nickname}</h2><p>{user?.description || '欢迎回来'}</p></div>
            </div>
          ) : null}
          {active === 'info' ? (
            <>
              <h2>我的信息</h2>
              <Form form={profileForm} layout="vertical" onFinish={saveProfile}>
                <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}>
                  <Input maxLength={20} />
                </Form.Item>
                <Form.Item name="description" label="个性签名">
                  <Input.TextArea maxLength={80} showCount />
                </Form.Item>
                <Form.Item name="gender" label="性别">
                  <Radio.Group options={[{ label: '保密', value: 0 }, { label: '男', value: 1 }, { label: '女', value: 2 }]} />
                </Form.Item>
                <Button type="primary" htmlType="submit">保存修改</Button>
              </Form>
            </>
          ) : null}
          {active === 'avatar' ? (
            <div className="avatar-editor">
              <h2>我的头像</h2>
              <Avatar size={160} src={avatarUrl} icon={<UserOutlined />} />
              <Upload accept="image/*" showUploadList={false} beforeUpload={uploadAvatar}>
                <Button icon={<CameraOutlined />}>选择新头像</Button>
              </Upload>
            </div>
          ) : null}
          {active === 'security' ? (
            <>
              <h2>账号安全</h2>
              <Form form={passwordForm} layout="vertical" onFinish={savePassword}>
                <Form.Item name="password" label="当前密码" rules={[{ required: true }]}>
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item name="newPassword" label="新密码" rules={[{ required: true, min: 6 }]}>
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Form.Item
                  name="confirmPassword"
                  label="确认新密码"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        return value === getFieldValue('newPassword')
                          ? Promise.resolve()
                          : Promise.reject(new Error('两次输入不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} />
                </Form.Item>
                <Button type="primary" htmlType="submit">修改密码</Button>
              </Form>
            </>
          ) : null}
        </section>
      </div>
    </main>
  )
}
