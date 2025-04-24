const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../India_data/Fertilizer Prediction.csv');
const jsonFilePath = path.join(__dirname, '../src/data/fertilizer_predictions.json');

console.log(`Reading CSV file from: ${csvFilePath}`);

fs.readFile(csvFilePath, { encoding: 'utf-8' }, (err, data) => {
  if (err) {
    console.error("Error reading CSV file:", err);
    return;
  }

  console.log("Successfully read CSV file.");

  const lines = data.trim().split('\n');
  if (lines.length < 2) {
    console.error("CSV file is empty or has only a header.");
    return;
  }

  const headers = lines[0].split(',').map(header => header.trim()); // Trim headers to remove trailing spaces
  const jsonData = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length === headers.length) {
      const entry = {};
      headers.forEach((header, index) => {
        const value = values[index].trim();
        // Attempt to convert numeric values, otherwise keep as string
        entry[header] = isNaN(value) || value === '' ? value : parseFloat(value);
      });
      jsonData.push(entry);
    } else {
      console.warn(`Skipping line ${i + 1}: Incorrect number of columns.`);
    }
  }

  console.log(`Processed ${jsonData.length} data rows.`);

  const jsonString = JSON.stringify(jsonData, null, 2); // Pretty print JSON

  console.log(`Writing JSON data to: ${jsonFilePath}`);

  fs.writeFile(jsonFilePath, jsonString, (err) => {
    if (err) {
      console.error("Error writing JSON file:", err);
    } else {
      console.log(`Successfully converted CSV to JSON and saved to ${jsonFilePath}`);
    }
  });
});