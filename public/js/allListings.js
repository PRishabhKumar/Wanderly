document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".listing-card");
  const taxSwitch = document.querySelector(".switch");

  // Hover animations (optional JS enhancement, CSS handles most)
  cards.forEach((card) => {
    // Keeping internal logic simple or removing if CSS handles it
  });

  // GST switch toggle logic
  if (taxSwitch) {
    taxSwitch.addEventListener("change", async function () {
      const url = this.checked
        ? "/listings/updatePrice"
        : "/listings/revertPrice";
      if (this.checked) {
        console.log("Switch is toggled to show tax inclusive prices");
      } else {
        console.log("Switch is toggled to show taxless prices");
      }
      try {
        const response = await fetch(url, {
          method: "PATCH",
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
