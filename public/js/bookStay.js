let passengerIndex = 0;

document.addEventListener("DOMContentLoaded", () => {
    const addPassengerButton = document.querySelector(".addPassengerButton");
    const container = document.querySelector(".passengersContainer");
    const submitButton = document.querySelector(".submitButton");

    function updatePassengerIndices() {
        const passengerBlocks = document.querySelectorAll(".passenger-block");
        passengerBlocks.forEach((div, index) => {
            const fieldset = div.querySelector("fieldset");
            fieldset.querySelector("legend").innerText = `Passenger ${index + 1}`;
            fieldset.querySelector('input[name$="[name]"]').name = `passengers[${index}][name]`;
            fieldset.querySelector('input[name$="[age]"]').name = `passengers[${index}][age]`;
            fieldset.querySelector('select[name$="[gender]"]').name = `passengers[${index}][gender]`;
        });

        passengerIndex = passengerBlocks.length;
        submitButton.classList.toggle("showButton", passengerBlocks.length>0); 
    }

    addPassengerButton.addEventListener("click", () => {
        const passengerDiv = document.createElement("div");
        passengerDiv.className = "passenger-block"; // prevent nested .passenger confusion
        passengerDiv.innerHTML = `
            <fieldset class="passenger p-3 mb-3 rounded shadow-sm bg-light">
                <legend>Passenger ${passengerIndex + 1}</legend>
                <div class="mb-2">
                    <label>Name:</label>
                    <input class="form-control" name="passengers[${passengerIndex}][name]" required>
                </div>
                <div class="mb-2">
                    <label>Age:</label>
                    <input type="number" class="form-control" name="passengers[${passengerIndex}][age]" required>
                </div>
                <div class="mb-2">
                    <label>Gender:</label>
                    <select class="form-control" name="passengers[${passengerIndex}][gender]" required>
                        <option value="">Select</option>
                        <option>Male</option>
                        <option>Female</option>
                        <option>Other</option>
                    </select>
                </div>
                <button type="button" class="btn btn-danger mt-2 btn-delete">Delete</button>
            </fieldset>
        `;        

        passengerDiv.querySelector(".btn-delete").addEventListener("click", () => {
            passengerDiv.remove();
            updatePassengerIndices();
        });

        container.appendChild(passengerDiv);
        updatePassengerIndices();
    });

    updatePassengerIndices(); // handle cases where passenger already exists
   
});
