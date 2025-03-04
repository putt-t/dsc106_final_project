// Data loading and processing utilities
class DataLoader {
    constructor() {
        this.subjectInfo = null;
        this.respiratoryData = {};
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    async loadData() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise(async (resolve) => {
            try {
                // Load subject info
                this.subjectInfo = await d3.csv("../../subject-info.csv", d => {
                    return {
                        subjectNumber: +d["Subject Number"],
                        sex: d["Sex (M/F)"],
                        height: +d["Height [cm]"],
                        weight: +d["Weight [kg]"],
                        age: +d["Age [years]"],
                        asthma: d["Asthma (Y/N)"] === "Y",
                        medication: d["Medication"],
                        dosageFrequency: d["Dosage Frequency"],
                        smokingHistory: d["History of Smoking (Y/N)"] === "Y",
                        currentSmoker: d["Current Smoker (Y/N)"] === "Y",
                        quitSmokingTime: d["How long since you quit smoking"],
                        smokingFrequency: d["Smoking Frequency"],
                        timeAsSmoker: d["Time as a smoker"],
                        vapingHistory: d["History of Vaping (Y/N)"] === "Y",
                        currentVaper: d["Current Vaper (Y/N)"] === "Y",
                        quitVapingTime: d["How long since you quit vaping"],
                        vapingFrequency: d["Vaping Frequency"],
                        timeAsVaper: d["Time as a vaper"],
                        trialClassification: d["Trial Classification"],
                        chestDepth: +d["Chest Depth [mm]"],
                        chestWidth: +d["Chest Width [mm]"]
                    };
                });
                // Load respiratory data for each subject
                const loadingPromises = this.subjectInfo.map(subject => {
                    // Check if subject number is valid (greater than 0)
                    if (!subject.subjectNumber || subject.subjectNumber <= 0) {
                        console.warn(`Invalid subject number: ${subject.subjectNumber}, skipping`);
                        return Promise.resolve(); // Skip this subject
                    }

                    // Ensure subject numbers start at 1, not 0, and pad with leading zeros
                    const subjectId = String(subject.subjectNumber).padStart(2, '0');

                    console.log(`Loading data for subject ${subjectId}`); // Debug log

                    return d3.csv(`../../Processed_Dataset/ProcessedData_Subject${subjectId}.csv`, d => {
                        return {
                            time: +d["Time [s]"],
                            pressure: +d["Pressure [cmH2O]"],
                            flow: +d["Flow [L/s]"],
                            v_tidal: +d["V_tidal [L]"],
                            chest: +d["Chest [mm]"],
                            abd: +d["Abd [mm]"],
                            inspiratoryIndices: +d["Inspiratory Indicies"],
                            timeAeration: +d["Time (Aeration Data)_[s]"],
                            globalAeration: +d["Global Aeration"],
                            inspiratoryIndicesAeration: +d["Inspiratory Indicies (Aeration Data)"]
                        };
                    }).then(data => {
                        this.respiratoryData[subject.subjectNumber] = data;
                    }).catch(error => {
                        console.warn(`Failed to load data for subject ${subject.subjectNumber} (ID: ${subjectId}): ${error.message}`);
                        // Return empty array so Promise.all doesn't fail completely
                        this.respiratoryData[subject.subjectNumber] = [];
                    });
                });

                await Promise.all(loadingPromises);
                this.isLoaded = true;
                resolve();
            } catch (error) {
                console.error("Error loading data:", error);
            }
        });

        return this.loadingPromise;
    }

    getSubjectInfo() {
        return this.subjectInfo;
    }

    getRespiratoryData(subjectNumber) {
        return this.respiratoryData[subjectNumber];
    }

    getAllRespiratoryData() {
        return this.respiratoryData;
    }

    getGroupedData(groupBy) {
        const grouped = {};

        this.subjectInfo.forEach(subject => {
            let key;

            switch (groupBy) {
                case 'sex':
                    key = subject.sex;
                    break;
                case 'asthma':
                    key = subject.asthma ? 'Asthmatic' : 'Non-Asthmatic';
                    break;
                case 'smoking':
                    key = subject.smokingHistory ? 'Smoking History' : 'No Smoking History';
                    break;
                case 'vaping':
                    key = subject.vapingHistory ? 'Vaping History' : 'No Vaping History';
                    break;
                default:
                    key = 'All';
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }

            grouped[key].push(subject.subjectNumber);
        });

        return grouped;
    }

    getAverageRespiratoryData(subjectNumbers, metric, timeWindow = 5) {
        // Get the first timeWindow seconds of data for each subject
        const allData = subjectNumbers.map(subjectNumber => {
            const data = this.respiratoryData[subjectNumber];
            return data.filter(d => d.time >= 0 && d.time <= timeWindow);
        });

        // Find the minimum length to normalize data points
        const minLength = Math.min(...allData.map(d => d.length));

        // Resample data to have the same number of points
        const resampledData = allData.map(data => {
            const indices = Array.from({ length: minLength }, (_, i) =>
                Math.floor(i * (data.length / minLength)));
            return indices.map(i => data[i]);
        });

        // Calculate average for each time point
        const averageData = [];
        for (let i = 0; i < minLength; i++) {
            const values = resampledData.map(d => d[i][metric]);
            const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
            averageData.push({
                time: resampledData[0][i].time,
                [metric]: avg
            });
        }

        return averageData;
    }
}

// Create a singleton instance
const dataLoader = new DataLoader();
