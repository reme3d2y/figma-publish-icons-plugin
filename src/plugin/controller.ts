figma.showUI(__html__, {
  width: 600,
  height: 500,
});

figma.ui.onmessage = msg => {
  if (msg.type === 'publish') {
    figma.ui.postMessage({
      type: 'publish',
      message: figma.apiVersion,
    });
  }

  if (msg.type === 'cancel') {
    figma.closePlugin();
  }
};
