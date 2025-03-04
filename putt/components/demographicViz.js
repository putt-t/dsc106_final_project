class DemographicViz {
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

    // Create a demographic overview visualization
    createDemographicOverview() {
        // Clear previous content
        this.g.selectAll("*").remove();

        const subjectInfo = dataLoader.getSubjectInfo();

        // Create a grid layout
        const gridLayout = [
            { id: "sex", title: "Sex Distribution", x: 0, y: 0, width: this.innerWidth / 2, height: this.innerHeight / 2 },
            { id: "age", title: "Age Distribution", x: this.innerWidth / 2, y: 0, width: this.innerWidth / 2, height: this.innerHeight / 2 },
            { id: "health", title: "Health Conditions", x: 0, y: this.innerHeight / 2, width: this.innerWidth / 2, height: this.innerHeight / 2 },
            { id: "bmi", title: "BMI Distribution", x: this.innerWidth / 2, y: this.innerHeight / 2, width: this.innerWidth / 2, height: this.innerHeight / 2 }
        ];

        // Create grid cells
        const cells = this.g.selectAll(".cell")
            .data(gridLayout)
            .enter()
            .append("g")
            .attr("class", "cell")
            .attr("transform", d => `translate(${d.x}, ${d.y})`);

        // Add cell titles
        cells.append("text")
            .attr("class", "cell-title")
            .attr("x", d => d.width / 2)
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("font-weight", "bold")
            .text(d => d.title);

        // Create sex distribution pie chart
        this.createSexDistribution(
            cells.filter(d => d.id === "sex"),
            subjectInfo,
            gridLayout.find(d => d.id === "sex")
        );

        // Create age distribution histogram
        this.createAgeDistribution(
            cells.filter(d => d.id === "age"),
            subjectInfo,
            gridLayout.find(d => d.id === "age")
        );

        // Create health conditions bar chart
        this.createHealthConditions(
            cells.filter(d => d.id === "health"),
            subjectInfo,
            gridLayout.find(d => d.id === "health")
        );

        // Create BMI distribution scatter plot
        this.createBMIDistribution(
            cells.filter(d => d.id === "bmi"),
            subjectInfo,
            gridLayout.find(d => d.id === "bmi")
        );

        return this;
    }

    // Create sex distribution pie chart
    createSexDistribution(cell, data, cellDimensions) {
        // Count males and females
        const sexCounts = d3.rollup(
            data,
            v => v.length,
            d => d.sex
        );

        const pieData = Array.from(sexCounts, ([key, value]) => ({ key, value }));

        // Create pie chart
        const radius = Math.min(cellDimensions.width, cellDimensions.height) / 2 - 40;

        const pie = d3.pie()
            .value(d => d.value)
            .sort(null);

        const arc = d3.arc()
            .innerRadius(0)
            .outerRadius(radius);

        const colorScale = d3.scaleOrdinal()
            .domain(["M", "F"])
            .range(["#3498db", "#e74c3c"]);

        const pieG = cell.append("g")
            .attr("transform", `translate(${cellDimensions.width / 2}, ${cellDimensions.height / 2 + 20})`);

        const arcs = pieG.selectAll(".arc")
            .data(pie(pieData))
            .enter()
            .append("g")
            .attr("class", "arc");

        arcs.append("path")
            .attr("d", arc)
            .attr("fill", d => colorScale(d.data.key))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => {
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
              <strong>${d.data.key === "M" ? "Male" : "Female"}:</strong> ${d.data.value} participants<br>
              <strong>Percentage:</strong> ${(d.data.value / data.length * 100).toFixed(1)}%
            `);
            })
            .on("mouseout", () => {
                this.tooltip.style("opacity", 0);
            });

        // Add labels
        arcs.append("text")
            .attr("transform", d => `translate(${arc.centroid(d)})`)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .attr("fill", "white")
            .text(d => `${d.data.key} (${d.data.value})`);

        // Add legend
        const legend = pieG.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${radius + 10}, ${-radius})`);

        const legendItems = legend.selectAll(".legend-item")
            .data(["M", "F"])
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("rect")
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", d => colorScale(d));

        legendItems.append("text")
            .attr("x", 15)
            .attr("y", 10)
            .attr("text-anchor", "start")
            .text(d => d === "M" ? "Male" : "Female");

        // Animate pie chart
        arcs.selectAll("path")
            .transition()
            .duration(1000)
            .attrTween("d", function (d) {
                const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
                return t => arc(interpolate(t));
            });
    }

    // Create age distribution histogram
    createAgeDistribution(cell, data, cellDimensions) {
        // Create scales
        const xScale = d3.scaleLinear()
            .domain([15, d3.max(data, d => d.age) + 5])
            .range([0, cellDimensions.width - 40]);

        const histogram = d3.histogram()
            .value(d => d.age)
            .domain(xScale.domain())
            .thresholds(xScale.ticks(8));

        const bins = histogram(data);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([cellDimensions.height - 80, 40]);

        // Create axes
        const xAxis = d3.axisBottom(xScale).ticks(8);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        const histG = cell.append("g")
            .attr("transform", `translate(30, 0)`);

        histG.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${cellDimensions.height - 80})`)
            .call(xAxis);

        histG.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Add axis labels
        histG.append("text")
            .attr("class", "x-axis-label")
            .attr("x", (cellDimensions.width - 40) / 2)
            .attr("y", cellDimensions.height - 40)
            .attr("text-anchor", "middle")
            .text("Age (years)");

        histG.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -(cellDimensions.height - 80 + 40) / 2)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .text("Count");

        // Create bars
        const bars = histG.selectAll(".bar")
            .data(bins)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.x0) + 1)
            .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
            .attr("y", cellDimensions.height - 80)
            .attr("height", 0)
            .attr("fill", "#3498db")
            .on("mouseover", (event, d) => {
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
              <strong>Age Range:</strong> ${d.x0.toFixed(0)}-${d.x1.toFixed(0)} years<br>
              <strong>Count:</strong> ${d.length} participants
            `);
            })
            .on("mouseout", () => {
                this.tooltip.style("opacity", 0);
            });

        // Animate bars
        bars.transition()
            .duration(1000)
            .attr("y", d => yScale(d.length))
            .attr("height", d => cellDimensions.height - 80 - yScale(d.length));
    }

    // Create health conditions bar chart
    createHealthConditions(cell, data, cellDimensions) {
        // Count health conditions
        const healthConditions = [
            { key: "Asthma", value: data.filter(d => d.asthma).length },
            { key: "Smoking History", value: data.filter(d => d.smokingHistory).length },
            { key: "Current Smoker", value: data.filter(d => d.currentSmoker).length },
            { key: "Vaping History", value: data.filter(d => d.vapingHistory).length },
            { key: "Current Vaper", value: data.filter(d => d.currentVaper).length }
        ];

        // Create scales
        const xScale = d3.scaleBand()
            .domain(healthConditions.map(d => d.key))
            .range([0, cellDimensions.width - 40])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(healthConditions, d => d.value)])
            .range([cellDimensions.height - 80, 40]);

        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        const barG = cell.append("g")
            .attr("transform", `translate(30, 0)`);

        barG.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${cellDimensions.height - 80})`)
            .call(xAxis)
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .attr("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em");

        barG.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Add axis labels
        barG.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -(cellDimensions.height - 80 + 40) / 2)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .text("Count");

        // Create bars
        const bars = barG.selectAll(".bar")
            .data(healthConditions)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.key))
            .attr("width", xScale.bandwidth())
            .attr("y", cellDimensions.height - 80)
            .attr("height", 0)
            .attr("fill", "#e74c3c")
            .on("mouseover", (event, d) => {
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
              <strong>${d.key}:</strong> ${d.value} participants<br>
              <strong>Percentage:</strong> ${(d.value / data.length * 100).toFixed(1)}%
            `);
            })
            .on("mouseout", () => {
                this.tooltip.style("opacity", 0);
            });

        // Animate bars
        bars.transition()
            .duration(1000)
            .attr("y", d => yScale(d.value))
            .attr("height", d => cellDimensions.height - 80 - yScale(d.value));
    }

    // Create BMI distribution scatter plot
    createBMIDistribution(cell, data, cellDimensions) {
        // Calculate BMI for each participant
        const bmiData = data.map(d => {
            const heightInMeters = d.height / 100;
            const bmi = d.weight / (heightInMeters * heightInMeters);
            return {
                ...d,
                bmi
            };
        });

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([15, d3.max(bmiData, d => d.bmi) + 2])
            .range([0, cellDimensions.width - 40]);

        const yScale = d3.scaleLinear()
            .domain([15, d3.max(bmiData, d => d.age) + 5])
            .range([cellDimensions.height - 80, 40]);

        // Create axes
        const xAxis = d3.axisBottom(xScale).ticks(5);
        const yAxis = d3.axisLeft(yScale).ticks(5);

        const scatterG = cell.append("g")
            .attr("transform", `translate(30, 0)`);

        scatterG.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${cellDimensions.height - 80})`)
            .call(xAxis);

        scatterG.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Add axis labels
        scatterG.append("text")
            .attr("class", "x-axis-label")
            .attr("x", (cellDimensions.width - 40) / 2)
            .attr("y", cellDimensions.height - 40)
            .attr("text-anchor", "middle")
            .text("BMI (kg/m²)");

        scatterG.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -(cellDimensions.height - 80 + 40) / 2)
            .attr("y", -25)
            .attr("text-anchor", "middle")
            .text("Age (years)");

        // Create BMI category regions
        const bmiCategories = [
            { name: "Underweight", min: 0, max: 18.5, color: "#3498db" },
            { name: "Normal", min: 18.5, max: 25, color: "#2ecc71" },
            { name: "Overweight", min: 25, max: 30, color: "#f39c12" },
            { name: "Obese", min: 30, max: 100, color: "#e74c3c" }
        ];

        scatterG.selectAll(".bmi-region")
            .data(bmiCategories)
            .enter()
            .append("rect")
            .attr("class", "bmi-region")
            .attr("x", d => xScale(d.min))
            .attr("width", d => xScale(d.max) - xScale(d.min))
            .attr("y", 40)
            .attr("height", cellDimensions.height - 80 - 40)
            .attr("fill", d => d.color)
            .attr("opacity", 0.1);

        // Add BMI category labels
        scatterG.selectAll(".bmi-label")
            .data(bmiCategories)
            .enter()
            .append("text")
            .attr("class", "bmi-label")
            .attr("x", d => xScale((d.min + d.max) / 2))
            .attr("y", 55)
            .attr("text-anchor", "middle")
            .attr("font-size", "10px")
            .text(d => d.name);

        // Create points
        const colorScale = d3.scaleOrdinal()
            .domain(["M", "F"])
            .range(["#3498db", "#e74c3c"]);

        const points = scatterG.selectAll(".point")
            .data(bmiData)
            .enter()
            .append("circle")
            .attr("class", "point")
            .attr("cx", d => xScale(d.bmi))
            .attr("cy", d => yScale(d.age))
            .attr("r", 0)
            .attr("fill", d => colorScale(d.sex))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => {
                this.tooltip
                    .style("opacity", 0.9)
                    .style("left", `${event.pageX + 10}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .html(`
              <strong>Subject:</strong> ${d.subjectNumber}<br>
              <strong>Sex:</strong> ${d.sex === "M" ? "Male" : "Female"}<br>
              <strong>Age:</strong> ${d.age} years<br>
              <strong>BMI:</strong> ${d.bmi.toFixed(1)} kg/m²<br>
              <strong>Height:</strong> ${d.height} cm<br>
              <strong>Weight:</strong> ${d.weight} kg
            `);
            })
            .on("mouseout", () => {
                this.tooltip.style("opacity", 0);
            });

        // Animate points
        points.transition()
            .duration(1000)
            .delay((d, i) => i * 10)
            .attr("r", 5);

        // Add legend
        const legend = scatterG.append("g")
            .attr("class", "legend")
            .attr("transform", `translate(${cellDimensions.width - 80}, 50)`);

        const legendItems = legend.selectAll(".legend-item")
            .data(["M", "F"])
            .enter()
            .append("g")
            .attr("class", "legend-item")
            .attr("transform", (d, i) => `translate(0, ${i * 20})`);

        legendItems.append("circle")
            .attr("r", 5)
            .attr("fill", d => colorScale(d))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1);

        legendItems.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .attr("text-anchor", "start")
            .text(d => d === "M" ? "Male" : "Female");
    }
}
