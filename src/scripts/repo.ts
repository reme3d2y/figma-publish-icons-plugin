import path from 'path';
import * as fs from 'fs';
const fsPromises = require('fs').promises;

type IconProps = {
  page: string;
  frame: string;
  filename: string;
  nodeId: string;
  origName: string;
  name: string;
  size: string;
  color: string;
};

async function getFiles(dir: string) {
  const dirs = await fsPromises.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    dirs.map(d => {
      const res = path.resolve(dir, d.name);
      return d.isDirectory() ? getFiles(res) : res;
    })
  );
  return Array.prototype.concat(...files);
}

export default async function parseRepo(repoDir: string, outDir: string) {
  const files = await getFiles(repoDir);
  let page = 'icon';

  const validComponents = {};
  const invalidComponents = [];

  files.forEach(filepath => {
    let [frame, origName] = filepath
      .replace(repoDir, '')
      .replace('.svg', '')
      .split('/');

    let icon: Partial<IconProps> = {
      page,
      frame,
      origName,
    };

    const m = /^(?:icon_[a-z0-9-]+\/)?icon_([a-z0-9-]+)_([a-z0-9]+)(?:_([a-z0-9]+))$/i.exec(origName);

    if (m) {
      icon = {
        ...icon,
        name: m[1],
        size: m[2],
        color: m[3] || '',
        frame,
        page
      };

      const filename = `${icon.page}_${icon.name}_${icon.size}${icon.color ? '_' + icon.color : ''}.svg`;

      validComponents[filename] = icon;
    } else {
      invalidComponents.push();
    }
  });

  fs.writeFileSync(path.join(outDir, 'repo_validComponents.json'), JSON.stringify(validComponents), 'utf-8');
  fs.writeFileSync(path.join(outDir, 'repo_invalidComponents.json'), JSON.stringify(invalidComponents), 'utf-8');
}
