export enum PAGES {
  icon = 'icon',
  click = 'click',
}

export const ICON_NAME_RX = {
  [PAGES.icon]: /^(?:icon_[a-z0-9-]+\/)?icon_([a-z0-9-]+)_([a-z0-9]+)(?:_([a-z0-9]+))$/i,
  [PAGES.click]: /^[a-z0-9-]+ \/ ([a-z0-9-]+)$/i,
};

const nameParsers = {
  [PAGES.icon]: (origName: string) => {
    const m = ICON_NAME_RX[PAGES.icon].exec(origName);

    return {
      name: m[1],
      size: m[2],
      color: m[3] || '',
    };
  },
  [PAGES.click]: (origName: string) => {
    const m = ICON_NAME_RX[PAGES.click].exec(origName);

    return {
      name: m[1],
      size: '24',
      color: '',
    };
  },
} as const;

export function prepareSvg(svgContent: string): string {
  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');

  const svg = svgDoc.querySelector('svg');

  createBlankRect(svg);

  //TODO: добавить обработку svg

  return svg.outerHTML + '\n';
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

export function validate(iconComponent: FullComponentMetadata): boolean {
  const page = iconComponent.containing_frame.pageName;

  return page in PAGES && ICON_NAME_RX[PAGES[page]].test(iconComponent.name);
}

export function prepareName(iconComponent: FullComponentMetadata): string {
  const page = iconComponent.containing_frame.pageName;
  const frame = iconComponent.containing_frame.name;
  const icon = nameParsers[page](iconComponent.name);

  return `${frame.toLowerCase()}/${page}_${icon.name}_${icon.size}${icon.color ? '_' + icon.color : ''}.svg`;
}
