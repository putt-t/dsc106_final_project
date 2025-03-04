// Main application logic
document.addEventListener("DOMContentLoaded", async () => {
    // Show loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-indicator";
    loadingIndicator.innerHTML = `
      <div class="spinner"></div>
      <p>Loading respiratory data...</p>
    `;
    document.body.appendChild(loadingIndicator);

    try {
        // Load data
        await dataLoader.loadData();

        // Remove loading indicator
        document.body.removeChild(loadingIndicator);

        // Initialize visualizations
        initializeVisualizations();
    } catch (error) {
        console.error("Error initializing application:", error);
        loadingIndicator.innerHTML = `
        <p>Error loading data. Please try again later.</p>
      `;
    }
});

// Initialize all visualizations
function initializeVisualizations() {
    // Create breathing animation in introduction section
    createBreathingAnimation();

    // Create demographic overview
    createDemographicOverview();

    // Create breathing patterns comparison
    createBreathingPatternsComparison();

    // Create individual explorer
    createIndividualExplorer();

    // Create insights visualization
    createInsightsVisualization();

    // Set up event listeners
    setupEventListeners();
}

// Create breathing animation
function createBreathingAnimation() {
    const container = document.getElementById("breathing-animation");

    // Create a 3-column layout
    const layout = document.createElement("div");
    layout.className = "animation-layout";
    layout.style.display = "flex";
    layout.style.justifyContent = "space-between";
    container.appendChild(layout);

    // Create lung animation
    const lungContainer = document.createElement("div");
    lungContainer.className = "animation-container";
    lungContainer.innerHTML = `
      <h3>Lung Expansion</h3>
      <svg id="lung-animation" width="300" height="300"></svg>
    `;
    layout.appendChild(lungContainer);

    // Create flow curve animation
    const flowContainer = document.createElement("div");
    flowContainer.className = "animation-container";
    flowContainer.innerHTML = `
      <h3>Flow Pattern</h3>
      <svg id="flow-animation" width="300" height="300"></svg>
    `;
    layout.appendChild(flowContainer);

    // Create chest-abdomen animation
    const chestAbdContainer = document.createElement("div");
    chestAbdContainer.className = "animation-container";
    chestAbdContainer.innerHTML = `
      <h3>Chest-Abdomen Movement</h3>
      <svg id="chest-abd-animation" width="300" height="300"></svg>
    `;
    layout.appendChild(chestAbdContainer);

    // Get sample data for animations
    const sampleSubject = dataLoader.getSubjectInfo()[0].subjectNumber;
    const sampleData = dataLoader.getRespiratoryData(sampleSubject);

    // Create animations
    const lungAnim = breathingAnimations.createLungAnimation(
        document.getElementById("lung-animation"),
        sampleData
    );

    const flowAnim = breathingAnimations.createFlowCurveAnimation(
        document.getElementById("flow-animation"),
        sampleData,
        { metric: "flow" }
    );

    const chestAbdAnim = breathingAnimations.createChestAbdomenAnimation(
        document.getElementById("chest-abd-animation"),
        sampleData
    );

    // Start animations
    lungAnim();
    flowAnim();
    chestAbdAnim();
}

// Create demographic overview
function createDemographicOverview() {
    const demographicViz = new DemographicViz("demographics-viz");
    demographicViz.createDemographicOverview();
}

// Create breathing patterns comparison
function createBreathingPatternsComparison() {
    const breathingViz = new BreathingViz("patterns-viz");

    // Default to comparing by sex and showing flow
    breathingViz.createGroupComparison("sex", "flow");

    // Set up event listeners for controls
    document.getElementById("group-select").addEventListener("change", updateBreathingComparison);
    document.getElementById("metric-select").addEventListener("change", updateBreathingComparison);

    function updateBreathingComparison() {
        const groupBy = document.getElementById("group-select").value;
        const metric = document.getElementById("metric-select").value;
        breathingViz.createGroupComparison(groupBy, metric);
    }
}

