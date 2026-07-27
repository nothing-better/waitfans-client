import { useState } from 'react'
import { Form, Input, Modal, Tabs, message } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { useAppDispatch } from '@/store/hooks'
import { loginUser } from '@/store/slices/userSlice'
import { register } from '@/api/user'

interface LoginRegisterProps {
  open: boolean
  onClose: () => void
}

interface LoginValues {
  username: string
  password: string
}

interface RegisterValues extends LoginValues {
  confirmedPassword: string
}

export default function LoginRegister({ open, onClose }: LoginRegisterProps) {
  const dispatch = useAppDispatch()
  const [submitting, setSubmitting] = useState(false)

  const submitLogin = async (values: LoginValues) => {
    setSubmitting(true)
    try {
      await dispatch(loginUser(values)).unwrap()
      message.success('登录成功')
      onClose()
    } catch {
      // The shared request layer presents the server error.
    } finally {
      setSubmitting(false)
    }
  }

  const submitRegister = async (values: RegisterValues) => {
    setSubmitting(true)
    try {
      await register(values)
      message.success('注册成功，请登录')
    } catch {
      // The shared request layer presents the server error.
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      footer={null}
      onCancel={onClose}
      destroyOnHidden
      width={460}
      title="欢迎来到 waitfans"
    >
      <Tabs
        centered
        items={[
          {
            key: 'login',
            label: '登录',
            children: (
              <Form<LoginValues> layout="vertical" onFinish={submitLogin}>
                <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
                  <Input prefix={<UserOutlined />} autoComplete="username" placeholder="请输入账号" />
                </Form.Item>
                <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
                  <Input.Password prefix={<LockOutlined />} autoComplete="current-password" placeholder="请输入密码" />
                </Form.Item>
                <button className="auth-submit" type="submit" disabled={submitting}>
                  {submitting ? '登录中…' : '登录'}
                </button>
              </Form>
            ),
          },
          {
            key: 'register',
            label: '注册',
            children: (
              <Form<RegisterValues> layout="vertical" onFinish={submitRegister}>
                <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}>
                  <Input prefix={<UserOutlined />} autoComplete="username" />
                </Form.Item>
                <Form.Item name="password" label="密码" rules={[{ required: true, min: 6, message: '密码至少 6 位' }]}>
                  <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
                </Form.Item>
                <Form.Item
                  name="confirmedPassword"
                  label="确认密码"
                  dependencies={['password']}
                  rules={[
                    { required: true, message: '请确认密码' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        return !value || getFieldValue('password') === value
                          ? Promise.resolve()
                          : Promise.reject(new Error('两次输入的密码不一致'))
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} autoComplete="new-password" />
                </Form.Item>
                <button className="auth-submit" type="submit" disabled={submitting}>
                  {submitting ? '注册中…' : '注册'}
                </button>
              </Form>
            ),
          },
        ]}
      />
    </Modal>
  )
}
