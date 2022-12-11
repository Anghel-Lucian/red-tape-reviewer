import { readdir } from 'fs/promises';
import path from 'path';

export async function getFilesNameByExtension(directory, extension, fileNamePattern = '') {
  const matchedFiles = [];

  const files = await readdir(directory);

  for (const file of files) {
    const fileExt = path.extname(file);

    if (fileExt === `.${extension}` && file.includes(fileNamePattern)) {
      matchedFiles.push(file);
    }
  }

  return matchedFiles;
};