class ComparisonViz {
    constructor(containerId) {
        this.container = d3.select(`#${containerId}`);
        this.width = this.container.node().getBoundingClientRect().width;
        this.height = 600;
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

    // Create a multi-metric comparison visualization
    createMultiMetricComparison(subjectNumber1, subjectNumber2) {
        // Clear previous content
        this.g.selectAll("*").remove();

        const data1 = dataLoader.getRespiratoryData(subjectNumber1);
        const data2 = dataLoader.getRespiratoryData(subjectNumber2);
        const subject1 = dataLoader.getSubjectInfo().find(d => d.subjectNumber === subjectNumber1);
        const subject2 = dataLoader.getSubjectInfo().find(d => d.subjectNumber === subjectNumber2);

        // Define metrics to compare
        const metrics = [
            { id: "flow", label: "Flow (L/s)" },
            { id: "pressure", label: "Pressure (cmH2O)" },
            { id: "v_tidal", label: "Tidal Volume (L)" },
            { id: "chest", label: "Chest Movement (mm)" },
            { id: "abd", label: "Abdominal Movement (mm)" }
        ];

        // Create a grid layout
        const gridWidth = this.innerWidth;
        const gridHeight = this.innerHeight / metrics.length;

        // Create color scale
        const colorScale = d3.scaleOrdinal()
            .domain([subjectNumber1, subjectNumber2])
            .range(["#3498db", "#e74c3c"]);

        // Add title
        this.g.append("text")
            .attr("class", "chart-title")
            .attr("x", this.innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Comparison: Subject ${subjectNumber1} vs Subject ${subjectNumber2}`);

        // Add subtitle with subject info
        this.g.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", this.innerWidth / 2)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(`${subject1.sex} ${subject1.age}y ${subject1.trialClassification} vs ${subject2.sex} ${subject2.age}y ${subject2.trialClassification}`);

        // Create grid cells for each metric
        metrics.forEach((metric, i) => {
            const cellG = this.g.append("g")
                .attr("class", `metric-cell-${metric.id}`)
                .attr("transform", `translate(0, ${i * gridHeight + 20})`);

            // Add metric label
            cellG.append("text")
                .attr("class", "metric-label")
                .attr("x", 0)
                .attr("y", 0)
                .attr("font-size", "14px")
                .attr("font-weight", "bold")
                .text(metric.label);

            // Create scales
            const xScale = d3.scaleLinear()
                .domain([0, Math.max(
                    d3.max(data1, d => d.time),
                    d3.max(data2, d => d.time)
                )])
                .range([0, gridWidth]);

            const yScale = d3.scaleLinear()
                .domain([
                    Math.min(
                        d3.min(data1, d => d[metric.id]),
                        d3.min(data2, d => d[metric.id])
                    ) * 1.1,
                    Math.max(
                        d3.max(data1, d => d[metric.id]),
                        d3.max(data2, d => d[metric.id])
                    ) * 1.1
                ])
                .range([gridHeight - 40, 20]);

            // Create axes
            const xAxis = d3.axisBottom(xScale).ticks(5);
            const yAxis = d3.axisLeft(yScale).ticks(3);

            cellG.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${gridHeight - 40})`)
                .call(xAxis);

            cellG.append("g")
                .attr("class", "y-axis")
                .call(yAxis);

            // Create line generator
            const line = d3.line()
                .x(d => xScale(d.time))
                .y(d => yScale(d[metric.id]))
                .curve(d3.curveBasis);

            // Add lines for each subject
            const path1 = cellG.append("path")
                .datum(data1)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(subjectNumber1))
                .attr("stroke-width", 2)
                .attr("d", line);

            const path2 = cellG.append("path")
                .datum(data2)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", colorScale(subjectNumber2))
                .attr("stroke-width", 2)
                .attr("d", line);

            // Animate paths
            this.animatePath(path1);
            this.animatePath(path2);

            // Add interactive elements
            const focus = cellG.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("circle")
                .attr("class", "focus-circle-1")
                .attr("r", 4)
                .attr("fill", colorScale(subjectNumber1));

            focus.append("circle")
                .attr("class", "focus-circle-2")
                .attr("r", 4)
                .attr("fill", colorScale(subjectNumber2));

            focus.append("line")
                .attr("class", "x-hover-line hover-line")
                .attr("y1", 20)
                .attr("y2", gridHeight - 40)
                .attr("stroke", "#7f8c8d")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "3,3");

            const overlay = cellG.append("rect")
                .attr("class", "overlay")
                .attr("width", gridWidth)
                .attr("height", gridHeight - 40 - 20)
                .attr("y", 20)
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

                    // Find the closest data points
                    const bisect = d3.bisector(d => d.time).left;
                    const i1 = bisect(data1, x0);
                    const i2 = bisect(data2, x0);

                    const d0_1 = data1[i1 - 1];
                    const d1_1 = data1[i1];
                    const d1 = x0 - d0_1?.time > d1_1?.time - x0 ? d1_1 : d0_1;

