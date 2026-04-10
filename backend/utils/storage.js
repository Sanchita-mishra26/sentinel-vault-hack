const fs = require('fs');
const path = require('path');

const METADATA_FILE = path.join(process.cwd(), 'metadata.json');

let initialFiles = {};
if (fs.existsSync(METADATA_FILE)) {
  try {
    initialFiles = JSON.parse(fs.readFileSync(METADATA_FILE, 'utf-8'));
  } catch (e) {
    console.error('Failed to parse metadata.json', e);
  }
}

const filesHandler = {
  set(obj, prop, value) {
    obj[prop] = value;
    try {
      fs.writeFileSync(METADATA_FILE, JSON.stringify(obj, null, 2));
    } catch(e) {
      console.error('Failed to write metadata.json', e);
    }
    return true;
  }
};

const storage = {
  files: new Proxy(initialFiles, filesHandler)
};

module.exports = storage;