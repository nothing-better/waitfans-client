import { useCallback, useState } from 'react'
import SparkMD5 from 'spark-md5'
import { uploadChunk } from '@/api/video'

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
  const [status, setStatus] = useState<'idle' | 'hashing' | 'uploading' | 'done' | 'error'>('idle')

  const upload = useCallback(async (file: File) => {
    setProgress(0)
    setStatus('hashing')
    try {
      const hash = await computeHash(file)
      const chunks = Math.ceil(file.size / CHUNK_SIZE)
      setStatus('uploading')
      for (let index = 0; index < chunks; index += 1) {
        const data = new FormData()
        data.append('chunk', file.slice(index * CHUNK_SIZE, (index + 1) * CHUNK_SIZE))
        data.append('hash', hash)
        data.append('index', String(index))
        await uploadChunk(data)
        setProgress(Math.round(((index + 1) / chunks) * 100))
      }
      setStatus('done')
      return hash
    } catch (error) {
      setStatus('error')
      throw error
    }
  }, [])

  return { upload, progress, status }
}
