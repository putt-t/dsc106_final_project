// Breathing Waveform Animation
document.addEventListener('DOMContentLoaded', function () {
    // Set up dimensions
    const width = 900;
    const height = 400;
    const margin = { top: 50, right: 100, bottom: 50, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Group colors
    const groupColors = {
        // normal: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(),
        // asthma: getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(),
        normal: '#6c90b0',
        asthma: '#e57a77',
        smoker: "#9b59b6", // purple
        vaper: "#f1c40f"   // yellow
    };

    const red = '#e57a77';
    const blue = '#7ca1cc';

    // Averaged group data
    let averagedGroupData = {};
    const timeWindow = 10;
    let currentTime = 0;

    // Create SVG
    const svg = d3.select("#breathing-viz")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Add title
    svg.append("text")
        .attr("class", "viz-title")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .text("Breathing Patterns Visualization");

    // Create group for the visualization
    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
        .range([0, innerWidth]);

    const y = d3.scaleLinear()
        .domain([0, 10])
        .range([innerHeight, 0]);

    // Add axes
    const xAxis = g.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerHeight})`);

    const yAxis = g.append("g")
        .attr("class", "y-axis");


    // Add axis labels
    g.append("text")
        .attr("class", "x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerHeight + 40)
        .attr("text-anchor", "middle")
        .text("Time (s)");

    g.append("text")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight / 2)
        .attr("y", -60)
        .attr("text-anchor", "middle")
        .text("Tidal Volume (L)");

    // Create line generator for tidal volume
    const line = d3.line()
        .x(d => x(d.time))
        .y(d => y(d.volume))
        .curve(d3.curveBasis);

    // Create gradient for the line
    const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "flow-gradient")
        .attr("gradientUnits", "userSpaceOnUse")
        .attr("x1", 0)
        .attr("y1", y(0))
        .attr("x2", 0)
        .attr("y2", y(4));

    gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", groupColors.normal);

    gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", groupColors.normal);

    gradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", groupColors.asthma);

    gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", groupColors.asthma);

    // Create path for the line for single group mode
    const path = g.append("path")
        .attr("class", "flow-line")
        .attr("fill", "none")
        .attr("stroke", groupColors.normal)
        .attr("stroke-width", 3);

    // Create group paths for "All" mode
    const groupPaths = {};
    Object.keys(groupColors).forEach(group => {
        groupPaths[group] = g.append("path")
            .attr("class", `flow-line ${group}-line`)
            .attr("fill", "none")
            .attr("stroke", groupColors[group])
            .attr("stroke-width", 3)
            .attr("opacity", 0); // Initially hidden
    });

    // Create a breathing indicator
    const breathIndicator = g.append("circle")
        .attr("class", "breath-indicator")
        .attr("r", 8)
        .attr("fill", groupColors.normal);

    // Create area generator for tidal volume
    const area = d3.area()
        .x(d => x(d.time))
        .y0(y(0))
        .y1(d => y(d.volume))
        .curve(d3.curveBasis);

    // Create path for the area
    const areaPath = g.append("path")
        .attr("class", "volume-area")
        .attr("fill", groupColors.normal)
        .attr("fill-opacity", 0.3);

    // Keep the original flow area generators for compatibility
    const areaAbove = d3.area()
        .x(d => x(d.time))
        .y0(y(0))
        .y1(d => d.flow > 0 ? y(d.flow) : y(0))
        .curve(d3.curveBasis);

    const areaBelow = d3.area()
        .x(d => x(d.time))
        .y0(y(0))
        .y1(d => d.flow < 0 ? y(d.flow) : y(0))
        .curve(d3.curveBasis);

    // Create paths for the flow areas (hidden by default)
    const areaPathAbove = g.append("path")
        .attr("class", "area-above")
        .attr("fill", groupColors.asthma)
        .attr("fill-opacity", 0);

    const areaPathBelow = g.append("path")
        .attr("class", "area-below")
        .attr("fill", groupColors.normal)
        .attr("fill-opacity", 0);

    // Load subject info to get group classifications
    let subjectGroups = {};
    let selectedGroup = "normal"; // Default group

    d3.csv("subject-info.csv")
        .then(subjectData => {
            console.log("Subject data loaded successfully:", subjectData.length, "records");
            console.log("Sample data:", subjectData[0]); // Log first record to see column names

            // Parse subject classifications
            subjectData.forEach(subject => {
                // Check what columns are available
                // console.log("Subject record keys:", Object.keys(subject));

                // Try different ways to get the ID
                const subjectId = subject["Subject Number"] || subject["SubjectID"] || subject["Subject"] || subject["ID"];

                // Convert to number properly
                const id = parseInt(subjectId, 10);

                if (isNaN(id)) {
                    console.error("Failed to parse ID:", subjectId, "from record:", subject);
                    return; // Skip this record
                }

                const classification = subject["Trial Classification"] || subject["Classification"] || subject["Trial"];

                if (!classification) {
                    console.error("Missing classification for subject:", id);
                    return; // Skip this record
                }

                let group;
                if (classification.includes("Normal")) {
                    group = "normal";
                } else if (classification.includes("Asthmatic")) {
                    group = "asthma";
                } else if (classification.includes("Smoker")) {
                    group = "smoker";
                } else if (classification.includes("Vaper")) {
                    group = "vaper";
                } else {
                    group = "unknown";
                }

                // Store group for this subject
                subjectGroups[id] = group;

                // Extract condition and gender from classification
                const parts = classification.split(" ");
                const condition = parts[0] || "";
                const gender = parts[1] || "";

                // console.log(`Subject ${id}: Group: ${group}, Condition: ${condition}, Gender: ${gender}`);
            });

            // After all subjects are processed, then populate the selector
            populateParticipantSelect();

            // console.log("Compute data averaging");

            // Load average data for all groups
            d3.csv("grouped_data.csv").then(groupData => {
                Object.keys(groupColors).forEach(group => {
                    dataGroup = groupData.filter(d => d.group === group);
                    averagedGroupData[group] = dataGroup.map(d => ({
                        time: +d["Time [s]"],
                        flow: +d["Flow [L/s]"],
                        volume: +d["V_tidal [L]"],
                        chest: +d["Chest [mm]"],
                        abdomen: +d["Abd [mm]"],
                        ratio: +d["Chest [mm]"] / +d["Abd [mm]"]
                    }));

                    // sort by time
                    averagedGroupData[group] = averagedGroupData[group].sort((a, b) => a.time - b.time);
                    
                    // filter out data > 300 seconds
                    averagedGroupData[group] = averagedGroupData[group].filter(d => d.time >= 0 && d.time <= 300);
                });
            });
        })
        .catch(error => {
            console.error("Error loading subject info:", error);
            alert("Error loading subject classification data. Please check the console for details.");
        });

    // Populate participant selector
    function populateParticipantSelect() {
        const participantSelect = document.getElementById("participant-select");
        participantSelect.innerHTML = ""; // Clear existing options

        // console.log("Populating participant select with subject groups:", subjectGroups);

        // Add "All" option
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All Groups (Comparison)";
        allOption.dataset.group = "all";
        allOption.classList.add("participant-option");
        participantSelect.appendChild(allOption);

        // Add individual subjects
        for (let i = 1; i <= 80; i++) {
            const group = subjectGroups[i] || "unknown";
            // console.log(`Subject ${i}: Group = ${group}`);

            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Subject ${i.toString().padStart(2, '0')} (${group.charAt(0).toUpperCase() + group.slice(1)})`;
            option.dataset.group = group;
            option.classList.add("participant-option");

            if (i === 1) {
                option.classList.add("participant-active"); // Select the first subject by default
            }

            participantSelect.appendChild(option);
        }

        // Set up change listener
        participantSelect.addEventListener("change", function () {
            // Get selected subject
            const subjectId = this.value;
            const groupButtons = document.querySelectorAll(".group-btn");

            // Hide all group paths initially
            Object.values(groupPaths).forEach(path => path.attr("opacity", 0));

            let selectedParticipants = document.querySelectorAll(".participant-option");

            // console.log(selectedParticipants);

            selectedParticipants.forEach(participant => {
                // console.log(participant)
                if (participant.value === subjectId) {
                    if (participant.classList.contains("participant-active")) {
                        return; // Don't do anything if already active
                    }
                    participant.classList.add("participant-active");
                } else {
                    participant.classList.remove("participant-active");
                }
            });

            if (subjectId === "all") {
                // Show all groups
                path.attr("opacity", 0); // Hide single path
                breathIndicator.attr("opacity", 0); // Hide indicator
                areaPath.attr("opacity", 0); // Hide volume area
                areaPathAbove.attr("opacity", 0); // Hide flow areas
                areaPathBelow.attr("opacity", 0);

                // Select the "All" option in the dropdown
                participantSelect.value = "all";

                selectedGroup = "all";
                // Update buttons to reflect "all" selection
                groupButtons.forEach(btn => {
                    btn.classList.remove("active");
                    if (btn.dataset.group === "all") {
                        btn.classList.add("active");
                    }
                });
                animateAllGroups();
            } else {
                const group = this.options[this.selectedIndex].dataset.group;
                selectedGroup = group;
                groupButtons.forEach(btn => {
                    btn.classList.remove("active");
                    if (btn.dataset.group === group) {
                        btn.classList.add("active");
                    }
                });

                // Show single group
                path.attr("opacity", 1);
                breathIndicator.attr("opacity", 1);
                areaPath.attr("opacity", 0.3);
                areaPathAbove.attr("opacity", 0); // Hide flow areas
                // areaPathBelow.attr("opacity", 0);

                animateBreathing(subjectId);
            }

            updateLegend();
        });

        // Initialize with first subject
        if (participantSelect.options.length > 1) {  // Skip the "All" option
            participantSelect.selectedIndex = 1;  // Select the first actual subject
            animateBreathing(participantSelect.value);
        }
    }

    // Update legend
    function updateLegend() {
        const legendContainer = document.querySelector(".breathing-legend");
        legendContainer.innerHTML = "";

        if (selectedGroup === "all") {
            // Show all groups in legend
            Object.keys(groupColors).forEach(group => {
                const legendItem = document.createElement("div");
                legendItem.className = "legend-item";

                const colorBox = document.createElement("div");
                colorBox.className = "legend-color";
                colorBox.style.backgroundColor = groupColors[group];

                const label = document.createElement("div");
                label.className = "legend-label";
                label.textContent = group.charAt(0).toUpperCase() + group.slice(1);
                if (group === "normal") {
                    label.textContent = 'Healthy';
                }

                legendItem.appendChild(colorBox);
                legendItem.appendChild(label);
                legendContainer.appendChild(legendItem);
            });
        } else {
            // Show tidal volume instead of inhalation/exhalation
            const volumeItem = document.createElement("div");
            volumeItem.className = "legend-item";

            const volumeColorBox = document.createElement("div");
            volumeColorBox.className = "legend-color";
            volumeColorBox.style.backgroundColor = groupColors.normal;

            const volumeLabel = document.createElement("div");
            volumeLabel.className = "legend-label";
            volumeLabel.textContent = "Tidal Volume";

            volumeItem.appendChild(volumeColorBox);
            volumeItem.appendChild(volumeLabel);
            legendContainer.appendChild(volumeItem);
        }
    }

    // Set up group buttons
    const groupButtons = document.querySelectorAll(".group-btn");
    groupButtons.forEach(button => {
        button.addEventListener("click", function () {
            if (this.classList.contains("active")) return; // Don't do anything if already active

            groupButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            selectedGroup = this.dataset.group;

            // Update the participant select dropdown to match the selected group
            let participantSelect = document.getElementById("participant-select");


            // Hide all group paths initially
            Object.values(groupPaths).forEach(path => path.attr("opacity", 0));

            if (selectedGroup === "all") {
                // Show all groups
                path.attr("opacity", 0); // Hide single path
                breathIndicator.attr("opacity", 0); // Hide indicator
                areaPath.attr("opacity", 0); // Hide volume area
                areaPathAbove.attr("opacity", 0); // Hide flow areas
                areaPathBelow.attr("opacity", 0);

                // Select the "All" option in the dropdown
                participantSelect.value = "all";

                let selectedParticipants = document.querySelectorAll(".participant-option");

                    selectedParticipants.forEach(participant => {
                        // console.log(participant)
                        if (participant.value === participantSelect.value) {
                            if (participant.classList.contains("participant-active")) {
                                return; // Don't do anything if already active
                            }
                            participant.classList.add("participant-active");
                        } else {
                            participant.classList.remove("participant-active");
                        }
                    });

                animateAllGroups();
            } else {
                // Show single group
                path.attr("opacity", 1);
                breathIndicator.attr("opacity", 1);
                areaPath.attr("opacity", 0.3);
                areaPathAbove.attr("opacity", 0); // Hide flow areas
                areaPathBelow.attr("opacity", 1);

                // Get a representative subject from the selected group
                let subjectFound = false;

                for (let i = 0; i < participantSelect.options.length; i++) {
                    if (participantSelect.options[i].dataset.group === selectedGroup) {
                        participantSelect.selectedIndex = i;
                        subjectFound = true;
                        break;
                    }
                }

                if (subjectFound) {
                    let selectedParticipants = document.querySelectorAll(".participant-option");

                    selectedParticipants.forEach(participant => {
                        // console.log(participant)
                        if (participant.value === participantSelect.value) {
                            if (participant.classList.contains("participant-active")) {
                                return; // Don't do anything if already active
                            }
                            participant.classList.add("participant-active");
                        } else {
                            participant.classList.remove("participant-active");
                        }
                    });

                    animateBreathing(participantSelect.value);
                }
            }

            updateLegend();
        });
    });

    // Set up speed slider
    const speedSlider = document.getElementById("speed-slider");
    const speedValue = document.getElementById("speed-value");
    let animationSpeed = 1;

    speedSlider.addEventListener("input", function () {
        animationSpeed = parseFloat(this.value);
        speedValue.textContent = `${animationSpeed}x`;
    });

    // Stats elements
    const currentFlowElement = document.getElementById("current-flow");
    const currentVolumeElement = document.getElementById("current-volume");
    const breathingRateElement = document.getElementById("breathing-rate");
    breathingRateElement.textContent = "-- breaths/min";

    // Animation variables
    let animationFrameId;
    let breathCount = 0;
    let lastBreathTime = 0;
    let isInhaling = false;
    let breathingRateArray = [];
    let prevVolume = 0;

    function animateAllGroups() {
        // Cancel any existing animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Change Y scale to [0, 4] for flow visualization
        y.domain([0, 4]);
        yAxis.call(d3.axisLeft(y).ticks(5));

        // Animation loop
        function animate() {
            let continueAnimation = false;

            Object.entries(averagedGroupData).forEach(([group, data]) => {
                const visibleData = data.filter(d =>
                    d.time >= currentTime && d.time <= currentTime + timeWindow
                );

                if (visibleData.length > 0) {
                    continueAnimation = true;

                    // Update line for this group using average volume data
                    groupPaths[group]
                        .datum(visibleData)
                        .attr("d", line)
                        .attr("opacity", 1);
                } else {
                    groupPaths[group].attr("opacity", 0);
                }
            });

            if (!continueAnimation) {
                // Reset if all data has been played
                currentTime = 0;
                animate();
                return;
            }

            // Reset stats display in multi-group mode
            let statsPanel = document.getElementById('stats-panel');
            statsPanel.style.opacity = 0; // Start fade out

            // Wait for transition to complete before hiding
            setTimeout(() => {
                statsPanel.classList.add('stats-hidden');
            }, 500); // Match the transition duration (500ms)

            // Reset stats display in multi-group mode
            let circleVizCont = document.getElementById('circle-viz-container');
            circleVizCont.style.opacity = 0; // Start fade out

            // Wait for transition to complete before hiding
            setTimeout(() => {
                circleVizCont.classList.add('circle-viz-hidden');
            }, 500); // Match the transition duration (500ms)

            // Advance time based on animation speed
            currentTime += 0.02 * animationSpeed;

            // Update x domain
            x.domain([currentTime, currentTime + timeWindow]);

            // Update x-axis
            xAxis.call(d3.axisBottom(x).ticks(10));

            // Continue animation
            animationFrameId = requestAnimationFrame(animate);
        }

        // Start animation
        animate();
    }

    // Animation function for single subject
    function animateBreathing(subjectId) {
        // Cancel any existing animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Change Y scale to [0, 10] for flow visualization
        y.domain([0, 10]);
        yAxis.call(d3.axisLeft(y).ticks(5));
        
        breathCount = 0;
        lastBreathTime = 0;
        isInhaling = false;
        breathingRateArray = [];
        breathingRateElement.textContent = "-- breaths/min";
        let frameCount = 0;

        // Setup lung visualization
        const lung_options = {
            width: 500,   // Adjusted for better fit
            height: 300,  // Adjusted for better fit
            baseRadius: 60,  // Base size of lung
            maxRadius: 120,  // Maximum size of lung
            minRadius: 40,   // Minimum size of lung
            inhalationColor: blue,
            exhalationColor: red,
            transitionSpeed: 300  // ms for smooth transitions
        };

        const chest_options = {
            width : 500,
            height : 300,
            baseRadiusChest: 60,
            baseRadiusAbdomen: 60,
            transitionSpeed: 300
        }

        d3.select("#lung-viz").selectAll("svg").remove();
        d3.select("#chest-viz").selectAll("svg").remove();

        // Clear and initialize lung visualization
        const lung_svg = d3.select("#lung-viz")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${lung_options.width} ${lung_options.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");
        
        const chest_svg = d3.select("#chest-viz")
            .append("svg")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("viewBox", `0 0 ${chest_options.width} ${chest_options.height}`)
            .attr("preserveAspectRatio", "xMidYMid meet");

        lung_svg.selectAll("svg").remove();
        chest_svg.selectAll("svg").remove();

        lung_svg.append("text")
            .attr("class", "viz-title")
            .attr("x", lung_options.width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .text("Lung Flow Visualization");

        chest_svg.append("text")
            .attr("class", "viz-title")
            .attr("x", chest_options.width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .text("Chest and Abdomen Movement");

        // Create lung group
        const lung = lung_svg.append("g")
            .attr("transform", `translate(${lung_options.width / 2}, ${lung_options.height / 2})`);

        const chest = chest_svg.append("g")
            .attr("transform", `translate(${chest_options.width / 2}, ${chest_options.height / 2})`);

        // Add lung circle
        const circle = lung.append("circle")
            .attr("r", lung_options.baseRadius)
            .attr("fill", lung_options.inhalationColor)
            .attr("cy", +20)
            .attr("opacity", 0.6)
            .attr("stroke", "#2980b9")
            .attr("stroke-width", 2);

        // Add chest and abdomen circles
        const abdomenCircle = chest.append("circle")
            .attr("r", chest_options.baseRadiusAbdomen)
            .attr("cy", +70)
            .attr("fill", red)
            .attr("opacity", 0.6)
            .attr("stroke", "#c0392b")
            .attr("stroke-width", 2);

        const chestCircle = chest.append("circle")
            .attr("r", chest_options.baseRadiusChest)
            .attr("cy", -30)
            .attr("fill", blue)
            .attr("opacity", 0.6)
            .attr("stroke", "#2980b9")
            .attr("stroke-width", 2);


        // Reset breath tracking
        let statsPanel = document.getElementById('stats-panel');
        
        // Show stats panel if hidden
        if (statsPanel.classList.contains('stats-hidden')) {
            statsPanel.style.opacity = 0; // Start fade in

            // Wait for transition to complete before showing
            setTimeout(() => {
                statsPanel.classList.remove('stats-hidden');
                statsPanel.style.opacity = 1; // Start fade in
            }, 500); // Match the transition duration (500ms)
        }

        // Reset breath tracking
        let circleVizCont = document.getElementById('circle-viz-container');
        
        // Show stats panel if hidden
        if (circleVizCont.classList.contains('circle-viz-hidden')) {
            circleVizCont.style.opacity = 0; // Start fade in

            // Wait for transition to complete before showing
            setTimeout(() => {
                circleVizCont.classList.remove('circle-viz-hidden');
                circleVizCont.style.opacity = 1; // Start fade in
            }, 500); // Match the transition duration (500ms)
        }

        // Load data for the selected subject
        d3.csv(`Processed_Dataset/ProcessedData_Subject${subjectId.toString().padStart(2, '0')}.csv`).then(data => {
            // Process data
            let processedData = data.map(d => ({
                time: +d["Time [s]"],
                flow: +d["Flow [L/s]"],
                pressure: +d["Pressure [cmH2O]"],
                volume: Math.max(0, +d["V_tidal [L]"]),
                chest: +d["Chest [mm]"],
                abdomen: +d["Abd [mm]"]
            }));

            // Only get data <= 300 seconds
            const maxTime = 300;
            processedData = processedData.filter(d => d.time <= maxTime);

            // Find max flow for scaling
            const maxFlow = d3.max(processedData, d => Math.abs(d.flow));

            // Find min and max values for chest and abdomen for proper scaling
            const chestMin = d3.min(processedData, d => d.chest);
            const chestMax = d3.max(processedData, d => d.chest);
            const abdomenMin = d3.min(processedData, d => d.abdomen);
            const abdomenMax = d3.max(processedData, d => d.abdomen);

            // Function to scale flow to radius
            const flowToRadius = d3.scaleLinear()
                .domain([-maxFlow, maxFlow])
                .range([lung_options.minRadius, lung_options.maxRadius])
                .clamp(true);

            // // Functions to scale chest and abdomen measurements to radii
            // const chestToRadius = d3.scaleLinear()
            //     .domain([chestMin, chestMax])
            //     .range([chest_options.baseRadiusChest * 0.8, chest_options.baseRadiusChest * 1.2])
            //     .clamp(true);

            // const abdomenToRadius = d3.scaleLinear()
            //     .domain([abdomenMin, abdomenMax])
            //     .range([chest_options.baseRadiusAbdomen * 0.8, chest_options.baseRadiusAbdomen * 1.2])
            //     .clamp(true);

            // Calculate mean values as baselines
            const chestMean = d3.mean(processedData, d => d.chest);
            const abdomenMean = d3.mean(processedData, d => d.abdomen);

            // Calculate typical deviation (difference between max and min)
            const chestDeviation = (chestMax - chestMin) / 2;
            const abdomenDeviation = (abdomenMax - abdomenMin) / 2;

            // Create more dramatic scaling functions that amplify deviations from the mean
            const amplificationFactor = 0.2; // Increase this to make changes more dramatic

            const chestToRadius = (chestValue) => {
                // Calculate how far from mean, as a proportion of typical deviation
                const deviationFromMean = (chestValue - chestMean) / chestDeviation;
                
                // Amplify this deviation and apply to base radius
                return chest_options.baseRadiusChest * (1 + deviationFromMean * amplificationFactor);
            };

            const abdomenToRadius = (abdomenValue) => {
                // Calculate how far from mean, as a proportion of typical deviation
                const deviationFromMean = (abdomenValue - abdomenMean) / abdomenDeviation;
                
                // Amplify this deviation and apply to base radius
                return chest_options.baseRadiusAbdomen * (1 + deviationFromMean * amplificationFactor);
            };

            // Set up time window
            const timeWindow = 10;
            let currentTime = 0;

            // Update x domain
            x.domain([currentTime, currentTime + timeWindow]);

            // Update axes
            xAxis.call(d3.axisBottom(x).ticks(10));
            yAxis.call(d3.axisLeft(y).ticks(10));

            // Animation loop
            function animate() {
                // Get data for current time window
                const visibleData = processedData.filter(d =>
                    d.time >= currentTime && d.time <= currentTime + timeWindow
                );

                if (visibleData.length === 0) {
                    currentTime = 0; // Reset to beginning
                    breathCount = 0;
                    lastBreathTime = 0;
                    prevVolume = 0;
                    isInhaling = false;
                    breathingRateArray = [];
                    animate();
                    return;
                }

                // Update line with volume data
                path.datum(visibleData)
                    .attr("d", line);

                // Update volume area
                areaPath.datum(visibleData)
                    .attr("d", area);

                // Update visualizations with the latest data point
                if (visibleData.length > 0) {
                    const latestPoint = visibleData[visibleData.length - 1];
                    
                    // Update lung circle based on flow
                    const newRadius = flowToRadius(latestPoint.flow);
                    let isInhaling = latestPoint.flow > 0;
                    
                    // Apply smooth transition for lung visualization
                    circle.transition()
                        .duration(lung_options.transitionSpeed * (1/animationSpeed)) // Adjust transition speed based on animation speed
                        .ease(d3.easeCubicOut)
                        .attr("r", newRadius)
                        .attr("fill", isInhaling ? lung_options.inhalationColor : lung_options.exhalationColor);

                    // Update chest circle based on chest measurement
                    const newChestRadius = chestToRadius(latestPoint.chest);
                    chestCircle.transition()
                        .duration(chest_options.transitionSpeed * (1/animationSpeed))
                        .ease(d3.easeCubicOut)
                        .attr("r", newChestRadius);

                    // Update abdomen circle based on abdomen measurement
                    const newAbdomenRadius = abdomenToRadius(latestPoint.abdomen);
                    abdomenCircle.transition()
                        .duration(chest_options.transitionSpeed * (1/animationSpeed))
                        .ease(d3.easeCubicOut)
                        .attr("r", newAbdomenRadius);

                    // Add indicators to show the measurement values
                    // Update or create text elements to display current values
                    d3.select("#chest-value").remove();
                    chest.append("text")
                        .attr("id", "chest-value")
                        .attr("y", -30)
                        .attr("text-anchor", "middle")
                        .attr("fill", "white")
                        .attr("font-size", "14px")
                        .text(`${latestPoint.chest.toFixed(1)} mm`);
                        
                    d3.select("#abdomen-value").remove();
                    chest.append("text")
                        .attr("id", "abdomen-value")
                        .attr("y", 70)
                        .attr("text-anchor", "middle")
                        .attr("fill", "white")
                        .attr("font-size", "14px")
                        .text(`${latestPoint.abdomen.toFixed(1)} mm`);
                    
                    // Update breathing indicator and stats
                    breathIndicator
                        .attr("cx", x(latestPoint.time))
                        .attr("cy", y(latestPoint.volume))
                        .attr("r", 8);

                    // Update stats display
                    if (frameCount % 3 === 0) {
                        currentFlowElement.textContent = `${latestPoint.flow.toFixed(2)} L/s`;
                        currentFlowElement.style.color = latestPoint.flow > 0 ? blue : red;
                        currentVolumeElement.textContent = `${latestPoint.volume.toFixed(2)} L`;
                    }

                    // Update breathing indicator to show position on the volume curve
                    breathIndicator
                        .attr("cx", x(latestPoint.time))
                        .attr("cy", y(latestPoint.volume))
                        .attr("r", 8); // Fixed size for volume visualization

                    // Update stats
                    if (frameCount % 3 === 0) { // Updates every _ frames
                        currentFlowElement.textContent = `${latestPoint.flow.toFixed(2)} L/s`;
                        currentFlowElement.style.color = latestPoint.flow > 0 ? blue : red;

                        currentVolumeElement.textContent = `${latestPoint.volume.toFixed(2)} L`;
                    }

                    if (latestPoint.volume >= prevVolume && !isInhaling) {  // Use threshold to avoid noise
                        isInhaling = true;

                        // If this isn't the first breath, calculate breathing rate
                        if (lastBreathTime > 0) {
                            const breathsPerMinute = breathCount / (latestPoint.time / 60);

                            // Add to array for averaging (keep last 5 breaths)
                            breathingRateArray.push(breathsPerMinute);
                            if (breathingRateArray.length > 10) {
                                breathingRateArray.shift();
                            }
                            // console.log("Breathing rate array:", breathingRateArray);

                            // Calculate average breathing rate
                            const avgBreathingRate = breathingRateArray.reduce((a, b) => a + b, 0) / breathingRateArray.length;

                            // Apply a sanity check to the displayed rate
                            if (breathCount > 2) {
                                breathingRateElement.textContent = `${avgBreathingRate.toFixed(1)} breaths/min`;
                            } else {
                                breathingRateElement.textContent = "-- breaths/min";
                            }
                        }

                        lastBreathTime = latestPoint.time;
                        breathCount++;
                        prevVolume = latestPoint.volume;
                        // console.log("Breath count:", breathCount);
                    } else if (latestPoint.volume < prevVolume && isInhaling) {  // Use threshold to avoid noise
                        isInhaling = false;
                        prevVolume = latestPoint.volume;
                    }
                }

                // Continue with the rest of the animation function...
                // Advance time based on animation speed
                currentTime += 0.02 * animationSpeed;

                // Update x domain and axis
                x.domain([currentTime, currentTime + timeWindow]);
                xAxis.call(d3.axisBottom(x).ticks(10));

                // Continue animation
                animationFrameId = requestAnimationFrame(animate);
                frameCount++;
            }

            // Start animation
            animate();
        }).catch(error => {
            console.error("Error loading data:", error);
            // Display error message
        });
    }

    // Initialize legend
    updateLegend();
});