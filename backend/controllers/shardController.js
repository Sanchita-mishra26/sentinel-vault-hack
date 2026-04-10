const fs = require("fs");
const path = require("path");

const createShardsInternal = async (filePath, numShards = 3) => {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const shardsDir = path.join(process.cwd(), 'backend', 'shards');
  // If you are running the server from the backend folder, process.cwd() is already "backend"
  const storageBase = path.join(process.cwd(), 'storage');

  if (!fs.existsSync(shardsDir)) fs.mkdirSync(shardsDir, { recursive: true });

  const nodes = ['node_a', 'node_b', 'node_c'];
  nodes.forEach(n => {
    const dir = path.join(storageBase, n);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  const shardSize = Math.floor(fileBuffer.length / numShards);
  const shardPaths = [];

  // 1. Slice the file into 3 pieces
  for (let i = 0; i < numShards; i++) {
    const start = i * shardSize;
    const end = (i === numShards - 1) ? fileBuffer.length : start + shardSize;
    const shardPath = path.join(shardsDir, `${fileName}.part_${i}`);
    fs.writeFileSync(shardPath, fileBuffer.slice(start, end));
    shardPaths.push(shardPath);
  }

  // 2. Distribute with Redundancy (Primary + Replica)
  const s = shardPaths.map(p => path.basename(p));

  // Node A: Primary 0 + Replica 2
  fs.copyFileSync(shardPaths[0], path.join(storageBase, 'node_a', s[0]));
  fs.copyFileSync(shardPaths[2], path.join(storageBase, 'node_a', `replica_${s[2]}`));

  // Node B: Primary 1 + Replica 0
  fs.copyFileSync(shardPaths[1], path.join(storageBase, 'node_b', s[1]));
  fs.copyFileSync(shardPaths[0], path.join(storageBase, 'node_b', `replica_${s[0]}`));

  // Node C: Primary 2 + Replica 1
  fs.copyFileSync(shardPaths[2], path.join(storageBase, 'node_c', s[2]));
  fs.copyFileSync(shardPaths[1], path.join(storageBase, 'node_c', `replica_${s[1]}`));

  console.log("✅ REDUNDANCY COMPLETE: Shards and Replicas stored in Node folders.");
  console.log(`VERIFICATION: Server expects storage folders at: ${storageBase}`);
  return shardPaths;
};

module.exports = { createShardsInternal };