module.exports = {
  '*.{js,jsx,mjs,cjs}': (files) => {
    const filtered = files.filter(
      (f) =>
        !f.includes(`${require('path').sep}apps${require('path').sep}web${require('path').sep}`),
    )
    if (!filtered.length) return []
    const list = filtered.map((f) => `"${f}"`).join(' ')
    return [`eslint --max-warnings 9999 --fix ${list}`, `prettier --write ${list}`]
  },
  '*.{ts,tsx,json,md,css,yml,yaml}': (files) => {
    const filtered = files.filter(
      (f) =>
        !f.includes(`${require('path').sep}apps${require('path').sep}web${require('path').sep}`),
    )
    if (!filtered.length) return []
    const list = filtered.map((f) => `"${f}"`).join(' ')
    return [`prettier --write ${list}`]
  },
}
