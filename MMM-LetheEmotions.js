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
    letheEmotion: null,
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
        if (this.letheEmotion === null) {
            wrapper.innerHTML = "Loading...";
            return wrapper; 
        } else {
            wrapper.className = "bright";
            wrapper.innerHTML = `Today's Emotion: <strong>${this.letheEmotion}</strong>`;
            return wrapper;
        }
    },
    async retrieveEmotionData() {
        const patid = this.config.patid;
        const today = new Date().toISOString().split("T")[0]; // Format date as YYYY-MM-DD
        const query = `
            query getpatientemotions($patid: Int!, $date: String!) {
                getpatientemotionsList(patid: $patid) {
                    empatid
                    emmoodid
                    emdate
                }
            }
        `;
        const variables = {
            patid: patid,
            date: today
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
                // Filter for today's date
                const emotionToday = emotions.find(e => e.emdate === today);
                if (emotionToday) {
                    this.letheEmotion = emotionToday.emmoodid;
                } else {
                    this.letheEmotion = "No emotion recorded for today.";
                }
            } else {
                this.letheEmotion = "Error: No data received.";
            }
        } catch (error) {
            console.error("Error fetching emotion data:", error);
            this.letheEmotion = "Error: Unable to retrieve data.";
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
