import removeMarkdown from 'remove-markdown';

export function parseContent(content) {
  let title = content.title;

  if (!title) {
    title = removeMarkdown(content.body).substring(0, 120).replace(/\s+/g, ' ');
  }

  // Regex to wrap text: https://stackoverflow.com/a/51506718
  if (content.parent_id) {
    title = title.replace(/(?![^\n]{1,30}$)([^\n]{1,30})\s/g, '$1_').split('_');
  } else {
    title = title.replace(/(?![^\n]{1,24}$)([^\n]{1,24})\s/g, '$1_').split('_');
  }

  title = title.length <= 3 ? title : [title[0], title[1], title[2] + '...'];

  let parent_title = content.parent_title;

  if (content.parent_slug) {
    parent_title = (parent_title ?? content.parent_username).substring(0, 60);
  }

  parent_title = parent_title?.length > 50 ? parent_title.substring(0, 50) + '...' : parent_title;

  const date = new Date(content.published_at).toLocaleDateString('pt-BR');

  // Measure author text width: https://bl.ocks.org/tophtucker/62f93a4658387bb61e4510c37e2e97cf
  function measureText(string, fontSize = 32) {
    const widths = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.246875,
      0.2578125, 0.3203125, 0.61640625, 0.56171875, 0.7328125, 0.621875, 0.175, 0.3421875, 0.34765625, 0.43125,
      0.5671875, 0.196875, 0.2765625, 0.26328125, 0.4125, 0.56171875, 0.56171875, 0.56171875, 0.56171875, 0.56171875,
      0.56171875, 0.56171875, 0.56171875, 0.56171875, 0.56171875, 0.2421875, 0.21171875, 0.50859375, 0.54921875,
      0.52265625, 0.47265625, 0.8984375, 0.65234375, 0.62265625, 0.6515625, 0.65625, 0.56875, 0.553125, 0.68125,
      0.71328125, 0.27265625, 0.55234375, 0.62744140625, 0.53828125, 0.8734375, 0.71328125, 0.6875, 0.63125, 0.6875,
      0.61640625, 0.59375, 0.596875, 0.6484375, 0.63671875, 0.8875, 0.62734375, 0.60078125, 0.59921875, 0.265625,
      0.41015625, 0.265625, 0.41796875, 0.4515625, 0.309375, 0.54453125, 0.56171875, 0.5234375, 0.5640625, 0.53046875,
      0.3486328125, 0.56171875, 0.55078125, 0.24296875, 0.27080078125, 0.50703125, 0.24296875, 0.8765625, 0.55234375,
      0.5703125, 0.56171875, 0.56875, 0.3390625, 0.515625, 0.32734375, 0.5515625, 0.484375, 0.7515625, 0.49609375,
      0.4734375, 0.49609375, 0.3390625, 0.24375, 0.3390625, 0.68046875,
    ];
    const avg = 0.5117845394736842;
    return (
      string
        .split('')
        .map((c) => (c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg))
        .reduce((cur, acc) => acc + cur) * fontSize
    );
  }

  return {
    title,
    parentTitle: parent_title,
    username: content.username,
    usernameWidth: measureText(content.username),
    comments: content.children_deep_count,
    date,
  };
}
