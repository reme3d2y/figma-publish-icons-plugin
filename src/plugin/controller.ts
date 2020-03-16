figma.showUI(__html__, {
  width: 600,
  height: 420,
});

figma.ui.onmessage = msg => {
  if (msg.type === 'publish') {
    figma.ui.postMessage({
      type: 'publish',
      message: figma.apiVersion,
    });
  }

  if (msg.type === 'focus') {
    const { pageId, nodeId } = msg;
    const node = figma.getNodeById(nodeId);

    if (figma.currentPage.id !== pageId) {
      const pageNode = figma.getNodeById(pageId);
      if (pageNode.type === "PAGE") {
        figma.currentPage = pageNode;
      }
    }

    if (node.type === "COMPONENT") {
      figma.currentPage.selection = [node];
      figma.viewport.scrollAndZoomIntoView([node]);
    }
  }


  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
