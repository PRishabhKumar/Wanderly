let icons = document.querySelectorAll(".fa-brands")

let urls = ["https://www.facebook.com/airbnb/", "https://x.com/Airbnb", "https://www.instagram.com/airbnb/"]

icons.forEach((icon, index)=>{
    icon.addEventListener("click", ()=>{
        window.location.href = urls[index]
    })
})