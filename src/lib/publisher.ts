import { Octokit } from '@octokit/rest';
import createPullRequest from 'octokit-create-pull-request';
import { figmaRequest } from './figma';

export type LastRun = {
  lastModified: string;
};

export type Changes = {
  [key: string]: string | null;
};

export type OpenedPR = {
  data: {
    html_url: string;
  };
  // TODO: дописать
};

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const figmaApiKey = process.env.FIGMA_API_KEY;
const figmaId = process.env.FIGMA_ID;

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
  const r: FileVersionsResponse = await figmaRequest(`/v1/files/${figmaId}/versions`, figmaApiKey);
  if (r.versions.length) {
    return r.versions[0];
  }
}

export async function getChangedComponents(dateFrom: string): Promise<FullComponentMetadata[]> {
  const r: ComponentResponse = await figmaRequest(`/v1/files/${figmaId}/components`, figmaApiKey);

  const from = Date.parse(dateFrom);

  return r.meta.components.filter(component => {
    const updatedAt = Date.parse(component.updated_at);
    return updatedAt > from;
  });
}

export async function fetchIcons(changed: FullComponentMetadata[]): Promise<FileImageResponse> {
  return figmaRequest(`/v1/images/${figmaId}`, figmaApiKey, {
    ids: changed.map(c => c.node_id),
    format: 'svg',
  });
}

export async function openPR(
  title: string,
  description: string,
  branch: string,
  commit: string,
  changes: Changes
): Promise<OpenedPR> {
  return await octokit.createPullRequest({
    owner,
    repo,
    title,
    body: description,
    base: 'master',
    head: branch,
    changes: {
      files: changes,
      commit,
    },
  });
}
