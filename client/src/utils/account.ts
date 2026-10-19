const KEY = 'accountSlug'

export function getAccountSlug(): string | null {
    try { return localStorage.getItem(KEY) } catch { return null }
}
export function setAccountSlug(slug: string) {
    try { localStorage.setItem(KEY, slug) } catch { /* localStorage недоступен */ }
}
export function clearAccountSlug() {
    try { localStorage.removeItem(KEY) } catch { /* localStorage недоступен */ }
}
