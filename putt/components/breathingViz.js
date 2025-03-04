class BreathingViz {
    constructor(containerId) {
        this.container = d3.select(`#${containerId}`);
        this.width = this.container.node().getBoundingClientRect().width;
        this.height = 500;
        this.margin = { top: 40, right: 30, bottom: 60, left: 60 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;
        this.innerHeight = this.height - this.margin.top - this.margin.bottom;

        this.svg = this.container.append("svg")
            .attr("width", this.width)
            .attr("height", this.height);

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.tooltip = this.container.append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);
    }

    // Create a breathing pattern visualization for a single subject
    createBreathingPattern(subjectNumber, metric = "flow") {
        const data = dataLoader.getRespiratoryData(subjectNumber);
        const subjectInfo = dataLoader.getSubjectInfo().find(d => d.subjectNumber === subjectNumber);

        // Clear previous content
        this.g.selectAll("*").remove();

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.time)])
            .range([0, this.innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(data, d => d[metric]) * 1.1,
                d3.max(data, d => d[metric]) * 1.1
            ])
            .range([this.innerHeight, 0]);

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        this.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.innerHeight})`)
            .call(xAxis);

        this.g.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Add axis labels
        this.g.append("text")
            .attr("class", "x-axis-label")
            .attr("x", this.innerWidth / 2)
            .attr("y", this.innerHeight + 40)
            .attr("text-anchor", "middle")
            .text("Time (s)");

        this.g.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text(this.getMetricLabel(metric));

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d[metric]))
            .curve(d3.curveBasis);

        // Add the line path
        const path = this.g.append("path")
            .datum(data)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#3498db")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add title
        this.g.append("text")
            .attr("class", "chart-title")
            .attr("x", this.innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Subject ${subjectNumber} (${subjectInfo.sex}, ${subjectInfo.age} years)`);

        // Add interactive elements
        const focus = this.g.append("g")
            .attr("class", "focus")
            .style("display", "none");

        focus.append("circle")
            .attr("r", 5)
            .attr("fill", "#e74c3c");

        focus.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", this.innerHeight)
            .attr("stroke", "#7f8c8d")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        focus.append("line")
            .attr("class", "y-hover-line hover-line")
            .attr("x1", 0)
            .attr("x2", this.innerWidth)
            .attr("stroke", "#7f8c8d")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        const overlay = this.g.append("rect")
            .attr("class", "overlay")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight)
            .attr("fill", "none")
            .attr("pointer-events", "all");

        // Add mouseover interaction
        overlay.on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => {
                focus.style("display", "none");
                this.tooltip.style("opacity", 0);
            })
            .on("mousemove", (event) => {
                const mouseX = d3.pointer(event)[0];
                const x0 = xScale.invert(mouseX);

                // Find the closest data point
                const bisect = d3.bisector(d => d.time).left;
                const i = bisect(data, x0);
                const d0 = data[i - 1];
                const d1 = data[i];
                const d = x0 - d0?.time > d1?.time - x0 ? d1 : d0;

                if (!d) return;

                // Update focus position
                focus.attr("transform", `translate(${xScale(d.time)}, ${yScale(d[metric])})`);
                focus.select(".x-hover-line").attr("y2", this.innerHeight - yScale(d[metric]));
                focus.select(".y-hover-line").attr("x2", -xScale(d.time));

                // Update tooltip
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
                <strong>Time:</strong> ${d.time.toFixed(2)}s<br>
                <strong>${this.getMetricLabel(metric)}:</strong> ${d[metric].toFixed(3)}
              `);
            });

        // Add animation
        this.animateBreathingPattern(path);

        return this;
    }

    // Create a comparison of breathing patterns between groups
    createGroupComparison(groupBy, metric = "flow") {
        // Clear previous content
        this.g.selectAll("*").remove();

        // Get grouped data
        const groupedSubjects = dataLoader.getGroupedData(groupBy);
        const groups = Object.keys(groupedSubjects);

        // Create color scale for groups
        const colorScale = d3.scaleOrdinal()
            .domain(groups)
            .range(d3.schemeCategory10);

        // Get average data for each group
        const groupData = {};
        groups.forEach(group => {
            groupData[group] = dataLoader.getAverageRespiratoryData(
                groupedSubjects[group],
                metric,
                10 // Use first 10 seconds of data
            );
        });

        // Find global min and max for y-axis
        let yMin = Infinity;
        let yMax = -Infinity;

        groups.forEach(group => {
            const min = d3.min(groupData[group], d => d[metric]);
            const max = d3.max(groupData[group], d => d[metric]);
            if (min < yMin) yMin = min;
            if (max > yMax) yMax = max;
        });

        // Add some padding to the y domain
        yMin = yMin * 1.1;
        yMax = yMax * 1.1;

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, 10]) // 10 seconds of data
            .range([0, this.innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([yMin, yMax])
            .range([this.innerHeight, 0]);

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        this.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${this.innerHeight})`)
            .call(xAxis);

        this.g.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Add axis labels
        this.g.append("text")
            .attr("class", "x-axis-label")
            .attr("x", this.innerWidth / 2)
            .attr("y", this.innerHeight + 40)
            .attr("text-anchor", "middle")
            .text("Time (s)");

        this.g.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text(this.getMetricLabel(metric));

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d[metric]))
            .curve(d3.curveBasis);

        // Add lines for each group
        const paths = {};
        groups.forEach(group => {
            paths[group] = this.g.append("path")
                .datum(groupData[group])
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(group))
                .attr("stroke-width", 3)
                .attr("d", line);
        });

        // Add title
        this.g.append("text")
            .attr("class", "chart-title")
            .attr("x", this.innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Average ${this.getMetricLabel(metric)} by ${this.getGroupByLabel(groupBy)}`);

        // Add legend
        const legend = this.g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.innerWidth - 100}, 20)`);

        groups.forEach((group, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 20})`);

            legendRow.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("fill", colorScale(group));

            legendRow.append("text")
                .attr("x", 15)
                .attr("y", 10)
                .attr("text-anchor", "start")
                .text(group);
        });

        // Add interactive elements
        const focus = this.g.append("g")
            .attr("class", "focus")
            .style("display", "none");

        groups.forEach(group => {
            focus.append("circle")
                .attr("class", `focus-circle-${group.replace(/\s+/g, '-').toLowerCase()}`)
                .attr("r", 5)
                .attr("fill", colorScale(group));
        });

        focus.append("line")
            .attr("class", "x-hover-line hover-line")
            .attr("y1", 0)
            .attr("y2", this.innerHeight)
            .attr("stroke", "#7f8c8d")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3,3");

        const overlay = this.g.append("rect")
            .attr("class", "overlay")
            .attr("width", this.innerWidth)
            .attr("height", this.innerHeight)
            .attr("fill", "none")
            .attr("pointer-events", "all");

        // Add mouseover interaction
        overlay.on("mouseover", () => focus.style("display", null))
            .on("mouseout", () => {
                focus.style("display", "none");
                this.tooltip.style("opacity", 0);
            })
            .on("mousemove", (event) => {
                const mouseX = d3.pointer(event)[0];
                const x0 = xScale.invert(mouseX);

                // Find the closest data point for each group
                const bisect = d3.bisector(d => d.time).left;
                let tooltipContent = `<strong>Time:</strong> ${x0.toFixed(2)}s<br>`;

                // Update focus elements for each group
                groups.forEach(group => {
                    const data = groupData[group];
                    const i = bisect(data, x0);
                    const d0 = data[i - 1];
                    const d1 = data[i];
                    const d = x0 - d0?.time > d1?.time - x0 ? d1 : d0;

                    if (!d) return;

                    // Update focus circle
                    focus.select(`.focus-circle-${group.replace(/\s+/g, '-').toLowerCase()}`)
                        .attr("cx", xScale(d.time))
                        .attr("cy", yScale(d[metric]));

                    // Add to tooltip content
                    tooltipContent += `<strong>${group}:</strong> ${d[metric].toFixed(3)}<br>`;
                });

                // Update x-line position
                focus.select(".x-hover-line")
                    .attr("transform", `translate(${mouseX}, 0)`);

                // Update tooltip
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(tooltipContent);
            });

        // Animate each path
        Object.values(paths).forEach(path => {
            this.animateBreathingPattern(path);
        });

        return this;
    }

    // Animate a breathing pattern path
    animateBreathingPattern(path) {
        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(3000)
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .on("end", () => {
                path.attr("stroke-dasharray", "none");
            });
    }

    // Get a human-readable label for a metric
    getMetricLabel(metric) {
        switch (metric) {
            case "flow": return "Flow (L/s)";
            case "pressure": return "Pressure (cmH2O)";
            case "v_tidal": return "Tidal Volume (L)";
            case "chest": return "Chest Movement (mm)";
            case "abd": return "Abdominal Movement (mm)";
            case "globalAeration": return "Global Aeration";
            default: return metric;
        }
    }

    // Get a human-readable label for a groupBy value
    getGroupByLabel(groupBy) {
        switch (groupBy) {
            case "sex": return "Sex";
            case "asthma": return "Asthma Status";
            case "smoking": return "Smoking History";
            case "vaping": return "Vaping History";
            default: return groupBy;
        }
    }
}