// Create individual explorer
function createIndividualExplorer() {
    const comparisonViz = new ComparisonViz("individual-viz");
    const subjectSelect = document.getElementById("subject-select");

    // Populate subject dropdown
    const subjects = dataLoader.getSubjectInfo();
    subjects.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject.subjectNumber;
        option.textContent = `Subject ${subject.subjectNumber} (${subject.sex}, ${subject.age}y, ${subject.trialClassification})`;
        subjectSelect.appendChild(option);
    });

    // Default to first subject
    comparisonViz.createRespiratoryDashboard(subjects[0].subjectNumber);

    // Set up event listener for subject selection
    subjectSelect.addEventListener("change", () => {
        const selectedSubject = parseInt(subjectSelect.value);
        comparisonViz.createRespiratoryDashboard(selectedSubject);
    });
}

// Create insights visualization
function createInsightsVisualization() {
    const container = document.getElementById("insights-viz");

    // Create tabs for different insights
    const tabsContainer = document.createElement("div");
    tabsContainer.className = "tabs-container";
    container.appendChild(tabsContainer);

    const tabs = [
        { id: "asthma-impact", label: "Asthma Impact" },
        { id: "smoking-vaping", label: "Smoking & Vaping" },
        { id: "sex-differences", label: "Sex Differences" },
        { id: "age-effects", label: "Age Effects" }
    ];

    tabs.forEach(tab => {
        const tabButton = document.createElement("button");
        tabButton.className = "tab-button";
        tabButton.dataset.tabId = tab.id;
        tabButton.textContent = tab.label;
        tabsContainer.appendChild(tabButton);
    });

    // Create content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "tab-content-container";
    container.appendChild(contentContainer);

    // Set up event listeners for tabs
    tabsContainer.addEventListener("click", (event) => {
        if (event.target.classList.contains("tab-button")) {
            // Remove active class from all tabs
            document.querySelectorAll(".tab-button").forEach(btn => {
                btn.classList.remove("active");
            });

            // Add active class to clicked tab
            event.target.classList.add("active");

            // Show corresponding content
            const tabId = event.target.dataset.tabId;
            showInsightContent(tabId, contentContainer);
        }
    });

    // Activate first tab by default
    document.querySelector(".tab-button").classList.add("active");
    showInsightContent(tabs[0].id, contentContainer);
}

// Show insight content based on selected tab
function showInsightContent(tabId, container) {
    // Clear container
    container.innerHTML = "";

    // Create visualization based on tab
    switch (tabId) {
        case "asthma-impact":
            createAsthmaImpactViz(container);
            break;
        case "smoking-vaping":
            createSmokingVapingViz(container);
            break;
        case "sex-differences":
            createSexDifferencesViz(container);
            break;
        case "age-effects":
            createAgeEffectsViz(container);
            break;
    }
}

// Create asthma impact visualization
function createAsthmaImpactViz(container) {
    // Create heading
    const heading = document.createElement("h3");
    heading.textContent = "Impact of Asthma on Respiratory Mechanics";
    container.appendChild(heading);

    // Create description
    const description = document.createElement("p");
    description.textContent = "This visualization compares respiratory metrics between asthmatic and non-asthmatic participants, highlighting differences in flow patterns, pressure requirements, and chest-abdominal movement.";
    container.appendChild(description);

    // Create visualization container
    const vizContainer = document.createElement("div");
    vizContainer.id = "asthma-viz-container";
    vizContainer.style.height = "500px";
    container.appendChild(vizContainer);

    // Create visualization
    const breathingViz = new BreathingViz("asthma-viz-container");
    breathingViz.createGroupComparison("asthma", "flow");

    // Add key findings
    const findings = document.createElement("div");
    findings.className = "key-findings";
    findings.innerHTML = `
    <h4>Key Findings:</h4>
    <ul>
      <li>Asthmatic participants show more variable flow patterns during breathing</li>
      <li>Higher resistance to airflow is observed in asthmatic participants</li>
      <li>Chest movement tends to be more pronounced in asthmatic participants compared to abdominal movement</li>
      <li>Recovery time after peak flow is typically longer in asthmatic participants</li>
    </ul>
  `;
    container.appendChild(findings);
}

