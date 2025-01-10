Module.register("MMM-LetheEmotions", {
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
    letheEmotions: [], // Updated to store multiple emotions with date
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
    if (this.letheEmotions.length === 0) {
        wrapper.innerHTML = "Loading...";
        return wrapper;
    } else {
        wrapper.className = "bright";
        // Create a table to display emotions in a weekly calendar
        wrapper.innerHTML = `
            <strong>Weekly Emotions for Patient ${this.config.patid}:</strong>
            <table>
                <thead>
                    <tr>
                        ${this.getWeekDays().map(day => `<th>${day}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        ${this.letheEmotions.map(e => `
                            <td class="table-cell">
                                <div>${e.date}</div>
                                ${
                                    e.emotion === "no-data"
                                        ? `<div class="no-entry">no entry</div>`
                                        : `<img src="${this.file(`svg/${e.emotion}.svg`)}" alt="${e.emotion}" style="width:50px;height:50px;">`
                                }
                            </td>
                        `).join('')}
                    </tr>
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

                // Map emotions to include date and emotion name
                this.letheEmotions = this.getWeekDates().map(date => {
                    const emotion = emotions.find(e => {
                        const emotionDate = new Date(e.emdate).toLocaleDateString('de-AT', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                        }).split('.').reverse().join('-'); // Convert emdate to YYYY-MM-DD
                        return emotionDate === date;
                    });
                    return {
                        date: date,
                        emotion: emotion ? emotionMap[emotion.emmoodid] || "unknown" : "no-data"
                    };
                });
            } else {
                this.letheEmotions = this.getWeekDates().map(date => ({
                    date: date,
                    emotion: "no-data"
                }));
            }
        } catch (error) {
            console.error("Error fetching emotion data:", error);
            this.letheEmotions = this.getWeekDates().map(date => ({
                date: date,
                emotion: "error"
            }));
        }
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
    },
    getWeekDates() {
        const today = new Date();
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Monday
        return Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(firstDayOfWeek);
            day.setDate(firstDayOfWeek.getDate() + i);
            return day.toISOString().split('T')[0]; // YYYY-MM-DD
        });
    },
    getWeekDays() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    }
});

