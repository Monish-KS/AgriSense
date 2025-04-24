const fs = require('fs');
const path = require('path');
const csv = require('csv-parser'); // Using a library for more robust CSV parsing

const csvFilePath = path.join(__dirname, '../India_data/Rainfall.csv');
const jsonFilePath = path.join(__dirname, '../src/data/rainfall_data.json');
const results = [];

console.log(`Reading CSV file from: ${csvFilePath}`);

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    // Trim keys and values
    const cleanedData = {};
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        cleanedData[key.trim()] = data[key].trim();
      }
    }
    results.push(cleanedData);
  })
  .on('end', () => {
    console.log(`Processed ${results.length} data rows.`);

    const jsonString = JSON.stringify(results, null, 2); // Pretty print JSON

    console.log(`Writing JSON data to: ${jsonFilePath}`);

    fs.writeFile(jsonFilePath, jsonString, (err) => {
      if (err) {
        console.error("Error writing JSON file:", err);
      } else {
        console.log(`Successfully converted CSV to JSON and saved to ${jsonFilePath}`);
      }
    });
  })
  .on('error', (err) => {
    console.error("Error reading CSV file:", err);
  });