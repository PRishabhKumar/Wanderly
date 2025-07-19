

document.addEventListener("DOMContentLoaded", () => {
    console.log("showStay.js loaded");
    let navbar = document.querySelector(".navbar");
    if(navbar){
        console.log("Navbar found !!!")
    }
    else{
        console.log("Navbar not found !!!")
    }
    document.addEventListener("scroll", () => {
        console.log("Document scrolled");
    });
});
