// Animation utilities for breathing visualizations
class BreathingAnimations {
    constructor() {
        this.animations = {};
    }

    // Create a breathing animation that simulates lung expansion and contraction
    createLungAnimation(svgElement, data, options = {}) {
        const {
            width = 300,
            height = 300,
            duration = 3000,
            color = "#3498db",
            maxRadius = 120
        } = options;

        const svg = d3.select(svgElement)
            .attr("width", width)
            .attr("height", height);

        // Clear any existing elements
        svg.selectAll("*").remove();

        // Create a group for the lung
        const lung = svg.append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        // Create the lung shape (simplified as a circle)
        const circle = lung.append("circle")
            .attr("r", 50)
            .attr("fill", color)
            .attr("opacity", 0.7)
            .attr("stroke", "#2980b9")
            .attr("stroke-width", 2);

        // Create animation based on flow data
        const animateBreathing = () => {
            // Normalize flow data to radius values
            const radiusData = data.map(d => {
                // Map flow to radius (inhale = expand, exhale = contract)
                const baseRadius = 50;
                const radiusChange = d.flow * 30; // Scale factor
                return {
                    time: d.time,
                    radius: baseRadius + radiusChange
                };
            });

            // Create a continuous loop
            const animate = () => {
                circle.transition()
                    .duration(duration)
                    .attrTween("r", () => {
                        return t => {
                            // Get the index in the data array based on time
                            const i = Math.floor(t * radiusData.length);
                            // Get the radius value from the data
                            const r = radiusData[Math.min(i, radiusData.length - 1)].radius;
                            // Ensure radius is within bounds
                            return Math.max(30, Math.min(maxRadius, r));
                        };
                    })
                    .on("end", animate);
            };

            // Start the animation
            animate();
        };

        // Store the animation function
        this.animations[svgElement.id] = animateBreathing;

        return animateBreathing;
    }

