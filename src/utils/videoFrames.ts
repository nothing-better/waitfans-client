export interface VideoFrame {
  file: File
  url: string
  time: number
}

function once(target: HTMLVideoElement, event: 'loadeddata' | 'seeked') {
  return new Promise<void>((resolve, reject) => {
    const handleSuccess = () => {
      cleanup()
      resolve()
    }
    const handleError = () => {
      cleanup()
      reject(new Error('无法读取视频画面'))
    }
    const cleanup = () => {
      target.removeEventListener(event, handleSuccess)
      target.removeEventListener('error', handleError)
    }
    target.addEventListener(event, handleSuccess, { once: true })
    target.addEventListener('error', handleError, { once: true })
  })
}

function canvasBlob(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('封面生成失败'))
      },
      'image/jpeg',
      0.9,
    )
  })
}

export async function extractVideoFrames(file: File, count = 4): Promise<VideoFrame[]> {
  const video = document.createElement('video')
  const sourceUrl = URL.createObjectURL(file)
  video.preload = 'auto'
  video.muted = true
  video.playsInline = true
  video.src = sourceUrl

  try {
    await once(video, 'loadeddata')
    const duration = Number.isFinite(video.duration) ? video.duration : 0
    const width = video.videoWidth || 1280
    const height = video.videoHeight || 720
    const targetWidth = Math.min(width, 1280)
    const targetHeight = Math.max(1, Math.round((height / width) * targetWidth))
    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')
    if (!context) throw new Error('当前浏览器无法生成视频封面')

    const positions = Array.from({ length: Math.max(1, count) }, (_, index) => {
      const ratio = count === 1 ? 0.1 : 0.08 + (index / Math.max(1, count - 1)) * 0.78
      return Math.max(0, Math.min(duration ? duration * ratio : 0, Math.max(0, duration - 0.05)))
    })
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'video'
    const frames: VideoFrame[] = []

    for (let index = 0; index < positions.length; index += 1) {
      const time = positions[index]
      if (Math.abs(video.currentTime - time) > 0.01) {
        video.currentTime = time
        await once(video, 'seeked')
      }
      context.drawImage(video, 0, 0, targetWidth, targetHeight)
      const blob = await canvasBlob(canvas)
      const frameFile = new File([blob], `${baseName}-cover-${index + 1}.jpg`, {
        type: 'image/jpeg',
        lastModified: Date.now(),
      })
      frames.push({ file: frameFile, url: URL.createObjectURL(blob), time })
    }

    return frames
  } finally {
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(sourceUrl)
  }
}
