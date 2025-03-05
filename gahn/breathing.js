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
        normal: getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim(),
        asthma: getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim(),
        smoker: "#9b59b6", // purple
        vaper: "#f1c40f"   // yellow
    };

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
        .domain([0, 4])
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
        .attr("stroke", "url(#flow-gradient)")
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

    d3.csv("../subject-info.csv")
        .then(subjectData => {
            console.log("Subject data loaded successfully:", subjectData.length, "records");
            console.log("Sample data:", subjectData[0]); // Log first record to see column names

            // Parse subject classifications
            subjectData.forEach(subject => {
                // Check what columns are available
                console.log("Subject record keys:", Object.keys(subject));

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

                console.log(`Subject ${id}: Group: ${group}, Condition: ${condition}, Gender: ${gender}`);
            });

            // After all subjects are processed, then populate the selector
            populateParticipantSelect();
        })
        .catch(error => {
            console.error("Error loading subject info:", error);
            alert("Error loading subject classification data. Please check the console for details.");
        });

    // Populate participant selector
    function populateParticipantSelect() {
        const participantSelect = document.getElementById("participant-select");
        participantSelect.innerHTML = ""; // Clear existing options

        console.log("Populating participant select with subject groups:", subjectGroups);

        // Add "All" option
        const allOption = document.createElement("option");
        allOption.value = "all";
        allOption.textContent = "All Groups (Comparison)";
        allOption.dataset.group = "all";
        participantSelect.appendChild(allOption);

        // Add individual subjects
        for (let i = 1; i <= 80; i++) {
            const group = subjectGroups[i] || "unknown";
            console.log(`Subject ${i}: Group = ${group}`);

            const option = document.createElement("option");
            option.value = i;
            option.textContent = `Subject ${i.toString().padStart(2, '0')} (${group.charAt(0).toUpperCase() + group.slice(1)})`;
            option.dataset.group = group;
            participantSelect.appendChild(option);
        }

        // Set up change listener
        participantSelect.addEventListener("change", function () {
            const subjectId = this.value;

            if (subjectId === "all") {
                selectedGroup = "all";
                // Update buttons to reflect "all" selection
                const groupButtons = document.querySelectorAll(".group-btn");
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
            groupButtons.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            selectedGroup = this.dataset.group;

            // Update the participant select dropdown to match the selected group
            const participantSelect = document.getElementById("participant-select");

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

                animateAllGroups();
            } else {
                // Show single group
                path.attr("opacity", 1);
                breathIndicator.attr("opacity", 1);
                areaPath.attr("opacity", 0.3);
                areaPathAbove.attr("opacity", 0); // Hide flow areas
                areaPathBelow.attr("opacity", 0);

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

        if (selectedGroup === "all") {
            animateAllGroups();
        } else {
            const currentSubject = document.getElementById("participant-select").value;
            animateBreathing(currentSubject);
        }
    });

    // Stats elements
    const currentFlowElement = document.getElementById("current-flow");
    const currentVolumeElement = document.getElementById("current-volume");
    const breathingRateElement = document.getElementById("breathing-rate");

    // Animation variables
    let animationFrameId;
    let breathCount = 0;
    let lastBreathTime = 0;
    let isInhaling = false;
    let breathingRateArray = [];

    function animateAllGroups() {
        // Cancel any existing animation
        // if (animationFrameId) {
        //     cancelAnimationFrame(animationFrameId);
        // }

        cancelAnimationFrame(animationFrameId);

        console.log("Starting animateAllGroups with data averaging");

        // Group subjects by their classification
        const subjectsByGroup = {};
        Object.keys(groupColors).forEach(group => {
            subjectsByGroup[group] = [];
            for (let id in subjectGroups) {
                if (subjectGroups[id] === group) {
                    subjectsByGroup[group].push(id);
                }
            }
        });

        console.log("Subjects by group:", subjectsByGroup);

        // Load data for all subjects in each group
        const groupPromises = Object.entries(subjectsByGroup).map(([group, subjectIds]) => {
            // Load data for up to 5 subjects per group to keep performance reasonable
            const sampleSubjects = subjectIds.slice(0, 5);

            const subjectPromises = sampleSubjects.map(id => {
                return d3.csv(`../Processed_Dataset/ProcessedData_Subject${id.toString().padStart(2, '0')}.csv`)
                    .then(data => {
                        return data.map(d => ({
                            time: +d["Time [s]"],
                            flow: +d["Flow [L/s]"],
                            volume: Math.max(0, +d["V_tidal [L]"])
                        })).filter(d => d.time <= 300); // Only get data <= 300 seconds
                    })
                    .catch(error => {
                        console.error(`Error loading data for subject ${id}:`, error);
                        return []; // Return empty data on error
                    });
            });

            return Promise.all(subjectPromises).then(allSubjectData => {
                return {
                    group: group,
                    subjectData: allSubjectData
                };
            });
        });

        Promise.all(groupPromises).then(groupData => {
            // Set up time window (10 seconds)
            const timeWindow = 10;
            let currentTime = 0;

            // Update x domain
            x.domain([currentTime, currentTime + timeWindow]);

            // Update axes
            xAxis.call(d3.axisBottom(x).ticks(10));
            yAxis.call(d3.axisLeft(y).ticks(5));

            // Create time-binned average data for each group
            const binSize = 0.1; // 100ms bins
            const averagedGroupData = {};

            groupData.forEach(group => {
                const allData = group.subjectData;
                if (allData.length === 0) return;

                // Create bins from 0 to 300 seconds
                const bins = {};
                for (let t = 0; t <= 300; t += binSize) {
                    bins[t.toFixed(1)] = {
                        count: 0,
                        totalVolume: 0
                    };
                }

                // Sum up values in each bin
                allData.forEach(subjectData => {
                    subjectData.forEach(point => {
                        const binKey = (Math.floor(point.time / binSize) * binSize).toFixed(1);
                        if (bins[binKey]) {
                            bins[binKey].count++;
                            bins[binKey].totalVolume += point.volume;
                        }
                    });
                });

                // Calculate averages and create data points
                averagedGroupData[group.group] = Object.entries(bins)
                    .map(([time, values]) => ({
                        time: parseFloat(time),
                        volume: values.count > 0 ? values.totalVolume / values.count : 0
                    }))
                    .filter(d => d.volume > 0) // Filter out empty bins
                    .sort((a, b) => a.time - b.time); // Sort by time
            });

            console.log("Averaged group data created:", Object.keys(averagedGroupData));

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
                currentFlowElement.textContent = "Average";
                currentVolumeElement.textContent = "Average";
                breathingRateElement.textContent = "Average";

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
        }).catch(error => {
            console.error("Error loading data for all groups:", error);
        });
    }

    // Animation function for single subject
    function animateBreathing(subjectId) {
        // Cancel any existing animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Reset breath tracking
        breathCount = 0;
        lastBreathTime = 0;
        isInhaling = false;
        breathingRateArray = [];

        // Load data for the selected subject
        d3.csv(`../Processed_Dataset/ProcessedData_Subject${subjectId.toString().padStart(2, '0')}.csv`).then(data => {
            // Process data
            let processedData = data.map(d => ({
                time: +d["Time [s]"],
                flow: +d["Flow [L/s]"],
                pressure: +d["Pressure [cmH2O]"],
                volume: Math.max(0, +d["V_tidal [L]"]),  // Use Math.max to prevent negative values
                chest: +d["Chest [mm]"],
                abdomen: +d["Abd [mm]"]
            }));

            // Only get data <= 300 seconds
            const maxTime = 300;
            processedData = processedData.filter(d => d.time <= maxTime);

            // Set up time window (10 seconds)
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

                // Update breathing indicator and stats (if data available)
                if (visibleData.length > 0) {
                    const latestPoint = visibleData[visibleData.length - 1];

                    // Update breathing indicator to show position on the volume curve
                    breathIndicator
                        .attr("cx", x(latestPoint.time))
                        .attr("cy", y(latestPoint.volume))
                        .attr("r", 8); // Fixed size for volume visualization

                    // Update stats
                    currentFlowElement.textContent = `${latestPoint.flow.toFixed(2)} L/s`;
                    currentFlowElement.style.color = latestPoint.flow > 0 ? groupColors.asthma : groupColors.normal;

                    currentVolumeElement.textContent = `${latestPoint.volume.toFixed(2)} L`;

                    if (latestPoint.flow > 0.2 && !isInhaling) {  // Use threshold to avoid noise
                        isInhaling = true;

                        // If this isn't the first breath, calculate breathing rate
                        if (lastBreathTime > 0) {
                            const timeBetweenBreaths = latestPoint.time - lastBreathTime;

                            // Only count reasonable breath intervals (between 0.5 and 10 seconds)
                            // This gives a range of 6 to 120 breaths per minute
                            if (timeBetweenBreaths > 0.5 && timeBetweenBreaths < 10) {
                                const breathsPerMinute = 60 / timeBetweenBreaths;

                                // Add to array for averaging (keep last 5 breaths)
                                breathingRateArray.push(breathsPerMinute);
                                if (breathingRateArray.length > 5) {
                                    breathingRateArray.shift();
                                }

                                // Calculate average breathing rate
                                const avgBreathingRate = breathingRateArray.reduce((a, b) => a + b, 0) / breathingRateArray.length;

                                // Apply a sanity check to the displayed rate
                                if (avgBreathingRate > 6 && avgBreathingRate < 40) {
                                    breathingRateElement.textContent = `${avgBreathingRate.toFixed(1)} breaths/min`;
                                } else {
                                    breathingRateElement.textContent = "-- breaths/min";
                                }
                            }
                        }

                        lastBreathTime = latestPoint.time;
                        breathCount++;
                    } else if (latestPoint.flow < -0.2 && isInhaling) {  // Use threshold to avoid noise
                        isInhaling = false;
                    }
                }

                // Advance time based on animation speed
                currentTime += 0.02 * animationSpeed;

                // Update x domain
                x.domain([currentTime, currentTime + timeWindow]);

                // Update x-axis with transition
                xAxis.call(d3.axisBottom(x).ticks(10));

                // Continue animation
                animationFrameId = requestAnimationFrame(animate);
            }

            // Start animation
            animate();
        }).catch(error => {
            console.error("Error loading data:", error);
            // Display error message in the visualization area
            d3.select("#breathing-viz")
                .append("div")
                .attr("class", "error-message")
                .style("color", "red")
                .style("text-align", "center")
                .style("padding", "20px")
                .html(`<p>Error loading data for Subject ${subjectId}.</p>
                       <p>Please make sure the file exists and is correctly formatted.</p>
                       <p>Technical details: ${error.message}</p>`);
        });
    }

    // Initialize legend
    updateLegend();
});