                    const d0_2 = data2[i2 - 1];
                    const d1_2 = data2[i2];
                    const d2 = x0 - d0_2?.time > d1_2?.time - x0 ? d1_2 : d0_2;

                    if (!d1 || !d2) return;

                    // Update focus elements
                    focus.select(".focus-circle-1")
                        .attr("cx", xScale(d1.time))
                        .attr("cy", yScale(d1[metric.id]));

                    focus.select(".focus-circle-2")
                        .attr("cx", xScale(d2.time))
                        .attr("cy", yScale(d2[metric.id]));

                    focus.select(".x-hover-line")
                        .attr("transform", `translate(${mouseX}, 0)`);

                    // Update tooltip
                    this.tooltip
                        .style("opacity", 0.9)
                        .style("left", `${event.pageX + 10}px`)
                        .style("top", `${event.pageY - 28}px`)
                        .html(`
                <strong>Time:</strong> ${x0.toFixed(2)}s<br>
                <strong>Subject ${subjectNumber1}:</strong> ${d1[metric.id].toFixed(3)}<br>
                <strong>Subject ${subjectNumber2}:</strong> ${d2[metric.id].toFixed(3)}<br>
                <strong>Difference:</strong> ${(d1[metric.id] - d2[metric.id]).toFixed(3)}
              `);
                });
        });

        // Add legend
        const legend = this.g.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${this.innerWidth - 150}, 0)`);

        const legendItems = legend.selectAll(".legend-item")
            .data([subjectNumber1, subjectNumber2])
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("line")
            .attr("x1", 0)
            .attr("x2", 20)
            .attr("y1", 10)
            .attr("y2", 10)
            .attr("stroke", d => colorScale(d))
            .attr("stroke-width", 2);

        legendItems.append("text")
            .attr("x", 25)
            .attr("y", 15)
            .attr("text-anchor", "start")
            .text(d => `Subject ${d}`);

        return this;
    }

    // Create a phase plot visualization (e.g., pressure vs. flow)
    createPhasePlot(subjectNumber, xMetric = "pressure", yMetric = "flow") {
        // Clear previous content
        this.g.selectAll("*").remove();

        const data = dataLoader.getRespiratoryData(subjectNumber);
        const subject = dataLoader.getSubjectInfo().find(d => d.subjectNumber === subjectNumber);

        // Get metric labels
        const xMetricLabel = this.getMetricLabel(xMetric);
        const yMetricLabel = this.getMetricLabel(yMetric);

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([d3.min(data, d => d[xMetric]) * 1.1, d3.max(data, d => d[xMetric]) * 1.1])
            .range([0, this.innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([d3.min(data, d => d[yMetric]) * 1.1, d3.max(data, d => d[yMetric]) * 1.1])
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
            .text(xMetricLabel);

        this.g.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -this.innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text(yMetricLabel);

        // Add title
        this.g.append("text")
            .attr("class", "chart-title")
            .attr("x", this.innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Phase Plot: ${yMetricLabel} vs ${xMetricLabel}`);

        // Add subtitle with subject info
        this.g.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", this.innerWidth / 2)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(`Subject ${subjectNumber} (${subject.sex}, ${subject.age} years, ${subject.trialClassification})`);

        // Create line generator for the phase plot
        const line = d3.line()
            .x(d => xScale(d[xMetric]))
            .y(d => yScale(d[yMetric]))
            .curve(d3.curveBasis);

        // Add the phase plot path
        const path = this.g.append("path")
            .datum(data)
            .attr("class", "phase-plot")
            .attr("fill", "none")
            .attr("stroke", "#3498db")
            .attr("stroke-width", 2)
            .attr("d", line);

        // Add points to show direction
        const pointsData = [];
        for (let i = 0; i < data.length; i += Math.floor(data.length / 20)) {
            pointsData.push(data[i]);
        }

        const points = this.g.selectAll(".point")
            .data(pointsData)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d[xMetric]))
            .attr("cy", d => yScale(d[yMetric]))
            .attr("r", 4)
            .attr("fill", "#e74c3c")
            .attr("opacity", 0);

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
                const [mouseX, mouseY] = d3.pointer(event);
                const x0 = xScale.invert(mouseX);
                const y0 = yScale.invert(mouseY);

                // Find the closest data point
                let closestPoint = data[0];
                let closestDistance = Infinity;

                data.forEach(d => {
                    const dx = x0 - d[xMetric];
                    const dy = y0 - d[yMetric];
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestPoint = d;
                    }
                });

                // Update focus position
                focus.attr("transform", `translate(${xScale(closestPoint[xMetric])}, ${yScale(closestPoint[yMetric])})`);
                focus.select(".x-hover-line").attr("y2", this.innerHeight - yScale(closestPoint[yMetric]));
                focus.select(".y-hover-line").attr("x2", -xScale(closestPoint[xMetric]));

                // Update tooltip
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
          <strong>Time:</strong> ${closestPoint.time.toFixed(2)}s<br>
          <strong>${xMetricLabel}:</strong> ${closestPoint[xMetric].toFixed(3)}<br>
          <strong>${yMetricLabel}:</strong> ${closestPoint[yMetric].toFixed(3)}
        `);
            });

        // Animate the phase plot
        this.animatePath(path);

        // Animate points to show direction
        points.transition()
            .duration(1000)
            .delay((d, i) => 1000 + i * 100)
            .attr("opacity", 1);

        return this;
    }

    // Create a respiratory metrics dashboard
    createRespiratoryDashboard(subjectNumber) {
        // Clear previous content
        this.g.selectAll("*").remove();

        const data = dataLoader.getRespiratoryData(subjectNumber);
        const subject = dataLoader.getSubjectInfo().find(d => d.subjectNumber === subjectNumber);

        // Define metrics to display
        const metrics = [
            { id: "flow", label: "Flow (L/s)" },
            { id: "pressure", label: "Pressure (cmH2O)" },
            { id: "v_tidal", label: "Tidal Volume (L)" },
            { id: "chest", label: "Chest Movement (mm)" },
            { id: "abd", label: "Abdominal Movement (mm)" },
            { id: "globalAeration", label: "Global Aeration" }
        ];

        // Create a grid layout
        const gridCols = 3;
        const gridRows = Math.ceil(metrics.length / gridCols);
        const cellWidth = this.innerWidth / gridCols;
        const cellHeight = this.innerHeight / gridRows;

        // Add title
        this.g.append("text")
            .attr("class", "chart-title")
            .attr("x", this.innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Respiratory Metrics Dashboard: Subject ${subjectNumber}`);

        // Add subtitle with subject info
        this.g.append("text")
            .attr("class", "chart-subtitle")
            .attr("x", this.innerWidth / 2)
            .attr("y", 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(`${subject.sex}, ${subject.age} years, ${subject.trialClassification}`);

        // Create grid cells for each metric
        metrics.forEach((metric, i) => {
            const row = Math.floor(i / gridCols);
            const col = i % gridCols;

            const cellG = this.g.append("g")
                .attr("class", `metric-cell-${metric.id}`)
                .attr("transform", `translate(${col * cellWidth}, ${row * cellHeight + 20})`);

            // Add cell border
            cellG.append("rect")
                .attr("width", cellWidth - 10)
                .attr("height", cellHeight - 10)
                .attr("fill", "none")
                .attr("stroke", "#ecf0f1")
                .attr("stroke-width", 1);

            // Add metric label
            cellG.append("text")
                .attr("class", "metric-label")
                .attr("x", cellWidth / 2)
                .attr("y", 15)
                .attr("text-anchor", "middle")
                .attr("font-size", "12px")
                .attr("font-weight", "bold")
                .text(metric.label);

            // Create scales
            const xScale = d3.scaleLinear()
                .domain([0, d3.max(data, d => d.time)])
                .range([30, cellWidth - 30]);

            const yScale = d3.scaleLinear()
                .domain([
                    d3.min(data, d => d[metric.id]) * 1.1,
                    d3.max(data, d => d[metric.id]) * 1.1
                ])
                .range([cellHeight - 30, 30]);

            // Create axes
            const xAxis = d3.axisBottom(xScale).ticks(3);
            const yAxis = d3.axisLeft(yScale).ticks(3);

            cellG.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0, ${cellHeight - 30})`)
                .call(xAxis);

            cellG.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(30, 0)`)
                .call(yAxis);

            // Create line generator
            const line = d3.line()
                .x(d => xScale(d.time))
                .y(d => yScale(d[metric.id]))
                .curve(d3.curveBasis);

            // Add the line path
            const path = cellG.append("path")
                .datum(data)
                .attr("class", "line")
                .attr("fill", "none")
                .attr("stroke", "#3498db")
                .attr("stroke-width", 2)
                .attr("d", line);

            // Animate the path
            this.animatePath(path);

            // Calculate summary statistics
            const metricValues = data.map(d => d[metric.id]);
            const min = d3.min(metricValues);
            const max = d3.max(metricValues);
            const mean = d3.mean(metricValues);
            const median = d3.median(metricValues);

            // Add summary statistics
            const statsG = cellG.append("g")
                .attr("class", "stats")
                .attr("transform", `translate(${cellWidth - 100}, 40)`);

            statsG.append("text")
                .attr("y", 0)
                .attr("font-size", "10px")
                .text(`Min: ${min.toFixed(2)}`);

            statsG.append("text")
                .attr("y", 15)
                .attr("font-size", "10px")
                .text(`Max: ${max.toFixed(2)}`);

            statsG.append("text")
                .attr("y", 30)
                .attr("font-size", "10px")
                .text(`Mean: ${mean.toFixed(2)}`);

            statsG.append("text")
                .attr("y", 45)
                .attr("font-size", "10px")
                .text(`Median: ${median.toFixed(2)}`);
        });

        return this;
    }

    // Animate a path using stroke-dasharray technique
    animatePath(path) {
        const totalLength = path.node().getTotalLength();

        path
            .attr("stroke-dasharray", totalLength + " " + totalLength)
            .attr("stroke-dashoffset", totalLength)
            .transition()
            .duration(2000)
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
}
