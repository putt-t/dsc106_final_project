document.addEventListener('DOMContentLoaded', function () {
    const width = 900;
    const height = 800;
    const margin = { top: 50, right: 200, bottom: 50, left: 100 };
    const innerWidth = width - margin.left - margin.right;

    const groupColors = {
        healthy: '#6c90b0',
        asthma: '#e57a77',
        smoker: "#9b59b6",
        vaper: "#f1c40f"
    };

    const averagedGroupData = {};
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
        .attr("transform", "rotate(-90)")
        .attr("x", -innerGraphHeight / 2)
        .attr("y", -80)
        .attr("text-anchor", "middle")
        .text("Abdominal Circumference (mm)");

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
                animateAllGroups();
            } else {
                animateParticipant(selectedParticipant);
            }
        });

        participantSelect.property("selectedIndex", 1);
        animateParticipant(selectedParticipant);
    }

    function computeGroupAverages() {
        const subjectsByGroup = {};
        Object.keys(groupColors).forEach(group => {
            subjectsByGroup[group] = [];
            for (let id in subjectGroups) {
                if (subjectGroups[id] === group) {
                    subjectsByGroup[group].push(parseInt(id, 10));
                }
            }
        });

        const groupPromises = Object.entries(subjectsByGroup).map(([group, subjectIds]) => {
            const sampleSubjects = subjectIds.slice(0, 5);

            const subjectPromises = sampleSubjects.map(id => {
                const fileName = `Processed_Dataset/ProcessedData_Subject${String(id).padStart(2, '0')}.csv`;
                return d3.csv(fileName)
                    .then(data => {
                        return data.map(d => ({
                            time: +d["Time (Aeration Data)_[s]"],
                            chest: +d["Chest [mm]"],
                            abd: +d["Abd [mm]"]
                        })).filter(d => d.time <= 1000);
                    })
                    .catch(error => {
                        console.error(`Error loading data for subject ${id}:`, error);
                        return [];
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
            const binSize = 0.1;

            groupData.forEach(group => {
                const allData = group.subjectData;
                if (allData.length === 0) return;

                const bins = {};
                for (let t = 0; t <= 1000; t += binSize) {
                    bins[t.toFixed(1)] = {
                        count: 0,
                        totalChest: 0,
                        totalAbd: 0
                    };
                }

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

                averagedGroupData[group.group] = Object.entries(bins)
                    .map(([time, values]) => ({
                        time: parseFloat(time),
                        chest: values.count > 0 ? values.totalChest / values.count : 0,
                        abd: values.count > 0 ? values.totalAbd / values.count : 0
                    }))
                    .filter(d => d.chest > 0 && d.abd > 0)
                    .sort((a, b) => a.time - b.time);
            });

            console.log("Averaged group data created:", Object.keys(averagedGroupData));
        }).catch(error => {
            console.error("Error computing group averages:", error);
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
                })).filter(d => d.time <= 1000);

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

        yAxisAbd.style("opacity", 1);
        gAbd.select(".y-label-abd").style("opacity", 1);

        gChest.select(".y-label-chest").text("Chest Circumference (mm)");
    }

    function animateAllGroups() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        currentTime = 0;

        individualLegend.style("opacity", 0);
        groupLegend.style("opacity", 1);
        chestPath.attr("opacity", 0);
        abdPath.attr("opacity", 0);
        chestIndicator.attr("opacity", 0);
        abdIndicator.attr("opacity", 0);

        d3.select(".section-chest-abdominal h2").text("Chest/Abdominal Ratio Comparison Across Groups");

        d3.select("#abdominal-vis")
            .style("opacity", 0)
            .style("height", "0px")
            .style("overflow", "hidden");

        d3.select("#chest-vis")
            .style("opacity", 1)
            .style("height", "600px")
            .style("margin-bottom", "0");

        Object.values(groupPaths).forEach(paths => {
            paths.chest.attr("opacity", 0);
            paths.abd.attr("opacity", 0);
            paths.ratio.attr("opacity", 1);
        });

        statsContainer.style("display", "none");
        svgChest.selectAll(".subject-info").remove();
        svgChest.append("text")
            .attr("class", "subject-info")
            .attr("x", 10)
            .attr("y", 20)
            .text("Group Comparison (Chest/Abd Ratio)")
            .style("font-size", "14px")
            .style("font-weight", "bold");

        let allRatioValues = [];
        Object.values(averagedGroupData).forEach(groupData => {
            groupData.forEach(d => {
                const ratioVal = d.abd !== 0 ? d.chest / d.abd : 0;
                if (ratioVal > 0) allRatioValues.push(ratioVal);
            });
        });

        x.domain([0, timeWindow]);

        const ratioExtent = d3.extent(allRatioValues);
        const ratioMargin = (ratioExtent[1] - ratioExtent[0]) * 0.1;
        const ratioMin = Math.max(0, ratioExtent[0] - ratioMargin);
        const ratioMax = ratioExtent[1] + ratioMargin;

        yRatio.domain([ratioMin, ratioMax]);

        gChest.select(".y-label-chest")
            .text("Chest/Abd Ratio");

        gAbd.select(".y-label-abd")
            .style("opacity", 0);

        xAxisChest.call(d3.axisBottom(x).ticks(10));
        yAxisChest.call(d3.axisLeft(yRatio).ticks(5));
        yAxisAbd.style("opacity", 0);

        function animate() {
            let continueAnimation = false;

            Object.entries(averagedGroupData).forEach(([group, data]) => {
                const visibleData = data.filter(d =>
                    d.time >= currentTime && d.time <= currentTime + timeWindow
                );
                if (visibleData.length > 0) {
                    continueAnimation = true;
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
                currentTime = 0;
                animate();
                return;
            }

            currentTime += 0.02 * animationSpeed;

            x.domain([currentTime, currentTime + timeWindow]);
            xAxisChest.call(d3.axisBottom(x).ticks(10));

            animationFrameId = requestAnimationFrame(animate);
        }

        animate();
    }
});