const ExcelJS = require("exceljs");
const csv = require("csv-parser");
const stream = require("stream");

/**
 * Parse buffer into JSON rows based on file extension
 * @param {Buffer} buffer
 * @param {string} filename
 * @returns {Promise<Array<Object>>}
 */
async function parseFile(buffer, filename) {
  console.log("parseFile called with filename:", filename);
  if (filename.endsWith(".csv")) {
    console.log("Parsing as CSV");
    const result = await parseCsv(buffer);
    console.log("CSV parsing result:", result);
    return result;
  } else {
    console.log("Parsing as Excel");
    const result = await parseExcel(buffer);
    console.log("Excel parsing result:", result);
    return result;
  }
}

/** Parse Excel buffer using exceljs */
async function parseExcel(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  const headerRow = worksheet.getRow(1).values.slice(1); // skip null index
  const rows = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const obj = {};
    row.values.slice(1).forEach((val, idx) => {
      obj[headerRow[idx]] = val;
    });
    rows.push(obj);
  });

  return rows;
}

/** Parse CSV buffer using csv-parser */
function parseCsv(buffer) {
  return new Promise((resolve, reject) => {
    try {
      // Convert buffer to string and clean it
      let csvContent = buffer.toString('utf8');
      csvContent = csvContent.replace(/^\s*\n/, ''); // Remove leading empty lines
      csvContent = csvContent.replace(/^\uFEFF/, ''); // Remove BOM if present
      
      // Split into lines and filter out empty lines
      const lines = csvContent.split('\n').filter(line => line.trim() !== '');
      
      if (lines.length < 2) {
        return resolve([]);
      }
      
      // Parse header row
      const headers = lines[0].split(',').map(h => h.trim());
      // Parse data rows
      const results = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length === headers.length && values[0] !== '') {
          const row = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          results.push(row);
        }
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { parseFile };
