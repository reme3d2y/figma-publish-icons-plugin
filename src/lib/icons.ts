const nameParsers = {
  icon: (origName: string) => {
    const m = /^(?:icon_[a-z0-9-]+\/)?icon_([a-z0-9-]+)_([a-z0-9]+)(?:_([a-z0-9]+))$/i.exec(origName);

    return {
      name: m[1],
      size: m[2],
      color: m[3] || '',
    };
  },
};

export function prepareSvg(svgContent: string): string {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

  const svg = svgDoc.querySelector('svg');

  createBlankRect(svg);

  //TODO: добавить обработку svg

  return svg.outerHTML;
}

function createBlankRect(svg: SVGSVGElement) {
  const svgWidth = svg.getAttribute('width');
  const svgHeight = svg.getAttribute('height');

  const exists = svg.querySelectorAll(`rect[fill=none][width="${svgWidth}"][height="${svgHeight}"]`).length > 0;

  if (!exists) {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', svgWidth);
    rect.setAttribute('height', svgHeight);
    rect.setAttribute('fill', 'none');
    svg.prepend(rect);
  }
}

export function prepareName(iconComponent: FullComponentMetadata) {
  try {
    const page = iconComponent.containing_frame.pageName;
    const frame = iconComponent.containing_frame.name;
    const parserFn = nameParsers[page];
    const icon = parserFn(iconComponent.name);
    return `${frame.toLowerCase()}/${page}_${icon.name}_${icon.size}${icon.color ? '_' + icon.color : ''}.svg`;
  } catch (e) {
    return false;
  }
}