// Create smoking and vaping visualization
function createSmokingVapingViz(container) {
    // Create heading
    const heading = document.createElement("h3");
    heading.textContent = "Effects of Smoking and Vaping on Respiratory Function";
    container.appendChild(heading);

    // Create description
    const description = document.createElement("p");
    description.textContent = "This visualization explores how smoking and vaping history affects respiratory mechanics, comparing participants with and without smoking/vaping history.";
    container.appendChild(description);

    // Create tabs for smoking vs vaping
    const subTabsContainer = document.createElement("div");
    subTabsContainer.className = "sub-tabs-container";
    container.appendChild(subTabsContainer);

    const smokingButton = document.createElement("button");
    smokingButton.className = "sub-tab-button active";
    smokingButton.textContent = "Smoking History";
    subTabsContainer.appendChild(smokingButton);

    const vapingButton = document.createElement("button");
    vapingButton.className = "sub-tab-button";
    vapingButton.textContent = "Vaping History";
    subTabsContainer.appendChild(vapingButton);

    // Create visualization container
    const vizContainer = document.createElement("div");
    vizContainer.id = "smoking-vaping-viz-container";
    vizContainer.style.height = "500px";
    container.appendChild(vizContainer);

    // Create visualization
    const breathingViz = new BreathingViz("smoking-vaping-viz-container");
    breathingViz.createGroupComparison("smoking", "flow");

    // Add event listeners for sub-tabs
    smokingButton.addEventListener("click", () => {
        smokingButton.classList.add("active");
        vapingButton.classList.remove("active");
        breathingViz.createGroupComparison("smoking", "flow");
    });

    vapingButton.addEventListener("click", () => {
        vapingButton.classList.add("active");
        smokingButton.classList.remove("active");
        breathingViz.createGroupComparison("vaping", "flow");
    });

    // Add key findings
    const findings = document.createElement("div");
    findings.className = "key-findings";
    findings.innerHTML = `
    <h4>Key Findings:</h4>
    <ul>
      <li>Participants with smoking history show reduced peak flow compared to non-smokers</li>
      <li>Vapers exhibit different breathing patterns with more irregular flow curves</li>
      <li>Both smoking and vaping history correlate with increased chest movement relative to abdominal movement</li>
      <li>Recovery breathing patterns differ significantly between smokers/vapers and non-smokers/non-vapers</li>
    </ul>
  `;
    container.appendChild(findings);
}

// Create sex differences visualization
function createSexDifferencesViz(container) {
    // Create heading
    const heading = document.createElement("h3");
    heading.textContent = "Sex Differences in Respiratory Mechanics";
    container.appendChild(heading);

    // Create description
    const description = document.createElement("p");
    description.textContent = "This visualization compares respiratory metrics between male and female participants, highlighting physiological differences in breathing patterns.";
    container.appendChild(description);

    // Create visualization container
    const vizContainer = document.createElement("div");
    vizContainer.id = "sex-diff-viz-container";
    vizContainer.style.height = "500px";
    container.appendChild(vizContainer);

    // Create visualization
    const breathingViz = new BreathingViz("sex-diff-viz-container");
    breathingViz.createGroupComparison("sex", "flow");

    // Add metric selector
    const metricSelector = document.createElement("div");
    metricSelector.className = "metric-selector";
    metricSelector.innerHTML = `
    <label for="sex-metric-select">Metric:</label>
    <select id="sex-metric-select">
      <option value="flow">Flow (L/s)</option>
      <option value="pressure">Pressure (cmH2O)</option>
      <option value="v_tidal">Tidal Volume (L)</option>
      <option value="chest">Chest Movement (mm)</option>
      <option value="abd">Abdominal Movement (mm)</option>
    </select>
  `;
    container.insertBefore(metricSelector, vizContainer);

    // Add event listener for metric selection
    document.getElementById("sex-metric-select").addEventListener("change", (event) => {
        breathingViz.createGroupComparison("sex", event.target.value);
    });

    // Add key findings
    const findings = document.createElement("div");
    findings.className = "key-findings";
    findings.innerHTML = `
    <h4>Key Findings:</h4>
    <ul>
      <li>Male participants typically show higher peak flow and tidal volume compared to females</li>
      <li>Female participants often exhibit more thoracic (chest) breathing compared to males who show more abdominal breathing</li>
      <li>Breathing rate tends to be slightly higher in female participants</li>
      <li>Pressure curves show different patterns between sexes, potentially related to anatomical differences</li>
    </ul>
  `;
    container.appendChild(findings);
}

