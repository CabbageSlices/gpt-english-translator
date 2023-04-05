const MAX_CHUNK_SIZE = 800;
const API_URL = "https://api.openai.com/v1/chat/completions";
const TRANSLATE_DELAY = 3500;
const TRANSLATION_RETRIES = 3;
const TRANSLATED_TEXT_REQUIRED_SIZE_RATIO = 0.6;
let cancelTranslation = false;

document.getElementById("translate-button").addEventListener("click", translateAll);
document.getElementById("cancel-translate-button").addEventListener("click", cancelCurrentTranslation);

function getAPIKey() {
    return document.getElementById("api-key").value;
}

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

function translateChunk(chunk, apiKey) {
    return new Promise((resolve, reject) => {
        if (!apiKey) {
            reject(new Error('API Key is required'));
            return;
        }

        const data = JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ "role": "user", "content": "translate directly to English. Don't Summarize or shorten the final result. Provide an exact translation only: " + chunk }]
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
        xhr.setRequestHeader("Authorization", `Bearer ${apiKey}`);
        xhr.send(data);
    });
}

async function translateAll() {
    cancelTranslation = false;
    const input = document.getElementById("input").value;
    const chunks = splitText(input);
    const outputContainer = document.getElementById("output");
    const finalOutputContainer = document.getElementById("final-output");
    const apiKey = getAPIKey();

    outputContainer.innerHTML = '';
    finalOutputContainer.innerHTML = '';

    for (let chunk of chunks) {
        const inputChunkElement = createChunkElement(chunk, 'input-chunk');
        outputContainer.appendChild(inputChunkElement);

        const outputChunkElement = document.createElement('div');
        outputChunkElement.className = 'output-chunk';
        outputChunkElement.innerHTML = '<p>Translation in progress...</p>';
        outputChunkElement.appendChild(createLoaderElement());

        outputContainer.appendChild(outputChunkElement);

        let output;
        let translationAttempts = 0;

        while (translationAttempts < TRANSLATION_RETRIES) {
            try {
                output = await translateChunk(chunk, apiKey);

                if (output.length >= chunk.length * TRANSLATED_TEXT_REQUIRED_SIZE_RATIO) {
                    outputChunkElement.innerHTML = '<p>' + output + '</p>';
                    break;
                } else {
                    translationAttempts += 1;
                }
            } catch (error) {
                outputChunkElement.innerHTML = '<p>Error: ' + error.message + '</p>';
                break;
            }
        }

        if (cancelTranslation) {
            outputChunkElement.innerHTML = "";
            cancelTranslation = false;
            alert("Translation Cancelled.");
            break;
        }

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

function createLoaderElement() {
    const loaderElement = document.createElement('div');
    loaderElement.className = 'loader';
    return loaderElement;
}

function cancelCurrentTranslation() {
    cancelTranslation = true;
    alert("Cancelling Translation.");
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

