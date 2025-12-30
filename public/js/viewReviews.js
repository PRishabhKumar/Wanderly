const spotlight = document.querySelector(".overlayContainer")
document.addEventListener('mousemove', (e)=>{
    const x = (e.clientX/window.innerWidth)*100;
    const y = (e.clientY/window.innerHeight)*100;
    spotlight.style.setProperty("--mouse-x", `${x}%`)
    spotlight.style.setProperty("--mouse-y", `${y}%`)
    
    spotlight.classList.add('active')
})

document.addEventListener('mouseleave', ()=>{
    spotlight.classList.remove('active')
})