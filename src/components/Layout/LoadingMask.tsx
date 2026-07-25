interface LoadingMaskProps {
  visible: boolean
}

export default function LoadingMask({ visible }: LoadingMaskProps) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[50000] bg-black/50 flex items-center justify-center">
      <div className="loading-box">
        <img src="/loading.gif" alt="加载中" className="max-h-[33vh] max-w-[33vw]" />
      </div>
    </div>
  )
}
