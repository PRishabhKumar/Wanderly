let passengerIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
  const addPassengerButton = document.querySelector(".addPassengerButton");
  const container = document.querySelector(".passengersContainer");
  const submitButton = document.querySelector(".submitButton");

  function updatePassengerIndices() {
    const passengerCards = document.querySelectorAll(".passenger-card");
    passengerCards.forEach((div, index) => {
      const countLabel = div.querySelector(".passenger-count");
      if (countLabel) countLabel.innerText = `PASSENGER ${index + 1}`;

      div.querySelector(
        'input[name$="[name]"]'
      ).name = `passengers[${index}][name]`;
      div.querySelector(
        'input[name$="[age]"]'
      ).name = `passengers[${index}][age]`;
      div.querySelector(
        'select[name$="[gender]"]'
      ).name = `passengers[${index}][gender]`;
    });

    passengerIndex = passengerCards.length;
    // Logic to show/hide submit button based on passengers could go here if needed
    // submitButton.style.opacity = passengerIndex > 0 ? "1" : "0.5";
  }

  addPassengerButton.addEventListener("click", () => {
    const passengerDiv = document.createElement("div");
    passengerDiv.className = "passenger-card";

    // New HTML structure matching bookStayStyle.css
    passengerDiv.innerHTML = `
            <div class="passenger-header-row">
                <span class="passenger-count">Passenger ${
                  passengerIndex + 1
                }</span>
                <button type="button" class="btn-delete" title="Remove Passenger">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>

            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input class="form-input" name="passengers[${passengerIndex}][name]" placeholder="e.g. John Doe" required>
            </div>

            <div class="form-group">
                <label class="form-label">Age</label>
                <input type="number" class="form-input" name="passengers[${passengerIndex}][age]" placeholder="e.g. 28" required>
            </div>

            <div class="form-group">
                <label class="form-label">Gender</label>
                <select class="form-input" name="passengers[${passengerIndex}][gender]" required>
                    <option value="" style="color: #000;">Select Gender</option>
                    <option value="Male" style="color: #000;">Male</option>
                    <option value="Female" style="color: #000;">Female</option>
                    <option value="Other" style="color: #000;">Other</option>
                </select>
            </div>
        `;

    passengerDiv.querySelector(".btn-delete").addEventListener("click", () => {
      passengerDiv.style.opacity = "0";
      passengerDiv.style.transform = "translateY(10px)";
      setTimeout(() => {
        passengerDiv.remove();
        updatePassengerIndices();
      }, 300);
    });

    container.appendChild(passengerDiv);

    // Animation for entry
    passengerDiv.animate(
      [
        { opacity: 0, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      {
        duration: 400,
        easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      }
    );

    updatePassengerIndices();
  });

  // Initialize with one passenger if container is empty
  if (container.children.length === 0) {
    addPassengerButton.click();
  }
});
