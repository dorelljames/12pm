// Add this to handle scroll-based animations
document.addEventListener("DOMContentLoaded", () => {
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate-fade-in");
        if (entry.target.classList.contains("stagger-animations")) {
          entry.target.querySelectorAll("*").forEach((child) => {
            child.style.opacity = "1";
          });
        }
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with animation classes
  document
    .querySelectorAll(
      ".animate-fade-in, .animate-slide-up, .stagger-animations"
    )
    .forEach((el) => {
      observer.observe(el);
    });
});
