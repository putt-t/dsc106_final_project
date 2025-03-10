document.addEventListener('DOMContentLoaded', function () {
    const width = 900;
    const height = 800;
    const margin = { top: 50, right: 200, bottom: 50, left: 100 };
    const innerWidth = width - margin.left - margin.right;

    const groupColors = {
        normal: '#6c90b0',
        asthma: '#e57a77',
        smoker: "#9b59b6",
        vaper: "#f1c40f"
    };

    let averagedGroupData = {};
    const timeWindow = 10;
    let currentTime = 0;
    let animationSpeed = 1;
    let selectedParticipant = "1";

    const controlsContainer = d3.select(".section-chest-abdominal")
        .insert("div", "#chest-vis")
        .attr("class", "controls-container")
        .style("margin-bottom", "1.5rem")
        .style("padding", "1rem")
        .style("background-color", "var(--light-gray)")
        .style("border-radius", "8px");

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

    d3.select("#chest-vis").style("margin-bottom", "40px");

    const graphHeight = Math.floor(height / 2);
    const innerGraphHeight = graphHeight - margin.top - margin.bottom;

    const svgChest = d3.select("#chest-vis")
        .append("svg")
        .attr("width", "100%")
        .attr("height", graphHeight)
        .attr("viewBox", `0 0 ${width} ${graphHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    const svgAbd = d3.select("#abdominal-vis")
        .append("svg")
        .attr("width", "100%")
        .attr("height", graphHeight)
        .attr("viewBox", `0 0 ${width} ${graphHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

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

    const gChest = svgChest.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const gAbd = svgAbd.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const x = d3.scaleLinear()
        .range([0, innerWidth]);

    const yChest = d3.scaleLinear()
        .range([innerGraphHeight, 0]);

    const yAbd = d3.scaleLinear()
        .range([innerGraphHeight, 0]);

    const yRatio = d3.scaleLinear()
        .range([innerGraphHeight, 0]);

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

    gChest.append("text")
        .attr("class", "x-label")
        .attr("x", innerWidth / 2)
        .attr("y", innerGraphHeight + 40)
        .attr("text-anchor", "middle")
        .text("Time (s)");

    gChest.append("text")
        .attr("class", "y-label-chest")
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerGraphHeight / 2)
        .attr("y", -80)
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
        .attr("class", "y-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerGraphHeight / 2)
        .attr("y", -80)
        .attr("text-anchor", "middle")
        .text("Abdominal Circumference (mm)");

    const chestLine = d3.line()
        .x(d => x(d.time))
        .y(d => yChest(d.chest))
        .curve(d3.curveLinear);

    const abdLine = d3.line()
        .x(d => x(d.time))
        .y(d => yAbd(d.abd))
        .curve(d3.curveLinear);

    const ratioLine = d3.line()
        .x(d => x(d.time))
        .y(d => yRatio(d.ratio))
        .curve(d3.curveLinear);

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

    const groupPaths = {};
    Object.keys(groupColors).forEach(group => {
        groupPaths[group] = {
            chest: gChest.append("path")
                .attr("class", `chest-line ${group}-chest-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3)
                .attr("opacity", 0),
            abd: gAbd.append("path")
                .attr("class", `abd-line ${group}-abd-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3)
                .attr("stroke-dasharray", "5,5")
                .attr("opacity", 0),
            ratio: gChest.append("path")
                .attr("class", `ratio-line ${group}-ratio-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3)
                .attr("opacity", 0)
        };
    });

    const chestIndicator = gChest.append("circle")
        .attr("class", "chest-indicator")
        .attr("r", 8)
        .attr("fill", "#7ca1cc");

    const abdIndicator = gAbd.append("circle")
        .attr("class", "abd-indicator")
        .attr("r", 8)
        .attr("fill", "#e57a77");

    const individualLegend = svgChest.append("g")
        .attr("class", "legend individual-legend")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 20})`);

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

    const groupLegend = svgChest.append("g")
        .attr("class", "legend group-legend")
        .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 20})`)
        .style("opacity", 0);

    let legendY = 0;
    Object.entries(groupColors).forEach(([group, color]) => {
        groupLegend.append("line")
            .attr("x1", 0)
            .attr("y1", legendY + 7.5)
            .attr("x2", 15)
            .attr("y2", legendY + 7.5)
            .attr("stroke", color)
            .attr("stroke-width", 3);

        let displayName = group.charAt(0).toUpperCase() + group.slice(1);
        if (displayName === "Healthy") displayName = "Healthy";

        groupLegend.append("text")
            .attr("x", 25)
            .attr("y", legendY + 12.5)
            .text(displayName)
            .style("font-size", "14px");

        legendY += 25;
    });

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

    const groupStatsContainer = d3.select(".section-chest-abdominal")
        .append("div")
        .attr("class", "stats-panel")
        .style("display", "none")
        .style("justify-content", "space-between")
        .style("margin-top", "1rem")
        .style("gap", "1rem");

    Object.entries(groupColors).forEach(([group, color]) => {
        const groupStat = groupStatsContainer.append("div")
            .attr("class", "stat-box");

        groupStat.append("h3")
            .text(group.charAt(0).toUpperCase() + group.slice(1))
            .style("color", color);

        groupStat.append("div")
            .attr("id", `${group}-ratio`)
            .text("0.00")
            .style("color", color);
    });

    let animationFrameId;
    let subjectGroups = {};

    d3.csv("subject-info.csv")
        .then(subjectData => {
            subjectData.forEach(subject => {
                const subjectId = parseInt(subject["Subject Number"], 10);
                if (isNaN(subjectId)) return;

                const classification = subject["Trial Classification"];
                if (!classification) return;

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

                subjectGroups[subjectId] = group;
            });

            populateParticipantSelect();

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

    const comparisonContainer = d3.select(".section-chest-abdominal")
        .insert("div", "#chest-vis")
        .attr("class", "comparison-container")
        .style("display", "none")
        .style("margin-top", "1rem");

    comparisonContainer.append("div")
        .attr("id", "comparison-vis");

    const svgComparison = d3.select("#comparison-vis")
        .append("svg")
        .attr("width", "100%")
        .attr("height", graphHeight)
        .attr("viewBox", `0 0 ${width} ${graphHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    function populateParticipantSelect() {
        participantSelect.append("option")
            .attr("value", "all")
            .text("All Groups (Comparison)");

        for (let i = 1; i <= 80; i++) {
            const group = subjectGroups[i] || "unknown";
            const groupName = group.charAt(0).toUpperCase() + group.slice(1);

            participantSelect.append("option")
                .attr("value", i)
                .text(`Subject ${i.toString().padStart(2, '0')} (${groupName})`)
                .attr("data-group", group);
        }

        participantSelect.on("change", function () {
            selectedParticipant = this.value;

            if (selectedParticipant === "all") {
                showComparisonViz();
                animateAllGroups();
            } else {
                showIndividualViz();
                animateParticipant(selectedParticipant);
            }
        });

        participantSelect.property("selectedIndex", 1);
        animateParticipant(selectedParticipant);
    }

    function computeGroupAverages() {
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
            console.log(averagedGroupData)
            // Trigger initial animation for comparison if "all" is selected
            if (selectedParticipant === "all") {
                animateAllGroups();
            }
        })
            .catch(error => {
                console.error("Error loading grouped data:", error);
                alert("Failed to load group comparison data. See console for details.");
            });
    }


    function animateParticipant(subjectId) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        currentTime = 0;

        d3.select("#abdominal-vis")
            .style("opacity", 1)
            .style("height", "auto")
            .style("overflow", null);

        d3.select("#chest-vis")
            .style("height", "auto")
            .style("margin-bottom", "40px");

        individualLegend.style("opacity", 1);
        groupLegend.style("opacity", 0);

        chestPath.attr("opacity", 1);
        abdPath.attr("opacity", 1);
        chestIndicator.attr("opacity", 1);
        abdIndicator.attr("opacity", 1);

        Object.values(groupPaths).forEach(paths => {
            paths.chest.attr("opacity", 0);
            paths.abd.attr("opacity", 0);
            paths.ratio.attr("opacity", 0);
        });

        statsContainer.style("display", "flex");

        svgChest.selectAll(".subject-info").remove();
        const group = subjectGroups[subjectId] || "unknown";
        svgChest.append("text")
            .attr("class", "subject-info")
            .attr("x", 10)
            .attr("y", 20)
            .text(`Subject: ${subjectId} (${group})`)
            .style("font-size", "14px")
            .style("font-weight", "bold");

        const fileName = `Processed_Dataset/ProcessedData_Subject${String(subjectId).padStart(2, '0')}.csv`;
        d3.csv(fileName)
            .then(data => {
                let processedData = data.map(d => ({
                    time: +d["Time (Aeration Data)_[s]"],
                    chest: +d["Chest [mm]"],
                    abd: +d["Abd [mm]"]
                })).filter(d => d.time <= 300);

                x.domain([0, timeWindow]);

                const chestExtent = d3.extent(processedData, d => d.chest);
                const chestMargin = (chestExtent[1] - chestExtent[0]) * 0.1;
                const chestMin = chestExtent[0] - chestMargin;
                const chestMax = chestExtent[1] + chestMargin;

                const abdExtent = d3.extent(processedData, d => d.abd);
                const abdMargin = (abdExtent[1] - abdExtent[0]) * 0.1;
                const abdMin = abdExtent[0] - abdMargin;
                const abdMax = abdExtent[1] + abdMargin;

                yChest.domain([chestMin, chestMax]);
                yAbd.domain([abdMin, abdMax]);

                xAxisChest.call(d3.axisBottom(x).ticks(10));
                yAxisChest.call(d3.axisLeft(yChest).ticks(5));
                xAxisAbd.call(d3.axisBottom(x).ticks(10));
                yAxisAbd.call(d3.axisLeft(yAbd).ticks(5));

                function animate() {
                    const visibleData = processedData.filter(d =>
                        d.time >= currentTime && d.time <= currentTime + timeWindow
                    );

                    if (visibleData.length === 0) {
                        currentTime = 0;
                        animate();
                        return;
                    }

                    chestPath.datum(visibleData)
                        .attr("d", chestLine);

                    abdPath.datum(visibleData)
                        .attr("d", abdLine);

                    if (visibleData.length > 0) {
                        const latestPoint = visibleData[visibleData.length - 1];
                        chestIndicator
                            .attr("cx", x(latestPoint.time))
                            .attr("cy", yChest(latestPoint.chest));

                        abdIndicator
                            .attr("cx", x(latestPoint.time))
                            .attr("cy", yAbd(latestPoint.abd));

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

                    currentTime += 0.02 * animationSpeed;
                    x.domain([currentTime, currentTime + timeWindow]);

                    xAxisChest.call(d3.axisBottom(x).ticks(10));
                    xAxisAbd.call(d3.axisBottom(x).ticks(10));

                    animationFrameId = requestAnimationFrame(animate);
                }

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
    }

    function showIndividualViz() {
        d3.select("#chest-vis").style("display", "block");
        d3.select("#abdominal-vis").style("display", "block");
        comparisonContainer.style("display", "none");
        statsContainer.style("display", "flex");
        d3.select("#current-chest").style("display", "block");
        d3.select("#current-abd").style("display", "block");
        d3.select("#current-ratio").style("display", "block");

        chestStat.select("h3").text("Chest Circumference");
        abdStat.select("h3").text("Abdominal Circumference");
        ratioStat.select("h3").text("Chest/Abd Ratio");

        gAbd.select(".y-label-abd").style("opacity", 1);
        gChest.select(".y-label-chest").text("Chest Circumference (mm)");

        groupStatsContainer.style("display", "none");
    }

    function showComparisonViz() {
        d3.select("#chest-vis").style("display", "none");
        d3.select("#abdominal-vis").style("display", "none");
        comparisonContainer.style("display", "block");
        statsContainer.style("display", "none");
        groupStatsContainer.style("display", "flex");
    }

    function animateAllGroups() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        currentTime = 0;

        svgComparison.selectAll("*").remove();

        const gComparison = svgComparison.append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        svgComparison.append("text")
            .attr("class", "viz-title")
            .attr("x", width / 2)
            .attr("y", 25)
            .attr("text-anchor", "middle")
            .text("Chest/Abdominal Ratio Comparison Across Groups");

        // Check if we have any data
        let hasData = false;
        for (const group in averagedGroupData) {
            if (averagedGroupData[group].length > 0) {
                hasData = true;
                break;
            }
        }

        if (!hasData) {
            gComparison.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", innerGraphHeight / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("fill", "red")
                .text("No data available for comparison. Check console for details.");
            console.error("No data available in averagedGroupData:", averagedGroupData);
            return;
        }

        const comparisonPaths = {};
        Object.keys(groupColors).forEach(group => {
            comparisonPaths[group] = gComparison.append("path")
                .attr("class", `ratio-line ${group}-ratio-line`)
                .attr("fill", "none")
                .attr("stroke", groupColors[group])
                .attr("stroke-width", 3);
        });

        const xAxis = gComparison.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0, ${innerGraphHeight})`);

        const yAxis = gComparison.append("g")
            .attr("class", "y-axis");

        gComparison.append("text")
            .attr("class", "x-label")
            .attr("x", innerWidth / 2)
            .attr("y", innerGraphHeight + 40)
            .attr("text-anchor", "middle")
            .text("Time (s)");

        gComparison.append("text")
            .attr("class", "y-label")
            .attr("transform", "rotate(-90)")
            .attr("x", -innerGraphHeight / 2)
            .attr("y", -60)
            .attr("text-anchor", "middle")
            .text("Chest/Abd Ratio");

        const comparisonLegend = svgComparison.append("g")
            .attr("class", "legend group-legend")
            .attr("transform", `translate(${width - margin.right + 20}, ${margin.top + 20})`);

        let legendY = 0;
        Object.entries(groupColors).forEach(([group, color]) => {
            comparisonLegend.append("line")
                .attr("x1", 0)
                .attr("y1", legendY + 7.5)
                .attr("x2", 15)
                .attr("y2", legendY + 7.5)
                .attr("stroke", color)
                .attr("stroke-width", 3);

            let displayName = group.charAt(0).toUpperCase() + group.slice(1);
            comparisonLegend.append("text")
                .attr("x", 25)
                .attr("y", legendY + 12.5)
                .text(displayName)
                .style("font-size", "14px");

            legendY += 25;
        });

        // Collect all ratio values to set proper y scale domain
        let allRatioValues = [];
        let maxTime = 0;

        Object.values(averagedGroupData).forEach(groupData => {
            if (groupData.length > 0) {
                groupData.forEach(d => {
                    if (d.ratio && !isNaN(d.ratio) && isFinite(d.ratio)) {
                        allRatioValues.push(d.ratio);
                    }
                    if (d.time > maxTime) {
                        maxTime = d.time;
                    }
                });
            }
        });

        if (allRatioValues.length === 0) {
            gComparison.append("text")
                .attr("x", innerWidth / 2)
                .attr("y", innerGraphHeight / 2)
                .attr("text-anchor", "middle")
                .attr("font-size", "16px")
                .attr("fill", "red")
                .text("No valid ratio values found in the data.");
            return;
        }

        // Improve curve interpolation for smoother lines

        const smoothRatioLine = d3.line()
            .x(d => x(d.time))
            .y(d => yRatio(d.ratio))
            .curve(d3.curveLinear); // Better curve interpolation

        // Set x domain based on data with more appropriate time window
        const effectiveTimeWindow = Math.min(20, maxTime); // Use wider window for smoother visualization
        x.domain([0, effectiveTimeWindow]);

        // Set y domain based on the ratio values
        const ratioExtent = d3.extent(allRatioValues);
        const ratioMargin = (ratioExtent[1] - ratioExtent[0]) * 0.2; // Increase margin
        yRatio.domain([
            Math.max(0, ratioExtent[0] - ratioMargin),
            ratioExtent[1] + ratioMargin
        ]);

        function animate() {
            let continueAnimation = false;

            Object.entries(averagedGroupData).forEach(([group, data]) => {
                if (!data || data.length === 0) return;

                // Get visible data within the current time window
                const visibleData = data.filter(d =>
                    d.time >= currentTime &&
                    d.time <= currentTime + effectiveTimeWindow &&
                    !isNaN(d.ratio) &&
                    isFinite(d.ratio)
                );

                if (visibleData.length > 0) {
                    continueAnimation = true;

                    comparisonPaths[group]
                        .datum(visibleData)
                        .attr("d", smoothRatioLine); // Use the smoother line function

                    // Update the ratio display
                    const latestPoint = visibleData[visibleData.length - 1];
                    if (latestPoint && latestPoint.ratio && !isNaN(latestPoint.ratio)) {
                        d3.select(`#${group}-ratio`)
                            .text(latestPoint.ratio.toFixed(4));
                    }
                }
            });

            if (!continueAnimation) {
                if (currentTime >= maxTime) {
                    currentTime = 0;
                } else {
                    currentTime += effectiveTimeWindow / 2;
                }
                animate();
                return;
            }

            currentTime += 0.02 * animationSpeed;
            x.domain([currentTime, currentTime + effectiveTimeWindow]);
            xAxis.call(d3.axisBottom(x).ticks(10));
            yAxis.call(d3.axisLeft(yRatio).ticks(5));

            animationFrameId = requestAnimationFrame(animate);
        }

        xAxis.call(d3.axisBottom(x).ticks(10));
        yAxis.call(d3.axisLeft(yRatio).ticks(5));

        console.log("Starting animation with data:",
            Object.keys(averagedGroupData).map(g =>
                `${g}: ${averagedGroupData[g].length} points`).join(", "));

        animate();
    }

    showIndividualViz();
    animateParticipant(selectedParticipant);
});