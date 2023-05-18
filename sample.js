const fs = require('fs');
const csv = require('csv-parser');

const results = [];

fs.createReadStream('public/csv/10A.csv')
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
        console.log(results);
        // Process the data as needed
});