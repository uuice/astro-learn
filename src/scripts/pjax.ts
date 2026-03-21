/**
 * PJAX: intercept same-origin link clicks, fetch HTML, replace .page-main only, update URL.
 * Improves perceived performance by avoiding full page reload.
 */

const MAIN_SELECTOR = '.page-main'
const TRANSITION_CLASS = 'pjax-transitioning'

function isPjaxLink(link: HTMLAnchorElement): boolean {
  const href = link.getAttribute('href')
  if (!href || href.startsWith('#') || href.startsWith('javascript:')) return false
  if (link.target === '_blank' || link.hasAttribute('download')) return false
  if (link.getAttribute('rel') === 'external') return false
  if (link.hasAttribute('data-no-pjax')) return false
  try {
    const url = new URL(href, window.location.origin)
    if (url.origin !== window.location.origin) return false
    if (url.pathname.startsWith('/admin')) return false
    return true
  } catch {
    return false
  }
}

async function loadPage(url: string): Promise<{ html: string; title: string }> {
  const res = await fetch(url, {
    headers: { Accept: 'text/html', 'X-Requested-With': 'XMLHttpRequest' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const html = await res.text()
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')
  const main = doc.querySelector(MAIN_SELECTOR)
  const title = doc.querySelector('title')?.textContent ?? document.title
  return {
    html: main?.innerHTML ?? '',
    title,
  }
}

function replaceContent(html: string, title: string) {
  const main = document.querySelector(MAIN_SELECTOR)
  if (!main) return
  document.title = title
  main.classList.add(TRANSITION_CLASS)
  main.innerHTML = html
  requestAnimationFrame(() => {
    requestAnimationFrame(() => main.classList.remove(TRANSITION_CLASS))
  })
  window.dispatchEvent(new CustomEvent('pjax:complete', { detail: { url: window.location.href } }))
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function handleNavigate(url: string, pushState = true) {
  try {
    const { html, title } = await loadPage(url)
    replaceContent(html, title)
    if (pushState) {
      history.pushState({ pjax: true }, '', url)
    }
    scrollToTop()
  } catch {
    window.location.href = url
  }
}

function init() {
  document.addEventListener('click', (e) => {
    const link = (e.target as Element).closest('a')
    if (!link) return
    const href = link.getAttribute('href')
    if (href?.startsWith('#')) {
      e.preventDefault()
      const id = href.slice(1)
      const element = document.getElementById(id)
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
      return
    }
    if (!isPjaxLink(link)) return
    e.preventDefault()
    const url = link.href
    if (url === window.location.href) return
    void handleNavigate(url, true)
  })

  window.addEventListener('popstate', () => {
    void handleNavigate(window.location.href, false)
  })

  window.addEventListener('pageshow', (e) => {
    if (e.persisted && history.state?.pjax) {
      void handleNavigate(window.location.href, false)
    }
  })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init)
} else {
  init()
}
