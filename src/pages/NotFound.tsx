import { Button, Result } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  return (
    <main className="surface-page">
      <Result
        status="404"
        title="404"
        subTitle="页面不存在"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
      />
    </main>
  )
}
