// Chest vs. Abdominal Motion Visualization
document.addEventListener('DOMContentLoaded', function () {
    // Set up dimensions - INCREASED HEIGHT for larger graphs
    const width = 900;
    const height = 600; // Increased from 500 to 600
    const margin = { top: 50, right: 100, bottom: 50, left: 100 }; // Increased left margin to 100
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Group colors
    const groupColors = {
        healthy: '#6c90b0',
        asthma: '#e57a77',
        smoker: "#9b59b6", // purple
        vaper: "#f1c40f"   // yellow
    };

    // Averaged group data
    const averagedGroupData = {};
    const timeWindow = 10;
    let currentTime = 0;
    let animationSpeed = 1;
    let selectedParticipant = "1"; // Default to first participant

    // Create controls container BEFORE the visualization divs
    const controlsContainer = d3.select(".section-chest-abdominal")
        .insert("div", "#chest-vis") // Insert before the visualization divs
        .attr("class", "controls-container")
        .style("margin-bottom", "1.5rem")
        .style("padding", "1rem")
        .style("background-color", "var(--light-gray)")
        .style("border-radius", "8px");

    // Create participant selector
    const participantSelector = controlsContainer.append("div")
        .attr("class", "participant-selector")
        .style("margin", "0.5rem");

    participantSelector.append("label")
        .attr("for", "participant-select")
        .text("Select Participant: ")
        .style("font-weight", "bold")
        .style("font-size", "1.1rem")
        .style("margin-right", "0.5rem")
        .style("color", "var(--primary-color)");

    const participantSelect = participantSelector.append("select")
        .attr("id", "participant-select")
        .style("padding", "0.5rem")
        .style("border-radius", "4px")
        .style("border", "1px solid #6c90b0")
        .style("background-color", "#7ca1cc")
        .style("font-family", "var(--font-family)")
        .style("color", "white")
        .style("cursor", "pointer");

    // Set up speed control
    const speedControl = controlsContainer.append("div")
        .attr("class", "speed-control")
        .style("margin", "0.5rem")
        .style("grid-column", "1 / -1")
        .style("width", "100%");

    speedControl.append("label")
        .attr("for", "ca-speed-slider")
        .text("Animation Speed: ")
        .style("font-weight", "bold")
        .style("font-size", "1.1rem")
        .style("margin-right", "0.5rem")
        .style("color", "var(--primary-color)");

    speedControl.append("input")
        .attr("type", "range")
        .attr("id", "ca-speed-slider")
        .attr("min", "0.5")
        .attr("max", "5")
        .attr("step", "0.1")
        .attr("value", "1")
        .style("width", "75%")
        .style("margin", "0 0.5rem")
        .style("vertical-align", "middle")
        .style("accent-color", "#6186af")
        .on("input", function () {
            animationSpeed = +this.value;
            d3.select("#ca-speed-value").text(`${animationSpeed}x`);
        });

    speedControl.append("span")
        .attr("id", "ca-speed-value")
        .text("1x");

    // Add more vertical space between visualizations
    d3.select("#chest-vis").style("margin-bottom", "40px"); // Add 40px space between graphs

    // Set up dimensions - adjust height for two graphs with more separation
    const graphHeight = Math.floor(height / 2); // Use full half of total height for each graph
    const innerGraphHeight = graphHeight - margin.top - margin.bottom;

    // Create SVG elements for chest and abdominal - increased height
    const svgChest = d3.select("#chest-vis")
        .append("svg")
        .attr("width", "100%")
        .attr("height", graphHeight) // Explicit height in pixels for larger graphs
        .attr("viewBox", `0 0 ${width} ${graphHeight}`) // Adjust height for each graph
        .attr("preserveAspectRatio", "xMidYMid meet");

    const svgAbd = d3.select("#abdominal-vis")
        .append("svg")
        .attr("width", "100%")
        .attr("height", graphHeight) // Explicit height in pixels for larger graphs
        .attr("viewBox", `0 0 ${width} ${graphHeight}`) // Adjust height for each graph
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Add titles to each graph
    svgChest.append("text")
        .attr("class", "viz-title")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .text("Chest Motion During Breathing");

    svgAbd.append("text")
        .attr("class", "viz-title")
        .attr("x", width / 2)
        .attr("y", 25)
        .attr("text-anchor", "middle")
        .text("Abdominal Motion During Breathing");

    // Create groups for the two visualizations
    const gChest = svgChest.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const gAbd = svgAbd.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Set up scales
    const x = d3.scaleLinear()
        .range([0, innerWidth]);

    const yChest = d3.scaleLinear()
        .range([innerGraphHeight, 0]);

    const yAbd = d3.scaleLinear()
        .range([innerGraphHeight, 0]);

    const yRatio = d3.scaleLinear()
        .range([innerGraphHeight, 0]);

    // Add axes
    const xAxisChest = gChest.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerGraphHeight})`);

    const yAxisChest = gChest.append("g")
        .attr("class", "y-axis-chest");

    const xAxisAbd = gAbd.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0, ${innerGraphHeight})`);

    const yAxisAbd = gAbd.append("g")
        .attr("class", "y-axis-abd");

    // Add axis labels
    gChest.append("text")
        .attr("class", "x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerGraphHeight + 40)
        .attr("text-anchor", "middle")
        .text("Time (s)");

    gChest.append("text")
        .attr("class", "y-label-chest")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerGraphHeight / 2)
        .attr("y", -80) // Increased from -60 to -80 to avoid overlap
        .attr("text-anchor", "middle")
        .text("Chest Circumference (mm)");

    gAbd.append("text")
        .attr("class", "x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerGraphHeight + 40)
        .attr("text-anchor", "middle")
        .text("Time (s)");

    gAbd.append("text")
        .attr("class", "y-label-abd")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerGraphHeight / 2)
        .attr("y", -80) // Increased from -60 to -80 to avoid overlap
        .attr("text-anchor", "middle")
        .text("Abdominal Circumference (mm)");

    // Create line generators
    const chestLine = d3.line()
        .x(d => x(d.time))
        .y(d => yChest(d.chest))
        .curve(d3.curveBasis);

    const abdLine = d3.line()
        .x(d => x(d.time))
        .y(d => yAbd(d.abd))
        .curve(d3.curveBasis);

    const ratioLine = d3.line()
        .x(d => x(d.time))
        .y(d => yRatio(d.ratio))
        .curve(d3.curveBasis);

    // Create paths for individual participant
    const chestPath = gChest.append("path")
        .attr("class", "chest-line")
        .attr("fill", "none")
        .attr("stroke", "#7ca1cc")
        .attr("stroke-width", 3);

    const abdPath = gAbd.append("path")
        .attr("class", "abd-line")
        .attr("fill", "none")
        .attr("stroke", "#e57a77")
        .attr("stroke-width", 3);

    // Create paths for group averages
    const groupPaths = {};
    Object.keys(groupColors).forEach(group => {
        groupPaths[group] = {
            chest: gChest.append("path")
                .attr("class", `chest-line ${group}-chest-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3)
                .attr("opacity", 0), // Initially hidden
            abd: gAbd.append("path")
                .attr("class", `abd-line ${group}-abd-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", "5,5") // Dashed line for abdominal
                .attr("opacity", 0), // Initially hidden
            ratio: gChest.append("path")
                .attr("class", `ratio-line ${group}-ratio-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3)
                .attr("opacity", 0) // Initially hidden
        };
    });

    // Create indicators for current position
    const chestIndicator = gChest.append("circle")
        .attr("class", "chest-indicator")
        .attr("r", 8)
        .attr("fill", "#7ca1cc");

    const abdIndicator = gAbd.append("circle")
        .attr("class", "abd-indicator")
        .attr("r", 8)
        .attr("fill", "#e57a77");

    // Add legend for individual participant view
    const individualLegend = svgChest.append("g")
        .attr("class", "legend individual-legend")
        .attr("transform", `translate(${innerWidth - 180 + margin.left}, ${graphHeight - 80})`);

    // Chest legend item
    individualLegend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#7ca1cc");

    individualLegend.append("text")
        .attr("x", 25)
        .attr("y", 12.5)
        .text("Chest Motion")
        .style("font-size", "14px");

    // Abdominal legend item
    individualLegend.append("rect")
        .attr("x", 0)
        .attr("y", 25)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", "#e57a77");

    individualLegend.append("text")
        .attr("x", 25)
        .attr("y", 37.5)
        .text("Abdominal Motion")
        .style("font-size", "14px");

    // Add legend for group view
    const groupLegend = svgChest.append("g")
        .attr("class", "legend group-legend")
        .attr("transform", `translate(${innerWidth - 180 + margin.left}, ${graphHeight - 120})`)
        .style("opacity", 0); // Initially hidden

    // Add group legend items
    let legendY = 0;
    Object.entries(groupColors).forEach(([group, color]) => {
        // Solid line for chest
        groupLegend.append("line")
            .attr("x1", 0)
            .attr("y1", legendY + 7.5)
            .attr("x2", 15)
            .attr("y2", legendY + 7.5)
            .attr("stroke", color)
            .attr("stroke-width", 3);

        // Group name
        let displayName = group.charAt(0).toUpperCase() + group.slice(1);
        if (displayName === "Healthy") displayName = "Healthy";

        groupLegend.append("text")
            .attr("x", 25)
            .attr("y", legendY + 12.5)
            .text(displayName)
            .style("font-size", "14px");

        legendY += 25;
    });

    // Add stats display
    const statsContainer = d3.select(".section-chest-abdominal")
        .append("div")
        .attr("class", "stats-panel")
        .style("display", "flex")
        .style("justify-content", "space-between")
        .style("margin-top", "1rem")
        .style("gap", "1rem");

    const chestStat = statsContainer.append("div")
        .attr("class", "stat-box");

    chestStat.append("h3")
        .text("Chest Circumference");

    chestStat.append("div")
        .attr("id", "current-chest")
        .text("0.00 mm");

    const abdStat = statsContainer.append("div")
        .attr("class", "stat-box");

    abdStat.append("h3")
        .text("Abdominal Circumference");

    abdStat.append("div")
        .attr("id", "current-abd")
        .text("0.00 mm");

    const ratioStat = statsContainer.append("div")
        .attr("class", "stat-box");

    ratioStat.append("h3")
        .text("Chest/Abd Ratio");

    ratioStat.append("div")
        .attr("id", "current-ratio")
        .text("0.00");

    // Animation variables
    let animationFrameId;
    let subjectGroups = {};

    // Load subject info
    d3.csv("subject-info.csv")
        .then(subjectData => {
            // Parse subject classifications
            subjectData.forEach(subject => {
                const subjectId = parseInt(subject["Subject Number"], 10);
                if (isNaN(subjectId)) return;

                const classification = subject["Trial Classification"];
                if (!classification) return;

                let group;
                if (classification.includes("Normal")) {
                    group = "healthy";
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
                subjectGroups[subjectId] = group;
            });

            // Populate participant selector
            populateParticipantSelect();

            // Compute averaged data for each group
            computeGroupAverages();
        })
        .catch(error => {
            console.error("Error loading subject info:", error);
            d3.select(".section-chest-abdominal")
                .append("div")
                .attr("class", "error-message")
                .style("color", "red")
                .style("text-align", "center")
                .style("padding", "20px")
                .html(`<p>Error loading subject data: ${error.message}</p>`);
        });

    // Populate participant selector
    function populateParticipantSelect() {
        // Add "All Groups" option
        participantSelect.append("option")
            .attr("value", "all")
            .text("All Groups (Comparison)");

        // Add individual participants
        for (let i = 1; i <= 80; i++) {
            const group = subjectGroups[i] || "unknown";
            const groupName = group.charAt(0).toUpperCase() + group.slice(1);

            participantSelect.append("option")
                .attr("value", i)
                .text(`Subject ${i.toString().padStart(2, '0')} (${groupName})`)
                .attr("data-group", group);
        }

        // Set up change listener
        participantSelect.on("change", function () {
            selectedParticipant = this.value;

            if (selectedParticipant === "all") {
                animateAllGroups();
            } else {
                animateParticipant(selectedParticipant);
            }
        });

        // Initialize with first participant
        participantSelect.property("selectedIndex", 1);
        animateParticipant(selectedParticipant);
    }

    // Compute averaged data for each group
    function computeGroupAverages() {
        // Group subjects by classification
        const subjectsByGroup = {};
        Object.keys(groupColors).forEach(group => {
            subjectsByGroup[group] = [];
            for (let id in subjectGroups) {
                if (subjectGroups[id] === group) {
                    subjectsByGroup[group].push(parseInt(id, 10));
                }
            }
        });

        // Load data for all subjects in each group (up to 5 per group for performance)
        const groupPromises = Object.entries(subjectsByGroup).map(([group, subjectIds]) => {
            // Sample up to 5 subjects per group
            const sampleSubjects = subjectIds.slice(0, 5);

            const subjectPromises = sampleSubjects.map(id => {
                const fileName = `Processed_Dataset/ProcessedData_Subject${String(id).padStart(2, '0')}.csv`;
                return d3.csv(fileName)
                    .then(data => {
                        return data.map(d => ({
                            time: +d["Time (Aeration Data)_[s]"],
                            chest: +d["Chest [mm]"],
                            abd: +d["Abd [mm]"]
                        })).filter(d => d.time <= 1000); // Limit to 1000 seconds
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
            // Create time-binned average data for each group
            const binSize = 0.1; // 100ms bins

            groupData.forEach(group => {
                const allData = group.subjectData;
                if (allData.length === 0) return;

                // Create bins from 0 to 1000 seconds
                const bins = {};
                for (let t = 0; t <= 1000; t += binSize) {
                    bins[t.toFixed(1)] = {
                        count: 0,
                        totalChest: 0,
                        totalAbd: 0
                    };
                }

                // Sum up values in each bin
                allData.forEach(subjectData => {
                    subjectData.forEach(point => {
                        const binKey = (Math.floor(point.time / binSize) * binSize).toFixed(1);
                        if (bins[binKey]) {
                            bins[binKey].count++;
                            bins[binKey].totalChest += point.chest;
                            bins[binKey].totalAbd += point.abd;
                        }
                    });
                });

                // Calculate averages and create data points
                averagedGroupData[group.group] = Object.entries(bins)
                    .map(([time, values]) => ({
                        time: parseFloat(time),
                        chest: values.count > 0 ? values.totalChest / values.count : 0,
                        abd: values.count > 0 ? values.totalAbd / values.count : 0
                    }))
                    .filter(d => d.chest > 0 && d.abd > 0) // Filter out empty bins
                    .sort((a, b) => a.time - b.time); // Sort by time
            });

            console.log("Averaged group data created:", Object.keys(averagedGroupData));
        }).catch(error => {
            console.error("Error computing group averages:", error);
        });
    }

    // Animate individual participant - MODIFIED to use separate scales
    function animateParticipant(subjectId) {
        // Cancel any existing animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Reset animation variables
        currentTime = 0;

        // Show individual legend, hide group legend
        individualLegend.style("opacity", 1);
        groupLegend.style("opacity", 0);

        // Show individual paths, hide group paths
        chestPath.attr("opacity", 1);
        abdPath.attr("opacity", 1);
        chestIndicator.attr("opacity", 1);
        abdIndicator.attr("opacity", 1);

        // Make sure both visualizations are visible
        d3.select("#chest-vis")
            .style("opacity", 1)
            .style("height", "auto")
            .style("margin-bottom", "40px"); // Add spacing between graphs

        d3.select("#abdominal-vis")
            .style("opacity", 1)
            .style("height", "auto");

        d3.select(".section-chest-abdominal h2").text("Chest vs. Abdominal Motion Comparison");

        Object.values(groupPaths).forEach(paths => {
            paths.chest.attr("opacity", 0);
            paths.abd.attr("opacity", 0);
            paths.ratio.attr("opacity", 0);
        });

        // Show stats
        statsContainer.style("display", "flex");

        // Update subject info display
        svgChest.selectAll(".subject-info").remove();
        const group = subjectGroups[subjectId] || "unknown";
        svgChest.append("text")
            .attr("class", "subject-info")
            .attr("x", 10)
            .attr("y", 20)
            .text(`Subject: ${subjectId} (${group})`)
            .style("font-size", "14px")
            .style("font-weight", "bold");

        // Load data for the selected subject
        const fileName = `Processed_Dataset/ProcessedData_Subject${String(subjectId).padStart(2, '0')}.csv`;

        d3.csv(fileName)
            .then(data => {
                // Process data - limit to 1000 seconds as specified
                let processedData = data.map(d => ({
                    time: +d["Time (Aeration Data)_[s]"],
                    chest: +d["Chest [mm]"],
                    abd: +d["Abd [mm]"]
                })).filter(d => d.time <= 1000);

                // Set up scales for chest with SEPARATE BOUNDS
                x.domain([0, timeWindow]);

                // Calculate separate extents for chest and abdominal
                const chestExtent = d3.extent(processedData, d => d.chest);
                const chestMargin = (chestExtent[1] - chestExtent[0]) * 0.05; // 5% margin
                const chestMin = chestExtent[0] - chestMargin;
                const chestMax = chestExtent[1] + chestMargin;

                // Calculate separate extents for abdominal
                const abdExtent = d3.extent(processedData, d => d.abd);
                const abdMargin = (abdExtent[1] - abdExtent[0]) * 0.05; // 5% margin
                const abdMin = abdExtent[0] - abdMargin;
                const abdMax = abdExtent[1] + abdMargin;

                // Apply separate scales
                yChest.domain([chestMin, chestMax]);
                yAbd.domain([abdMin, abdMax]);

                // Update axes
                xAxisChest.call(d3.axisBottom(x).ticks(10));
                yAxisChest.call(d3.axisLeft(yChest).ticks(5));
                xAxisAbd.call(d3.axisBottom(x).ticks(10));
                yAxisAbd.call(d3.axisLeft(yAbd).ticks(5));

                // Animation function
                function animate() {
                    // Get data for current time window
                    const visibleData = processedData.filter(d =>
                        d.time >= currentTime && d.time <= currentTime + timeWindow
                    );

                    if (visibleData.length === 0) {
                        // Reset to beginning if no data
                        currentTime = 0;
                        animate();
                        return;
                    }

                    // Update lines
                    chestPath.datum(visibleData)
                        .attr("d", chestLine);

                    abdPath.datum(visibleData)
                        .attr("d", abdLine);

                    // Update indicators and stats
                    if (visibleData.length > 0) {
                        const latestPoint = visibleData[visibleData.length - 1];

                        // Update indicators
                        chestIndicator
                            .attr("cx", x(latestPoint.time))
                            .attr("cy", yChest(latestPoint.chest));

                        abdIndicator
                            .attr("cx", x(latestPoint.time))
                            .attr("cy", yAbd(latestPoint.abd));

                        // Update stats
                        d3.select("#current-chest")
                            .text(`${latestPoint.chest.toFixed(2)} mm`)
                            .style("color", "#7ca1cc");

                        d3.select("#current-abd")
                            .text(`${latestPoint.abd.toFixed(2)} mm`)
                            .style("color", "#e57a77");

                        const ratio = latestPoint.chest / latestPoint.abd;
                        d3.select("#current-ratio")
                            .text(ratio.toFixed(4))
                            .style("color", "#2c3e50");
                    }

                    // Advance time
                    currentTime += 0.02 * animationSpeed;

                    // Update x domain
                    x.domain([currentTime, currentTime + timeWindow]);

                    // Update x-axis
                    xAxisChest.call(d3.axisBottom(x).ticks(10));
                    xAxisAbd.call(d3.axisBottom(x).ticks(10));

                    // Continue animation
                    animationFrameId = requestAnimationFrame(animate);
                }

                // Start animation
                animate();
            })
            .catch(error => {
                console.error("Error loading data:", error);
                d3.select(".section-chest-abdominal")
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

    // Animate all groups - MODIFIED to fade out the abdominal graph
    function animateAllGroups() {
        // Cancel any existing animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Reset animation variables
        currentTime = 0;

        // Hide individual legend and elements; show group legend and ratio paths
        individualLegend.style("opacity", 0);
        groupLegend.style("opacity", 1);
        chestPath.attr("opacity", 0);
        abdPath.attr("opacity", 0);
        chestIndicator.attr("opacity", 0);
        abdIndicator.attr("opacity", 0);

        // Update section title
        d3.select(".section-chest-abdominal h2").text("Chest/Abdominal Ratio Comparison Across Groups");

        // FADE OUT the abdominal visualization
        d3.select("#abdominal-vis")
            .style("opacity", 0)
            .style("height", "0px")
            .style("overflow", "hidden");

        // Increase height of chest viz to take full space - MAKE EVEN LARGER
        d3.select("#chest-vis")
            .style("opacity", 1)
            .style("height", "600px") // Increased from 500px to 600px
            .style("margin-bottom", "0");

        // Show ratio paths, hide individual lines
        Object.values(groupPaths).forEach(paths => {
            paths.chest.attr("opacity", 0);
            paths.abd.attr("opacity", 0);
            paths.ratio.attr("opacity", 1); // Show only ratio lines
        });

        // Hide stats and update info display for ratio comparison
        statsContainer.style("display", "none");
        svgChest.selectAll(".subject-info").remove();
        svgChest.append("text")
            .attr("class", "subject-info")
            .attr("x", 10)
            .attr("y", 20)
            .text("Group Comparison (Chest/Abd Ratio)")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        // Compute combined ratio values across groups
        let allRatioValues = [];
        Object.values(averagedGroupData).forEach(groupData => {
            groupData.forEach(d => {
                const ratioVal = d.abd !== 0 ? d.chest / d.abd : 0;
                if (ratioVal > 0) allRatioValues.push(ratioVal);
            });
        });

        // Set up scales using ratio values with BETTER MARGINS
        x.domain([0, timeWindow]);

        // Compute margins dynamically
        const ratioExtent = d3.extent(allRatioValues);
        const ratioMargin = (ratioExtent[1] - ratioExtent[0]) * 0.1; // 10% margin
        const ratioMin = Math.max(0, ratioExtent[0] - ratioMargin); // Don't go below 0
        const ratioMax = ratioExtent[1] + ratioMargin;

        yRatio.domain([ratioMin, ratioMax]);

        // Update y-axis label for ratio comparison
        gChest.select(".y-label-chest")
            .text("Chest/Abd Ratio");

        // Hide the right y-axis label
        gAbd.select(".y-label-abd")
            .style("opacity", 0);

        // Update axes (using yAxisChest for ratio)
        xAxisChest.call(d3.axisBottom(x).ticks(10));
        yAxisChest.call(d3.axisLeft(yRatio).ticks(5));
        // Hide the right axis completely
        yAxisAbd.style("opacity", 0);

        // Animation function for ratio view
        function animate() {
            let continueAnimation = false;

            // Update each group's data
            Object.entries(averagedGroupData).forEach(([group, data]) => {
                const visibleData = data.filter(d =>
                    d.time >= currentTime && d.time <= currentTime + timeWindow
                );
                if (visibleData.length > 0) {
                    continueAnimation = true;
                    // Convert to ratio data
                    const ratioData = visibleData.map(d => ({
                        time: d.time,
                        ratio: d.abd !== 0 ? d.chest / d.abd : 0
                    }));
                    groupPaths[group].ratio
                        .datum(ratioData)
                        .attr("d", ratioLine);
                }
            });

            if (!continueAnimation) {
                // Reset if all data has been played
                currentTime = 0;
                animate();
                return;
            }

            // Advance time
            currentTime += 0.02 * animationSpeed;

            // Update x domain
            x.domain([currentTime, currentTime + timeWindow]);
            xAxisChest.call(d3.axisBottom(x).ticks(10));

            // Continue animation
            animationFrameId = requestAnimationFrame(animate);
        }

        // Start animation
        animate();
    }

    // Modify animateParticipant to show the right y-axis and label when returning from group view
    function animateParticipant(subjectId) {
        // Cancel any existing animation
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Reset animation variables
        currentTime = 0;

        // Show individual legend, hide group legend
        individualLegend.style("opacity", 1);
        groupLegend.style("opacity", 0);

        // Show individual paths, hide group paths
        chestPath.attr("opacity", 1);
        abdPath.attr("opacity", 1);
        chestIndicator.attr("opacity", 1);
        abdIndicator.attr("opacity", 1);

        Object.values(groupPaths).forEach(paths => {
            paths.chest.attr("opacity", 0);
            paths.abd.attr("opacity", 0);
            paths.ratio.attr("opacity", 0);
        });

        // Show stats
        statsContainer.style("display", "flex");

        // Update subject info display
        svgChest.selectAll(".subject-info").remove();
        const group = subjectGroups[subjectId] || "unknown";
        svgChest.append("text")
            .attr("class", "subject-info")
            .attr("x", 10)
            .attr("y", 20)
            .text(`Subject: ${subjectId} (${group})`)
            .style("font-size", "14px")
            .style("font-weight", "bold");

        // Load data for the selected subject
        const fileName = `Processed_Dataset/ProcessedData_Subject${String(subjectId).padStart(2, '0')}.csv`;

        d3.csv(fileName)
            .then(data => {
                // Process data - limit to 1000 seconds as specified
                let processedData = data.map(d => ({
                    time: +d["Time (Aeration Data)_[s]"],
                    chest: +d["Chest [mm]"],
                    abd: +d["Abd [mm]"]
                })).filter(d => d.time <= 1000);

                // Set up scales
                x.domain([0, timeWindow]);

                // Find combined min and max for chest and abdominal
                const combinedMin = Math.min(d3.min(processedData, d => d.chest), d3.min(processedData, d => d.abd)) * 0.999;
                const combinedMax = Math.max(d3.max(processedData, d => d.chest), d3.max(processedData, d => d.abd)) * 1.001;

                yChest.domain([combinedMin, combinedMax]);
                yAbd.domain([combinedMin, combinedMax]);

                // Update axes
                xAxisChest.call(d3.axisBottom(x).ticks(10));
                yAxisChest.call(d3.axisLeft(yChest).ticks(5));
                xAxisAbd.call(d3.axisBottom(x).ticks(10));
                yAxisAbd.call(d3.axisLeft(yAbd).ticks(5));

                // Animation function
                function animate() {
                    // Get data for current time window
                    const visibleData = processedData.filter(d =>
                        d.time >= currentTime && d.time <= currentTime + timeWindow
                    );

                    if (visibleData.length === 0) {
                        // Reset to beginning if no data
                        currentTime = 0;
                        animate();
                        return;
                    }

                    // Update lines
                    chestPath.datum(visibleData)
                        .attr("d", chestLine);

                    abdPath.datum(visibleData)
                        .attr("d", abdLine);

                    // Update indicators and stats
                    if (visibleData.length > 0) {
                        const latestPoint = visibleData[visibleData.length - 1];

                        // Update indicators
                        chestIndicator
                            .attr("cx", x(latestPoint.time))
                            .attr("cy", yChest(latestPoint.chest));

                        abdIndicator
                            .attr("cx", x(latestPoint.time))
                            .attr("cy", yAbd(latestPoint.abd));

                        // Update stats
                        d3.select("#current-chest")
                            .text(`${latestPoint.chest.toFixed(2)} mm`)
                            .style("color", "#7ca1cc");

                        d3.select("#current-abd")
                            .text(`${latestPoint.abd.toFixed(2)} mm`)
                            .style("color", "#e57a77");

                        const ratio = latestPoint.chest / latestPoint.abd;
                        d3.select("#current-ratio")
                            .text(ratio.toFixed(4))
                            .style("color", "#2c3e50");
                    }

                    // Advance time
                    currentTime += 0.02 * animationSpeed;

                    // Update x domain
                    x.domain([currentTime, currentTime + timeWindow]);

                    // Update x-axis
                    xAxisChest.call(d3.axisBottom(x).ticks(10));
                    xAxisAbd.call(d3.axisBottom(x).ticks(10));

                    // Continue animation
                    animationFrameId = requestAnimationFrame(animate);
                }

                // Start animation
                animate();
            })
            .catch(error => {
                console.error("Error loading data:", error);
                d3.select("#chest-abdominal-vis")
                    .append("div")
                    .attr("class", "error-message")
                    .style("color", "red")
                    .style("text-align", "center")
                    .style("padding", "20px")
                    .html(`<p>Error loading data for Subject ${subjectId}.</p>
                           <p>Please make sure the file exists and is correctly formatted.</p>
                           <p>Technical details: ${error.message}</p>`);
            });

        // Restore the right y-axis and its label
        yAxisAbd.style("opacity", 1);
        gAbd.select(".y-label-abd").style("opacity", 1);

        // Restore the left y-axis label
        gChest.select(".y-label-chest").text("Chest Circumference (mm)");
    }
});