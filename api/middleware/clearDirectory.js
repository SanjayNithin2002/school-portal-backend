const fs = require('fs');
module.exports = (folder) => {
    fs.readdir(folder, (err, files) => {
        if (err) {
            console.log(err);
        }
        files.forEach(file => {
            const fileDir = folder + '/' + file;
    
            if (file !== 'specialfile.txt') {
                fs.unlinkSync(fileDir);
            }
        });
    });
}