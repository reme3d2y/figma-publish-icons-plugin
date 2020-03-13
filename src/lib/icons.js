"use strict";
exports.__esModule = true;
function prepareSvg(svgContent) {
    var parser = new DOMParser();
    var svg = parser.parseFromString(svgContent, 'image/svg+xml');
    return svg.body.innerHTML;
}
exports.prepareSvg = prepareSvg;
console.log(prepareSvg('<svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="18" height="18" fill="none"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.5 1C5.364 1 2 4.364 2 8.5C2 12.636 5.364 16 9.5 16C13.636 16 17 12.636 17 8.5C17 4.364 13.636 1 9.5 1ZM9.5 15C7.77674 14.9979 6.12467 14.3124 4.90614 13.0939C3.68762 11.8753 3.00212 10.2233 3 8.5C3 4.916 5.916 2 9.5 2C13.084 2 16 4.916 16 8.5C16 12.084 13.084 15 9.5 15Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M11.6213 5.67157L12.3284 6.37868L7.3787 11.3284L6.67159 10.6213L11.6213 5.67157Z" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M7.37866 5.67157L12.3284 10.6213L11.6213 11.3284L6.67156 6.37868L7.37866 5.67157Z" fill="white"/></svg>'));
