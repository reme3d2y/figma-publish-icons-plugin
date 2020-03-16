const fsPromises = require('fs').promises;
import path from 'path';
import { figmaRequest } from '../lib/figma';

export async function fetchIcons(nodeIds: string[]) {
  return figmaRequest(`/v1/images/${process.env.FIGMA_ID}`, process.env.FIGMA_API_KEY, {
    ids: nodeIds,
    format: 'svg',
  });
}

export default async function copyIcons(repoDir: string, outDir: string) {
  const diffsData = await fsPromises.readFile(path.join(outDir, 'diffs.json'), 'utf-8');
  const allDiffs = JSON.parse(diffsData);

  const nodeIds = allDiffs['figma_only'].map(component => component.nodeId);

  const icons = await fetchIcons(nodeIds);

  console.log(icons);

  const svgs = await Promise.all(Object.values(icons.images).map((url: string) => fetch(url).then(r => r.text())));
  console.log(svgs);

  allDiffs['figma_only'].map((component, i) => {
    console.log(`[+] Save ${component.filename} to ${component.frame}`);
    fsPromises.writeFile(path.join(repoDir, component.frame, component.filename), svgs[i]);
  });
}
