export async function figmaRequest(
  url: string,
  figmaApiKey: string,
  params = null,
  method = 'GET',
  headers = {}
): Promise<any> {
  const init = {
    method: 'GET',
    headers: {
      'X-Figma-Token': figmaApiKey,
      ...headers,
    },
  };

  // TODO: написать нормально
  if (params) {
    if (method === 'POST') {
      init['body'] = JSON.stringify(params);
    }

    if (method === 'GET') {
      const urlParams = new URLSearchParams(Object.entries(params));
      url += `?${urlParams}`;
    }
  }

  let result = await fetch('https://api.figma.com' + url, init);
  return await result.json();
}

export async function fetchIcons(
  changed: FullComponentMetadata[],
  figmaId: string = process.env.FIGMA_ID,
  figmaApiKey: string = process.env.FIGMA_API_KEY
): Promise<FileImageResponse> {
  return figmaRequest(`/v1/images/${figmaId}`, figmaApiKey, {
    ids: changed.map(c => c.node_id),
    format: 'svg',
  });
}

export async function fetchComponents(
  figmaId: string = process.env.FIGMA_ID,
  figmaApiKey: string = process.env.FIGMA_API_KEY
): Promise<FullComponentMetadata[]> {
  const r: ComponentResponse = await figmaRequest(`/v1/files/${figmaId}/components`, figmaApiKey);

  return r.meta.components;
}

export async function fetchVersions(
  figmaId: string = process.env.FIGMA_ID,
  figmaApiKey: string = process.env.FIGMA_API_KEY
): Promise<FileVersionsResponse> {
  return await figmaRequest(`/v1/files/${figmaId}/versions`, figmaApiKey);
}
