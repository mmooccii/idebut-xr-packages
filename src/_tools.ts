export function browserOrNode() {
  const isBrowser =
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
  const isNode =
    typeof process !== 'undefined' &&
    process.versions != null &&
    process.versions.node != null

  return {
    isBrowser,
    isNode,
  }
}
