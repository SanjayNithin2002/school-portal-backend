module.exports = (filename) => {
    const trimmedFilename = filename.trim();
    const urlFriendlyFilename = trimmedFilename.replace(/[^a-zA-Z0-9_-]/g, '_');
    return urlFriendlyFilename;
}

