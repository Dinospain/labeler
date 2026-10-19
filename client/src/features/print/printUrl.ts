export type PrintSize = '58x40' | '100x70'

export function printUrl(labelId: number, size: PrintSize, accountSlug: string | null): string {
  const qs = new URLSearchParams({ ids: String(labelId), size })
  if (accountSlug) qs.set('account', accountSlug)
  return `/api/print?${qs.toString()}`
}
