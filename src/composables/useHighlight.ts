export function highlight(text: string | undefined | null, query: string | undefined | null) {
  if (!text) return ''
  if (!query) return escapeHtml(text)
  const q = String(query).trim()
  if (!q) return escapeHtml(text)

  const lower = text.toLowerCase()
  const qi = q.toLowerCase()
  const idx = lower.indexOf(qi)
  if (idx === -1) return escapeHtml(text)

  const before = escapeHtml(text.slice(0, idx))
  const match  = escapeHtml(text.slice(idx, idx + q.length))
  const after  = escapeHtml(text.slice(idx + q.length))
  return `${before}<mark class="search-mark">${match}</mark>${after}`
}

function escapeHtml(str: string) {
  return str.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  } as Record<string, string>)[c])
}

export function highlightWithRanges(text: string | undefined | null, ranges: Array<[number, number]> | undefined | null) {
  if (!text) return ''
  if (!ranges || !ranges.length) return escapeHtml(text)

  // Normalize ranges: sort and merge overlapping
  const sorted = [...ranges].sort((a, b) => a[0] - b[0])
  const merged: Array<[number, number]> = []
  for (const r of sorted) {
    if (!merged.length) { merged.push([r[0], r[1]]) }
    else {
      const last = merged[merged.length - 1]
      if (r[0] <= last[1] + 1) last[1] = Math.max(last[1], r[1])
      else merged.push([r[0], r[1]])
    }
  }

  let out = ''
  let idx = 0
  for (const [s, e] of merged) {
    if (s > idx) out += escapeHtml(text.slice(idx, s))
    out += `<mark class="search-mark">${escapeHtml(text.slice(s, e + 1))}</mark>`
    idx = e + 1
  }
  if (idx < text.length) out += escapeHtml(text.slice(idx))
  return out
}
