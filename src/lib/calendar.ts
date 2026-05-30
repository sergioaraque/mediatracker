import type { Media } from '@/types'

function escapeText(s: string) {
  return s.replace(/([,;\\n])/g, '\\$1')
}

export function generateIcsFromHistory(items: Media[], opts?: { year?: number }) {
  const now = new Date()
  const year = opts?.year
  const events: string[] = []

  for (const m of items) {
    if (!m.finished_at) continue
    const d = new Date(m.finished_at)
    if (year && d.getFullYear() !== year) continue
    const dt = d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const uid = `${m.$id}@mediatracker`
    const title = escapeText(m.title || '—')
    const desc = escapeText((m.description || '') + `\nTipo: ${m.type}`)
    events.push([
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART:${dt}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${desc}`,
      'END:VEVENT',
    ].join('\r\n'))
  }

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediaTracker//ES//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return body
}

export function downloadIcs(content: string, filename = 'mediatracker-calendar.ics') {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function generateIcsFromUpcoming(upcoming: Array<{ date: string; title: string; subtitle?: string; uid?: string }>) {
  const events: string[] = []
  for (const e of upcoming) {
    // use DATE value type for full-day events
    const dt = e.date.replace(/-/g, '')
    const uid = e.uid ?? `${dt}-${e.title.replace(/\s+/g, '_')}`
    events.push([
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${dt}`,
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(e.subtitle ?? '')}`,
      'END:VEVENT'
    ].join('\r\n'))
  }

  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MediaTracker//ES//EN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return body
}
