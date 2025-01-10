Module.register("MMM-LetheEmotionsYear", {   
    defaults: {
        fetchInterval: 5 * 60 * 1000,
        datelocales: 'de-AT',
        patid: 21,
        timeout: 8000,
        url: 'http://athen.technikum.fh-joanneum.local:5000/graphql'
    },
    getStyles() {
        return [
            this.file('style.css')
        ];
    },
    getScripts() {
        return [];
    },
    emotionCounts: { // Initialize a count for each emotion
        "sad": 0,
        "excited": 0,
        "ashamed": 0,
        "happy": 0,
        "calm": 0,
        "active": 0,
        "proud": 0,
        "afraid": 0,
        "lonely": 0
    },
    emotionLabelsMap: {
        "sad": "sad",
        "excited": "excited",
        "ashamed": "ashamed",
        "happy": "happy",
        "calm": "calm",
        "active": "active",
        "proud": "proud",
        "afraid": "afraid",
        "lonely": "lonely"
    },
    notificationReceived(notification, payload, sender) {
        if (notification === 'MODULE_DOM_CREATED') {
            this.retrieveEmotionData();
            setInterval(() => {
                this.retrieveEmotionData();
            }, this.config.fetchInterval);
        }
    },
    getDom() {
    const wrapper = document.createElement("div");
    
    if (this.isLoading) {
        wrapper.innerHTML = "Loading...";
        return wrapper;
    } else {
        wrapper.className = "bright";
        // Create a bar chart for emotion counts in the year
        wrapper.innerHTML = `
            <strong>Yearly Emotion Counts:</strong>
            <div style="padding-top: 10px;" class="chart-container">
                ${this.getBarChart()}
            </div>
        `;
        return wrapper;
    }
},
getBarChart() {
    // Create a bar chart for emotions
    const emotionLabels = Object.keys(this.emotionCounts);
    const emotionValues = Object.values(this.emotionCounts);

    const chartWidth = 800; // Fixed width for the chart
    const chartHeight = 300; // Maximum height for the bars
    const barWidth = 60;    // Width of each bar
    const barSpacing = 20;  // Space between bars
    const totalBars = emotionLabels.length;
    const totalChartWidth = totalBars * (barWidth + barSpacing) - barSpacing;
    const offsetX = (chartWidth - totalChartWidth) / 2; // Centering offset

    // Get the maximum value to scale bars dynamically
    const maxValue = Math.max(...emotionValues);
    const scaleFactor = maxValue > 0 ? chartHeight / maxValue : 1; // Avoid division by zero

    return 
        <svg width="${chartWidth}" height="${chartHeight + 50}">
            ${emotionLabels.map((emotion, index) => {
                const barHeight = emotionValues[index] * scaleFactor; // Dynamically scaled bar height
                const label = this.emotionLabelsMap[emotion];  // Get full label
                const xPosition = offsetX + index * (barWidth + barSpacing);
                return 
                    <rect x="${xPosition}" y="${chartHeight - barHeight}" width="${barWidth}" height="${barHeight}" fill="steelblue" />
                    <text x="${xPosition + barWidth / 2}" y="${chartHeight - barHeight - 10}" text-anchor="middle" fill="white">${emotionValues[index]}</text>
                    <text x="${xPosition + barWidth / 2}" y="${chartHeight + 20}" text-anchor="middle" fill="white">${label}</text>
                ;
            }).join('')}
            <!-- Axis lines -->
            <line x1="10" y1="0" x2="10" y2="${chartHeight}" stroke="white" stroke-width="2" />
            <line x1="10" y1="${chartHeight}" x2="${chartWidth - 10}" y2="${chartHeight}" stroke="white" stroke-width="2" />
        </svg>
    ;
},
    async retrieveEmotionData() {
        const patid = this.config.patid;
        const query = `
            query getpatientemotions($patid: Int!) {
                getpatientemotionsList(patid: $patid) {
                    empatid
                    emdate
                    emmoodid
                }
            }
        `;

        const emotionMap = {
            "1": "sad",
            "2": "excited",
            "3": "ashamed",
            "4": "happy",
            "5": "calm",
            "6": "active",
            "7": "proud",
            "8": "afraid",
            "9": "lonely"
        };

        const variables = {
            patid: patid
        };

        this.isLoading = true;
        this.updateDom();

        try {
            const response = await this.fetchWithTimeout(this.config.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query, variables }),
                timeout: parseInt(this.config.timeout)
            });
            const result = await response.json();

            if (result.data && result.data.getpatientemotionsList) {
                const emotions = result.data.getpatientemotionsList;

                // Reset emotion counts
                this.emotionCounts = {
                    "sad": 0,
                    "excited": 0,
                    "ashamed": 0,
                    "happy": 0,
                    "calm": 0,
                    "active": 0,
                    "proud": 0,
                    "afraid": 0,
                    "lonely": 0
                };

                // Count emotions for the current year
                emotions.forEach(e => {
                    const emotionDate = new Date(e.emdate);
                    const currentYear = new Date().getFullYear(); // Current year

                    // Only count emotions in the current year
                    if (emotionDate.getFullYear() === currentYear) {
                        const emotion = emotionMap[e.emmoodid] || "unknown";
                        if (this.emotionCounts[emotion] !== undefined) {
                            this.emotionCounts[emotion]++;
                        }
                    }
                });
            } else {
                // No data found, initialize with zero counts
                this.emotionCounts = {
                    "sad": 0,
                    "excited": 0,
                    "ashamed": 0,
                    "happy": 0,
                    "calm": 0,
                    "active": 0,
                    "proud": 0,
                    "afraid": 0,
                    "lonely": 0
                };
            }
        } catch (error) {
            console.error("Error fetching emotion data:", error);
            this.emotionCounts = {
                "sad": 0,
                "excited": 0,
                "ashamed": 0,
                "happy": 0,
                "calm": 0,
                "active": 0,
                "proud": 0,
                "afraid": 0,
                "lonely": 0
            };
        }
        this.isLoading = false;
        this.updateDom();
    },
    async fetchWithTimeout(resource, options = {}) {
        const { timeout = 8000 } = options;
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    }
});

