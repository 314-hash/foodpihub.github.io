const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];
const sourceIcon = path.join(__dirname, '../images/logo.png');
const targetDir = path.join(__dirname, '../images');

// Ensure the target directory exists
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// Generate icons for each size
sizes.forEach(size => {
    sharp(sourceIcon)
        .resize(size, size)
        .toFile(path.join(targetDir, `icon-${size}x${size}.png`))
        .then(info => console.log(`Generated ${size}x${size} icon`))
        .catch(err => console.error(`Error generating ${size}x${size} icon:`, err));
});
