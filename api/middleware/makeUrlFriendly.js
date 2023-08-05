module.exports = (filename) => {
    var trimmedFilename = filename.trim();
    var urlFriendlyFilename = trimmedFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    return urlFriendlyFilename;
}

