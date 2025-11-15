const fs = require("fs").promises; 
const path = require("path");

const audioDecodeModule = require("audio-decode");
const audioDecode = audioDecodeModule.default || audioDecodeModule; 

const inputFile = "";
const outputFile = "";

function findMaxAbsoluteValue(arr1, arr2) {
    let maxAbs = 0;

    for (const val of arr1) {
        const absVal = Math.abs(val);
        if (absVal > maxAbs) {
            maxAbs = absVal;
        }
    }

    for (const val of arr2) {
        const absVal = Math.abs(val);
        if (absVal > maxAbs) {
            maxAbs = absVal;
        }
    }
    return maxAbs;
}


async function processFlacToPointCloud() {
    try {
        const inputPath = path.resolve(inputFile);
        const outputPath = path.resolve(outputFile);

        console.log(`reading: ${inputPath}`);

        const flacBuffer = await fs.readFile(inputPath);

        const audioBuffer = await audioDecode(flacBuffer);
        
        if (audioBuffer.numberOfChannels === 0 || audioBuffer.length === 0) {
            throw new Error("encoded audio buffer is empty or has no channels.");
        }

        let left, right;
        const numChannels = audioBuffer.numberOfChannels;

        left = audioBuffer.getChannelData(0);

        if (numChannels === 1) {
            right = left;
        } else {
            right = audioBuffer.getChannelData(1);
        }

        const maxVal = findMaxAbsoluteValue(left, right); 

        const divisor = maxVal === 0 ? 1 : maxVal;

        const normalizedLeft = Array.from(left).map(v => v / divisor);
        const normalizedRight = Array.from(right).map(v => v / divisor);

        const csvLines = ["x,y"];
        for (let i = 0; i < normalizedLeft.length; i++) {
            csvLines.push(`${normalizedLeft[i]},${normalizedRight[i]}`);
        }

        const csvData = csvLines.join('\n') + '\n';

        await fs.writeFile(outputPath, csvData);

        console.log(`generated: ${outputPath} (there are ${normalizedLeft.length} points)`);

    } catch (error) {
        if (error.code === 'ENOENT') {
            console.error(`cannot find file "${inputFile}"。please check the path is correct.`);
        } else {
            console.error(`FLAC decoding or processing error occurred:`, error);
        }
        process.exit(1); 
    }
}

processFlacToPointCloud();