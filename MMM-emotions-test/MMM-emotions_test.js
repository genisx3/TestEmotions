Module.register("MMM-LetheEmotions", {
    defaults: {
        fetchInterval: 5 * 60 * 1000, // 5 Minuten
        umail: "mirror.dummy@fhjoanneum.at",
        url: 'http://athen.technikum.fh-joanneum.local:5000/graphql',
        svgMapping: {

            1: "sad.svg",
            2: "excited.svg",
            3: "ashamed.svg",
            4: "happy.svg",
            5: "calm.svg",
            6: "active.svg",
            7: "proud.svg",
            8: "afraid.svg",
            9: "lonely.svg"
        }
    },

    letheData: null,

    getStyles() {
        return [
            this.file("style.css")
        ];
    },

    getDom() {
        const wrapper = document.createElement("div");

        if (!this.letheData || this.letheData.length === 0) {
            wrapper.innerHTML = "<p>No data available!</p>";
            return wrapper;
        }

        const table = document.createElement("table");
        table.className = "emotion-table";

        // Aktuelles Datum und Wochenstart berechnen
        const currentDate = new Date();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Montag

        // Wochentage generieren
        for (let i = 0; i < 7; i++) {
            const currentDay = new Date(startOfWeek);
            currentDay.setDate(startOfWeek.getDate() + i);
            const formattedDay = currentDay.toISOString().split("T")[0]; // yyyy-mm-dd Format

            const row = document.createElement("tr");

            const dayCell = document.createElement("td");
            dayCell.className = "day-cell";
            dayCell.innerText = currentDay.toLocaleDateString("en-US", { weekday: "long" });

            const emotionCell = document.createElement("td");
            emotionCell.className = "emotion-cell";

            const dayData = this.letheData.filter(entry => entry.emdate === formattedDay);
            if (dayData.length > 0) {
                dayData.forEach(emotion => {
                    const img = document.createElement("img");
                    img.src = this.file(`svg/${this.config.svgMapping[emotion.emmoodid]}`);
                    img.alt = `Mood ${emotion.emmoodid}`;
                    img.className = "emotion-icon";
                    emotionCell.appendChild(img);
                });
            } else {
                emotionCell.innerText = "No data";
            }

            row.appendChild(dayCell);
            row.appendChild(emotionCell);
            table.appendChild(row);
        }

        wrapper.appendChild(table);
        return wrapper;
    },

    start() {
        this.retrieveEmotionData();
        setInterval(() => this.retrieveEmotionData(), this.config.fetchInterval);
    },

    async retrieveEmotionData() {
        const query = `query getpatientemotions($patid: Int!) {
            getpatientemotionsList(patid: $patid) {
                emmoodid
                emdate
            }
        }`;

        const variables = { patid: 21 };

        try {
            const response = await fetch(this.config.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ query, variables })
            });

            const result = await response.json();
            if (result.data) {
                this.letheData = result.data.getpatientemotionsList;
                this.updateDom();
            }
        } catch (error) {
            console.error("Error fetching emotion data:", error);
        }
    }
});