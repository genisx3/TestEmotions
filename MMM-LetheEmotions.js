Module.register("MMM-LetheEmotions", {
    defaults: {
        fetchInterval: 5 * 60 * 1000,
        dateoptions: {
            timeZone: "Europe/Vienna",
            hour12: "false",
            hourCycle: "h24",
            weekday: "long",
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "numeric",
            second: "numeric",
            timeZoneName: "long"
        },
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
        return [
            this.file('LetheCalendarEntryEmotions.js')
        ];
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
            // Create a table to display emotions with dates
            wrapper.innerHTML = `
                <strong>Emotions for Patient ${this.config.patid}:</strong>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Emotion ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.letheEmotions.map(e => `
                            <tr>
                                <td>${e.date}</td>
                                <td>${e.emotion}</td>
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
                    emmoodid
                    emdate
                }
            }
        `;

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
                // Store both date and emotion ID
                this.letheEmotions = emotions.map(e => ({
                    date: e.emdate || "Unknown Date",
                    emotion: e.emmoodid || "Unknown Mood ID"
                }));
            } else {
                this.letheEmotions = [{ date: "Error", emotion: "No data received" }];
            }
        } catch (error) {
            console.error("Error fetching emotion data:", error);
            this.letheEmotions = [{ date: "Error", emotion: "Unable to retrieve data" }];
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
});

