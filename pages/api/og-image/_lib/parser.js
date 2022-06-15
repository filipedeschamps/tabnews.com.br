export function parseRequest(req) {
  let { title, parentTitle, author, comments, date } = req.query;

  // Regex to wrap text: stackoverflow.com/a/51506718
  title = title.replace(/(?![^\n]{1,30}$)([^\n]{1,30})\s/g, '$1_').split('_');
  title = title.length <= 3 ? title : [title[0], title[1], title[2] + '...'];

  parentTitle = parentTitle?.length > 30 ? parentTitle.substring(0, 30) + '...' : parentTitle;

  // Measure author text width: https://bl.ocks.org/tophtucker/62f93a4658387bb61e4510c37e2e97cf
  function measureText(string, fontSize = 32) {
    const widths = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.22783203125,
      0.334375, 0.409375, 0.5, 0.5, 0.834375, 0.8, 0.2, 0.4, 0.334375, 0.5, 0.6, 0.25, 0.334375, 0.25, 0.3, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.278125, 0.3, 0.6, 0.6, 0.6, 0.5, 0.921875, 0.8, 0.7, 0.7, 0.7234375,
      0.6109375, 0.6, 0.7234375, 0.7234375, 0.334375, 0.4, 0.8, 0.6109375, 0.9, 0.7234375, 0.7234375, 0.6, 0.8, 0.7,
      0.55625, 0.6109375, 0.8, 0.8, 1, 0.8, 0.7234375, 0.6109375, 0.334375, 0.3, 0.334375, 0.5, 0.7, 0.334375, 0.5, 0.5,
      0.5, 0.5, 0.5, 0.4, 0.5, 0.5, 0.3, 0.378125, 0.5, 0.3, 0.8, 0.5, 0.5, 0.5, 0.5, 0.4, 0.4, 0.3, 0.5, 0.5, 0.8, 0.5,
      0.5, 0.5, 0.48125, 0.2015625, 0.48125, 0.6,
    ];
    const avg = 0.5315265213815787;
    return (
      string
        .split('')
        .map((c) => (c.charCodeAt(0) < widths.length ? widths[c.charCodeAt(0)] : avg))
        .reduce((cur, acc) => acc + cur) *
      fontSize *
      1.1
    );
  }

  return {
    title,
    parentTitle,
    author,
    authorWidth: measureText(author),
    comments,
    date,
  };
}
