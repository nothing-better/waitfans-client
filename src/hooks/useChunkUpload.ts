import { useCallback, useRef, useState } from 'react'
import SparkMD5 from 'spark-md5'
import {
  askChunk,
  cancelUpload as cancelUploadRequest,
  uploadChunk,
} from '@/api/video'

const CHUNK_SIZE = 2 * 1024 * 1024

async function computeHash(file: File): Promise<string> {
  const spark = new SparkMD5.ArrayBuffer()
  const chunks = Math.ceil(file.size / CHUNK_SIZE)
  for (let index = 0; index < chunks; index += 1) {
    const buffer = await file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE).arrayBuffer()
    spark.append(buffer)
  }
  return spark.end()
}

export function useChunkUpload() {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState<
    'idle' | 'hashing' | 'uploading' | 'done' | 'error' | 'cancelled'
  >('idle')
  const [error, setError] = useState<string | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const hashRef = useRef('')

  const upload = useCallback(async (file: File) => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setProgress(0)
    setError(null)
    setStatus('hashing')
    try {
      const hash = await computeHash(file)
      hashRef.current = hash
      const chunks = Math.ceil(file.size / CHUNK_SIZE)
      const nextChunk = Number(await askChunk(hash))
      const startAt = Number.isFinite(nextChunk)
        ? Math.min(Math.max(nextChunk, 0), chunks)
        : 0
      setProgress(chunks === 0 ? 0 : Math.round((startAt / chunks) * 100))
      setStatus('uploading')
      for (let index = startAt; index < chunks; index += 1) {
        if (controller.signal.aborted) {
          throw new DOMException('上传已取消', 'AbortError')
        }
        const data = new FormData()
        data.append(
          'chunk',
          file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE),
          `${file.name}.part${index}`,
        )
        data.append('hash', hash)
        data.append('index', String(index))
        await uploadChunk(data, controller.signal)
        setProgress(Math.round(((index + 1) / chunks) * 100))
      }
      setStatus('done')
      return hash
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') {
        setStatus('cancelled')
        throw reason
      }
      setError(reason instanceof Error ? reason.message : '上传失败，请稍后重试')
      setStatus('error')
      throw reason
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
      }
    }
  }, [])

  const cancel = useCallback(async () => {
    controllerRef.current?.abort()
    const hash = hashRef.current
    if (hash) {
      await cancelUploadRequest(hash).catch(() => undefined)
    }
    hashRef.current = ''
    setProgress(0)
    setStatus('cancelled')
  }, [])

  const reset = useCallback(() => {
    controllerRef.current?.abort()
    controllerRef.current = null
    hashRef.current = ''
    setProgress(0)
    setError(null)
    setStatus('idle')
  }, [])

  return { upload, cancel, reset, progress, status, error }
}