// Create age effects visualization
function createAgeEffectsViz(container) {
    // Create heading
    const heading = document.createElement("h3");
    heading.textContent = "Age-Related Changes in Respiratory Function";
    container.appendChild(heading);

    // Create description
    const description = document.createElement("p");
    description.textContent = "This visualization explores how age affects respiratory mechanics, comparing participants across different age groups.";
    container.appendChild(description);

    // Create age group selector
    const ageGroupSelector = document.createElement("div");
    ageGroupSelector.className = "age-group-selector";
    ageGroupSelector.innerHTML = `
    <div class="age-groups">
      <button class="age-group-button active" data-min="15" data-max="25">15-25 years</button>
      <button class="age-group-button" data-min="26" data-max="35">26-35 years</button>
      <button class="age-group-button" data-min="36" data-max="45">36-45 years</button>
      <button class="age-group-button" data-min="46" data-max="100">46+ years</button>
    </div>
  `;
    container.appendChild(ageGroupSelector);

    // Create visualization container
    const vizContainer = document.createElement("div");
    vizContainer.id = "age-viz-container";
    vizContainer.style.height = "500px";
    container.appendChild(vizContainer);

    // Create scatter plot for age vs respiratory metrics
    const scatterContainer = document.createElement("div");
    scatterContainer.id = "age-scatter-container";
    scatterContainer.style.height = "400px";
    container.appendChild(scatterContainer);

    // Create scatter plot
    createAgeScatterPlot(scatterContainer);

    // Add event listeners for age group buttons
    document.querySelectorAll(".age-group-button").forEach(button => {
        button.addEventListener("click", (event) => {
            // Remove active class from all buttons
            document.querySelectorAll(".age-group-button").forEach(btn => {
                btn.classList.remove("active");
            });

            // Add active class to clicked button
            event.target.classList.add("active");

            // Update visualization based on selected age group
            const minAge = parseInt(event.target.dataset.min);
            const maxAge = parseInt(event.target.dataset.max);
            updateAgeGroupVisualization(minAge, maxAge);
        });
    });

    // Initialize with first age group
    updateAgeGroupVisualization(15, 25);

    // Add key findings
    const findings = document.createElement("div");
    findings.className = "key-findings";
    findings.innerHTML = `
    <h4>Key Findings:</h4>
    <ul>
      <li>Peak flow tends to decrease with age, particularly after 45 years</li>
      <li>Older participants show more variability in breathing patterns</li>
      <li>The ratio of chest to abdominal movement changes with age</li>
      <li>Recovery time after exertion increases with age</li>
    </ul>
  `;
    container.appendChild(findings);
}

