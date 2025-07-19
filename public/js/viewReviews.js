let reviewCards = document.querySelectorAll(".reviewCard")

reviewCards.forEach((card, index)=>{
    let editReviewButton = card.querySelector(".editReviewButton")
    let viewReviewButton = card.querySelector(".viewReviewButton")
    let deleteReviewButton = card.querySelector(".deleteReviewButton")
    card.addEventListener("mouseenter", ()=>{
        editReviewButton.classList.add("buttonsAppear")
        viewReviewButton.classList.add("buttonsAppear")
        deleteReviewButton.classList.add("buttonsAppear")
    })
    card.addEventListener("mouseleave", ()=>{
        editReviewButton.classList.remove("buttonsAppear")
        viewReviewButton.classList.remove("buttonsAppear")
        deleteReviewButton.classList.remove("buttonsAppear")
    })
})