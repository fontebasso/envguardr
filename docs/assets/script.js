document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('pre > code').forEach((code) => {
    const pre = code.parentElement
    if (pre.closest('.terminal')) return

    hljs.highlightElement(code)

    const block = document.createElement('div')
    block.className = 'code-block'
    const btn = document.createElement('button')
    btn.className = 'copy-btn'
    btn.type = 'button'
    btn.setAttribute('aria-label', 'Copy')
    btn.textContent = 'Copy'
    pre.replaceWith(block)
    block.append(btn, pre)

    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(code.innerText).then(() => {
        btn.textContent = 'Copied!'
        btn.classList.add('copied')
        setTimeout(() => {
          btn.textContent = 'Copy'
          btn.classList.remove('copied')
        }, 2000)
      })
    })
  })
})
