const fs = require('fs');
const path = require('path');

exports.handleDelete = (req, res) => {
  const { fileId } = req.params;
  const metadataPath = path.join(__dirname, '..', 'metadata.json');
  
  if (!fs.existsSync(metadataPath)) {
    return res.status(500).json({ success: false, message: "Metadata registry not found." });
  }

  const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  const fileData = metadata[fileId];

  if (!fileData) {
    return res.status(404).json({ success: false, message: "File not found in ledger." });
  }

  const nodes = ['node_a', 'node_b', 'node_c'];
  const storageBase = path.join(__dirname, '..', 'storage');
  const shardsDir = path.join(__dirname, '..', 'shards');
  
  if (fileData.shards) {
    fileData.shards.forEach((shardName) => {
       const baseShard = path.join(shardsDir, shardName);
       if (fs.existsSync(baseShard)) {
         try { fs.unlinkSync(baseShard); } catch(e){}
       }

       nodes.forEach(n => {
          const dir = path.join(storageBase, n);
          if (fs.existsSync(dir)) {
             const files = fs.readdirSync(dir);
             files.forEach(f => {
                if(f.includes(shardName)) {
                   try { fs.unlinkSync(path.join(dir, f)); } catch(e){}
                }
             });
          }
       });
    });
  }
  
  if (fileData.encryptedPath && fs.existsSync(fileData.encryptedPath)) {
     try { fs.unlinkSync(fileData.encryptedPath); } catch(e){}
  }

  delete metadata[fileId];
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));

  return res.json({ success: true, message: "Fragments purged successfully." });
};
