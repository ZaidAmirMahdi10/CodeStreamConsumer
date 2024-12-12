// processor.js
const crypto = require('crypto'); // For hashing


// Process multiple files
const processMultipleFiles = (files) => {
    return Promise.all(
        files.map((file, index) => {
            const fileStream = require('stream').Readable.from(file.buffer.toString('utf8'));
            return processData(fileStream).then(result => ({
                fileIndex: index + 1,
                fileName: file.originalname,
                result,
            }));
        })
    );
};

// Detect clones across multiple files
const detectClonesInFiles = (files) => {
    const fileContents = files.map(file => file.buffer.toString('utf8'));
    const clones = [];
    const hashes = {};

    fileContents.forEach((content, fileIndex) => {
        const lines = content.split('\n');
        lines.forEach((line, lineIndex) => {
            const hash = crypto.createHash('sha256').update(line.trim()).digest('hex');
            if (hashes[hash]) {
                clones.push({
                    clone1: hashes[hash],
                    clone2: { fileIndex, lineIndex },
                    content: line,
                });
            } else {
                hashes[hash] = { fileIndex, lineIndex };
            }
        });
    });

    return Promise.resolve({ clones });
};


// Hash-based clone detection using rolling hashes
const detectClones = (fileStream) => {
    return new Promise((resolve, reject) => {
        try {
            const clones = [];
            const hashes = {}; 
            let buffer = '';

            fileStream.on('data', (chunk) => {
                buffer += chunk;
                const lines = buffer.split('\n');
                lines.forEach((line, index) => {
                    // Hash each line for uniqueness (this can be modified to work with chunks or blocks)
                    const hash = crypto.createHash('sha256').update(line.trim()).digest('hex');
                    
                    // Check if this hash already exists
                    if (hashes[hash]) {
                        clones.push({
                            clone1: hashes[hash],
                            clone2: index,
                            content: line,
                        });
                    } else {
                        hashes[hash] = index;
                    }
                });

                // Keep the last incomplete line in the buffer for the next chunk
                buffer = lines.slice(-1).join('\n');
            });

            fileStream.on('end', () => {
                resolve(clones);  
            });

            fileStream.on('error', (error) => {
                console.error('Error during clone detection:', error);
                reject(error);
            });
        } catch (error) {
            reject(error);
        }
    });
};

// Process file data with streaming support
const processData = (fileStream) => {
    return new Promise((resolve, reject) => {
        try {
            const chunkSize = 1000;
            const chunks = [];
            let buffer = '';
            const timings = []; 

            fileStream.on('data', (chunk) => {
                const startTime = Date.now(); 
                buffer += chunk;
                const lines = buffer.split('\n');
                while (lines.length > chunkSize) {
                    chunks.push(lines.splice(0, chunkSize));
                }
                buffer = lines.join('\n');
                const endTime = Date.now();
                timings.push(endTime - startTime);
            });

            fileStream.on('end', () => {
                if (buffer) {
                    chunks.push(buffer.split('\n'));
                }

                const processedData = chunks.map((chunk, index) => ({
                    chunkNumber: index + 1,
                    lineCount: chunk.length,
                    content: chunk.map(line => line.trim()).join('\n'),
                }));

                resolve({
                    message: 'File processed successfully!',
                    processedData,
                    timings,
                });
            });

            fileStream.on('error', (error) => {
                console.error('Error during processing:', error);
                reject(error);
            });
        } catch (error) {
            console.error('Error during processing:', error);
            reject(error);
        }
    });
};

module.exports = { processData, detectClones, processMultipleFiles, detectClonesInFiles };