export function handleTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  const parts = [minutes, remainingSeconds].map((value) => String(value).padStart(2, '0'))
  return hours > 0 ? `${String(hours).padStart(2, '0')}:${parts.join(':')}` : parts.join(':')
}

export function handleNum(num = 0): string {
  if (num >= 100_000_000) return `${(num / 100_000_000).toFixed(1)}亿`
  if (num >= 10_000) return `${(num / 10_000).toFixed(1)}万`
  return String(num)
}

export function handleDate(dateTime: number | string | Date): string {
  const date = new Date(dateTime)
  const now = new Date()
  const diff = Math.max(0, now.getTime() - date.getTime())
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / 60_000))}分钟前`
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3_600_000)}小时前`
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}-${date.getDate()}`
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function handleLevel(exp: number): number {
  const thresholds = [50, 200, 1500, 4500, 10800, 28800]
  return thresholds.findIndex((threshold) => exp < threshold) === -1
    ? 6
    : thresholds.findIndex((threshold) => exp < threshold)
}
