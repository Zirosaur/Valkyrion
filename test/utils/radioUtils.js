const { PassThrough } = require('stream');
const https = require('https');
const fs = require('fs');

let stream = new PassThrough();
let currentIndex = 0;
let radioLinks = [];

// Load radio links from JSON file
function loadRadioLinks() {
    try {
        const data = fs.readFileSync('radioLinks.json', 'utf8');
        radioLinks = JSON.parse(data).links;
    } catch (error) {
        console.error('Gagal memuat radioLinks.json:', error);
    }
}

const playRadio = (url, channel) => {
    https.get(url, (res) => {
        console.log(`Status code untuk ${url}: ${res.statusCode}`);
        if (res.statusCode === 200) {
            res.pipe(stream);
        } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`Mengalihkan ke: ${res.headers.location}`);
            playRadio(res.headers.location, channel);
        } else {
            channel.send(`Gagal terhubung ke ${radioLinks[currentIndex].name}. Mencoba saluran berikutnya...`);
            currentIndex = (currentIndex + 1) % radioLinks.length; // Coba saluran berikutnya
            playRadio(radioLinks[currentIndex].url, channel);
        }
    }).on('error', (err) => {
        console.error(`Error saat menghubungi radio: ${err.message}`);
        channel.send(`Terjadi kesalahan saat menghubungi ${radioLinks[currentIndex].name}. Mencoba saluran berikutnya...`);
        currentIndex = (currentIndex + 1) % radioLinks.length; // Coba saluran berikutnya
        playRadio(radioLinks[currentIndex].url, channel);
    });
};

// Initialize radio links
loadRadioLinks();

module.exports = {
    stream,
    playRadio,
    radioLinks,
    setCurrentIndex: (index) => { currentIndex = index; },
    getCurrentIndex: () => currentIndex,
};
