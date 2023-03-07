import { join, resolve } from 'path';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderAsync } from '@resvg/resvg-js';
import removeMarkdown from 'models/remove-markdown';
import content from 'models/content.js';

async function asPng(contentObject) {
  const parentContentObject = await content.findOne({
    where: {
      id: contentObject.parent_id,
    },
  });
  const parsedContent = parseContent(contentObject, parentContentObject);
  const svg = renderToStaticMarkup(renderTemplate(parsedContent));

  const renderBuffer = await renderAsync(svg, {
    fitTo: {
      mode: 'width',
      value: 1280,
    },
    font: {
      fontFiles: [
        join(resolve('.'), 'fonts', 'Roboto-Regular.ttf'),
        join(resolve('.'), 'fonts', 'Roboto-Bold.ttf'),
        join(resolve('.'), 'fonts', 'NotoEmoji-Bold.ttf'),
      ],
      loadSystemFonts: false,
      defaultFontFamily: 'Roboto',
    },
  });

  return renderBuffer.asPng();
}

export function parseContent(content, parentContent) {
  let title = content.title;

  if (!title) {
    title = removeMarkdown(content.body, { maxLength: 120 });
  }

  // Regex to wrap text: https://stackoverflow.com/a/51506718
  if (content.parent_id) {
    title = title.replace(/(?![^\n]{1,30}$)([^\n]{1,30})\s/g, '$1_').split('_');
  } else {
    title = title.replace(/(?![^\n]{1,24}$)([^\n]{1,24})\s/g, '$1_').split('_');
  }

  title = title.length <= 3 ? title : [title[0], title[1], title[2] + '...'];

  let parent_title = parentContent?.title;

  if (content.parent_id) {
    parent_title = (parent_title ?? parentContent.owner_username).substring(0, 60);
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
    username: content.owner_username,
    usernameWidth: measureText(content.owner_username),
    comments: content.children_deep_count,
    date,
  };
}

export function renderTemplate({ title, parentTitle, username, usernameWidth, comments, date }) {
  function renderPostHeader(title) {
    return (
      <text y="54" fill="#212529" fontSize="75" fontWeight="bold">
        {title.map((line, index) => (
          <tspan x="60" dy={100} key={index}>
            {line}
          </tspan>
        ))}
      </text>
    );
  }

  function renderCommentHeader(title, parentTitle) {
    return (
      <>
        {/* reference */}
        <text fill="#424C56" fontSize="32">
          <tspan x="60" y="123.938">
            Em resposta a
          </tspan>
        </text>
        <text fill="#424C56" fontSize="32" textDecoration="underline">
          <tspan x="275" y="123.938">
            {parentTitle}
          </tspan>
        </text>

        {/* title */}
        <text y="155" fill="#212529" fontSize="75" fontWeight="bold">
          {title.map((line, index) => (
            <tspan x={60} dy={90} key={index}>
              {line}
            </tspan>
          ))}
        </text>
      </>
    );
  }

  return (
    <svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
      {/* background */}
      <rect width="1200" height="628" fill="#F5F5F5" />

      {/* title */}
      {!!parentTitle ? renderCommentHeader(title, parentTitle) : renderPostHeader(title)}

      {/* tabnews icon */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1103.37 91.5C1110.21 91.5 1115.75 97.0405 1115.75 103.875V145.125C1115.75 151.96 1110.21 157.5 1103.37 157.5H1045.62C1038.79 157.5 1033.25 151.96 1033.25 145.125V103.875C1033.25 97.0405 1038.79 91.5 1045.62 91.5H1103.37ZM1107.5 114.702H1078.63C1076.35 114.702 1073.86 112.971 1073.06 110.835L1068.95 99.75H1045.62C1043.35 99.75 1041.5 101.597 1041.5 103.875V145.125C1041.5 147.403 1043.35 149.25 1045.62 149.25H1103.37C1105.65 149.25 1107.5 147.403 1107.5 145.125V114.702Z"
        fill="#212529"
      />

      {/* username container */}
      <rect x="60" y="511" width={usernameWidth + 20} height="68" rx="8" fill="#C7D9EC" />

      {/* username */}
      <text x="70" y="555" fill="#424C56" fontSize="32">
        <tspan>{username}</tspan>
      </text>

      {/* comments icon */}
      <path
        d="M774 532.333C765.163 532.333 758 538.431 758 545.951C758 549.137 759.243 552.072 761.236 554.169L758 561.667L768.084 558.653C780.744 562.117 790 554.319 790 545.951C790 538.431 782.837 532.333 774 532.333Z"
        fill="#8EA1B4"
      />

      {/* comments */}
      <text x="800" y="555" fill="#424C56" fontSize="32">
        <tspan>{comments}</tspan>
      </text>

      {/* calendar icon */}
      <path
        d="M909.667 547.333H904.333V542H909.667V547.333ZM917.667 542H912.333V547.333H917.667V542ZM901.667 550H896.333V555.333H901.667V550ZM909.667 550H904.333V555.333H909.667V550ZM901.667 542H896.333V547.333H901.667V542ZM923 531.333V549.181C923 552.369 914.136 562 909.919 562H891V531.333H923ZM920.333 539.333H893.667V559.333H908.816C914.357 559.333 912.333 551.333 912.333 551.333C912.333 551.333 920.333 553.533 920.333 548.057V539.333Z"
        fill="#8EA1B4"
      />

      {/* date */}
      <text x="940" y="555" fill="#424C56" fontSize="32">
        <tspan>{date}</tspan>
      </text>
    </svg>
  );
}

export default Object.freeze({
  asPng,
});
