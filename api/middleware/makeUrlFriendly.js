//Export a function that converts a given filename to a URL-friendly format
module.exports = (filename) => {
    //Trim any leading or trailing whitespace from the filename
    var trimmedFilename = filename.trim();
    
    //Replace any characters that are not alphanumeric, hyphens, or underscores with underscores
    var urlFriendlyFilename = trimmedFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    
    //Return the URL-friendly filename
    return urlFriendlyFilename;
}