const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const csvFilePath = path.join(__dirname, '../India_data/Temp min.csv');
const jsonFilePath = path.join(__dirname, '../src/data/min_temp_data.json');
const results = [];

console.log(`Reading CSV file from: ${csvFilePath}`);

fs.createReadStream(csvFilePath)
  .pipe(csv())
  .on('data', (data) => {
    // Trim keys and values
    const cleanedData = {};
    for (const key in data) {
      if (Object.hasOwnProperty.call(data, key)) {
        const cleanedKey = key.trim().replace('﻿', ''); // Also remove potential BOM character
        const value = data[key].trim();
        // Attempt to convert numeric values, otherwise keep as string
        cleanedData[cleanedKey] = isNaN(value) || value === '' ? value : parseFloat(value);
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