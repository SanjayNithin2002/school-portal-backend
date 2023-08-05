var fs = require('fs');
module.exports = (folder) => {
    fs.readdir(folder, (err, files) => {
        if (err) {
            console.log(err);
        }
        files.forEach(file => {
            var fileDir = folder + '/' + file;
    
            if (file !== 'specialfile.txt') {
                fs.unlinkSync(fileDir);
            }
        });
    });
}