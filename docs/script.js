document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.code-block code').forEach((el) => {
    hljs.highlightElement(el)
  })

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const code = btn.nextElementSibling.querySelector('code').innerText
      navigator.clipboard.writeText(code).then(() => {
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