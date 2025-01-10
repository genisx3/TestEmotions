Module.register("MMM-LetheEmotionsMonth", { 
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
    getScripts: function () {
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
        // Create a table to display emotion counts for the month with SVG images
        wrapper.innerHTML = `
            <strong>Monthly Emotion Counts:</strong>
            <table>
                <thead>
                    <tr>
                        <th>Emotion</th>
                        <th>Count</th>
                    </tr>
                </thead>
                <tbody>
                    ${Object.keys(this.emotionCounts).map(emotion => `
                        <tr>
                            <td>
                                <img src="modules/MMM-LetheEmotionsMonth/svg/${emotion}.svg" alt="${emotion}" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px;">
                                ${emotion}
                            </td>
                            <td>${this.emotionCounts[emotion]}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
        return wrapper;
    }
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

                // Count emotions for the current month
                emotions.forEach(e => {
                    const emotionDate = new Date(e.emdate);
                    const currentMonth = new Date().getMonth(); // Current month
                    const currentYear = new Date().getFullYear(); // Current year

                    // Only count emotions in the current month
                    if (emotionDate.getMonth() === currentMonth && emotionDate.getFullYear() === currentYear) {
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
