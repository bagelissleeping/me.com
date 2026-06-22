const workSections = document.querySelectorAll('.timeline-item.expandable')
const projectCards = Array.from(document.querySelectorAll('.project-card'))
let activeProject = 0
let autoTimer = null

workSections.forEach(item => {
  const button = item.querySelector('.detail-btn')
  const content = item.querySelector('.timeline-expand')
  button.addEventListener('click', () => {
    const expanded = content.classList.toggle('is-open')
    button.textContent = expanded ? '收起' : '了解更多'
  })
})

function setActiveProject(index) {
  activeProject = index
  projectCards.forEach((card, i) => {
    card.classList.toggle('is-featured', i === index)
  })
}

function startAutoHighlight() {
  if (!projectCards.length) return
  stopAutoHighlight()
  autoTimer = setInterval(() => {
    const next = (activeProject + 1) % projectCards.length
    setActiveProject(next)
  }, 5600)
}

function stopAutoHighlight() {
  if (autoTimer) clearInterval(autoTimer)
}

projectCards.forEach((card, index) => {
  const button = card.querySelector('.detail-btn')
  const content = card.querySelector('.project-expand')

  card.addEventListener('mouseenter', () => {
    setActiveProject(index)
    stopAutoHighlight()
  })

  card.addEventListener('mouseleave', () => {
    if (!content.classList.contains('is-open')) startAutoHighlight()
  })

  button.addEventListener('click', () => {
    const expanded = content.classList.toggle('is-open')
    button.textContent = expanded ? '收起项目' : '展开项目'
    setActiveProject(index)
    if (expanded) {
      stopAutoHighlight()
    } else {
      startAutoHighlight()
    }
  })
})

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-active')
    }
  })
}, { threshold: 0.24 })

document.querySelectorAll('.stage').forEach(section => observer.observe(section))

setActiveProject(0)
startAutoHighlight()
