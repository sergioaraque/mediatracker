/**
 * XSS Protection utilities
 * Simple HTML sanitization without dependencies
 * (DOMPurify can be added if needed for production)
 */

const DANGEROUS_TAGS = [
  'script', 'iframe', 'object', 'embed', 'form', 'input',
  'button', 'style', 'link', 'meta', 'svg', 'canvas'
]

const DANGEROUS_ATTRS = [
  'onclick', 'onload', 'onerror', 'onmouseover', 'onmouseout',
  'onkeydown', 'onkeyup', 'onchange', 'onfocus', 'onblur',
  'href', 'src', 'data'
]

/**
 * Simple HTML sanitization
 * Removes dangerous tags and attributes
 * Safe for user-generated text content
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return ''
  
  // Create a temporary element to parse HTML
  const div = document.createElement('div')
  div.innerHTML = html
  
  // Remove dangerous tags
  const walker = document.createTreeWalker(
    div,
    NodeFilter.SHOW_ELEMENT,
    null
  )
  
  const nodesToRemove: Node[] = []
  
  while (walker.nextNode()) {
    const element = walker.currentNode as Element
    
    // Remove if it's a dangerous tag
    if (DANGEROUS_TAGS.includes(element.tagName.toLowerCase())) {
      nodesToRemove.push(element)
      continue
    }
    
    // Remove dangerous attributes
    Array.from(element.attributes).forEach(attr => {
      if (DANGEROUS_ATTRS.includes(attr.name.toLowerCase()) ||
          attr.name.toLowerCase().startsWith('on')) {
        element.removeAttribute(attr.name)
      }
    })
  }
  
  nodesToRemove.forEach(node => node.parentNode?.removeChild(node))
  
  return div.innerHTML
}

/**
 * Escape HTML special characters
 * Safe for any user input
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, char => map[char])
}

/**
 * Validate URL to prevent javascript: and data: URLs
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}
