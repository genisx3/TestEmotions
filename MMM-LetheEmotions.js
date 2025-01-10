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
    currentWeekOffset: 0, // Track the current week offset
    currentWeekNumber: 0, // To display the current week number
    notificationReceived(notification, payload, sender) {
        if (notification === 'MODULE_DOM_CREATED') {
            this.updateWeekNumber();
            this.retrieveEmotionData();
            setInterval(() => {
                this.retrieveEmotionData();
            }, this.config.fetchInterval);
        }

        // Handle gestures from MMM-GroveGesture
        if (notification === "UP") {
            this.currentWeekOffset += 1;
            this.updateWeekNumber();
            this.retrieveEmotionData();
        } else if (notification === "DOWN") {
            this.currentWeekOffset -= 1;
            this.updateWeekNumber();
            this.retrieveEmotionData();
        } else if (notification === "CLOCKWISE") {  // Reset to current week
            this.currentWeekOffset = 0;
            this.updateWeekNumber();
            this.retrieveEmotionData();
        }
    },
    getDom() {
        const wrapper = document.createElement("div");
        const totalWeeksInYear = this.getTotalWeeksInYear(new Date());

        if (this.letheEmotions.length === 0) {
            wrapper.innerHTML = "Loading...";
            return wrapper;
        } else {
            wrapper.className = "bright";
            // Display the week info and a table of emotions
            wrapper.innerHTML = `
                <div><strong>Kalenderwoche: ${this.currentWeekNumber}/${totalWeeksInYear}</strong></div>
                <strong>Weekly Emotions:</strong>
                <table>
                    <thead>
                        <tr>
                            ${this.getWeekDays().map(day => `<th class="week-day">${day}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="emotion-row">
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
                const weekDates = this.getWeekDates(this.currentWeekOffset);

                // Map emotions to include date and emotion name
                this.letheEmotions = weekDates.map(date => {
                    const emotion = emotions.find(e => {
                        const emotionDate = new Date(e.emdate).toISOString().split('T')[0]; // YYYY-MM-DD Format von der DB
                        return emotionDate === date;
                    });

                    // Format das Datum nach der DB-Abfrage in "DD.MM.YYYY"
                    const formattedDate = this.formatDateToDDMMYYYY(date);

                    return {
                        date: formattedDate,  // Das formatierte Datum
                        emotion: emotion ? emotionMap[emotion.emmoodid] || "unknown" : "no-data"
                    };
                });
            } else {
                this.letheEmotions = this.getWeekDates(this.currentWeekOffset).map(date => ({
                    date: this.formatDateToDDMMYYYY(date), // Formatierung nach der DB-Abfrage
                    emotion: "no-data"
                }));
            }
        } catch (error) {
            console.error("Error fetching emotion data:", error);
            this.letheEmotions = this.getWeekDates(this.currentWeekOffset).map(date => ({
                date: this.formatDateToDDMMYYYY(date), // Formatierung nach der DB-Abfrage
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
    updateWeekNumber() {
        const today = new Date();
        today.setDate(today.getDate() + (this.currentWeekOffset * 7));
        this.currentWeekNumber = this.getWeekNumber(today);
    },
    getWeekDates(offset) {
        const today = new Date();
        today.setDate(today.getDate() + (offset * 7)); // Adjust the date by the week offset
        const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Monday
        return Array.from({ length: 7 }).map((_, i) => {
            const day = new Date(firstDayOfWeek);
            day.setDate(firstDayOfWeek.getDate() + i);
            return day.toISOString().split('T')[0]; // YYYY-MM-DD
        });
    },
    getWeekNumber(date) {
        const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
        const pastDaysOfYear = (date - firstDayOfYear + (firstDayOfYear.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000) / 86400000;
        return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    },
    getTotalWeeksInYear(date) {
        const lastDayOfYear = new Date(date.getFullYear(), 11, 31);
        return this.getWeekNumber(lastDayOfYear);
    },
    getWeekDays() {
        return ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    },
    formatDateToDDMMYYYY(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0'); // Monate sind 0-indexiert
        const year = d.getFullYear();

        return `${day}.${month}.${year}`;
    }
});

