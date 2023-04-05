const MAX_CHUNK_SIZE = 850;
const API_URL = "https://api.openai.com/v1/chat/completions";
const API_KEY = "Bearer %insert%";
const TRANSLATE_DELAY = 3000;

document.getElementById("translate-button").addEventListener("click", translateAll);

function splitText(text) {
    const replaced = text.replace(/\r\n/g, ".\n\n");
    const paragraphs = replaced.split(/.\n\n/);
    const chunks = [];
    let chunk = '';

    paragraphs.forEach(paragraph => {
        if (chunk.length + paragraph.length > MAX_CHUNK_SIZE) {
            chunks.push(chunk);
            chunk = '';
        }
        chunk += paragraph + '\n\n';
    });

    if (chunk.trim().length > 1) {
        chunks.push(chunk);
    }

    return chunks;
}

function translateChunk(chunk) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "user", "content": "translate to English: " + chunk }]
        });
        const xhr = new XMLHttpRequest();

        xhr.addEventListener("readystatechange", function () {
            if (this.readyState === this.DONE) {
                const response = JSON.parse(this.responseText);
                const output = response.choices[0].message.content;
                resolve(output);
            }
        });

        xhr.open("POST", API_URL);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Authorization", API_KEY);
        xhr.send(data);
    });
}

async function translateAll() {
    const input = document.getElementById("input").value;
    const chunks = splitText(input);
    const outputContainer = document.getElementById("output");
    const finalOutputContainer = document.getElementById("final-output");

    outputContainer.innerHTML = '';
    finalOutputContainer.innerHTML = '';

    for (let chunk of chunks) {
        const inputChunkElement = createChunkElement(chunk, 'input-chunk');
        outputContainer.appendChild(inputChunkElement);

        const outputChunkElement = document.createElement('div');
        outputChunkElement.className = 'output-chunk';

        try {
            const output = await translateChunk(chunk);
            outputChunkElement.innerHTML = '<p>' + output + '</p>';
        } catch (error) {
            outputChunkElement.innerHTML = '<p>Error: ' + error.message + '</p>';
        }

        outputContainer.appendChild(outputChunkElement);
        finalOutputContainer.innerHTML += output + '\n';
        await delay(TRANSLATE_DELAY);
    }
}

function createChunkElement(chunk, className) {
    const chunkElement = document.createElement('div');
    chunkElement.className = className;
    chunkElement.innerHTML = '<p>' + chunk + '</p>';
    return chunkElement;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
