export function highlightKeyword(keyword: string, inputString: string): string {
  if (!keyword) return inputString
  let result = inputString
  for (const char of keyword) {
    result = result.replace(
      new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      (match) => `<em class="suggest_high_light">${match}</em>`,
    )
  }
  return result
}

export function getNicknameLength(nickname: string): number {
  let len = 0
  for (const char of nickname) {
    len += /[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/.test(char) ? 2 : 1
  }
  return len
}
