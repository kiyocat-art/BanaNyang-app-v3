const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputSvg = path.join(__dirname, '../assets/icon.svg');
const outputDir = path.join(__dirname, '../build');
const outputPngPath = path.join(outputDir, 'icon.png');

async function generateIcon() {
    try {
        // Ensure the output directory exists
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Convert SVG to a 512x512 PNG. This is a good size for app icons.
        await sharp(inputSvg)
            .resize(512, 512)
            .png()
            .toFile(outputPngPath);

        console.log('Successfully generated icon.png in build directory.');
    } catch (error) {
        console.error('Error generating icon:', error);
        process.exit(1); // Exit with an error code
    }
}

generateIcon();
