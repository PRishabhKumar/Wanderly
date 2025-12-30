const spotlight = document.querySelector(".overlayContainer");

document.addEventListener("mousemove", (e) => {
  
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  let lastX = x
  let lastY = y
  // adding lerp smoothing
  lastX = lastX + (x - lastX) * 0.15;
  lastY = lastY + (y - lastY) * 0.15;

  spotlight.style.setProperty("--mouse-x", `${lastX}%`);
  spotlight.style.setProperty("--mouse-y", `${lastY}%`);

  spotlight.classList.add("active");
});

document.addEventListener("mouseleave", () => {
  spotlight.classList.remove("active");
});
