document.addEventListener("DOMContentLoaded", () => {
    const cards = document.querySelectorAll(".container");
    const taxSwitch = document.querySelector(".switch"); // or ".switch" if that's your selector

    // Hover animations
    cards.forEach((card) => {
        card.addEventListener("mouseenter", (event) => {
            const button = card.querySelector(".knowMoreButton");
            button.classList.add("knowMoreButtonEnter");
        });

        card.addEventListener("mouseleave", (event) => {
            const button = card.querySelector(".knowMoreButton");
            button.classList.remove("knowMoreButtonEnter");
        });
    });

    // GST switch toggle logic
    if (taxSwitch) {
        taxSwitch.addEventListener("change", async function () {
            const url = this.checked ? "/listings/updatePrice" : "/listings/revertPrice";
            if(this.checked){
                console.log("Switch is toggled to show tax inclusive prices")
            }
            else{
                console.log("Switch is toggled to show taxless prices")
            }
            try {
                const response = await fetch(url, {
                    method: "PATCH"
                });

                if (response.redirected) {
                    window.location.href = response.url;
                } else {
                    alert("Changes done but not redirected. Press OK to reload.");
                    window.location.href = "/listings";
                }
            } catch (error) {
                console.error("Error sending PATCH request:", error);
                alert("Some error occurred. Reloading...");
                window.location.href = "/listings";
            }
        });
    }
});
