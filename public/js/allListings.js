let cards = document.querySelectorAll(".container");

cards.forEach((card) => {
    card.addEventListener("mouseenter", (event) => {
        event.preventDefault();        
        let button = card.querySelector(".knowMoreButton");
        button.classList.add("knowMoreButtonEnter");
        
    });

    card.addEventListener("mouseleave", (event) => {
        event.preventDefault();
        let button = card.querySelector(".knowMoreButton");
        button.classList.remove("knowMoreButtonEnter")
    });
});


