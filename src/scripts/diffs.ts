import * as fs from 'fs';
import path from 'path';

function difference<T>(a1: T[], a2: T[]): T[] {
  var a2Set = new Set(a2);
  return a1.filter(function(x) {
    return !a2Set.has(x);
  });
}

function intersection<T>(a1: T[], a2: T[]): T[] {
  var a2Set = new Set(a2);
  return a1.filter(function(x) {
    return a2Set.has(x);
  });
}

export default function diffs(dir: string) {
  const figma = JSON.parse(fs.readFileSync(path.join(dir, 'validComponents.json'), 'utf-8'));
  const repo = JSON.parse(fs.readFileSync(path.join(dir, 'repo_validComponents.json'), 'utf-8'));

  const figmaKeys = Object.keys(figma);
  const repoKeys = Object.keys(repo);

  const diffs = {
    figma: figmaKeys,
    repo: repoKeys,
    figma_only: difference(figmaKeys, repoKeys).map(key => figma[key]),
    repo_only: difference(repoKeys, figmaKeys).map(key => repo[key]),
    ok: intersection(repoKeys, figmaKeys).length,
  };

  fs.writeFileSync(path.join(dir, 'diffs.json'), JSON.stringify(diffs), 'utf-8');
}
