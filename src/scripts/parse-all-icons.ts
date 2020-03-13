(global as any).fetch = require('node-fetch-polyfill');
import { figmaRequest } from '../lib/figma';
import path from 'path';
import * as fs from 'fs';

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

const nameParsers = {
  icon: (origName: string): Partial<IconProps> => {
    const m = /^(?:icon_[a-z0-9-]+\/)?icon_([a-z0-9-]+)_([a-z0-9]+)(?:_([a-z0-9]+))$/i.exec(origName);

    return {
      name: m[1],
      size: m[2],
      color: m[3] || '',
    };
  },
};

export default async function parse(figmaId, figmaApiKey, outDir) {
  const r = await figmaRequest(`/v1/files/${figmaId}/components`, figmaApiKey);

  // const r = JSON.parse(fs.readFileSync('./dist/components.json', 'utf-8'));

  const validComponents = {};
  const invalidComponents = [];

  r.meta.components.forEach(component => {
    const origName = component.name;
    let page = component.containing_frame.pageName;
    let frame = (component.containing_frame.name || '').toLowerCase();

    if (page === 'icons') page = 'icon';
    if (frame === 'actions') frame = 'action';

    let icon: Partial<IconProps> = {
      page,
      frame,
      origName,
      nodeId: component.node_id
    };

    try {
      const nameParser = nameParsers[page];
      icon = { ...icon, ...nameParser(origName) };

      const filename = `${icon.page}_${icon.name}_${icon.size}${icon.color ? '_' + icon.color : ''}.svg`;

      icon['filename'] = filename;

      validComponents[filename] = icon;
    } catch (e) {
      invalidComponents.push(icon);
    }
  });

  fs.writeFileSync(path.join(outDir, 'validComponents.json'), JSON.stringify(validComponents), 'utf-8');
  fs.writeFileSync(path.join(outDir, 'invalidComponents.json'), JSON.stringify(invalidComponents), 'utf-8');
}
