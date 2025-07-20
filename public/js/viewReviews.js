let reviewCards = document.querySelectorAll(".reviewCard")

reviewCards.forEach((card, index)=>{
    let editReviewButton = card.querySelector(".editReviewButton")
    let viewReviewButton = card.querySelector(".viewReviewButton")
    let deleteReviewButton = card.querySelector(".deleteReviewButton")
    card.addEventListener("mouseenter", ()=>{
        if(editReviewButton) editReviewButton.classList.add("buttonsAppear")
        if(viewReviewButton) viewReviewButton.classList.add("buttonsAppear")
        if(deleteReviewButton) deleteReviewButton.classList.add("buttonsAppear")
    })
    card.addEventListener("mouseleave", ()=>{
        if(editReviewButton) editReviewButton.classList.remove("buttonsAppear")
        if(viewReviewButton) viewReviewButton.classList.remove("buttonsAppear")
        if(deleteReviewButton) deleteReviewButton.classList.remove("buttonsAppear")
    })
})


