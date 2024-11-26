const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgBuffer = fs.readFileSync(path.join(__dirname, '../images/logo.svg'));

// Convert SVG to PNG and save as logo.png
sharp(svgBuffer)
    .png()
    .toFile(path.join(__dirname, '../images/logo.png'))
    .then(info => {
        console.log('Generated logo.png');
        // Now generate all the icons
        require('./generate-icons');
    })
    .catch(err => console.error('Error generating logo.png:', err));