// Update age group visualization
function updateAgeGroupVisualization(minAge, maxAge) {
    // Filter subjects by age group
    const subjects = dataLoader.getSubjectInfo().filter(subject =>
        subject.age >= minAge && subject.age <= maxAge
    );

    // Get subject numbers
    const subjectNumbers = subjects.map(subject => subject.subjectNumber);

    // Create average flow visualization for this age group
    const ageViz = new BreathingViz("age-viz-container");

    // If we have subjects in this age group
    if (subjectNumbers.length > 0) {
        // Get average data
        const averageData = dataLoader.getAverageRespiratoryData(subjectNumbers, "flow");

        // Create custom visualization
        ageViz.g.selectAll("*").remove();

        // Create scales
        const xScale = d3.scaleLinear()
            .domain([0, d3.max(averageData, d => d.time)])
            .range([0, ageViz.innerWidth]);

        const yScale = d3.scaleLinear()
            .domain([
                d3.min(averageData, d => d.flow) * 1.1,
                d3.max(averageData, d => d.flow) * 1.1
            ])
            .range([ageViz.innerHeight, 0]);


        // Create axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        ageViz.g.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${ageViz.innerHeight})`)
            .call(xAxis);

        ageViz.g.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Add axis labels
        ageViz.g.append("text")
            .attr("class", "x-axis-label")
            .attr("x", ageViz.innerWidth / 2)
            .attr("y", ageViz.innerHeight + 40)
            .attr("text-anchor", "middle")
            .text("Time (s)");

        ageViz.g.append("text")
            .attr("class", "y-axis-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -ageViz.innerHeight / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .text("Flow (L/s)");

        // Add title
        ageViz.g.append("text")
            .attr("class", "chart-title")
            .attr("x", ageViz.innerWidth / 2)
            .attr("y", -15)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .attr("font-weight", "bold")
            .text(`Average Flow Pattern for Age ${minAge}-${maxAge} (n=${subjectNumbers.length})`);

        // Create line generator
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.flow))
            .curve(d3.curveBasis);

        // Add the line path
        const path = ageViz.g.append("path")
            .datum(averageData)
            .attr("class", "line")
            .attr("fill", "none")
            .attr("stroke", "#3498db")
            .attr("stroke-width", 3)
            .attr("d", line);

        // Add confidence interval
        const confidenceData = calculateConfidenceInterval(subjectNumbers, "flow");

        const areaGenerator = d3.area()
            .x(d => xScale(d.time))
            .y0(d => yScale(d.lower))
            .y1(d => yScale(d.upper))
            .curve(d3.curveBasis);

        ageViz.g.append("path")
            .datum(confidenceData)
            .attr("class", "confidence-interval")
            .attr("fill", "#3498db")
            .attr("opacity", 0.2)
            .attr("d", areaGenerator);

        // Animate the path
        ageViz.animateBreathingPattern(path);
    } else {
        // Show message if no subjects in this age group
        ageViz.g.selectAll("*").remove();

        ageViz.g.append("text")
            .attr("x", ageViz.innerWidth / 2)
            .attr("y", ageViz.innerHeight / 2)
            .attr("text-anchor", "middle")
            .attr("font-size", "16px")
            .text(`No participants in the ${minAge}-${maxAge} age range`);
    }
}

// Calculate confidence interval for a group of subjects
function calculateConfidenceInterval(subjectNumbers, metric) {
    // Get data for each subject
    const allData = subjectNumbers.map(subjectNumber => {
        return dataLoader.getRespiratoryData(subjectNumber);
    });

    // Find common time points (first 5 seconds)
    const timePoints = [];
    for (let t = 0; t <= 5; t += 0.1) {
        timePoints.push(parseFloat(t.toFixed(1)));
    }

    // For each time point, calculate mean and standard deviation
    const confidenceData = timePoints.map(time => {
        // Find values at this time point for each subject
        const values = [];

        allData.forEach(subjectData => {
            // Find closest time point
            const closest = subjectData.reduce((prev, curr) => {
                return (Math.abs(curr.time - time) < Math.abs(prev.time - time) ? curr : prev);
            });

            if (Math.abs(closest.time - time) < 0.15) {
                values.push(closest[metric]);
            }
        });

        // Calculate mean and standard deviation
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const squareDiffs = values.map(value => {
            const diff = value - mean;
            return diff * diff;
        });
        const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = Math.sqrt(variance);

        // Calculate 95% confidence interval
        const confidenceFactor = 1.96; // 95% confidence
        const marginOfError = confidenceFactor * (stdDev / Math.sqrt(values.length));

        return {
            time: time,
            mean: mean,
            upper: mean + marginOfError,
            lower: mean - marginOfError
        };
    });

    return confidenceData;
}

