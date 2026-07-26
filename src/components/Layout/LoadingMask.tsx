import loadingGif from '@/assets/img/loading.gif'

interface LoadingMaskProps {
  visible: boolean
}

export default function LoadingMask({ visible }: LoadingMaskProps) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[50000] flex items-center justify-center bg-black/50">
      <img src={loadingGif} alt="加载中" className="max-h-[28vh] max-w-[28vw]" />
    </div>
  )
}
