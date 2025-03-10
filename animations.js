document.addEventListener("DOMContentLoaded", () => {
    // Register ScrollTrigger plugin
    gsap.registerPlugin(ScrollTrigger);

    // Initial page load animation
    gsap.from("header", {
        opacity: 0,
        y: -50,
        duration: 1,
        ease: "power3.out"
    });

    // Animate each section as it comes into view
    const sections = document.querySelectorAll("section");

    sections.forEach((section) => {
        // Skip initial opacity setting for the breathing section
        if (!section.classList.contains("section-breathing")) {
            gsap.set(section, { opacity: 0, y: 50 });
        }

        // Create animation for each section
        gsap.to(section, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none none"
            }
        });

        // For sections other than breathing and ML model, animate children with stagger
        if (!section.classList.contains("section-breathing") && !section.classList.contains("section-ml-model")) {
            const childElements = section.querySelectorAll("h2, p, img, .demographics-controls, .viz-container, .stats-panel");

            gsap.from(childElements, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });
        }
        // Special handling for breathing section
        else if (section.classList.contains("section-breathing")) {
            // Only animate the heading and text, not the visualization components
            const textElements = section.querySelectorAll("h2, p:not(.viz-container *)");

            gsap.from(textElements, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });

            // Animate the controls separately, but don't hide them initially
            const controlElements = section.querySelectorAll(".breathing-controls");
            gsap.from(controlElements, {
                opacity: 0,
                y: 20,
                duration: 0.8,
                delay: 0.3,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });
        }
        // Special handling for ML model section
        else if (section.classList.contains("section-ml-model")) {
            // Animate the heading and intro text
            const introElements = section.querySelectorAll("h2, > p");

            gsap.from(introElements, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                stagger: 0.15,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 75%",
                    toggleActions: "play none none none"
                }
            });

            // Animate the first step of the journey
            const firstStep = section.querySelector("#step-1");
            gsap.from(firstStep, {
                opacity: 0,
                y: 30,
                duration: 0.8,
                delay: 0.5,
                ease: "power2.out",
                scrollTrigger: {
                    trigger: section,
                    start: "top 60%",
                    toggleActions: "play none none none"
                }
            });
        }
    });

    // Animate buttons with a bounce effect
    const buttons = document.querySelectorAll("button");
    buttons.forEach(button => {
        button.addEventListener("mouseenter", () => {
            gsap.to(button, {
                scale: 1.05,
                duration: 0.3,
                ease: "power1.out"
            });
        });

        button.addEventListener("mouseleave", () => {
            gsap.to(button, {
                scale: 1,
                duration: 0.3,
                ease: "power1.in"
            });
        });
    });
});
