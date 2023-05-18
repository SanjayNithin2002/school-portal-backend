const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const csvWriter = createCsvWriter({
  path: 'output.csv',
  header: [
    { id: '_id', title: 'id' },
    { id: 'name', title: 'Name' }
  ]
});

const data = [
  { name: 'John Doe', age: 30, email: 'johndoe@example.com' },
  { name: 'Jane Smith', age: 25, email: 'janesmith@example.com' },
  // Add more data as needed
];

csvWriter
  .writeRecords(data)
  .then(() => console.log('CSV file has been written successfully'))
  .catch((error) => console.error(error));
