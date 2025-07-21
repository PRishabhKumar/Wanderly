let logoutButton = document.querySelector(".logoutButton")

if(logoutButton){
    let logoutIcon = document.querySelector(".logoutIcon")
    let logoutText = document.querySelector(".logoutText")
    logoutButton.addEventListener("mouseenter", ()=>{
        logoutIcon.classList.add("logoutIconHovered")
        logoutText.classList.add("logoutTextHovered")
    })
    logoutButton.addEventListener("mouseleave", ()=>{
        logoutIcon.classList.remove("logoutIconHovered")
        logoutText.classList.remove("logoutTextHovered")
    })
}