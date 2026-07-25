export function handleTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function handleNum(num: number): string {
  if (num >= 10000) {
    return `${(num / 10000).toFixed(1)}万`
  }
  return String(num)
}

export function handleDate(dateTime: number | string | Date): string {
  const date = new Date(dateTime)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  if (diff < 60 * 60 * 1000) {
    return `${Math.floor(diff / 60000)}分钟前`
  }
  if (diff < 24 * 60 * 60 * 1000) {
    return `${Math.floor(diff / 3600000)}小时前`
  }
  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}-${date.getDate()}`
  }
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

export function handleLevel(exp: number): number {
  if (exp < 50) return 0
  if (exp < 200) return 1
  if (exp < 1500) return 2
  if (exp < 4500) return 3
  if (exp < 10800) return 4
  if (exp < 28800) return 5
  return 6
}
