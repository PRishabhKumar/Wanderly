let stars = document.querySelectorAll(".star")
let ratingInput = document.querySelector(".rating")
let rating = 0
stars.forEach((star, index)=>{    
    star.addEventListener("click", ()=>{
        console.log("Star was clicked !!!")
        stars.forEach((s, i)=>{
            s.innerHTML = i<=index?'<i class="fa-solid fa-star"></i>':'<i class="fa-regular fa-star"></i>' // this means that this loop will iterate from starting till 'index' i.e. till the star that we have clicked and till that all the stars before and including the clicked star will get highlighted and that will be stored in index and adding 1 to it will give us the rating as the index starts from 0
        })
        let rating = index+1
        ratingInput.value = rating
        console.log(`Rating given (Through variable) : ${rating}`)
        console.log(`Rating given (Through input value) : ${ratingInput.value}`)
    })
})




