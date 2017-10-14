import fs from 'fs';

export default function readFixtures(path) {
  try {
    const data = JSON.parse(fs.readFileSync(path, 'utf-8'));
    return data;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}
