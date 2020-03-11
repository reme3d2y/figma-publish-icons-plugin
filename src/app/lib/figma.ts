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