// Create age scatter plot
function createAgeScatterPlot(container) {
    // Create SVG
    const width = container.clientWidth;
    const height = 400;
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(container).append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Get subject data
    const subjects = dataLoader.getSubjectInfo();

    // Calculate average flow for each subject
    const subjectFlows = subjects.map(subject => {
        const respiratoryData = dataLoader.getRespiratoryData(subject.subjectNumber);
        const avgFlow = d3.mean(respiratoryData, d => d.flow);

        return {
            subjectNumber: subject.subjectNumber,
            age: subject.age,
            sex: subject.sex,
            avgFlow: avgFlow,
            asthma: subject.asthma
        };
    });

    // Create scales
    const xScale = d3.scaleLinear()
        .domain([15, d3.max(subjects, d => d.age) + 5])
        .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
        .domain([
            d3.min(subjectFlows, d => d.avgFlow) * 0.9,
            d3.max(subjectFlows, d => d.avgFlow) * 1.1
        ])
        .range([innerHeight, 0]);

    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);

    g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`)
        .call(xAxis);

    g.append("g")
        .attr("class", "y-axis")
        .call(yAxis);

    // Add axis labels
    g.append("text")
        .attr("class", "x-axis-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Age (years)");

    g.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .text("Average Flow (L/s)");

    // Add title
    g.append("text")
        .attr("class", "chart-title")
        .attr("x", innerWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .attr("font-size", "16px")
        .attr("font-weight", "bold")
        .text("Relationship Between Age and Average Flow");

    // Create color scale for sex
    const colorScale = d3.scaleOrdinal()
        .domain(["M", "F"])
        .range(["#3498db", "#e74c3c"]);

    // Create shape scale for asthma
    const shapeScale = d3.scaleOrdinal()
        .domain([true, false])
        .range(["diamond", "circle"]);

    // Add points
    const points = g.selectAll(".point")
        .data(subjectFlows)
        .enter()
        .append("g")
        .attr("class", "point")
        .attr("transform", d => `translate(${xScale(d.age)}, ${yScale(d.avgFlow)})`);

    // Add circles or diamonds based on asthma status
    points.each(function (d) {
        const point = d3.select(this);

        if (d.asthma) {
            // Diamond for asthmatic
            point.append("path")
                .attr("d", d3.symbol().type(d3.symbolDiamond).size(100))
                .attr("fill", colorScale(d.sex))
                .attr("opacity", 0.7)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
        } else {
            // Circle for non-asthmatic
            point.append("circle")
                .attr("r", 5)
                .attr("fill", colorScale(d.sex))
                .attr("opacity", 0.7)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
        }
    });

    // Add tooltip
    const tooltip = d3.select(container).append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    points.on("mouseover", function (event, d) {
        tooltip.transition()
            .duration(200)
            .style("opacity", 0.9);
        tooltip.html(`
        <strong>Subject:</strong> ${d.subjectNumber}<br>
        <strong>Age:</strong> ${d.age} years<br>
        <strong>Sex:</strong> ${d.sex === "M" ? "Male" : "Female"}<br>
        <strong>Asthma:</strong> ${d.asthma ? "Yes" : "No"}<br>
        <strong>Avg Flow:</strong> ${d.avgFlow.toFixed(3)} L/s
      `)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    })
        .on("mouseout", function () {
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        });

    // Add regression line
    const regressionData = subjectFlows.map(d => [d.age, d.avgFlow]);
    const regression = linearRegression(regressionData);

    const regressionLine = d3.line()
        .x(d => xScale(d[0]))
        .y(d => yScale(regression.slope * d[0] + regression.intercept));

    const regressionPoints = [
        [d3.min(subjectFlows, d => d.age), 0],
        [d3.max(subjectFlows, d => d.age), 0]
    ];

    g.append("path")
        .datum(regressionPoints)
        .attr("class", "regression-line")
        .attr("fill", "none")
        .attr("stroke", "#2c3e50")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "5,5")
        .attr("d", regressionLine);

    // Add legend
    const legend = g.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${innerWidth - 120}, 20)`);

    // Sex legend
    const sexLegend = legend.append("g")
        .attr("class", "sex-legend");

    sexLegend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-weight", "bold")
        .text("Sex:");

    const sexItems = sexLegend.selectAll(".sex-item")
        .data(["M", "F"])
        .enter()
        .append("g")
        .attr("class", "sex-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20 + 15})`);

    sexItems.append("circle")
        .attr("r", 5)
        .attr("fill", d => colorScale(d))
        .attr("opacity", 0.7)
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);

    sexItems.append("text")
        .attr("x", 15)
        .attr("y", 5)
        .attr("text-anchor", "start")
        .text(d => d === "M" ? "Male" : "Female");

    // Asthma legend
    const asthmaLegend = legend.append("g")
        .attr("class", "asthma-legend")
        .attr("transform", "translate(0, 70)");

    asthmaLegend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("font-weight", "bold")
        .text("Asthma:");

    const asthmaItems = asthmaLegend.selectAll(".asthma-item")
        .data([true, false])
        .enter()
        .append("g")
        .attr("class", "asthma-item")
        .attr("transform", (d, i) => `translate(0, ${i * 20 + 15})`);

    asthmaItems.each(function (d, i) {
        const item = d3.select(this);

        if (d) {
            // Diamond for asthmatic
            item.append("path")
                .attr("d", d3.symbol().type(d3.symbolDiamond).size(100))
                .attr("fill", "#7f8c8d")
                .attr("opacity", 0.7)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
        } else {
            // Circle for non-asthmatic
            item.append("circle")
                .attr("r", 5)
                .attr("fill", "#7f8c8d")
                .attr("opacity", 0.7)
                .attr("stroke", "#fff")
                .attr("stroke-width", 1);
        }

        item.append("text")
            .attr("x", 15)
            .attr("y", 5)
            .attr("text-anchor", "start")
            .text(d ? "Yes" : "No");
    });
}

