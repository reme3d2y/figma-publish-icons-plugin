import { Octokit } from '@octokit/rest';
import createPullRequest from 'octokit-create-pull-request';
import { fetchIcons, fetchComponents, fetchVersions } from './figma';
import { prepareName } from './icons';
import { chunk } from './funcs';

export type LastRun = {
  lastModified: string;
};

export type OpenedPR = {
  data: {
    html_url: string;
  };
  // TODO: дописать
};

export type PR = {
  title: string;
  description: string;
  branch: string;
  commit: string;
  changes: {
    [key: string]: string | null;
  };
};

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

const OctokitWithPlugin = Octokit.plugin(createPullRequest);

const octokit = new OctokitWithPlugin({
  auth: process.env.GITHUB_ACCESS_TOKEN,
  userAgent: 'figma-publish-icons-plugin v1.0.0',
});

export async function getLastRunInfo(): Promise<LastRun> {
  const r: any = await octokit.repos.getContents({
    repo,
    owner,
    path: 'last_run.json',
  });

  if (r && r.data && r.data.content) {
    return JSON.parse(Buffer.from(r.data.content, 'base64').toString());
  } else {
    throw Error('Not found');
  }
}

export async function getVersion(): Promise<VersionMetadata> {
  const r = await fetchVersions();
  if (r.versions.length) {
    return r.versions[0];
  }
}

export async function getChangedComponents(dateFrom: string): Promise<FullComponentMetadata[]> {
  const components = await fetchComponents();

  const from = Date.parse(dateFrom);

  return components.filter(component => {
    const updatedAt = Date.parse(component.updated_at);
    return updatedAt > from;
  });
}

export async function loadSvgs(
  components: FullComponentMetadata[],
  onIconLoad: (id: string, svg: string) => void
): Promise<void> {
  const chunks = chunk(components, 100);

  for (let changed of chunks) {
    const icons = await fetchIcons(changed);

    for (const [id, url] of Object.entries(icons.images)) {
      await fetch(url)
        .then(r => r.text())
        .then((content: string) => onIconLoad(id, content));
    }
  }
}

export async function openPR(pr: PR): Promise<OpenedPR> {
  return await octokit.createPullRequest({
    owner,
    repo,
    title: pr.title,
    body: pr.description,
    base: 'master',
    head: pr.branch,
    changes: {
      files: pr.changes,
      commit: pr.commit,
    },
  });
}

export function createPR(
  components: FullComponentMetadata[],
  icons: { [key: string]: string },
  version: VersionMetadata
): PR {
  const meta = {
    'last_run.json': JSON.stringify({
      lastModified: version.created_at,
    }),
  };

  const iconsChanges = components.reduce((changes, component) => {
    changes[prepareName(component)] = icons[component.node_id];
    return changes;
  }, {});

  const changes = { ...iconsChanges, ...meta };

  const title = `new icons from version ${version.id}`;
  let description = `Версия документа: ${version.id}`;
  description += `\nДобавлены новые иконки:`;
  description += `\n`;
  description += Object.keys(iconsChanges)
    .map((name, i) => `${i + 1}. ${name}`)
    .join(`\n`);

  const branch = `feat/add-new-icons-${version.id}`;
  const commit = `feat(icons): add ${components.length} icons`;

  return { title, description, branch, commit, changes };
}
