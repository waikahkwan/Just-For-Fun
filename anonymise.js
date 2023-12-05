const csvProcessor = require('csvtojson')
const randomString = require('randomstring')
const fs = require('fs')

const columnName = 'PATIENT NAME'

var input_folder = "/data/inputs"; 
var output_folder = "/data/outputs";

async function processfolder(Path) {
  var files = fs.readdirSync(Path);
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var fullpath = Path + "/" + file;
    if (fs.statSync(fullpath).isDirectory()) {
      await processfolder(fullpath);
    } else {
      await anonymizeName(fullpath);
    }
  }
}

function generateRandomString(stringLength = 6) {
    return randomString.generate(stringLength)
}

function encodeCSVValue(value) {
    // If the value contains special characters, enclose it in double quotes
    if (/[",\n]/.test(value)) {
      // Escape double quotes by replacing them with two double quotes
      value = value.replace(/"/g, '""');
      // Enclose the value in double quotes
      value = `"${value}"`;
    }
    return value;
}

async function anonymizeName(filePath) {
    try {
        console.log(`=> Read from CSV file ... `)
        const jsonData =  await csvProcessor().fromFile(filePath)
        if(!jsonData?.length) throw new Error(`No data found.`)
        console.log(`=> Read from CSV file END ...`)
    
        console.log(`=> Amend rows data ... `)
        const headers = Object.keys(jsonData[0]).join(',')
        const rows = jsonData.map((obj, index) => {
            if(!obj[columnName]) throw new Error(`${columnName} not found for item ${index + 1} `)
            obj[columnName] = generateRandomString() // Replace the value for patient name
            return Object.values(obj).map(value => `${encodeCSVValue(value)}`).join(',')
        })
        console.log(`=> Amend rows data END `)
    
        console.log(`=> Build new CSV ... `)
        const csvData = `${headers}\n${rows.join('\n')}`
        const fileName = filePath.split('/').pop()
        fs.writeFileSync(`${output_folder}/${fileName}`, csvData, 'utf-8')
        console.log(`=> Build new CSV END ... `)

    } catch(err) {
        console.error(`Error: `, err)
    } finally {
        console.log(`======= END =======`)
    }
}

processfolder(input_folder)
