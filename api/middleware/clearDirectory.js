// Import the 'fs' (file system) library
var fs = require('fs');

// Export a function that removes all files in the given folder except 'specialfile.txt'
module.exports = (folder) => {
    // Read the contents of the specified folder
    fs.readdir(folder, (err, files) => {
        if (err) {
            console.log(err); // Log any errors that occur during file reading (for debugging)
        }
        // Loop through each file in the folder
        files.forEach(file => {
            var fileDir = folder + '/' + file; // Construct the full path to the file

            // Check if the current file is not named 'specialfile.txt'
            if (file !== 'specialfile.txt') {
                // Remove the file synchronously (blocking operation)
                fs.unlinkSync(fileDir);
            }
        });
    });
}
