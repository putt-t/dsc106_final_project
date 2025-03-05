// Set up dimensions
const width = 800;
const height = 500;
const margin = { top: 50, right: 50, bottom: 70, left: 70 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

// Create SVG
const svg = d3
    .select("#demographics-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Create a group for the chart content
const chart = svg
    .append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

// Add title
const chartTitle = chart
    .append("text")
    .attr("class", "chart-title")
    .attr("x", innerWidth / 2)
    .attr("y", -20)
    .attr("text-anchor", "middle")
    .style("font-size", "18px")
    .style("font-weight", "bold")
    .text("Gender Distribution");

// Add axes groups
const xAxisGroup = chart
    .append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${innerHeight})`);

const yAxisGroup = chart.append("g").attr("class", "y-axis");

// Add axis labels
const xAxisLabel = chart
    .append("text")
    .attr("class", "x-axis-label")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 40)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Category");

const yAxisLabel = chart
    .append("text")
    .attr("class", "y-axis-label")
    .attr("transform", "rotate(-90)")
    .attr("x", -innerHeight / 2)
    .attr("y", -50)
    .attr("text-anchor", "middle")
    .style("font-size", "14px")
    .text("Count");

// Load and process data
d3.csv("../subject-info.csv").then((data) => {
    // Function to update chart based on selected view
    function updateChart(viewType) {
        // Clear existing elements
        chart.selectAll(".bar").remove();
        chart.selectAll(".bar-label").remove();

        let processedData;
        let colorScale;

        // Process data based on view type
        if (viewType === "gender") {
            chartTitle.text("Gender Distribution");
            xAxisLabel.text("Gender");

            processedData = d3.rollup(
                data,
                (v) => v.length,
                (d) => d["Sex (M/F)"]
            );

            processedData = Array.from(processedData, ([key, value]) => ({
                category: key === "M" ? "Male" : "Female",
                count: value,
            }));

            colorScale = d3.scaleOrdinal()
                .domain(["Male", "Female"])
                .range(["#4e79a7", "#f28e2c"]);
        } else if (viewType === "asthma") {
            chartTitle.text("Asthma Status");
            xAxisLabel.text("Has Asthma");

            processedData = d3.rollup(
                data,
                (v) => v.length,
                (d) => d["Asthma (Y/N)"]
            );

            processedData = Array.from(processedData, ([key, value]) => ({
                category: key === "Y" ? "Yes" : "No",
                count: value,
            }));

            colorScale = d3.scaleOrdinal()
                .domain(["Yes", "No"])
                .range(["#59a14f", "#e15759"]);
        } else if (viewType === "smoking") {
            chartTitle.text("Smoking History");
            xAxisLabel.text("Has Smoked");

            processedData = d3.rollup(
                data,
                (v) => v.length,
                (d) => d["History of Smoking (Y/N)"]
            );

            processedData = Array.from(processedData, ([key, value]) => ({
                category: key === "Y" ? "Yes" : "No",
                count: value,
            }));

            colorScale = d3.scaleOrdinal()
                .domain(["Yes", "No"])
                .range(["#59a14f", "#e15759"]);
        } else if (viewType === "vaping") {
            chartTitle.text("Vaping History");
            xAxisLabel.text("Has Vaped");

            processedData = d3.rollup(
                data,
                (v) => v.length,
                (d) => d["History of Vaping (Y/N)"]
            );

            processedData = Array.from(processedData, ([key, value]) => ({
                category: key === "Y" ? "Yes" : "No",
                count: value,
            }));

            colorScale = d3.scaleOrdinal()
                .domain(["Yes", "No"])
                .range(["#59a14f", "#e15759"]);
        } else if (viewType === "age") {
            chartTitle.text("Age Distribution");
            xAxisLabel.text("Age Group");

            // Create age groups
            const ageGroups = [
                { min: 18, max: 25, label: "18-25" },
                { min: 26, max: 35, label: "26-35" },
                { min: 36, max: 45, label: "36-45" },
                { min: 46, max: 55, label: "46-55" },
                { min: 56, max: 100, label: "56+" },
            ];

            // Count participants in each age group
            processedData = ageGroups.map((group) => {
                const count = data.filter((d) => {
                    const age = parseInt(d["Age [years]"]);
                    return age >= group.min && age <= group.max;
                }).length;

                return {
                    category: group.label,
                    count: count,
                };
            });

            colorScale = d3.scaleOrdinal()
                .domain(ageGroups.map(g => g.label))
                .range(d3.schemeBlues[5]);
        }

        // Set up scales
        const xScale = d3
            .scaleBand()
            .domain(processedData.map((d) => d.category))
            .range([0, innerWidth])
            .padding(0.2);

        const yScale = d3
            .scaleLinear()
            .domain([0, d3.max(processedData, (d) => d.count) * 1.1])
            .range([innerHeight, 0]);

        // Update axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        xAxisGroup.call(xAxis);
        yAxisGroup.call(yAxis);

        // Create bars with animation
        const bars = chart
            .selectAll(".bar")
            .data(processedData)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", (d) => xScale(d.category))
            .attr("y", innerHeight)
            .attr("width", xScale.bandwidth())
            .attr("height", 0)
            .attr("fill", (d) => colorScale(d.category))
            .attr("rx", 4)
            .attr("ry", 4);

        // Add animation
        bars
            .transition()
            .duration(800)
            .delay((d, i) => i * 100)
            .attr("y", (d) => yScale(d.count))
            .attr("height", (d) => innerHeight - yScale(d.count));

        // Add labels on top of bars
        chart
            .selectAll(".bar-label")
            .data(processedData)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", (d) => xScale(d.category) + xScale.bandwidth() / 2)
            .attr("y", (d) => yScale(d.count) - 10)
            .attr("text-anchor", "middle")
            .style("font-size", "12px")
            .style("opacity", 0)
            .text((d) => d.count)
            .transition()
            .duration(800)
            .delay((d, i) => i * 100 + 400)
            .style("opacity", 1);
    }

    // Initialize with gender view
    updateChart("gender");

    // Set up button event listeners
    d3.select("#view-gender").on("click", () => updateChart("gender"));
    d3.select("#view-asthma").on("click", () => updateChart("asthma"));
    d3.select("#view-smoking").on("click", () => updateChart("smoking"));
    d3.select("#view-vaping").on("click", () => updateChart("vaping"));
    d3.select("#view-age").on("click", () => updateChart("age"));
});