// Linear regression helper function
function linearRegression(data) {
    const n = data.length;

    // Calculate means
    let sumX = 0;
    let sumY = 0;

    for (let i = 0; i < n; i++) {
        sumX += data[i][0];
        sumY += data[i][1];
    }

    const meanX = sumX / n;
    const meanY = sumY / n;

    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
        const x = data[i][0];
        const y = data[i][1];

        numerator += (x - meanX) * (y - meanY);
        denominator += (x - meanX) * (x - meanX);
    }

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;

    return { slope, intercept };
}

// Set up event listeners
function setupEventListeners() {
    // Add scroll event listener to start/stop animations
    window.addEventListener("scroll", handleScroll);

    function handleScroll() {
        // Get all animation containers
        const animationContainers = document.querySelectorAll(".animation-container");

        // Check if each container is in viewport
        animationContainers.forEach(container => {
            const rect = container.getBoundingClientRect();
            const isInViewport = (
                rect.top >= 0 &&
                rect.left >= 0 &&
                rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
                rect.right <= (window.innerWidth || document.documentElement.clientWidth)
            );

            // Get the SVG element inside the container
            const svg = container.querySelector("svg");

            if (isInViewport) {
                // Start animation if in viewport
                const animationFunction = breathingAnimations.animations[svg.id];
                if (animationFunction) {
                    animationFunction();
                }
            } else {
                // Stop animation if not in viewport
                breathingAnimations.stopAnimation(svg.id);
            }
        });
    }

    // Initial check
    handleScroll();
}