    // Create a flow curve animation
    createFlowCurveAnimation(svgElement, data, options = {}) {
        const {
            width = 600,
            height = 300,
            duration = 5000,
            color = "#e74c3c",
            metric = "flow"
        } = options;

        const svg = d3.select(svgElement)
            .attr("width", width)
            .attr("height", height);

        // Clear any existing elements
        svg.selectAll("*").remove();

        // Set margins
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const innerWidth = width - margin.left - margin.right;
        const innerHeight = height - margin.top - margin.bottom;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.time)])
            .range([0, innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d[metric]) * 1.2,
                d3.max(data, d => d[metric]) * 1.2
            ])
            .range([innerHeight, 0]);

        // Create a group for the visualization
        const g = svg.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // Add axes
        g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${innerHeight})`)
            .call(d3.axisBottom(xScale).ticks(5))
            .append("text")
            .attr("fill", "#000")
            .attr("x", innerWidth / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .text("Time (s)");

        g.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(yScale))
            .append("text")
            .attr("fill", "#000")
            .attr("transform", "rotate(-90)")
            .attr("y", -40)
            .attr("x", -innerHeight / 2)
            .attr("text-anchor", "middle")
            .text(metric === "flow" ? "Flow (L/s)" :
                metric === "pressure" ? "Pressure (cmH2O)" :
                    metric === "v_tidal" ? "Tidal Volume (L)" :
                        metric === "chest" ? "Chest Movement (mm)" :
                            metric === "abd" ? "Abdominal Movement (mm)" :
                                "Global Aeration");

        // Create a line generator
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d[metric]))
            .curve(d3.curveBasis);

        // Create a path for the line
        const path = g.append("path")
            .datum(data)
            .attr("fill", "none")
            .attr("stroke", color)
            .attr("stroke-width", 3)
            .attr("d", line);

        // Create a circle that will move along the path
        const circle = g.append("circle")
            .attr("r", 6)
            .attr("fill", "#2c3e50");

        // Create the animation
        const animateFlow = () => {
            // Get the total length of the path
            const pathLength = path.node().getTotalLength();

            // Reset the circle position
            circle
                .attr("cx", xScale(data[0].time))
                .attr("cy", yScale(data[0][metric]));

            // Animate the circle along the path
            const animate = () => {
                circle.transition()
                    .duration(duration)
                    .attrTween("cx", () => {
                        return t => {
                            // Get point at the current position along the path
                            const point = path.node().getPointAtLength(t * pathLength);
                            return point.x;
                        };
                    })
                    .attrTween("cy", () => {
                        return t => {
                            // Get point at the current position along the path
                            const point = path.node().getPointAtLength(t * pathLength);
                            return point.y;
                        };
                    })
                    .on("end", animate);
            };

            // Start the animation
            animate();
        };

        // Store the animation function
        this.animations[svgElement.id] = animateFlow;

        return animateFlow;
    }

    // Create a chest-abdomen movement animation
    createChestAbdomenAnimation(svgElement, data, options = {}) {
        const {
            width = 400,
            height = 400,
            duration = 5000
        } = options;

        const svg = d3.select(svgElement)
            .attr("width", width)
            .attr("height", height);

        // Clear any existing elements
        svg.selectAll("*").remove();

        // Create a group for the torso
        const torso = svg.append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        // Create the torso outline
        torso.append("ellipse")
            .attr("rx", 100)
            .attr("ry", 160)
            .attr("fill", "none")
            .attr("stroke", "#7f8c8d")
            .attr("stroke-width", 2);

        // Create the chest area
        const chest = torso.append("ellipse")
            .attr("cy", -60)
            .attr("rx", 80)
            .attr("ry", 50)
            .attr("fill", "#3498db")
            .attr("opacity", 0.6)
            .attr("stroke", "#2980b9")
            .attr("stroke-width", 1);

        // Create the abdomen area
        const abdomen = torso.append("ellipse")
            .attr("cy", 40)
            .attr("rx", 80)
            .attr("ry", 70)
            .attr("fill", "#e74c3c")
            .attr("opacity", 0.6)
            .attr("stroke", "#c0392b")
            .attr("stroke-width", 1);

        // Add labels
        torso.append("text")
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-weight", "bold")
            .text("Chest");

        torso.append("text")
            .attr("y", 40)
            .attr("text-anchor", "middle")
            .attr("fill", "#fff")
            .attr("font-weight", "bold")
            .text("Abdomen");

        // Normalize chest and abdomen data
        const chestData = data.map(d => ({
            time: d.time,
            value: d.chest
        }));

        const abdomenData = data.map(d => ({
            time: d.time,
            value: d.abd
        }));

        // Find min and max values for scaling
        const chestMin = d3.min(chestData, d => d.value);
        const chestMax = d3.max(chestData, d => d.value);
        const abdomenMin = d3.min(abdomenData, d => d.value);
        const abdomenMax = d3.max(abdomenData, d => d.value);

        // Create the animation
        const animateChestAbdomen = () => {
            const animate = () => {
                // Animate chest
                chest.transition()
                    .duration(duration)
                    .attrTween("ry", () => {
                        return t => {
                            // Get the index in the data array based on time
                            const i = Math.floor(t * chestData.length);
                            // Get the value from the data
                            const value = chestData[Math.min(i, chestData.length - 1)].value;
                            // Scale the value to a reasonable range for animation
                            return 50 + ((value - chestMin) / (chestMax - chestMin)) * 20;
                        };
                    });

                // Animate abdomen
                abdomen.transition()
                    .duration(duration)
                    .attrTween("ry", () => {
                        return t => {
                            // Get the index in the data array based on time
                            const i = Math.floor(t * abdomenData.length);
                            // Get the value from the data
                            const value = abdomenData[Math.min(i, abdomenData.length - 1)].value;
                            // Scale the value to a reasonable range for animation
                            return 70 + ((value - abdomenMin) / (abdomenMax - abdomenMin)) * 20;
                        };
                    })
                    .on("end", animate);
            };

            // Start the animation
            animate();
        };

        // Store the animation function
        this.animations[svgElement.id] = animateChestAbdomen;

        return animateChestAbdomen;
    }

    // Stop an animation by element ID
    stopAnimation(elementId) {
        if (this.animations[elementId]) {
            d3.select(`#${elementId}`).selectAll("*").interrupt();
        }
    }

    // Stop all animations
    stopAllAnimations() {
        Object.keys(this.animations).forEach(id => {
            d3.select(`#${id}`).selectAll("*").interrupt();
        });
    }
}

// Create a singleton instance
const breathingAnimations = new BreathingAnimations();
