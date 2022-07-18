/* eslint-disable react/jsx-key */

export function renderTemplate({ title, parentTitle, username, usernameWidth, comments, date }) {
  return (
    <svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
      {/* background */}
      <rect width="1200" height="628" fill="#F5F5F5" />

      {/* left bar */}
      <path
        d="M17.4004 31.4064C35.3534 35.7471 48 51.8158 48 70.2862L48 622C48 644.091 30.0914 662 7.99998 662L-27 662C-49.0914 662 -67 644.091 -67 622L-67 61.8238C-67 35.9288 -42.7694 16.8585 -17.5996 22.9441L17.4004 31.4064Z"
        fill="#212529"
      />

      {!!parentTitle ? renderCommentHeader(title, parentTitle) : renderPostHeader(title)}

      {/* tabnews icon */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1103.37 91.5C1110.21 91.5 1115.75 97.0405 1115.75 103.875V145.125C1115.75 151.96 1110.21 157.5 1103.37 157.5H1045.62C1038.79 157.5 1033.25 151.96 1033.25 145.125V103.875C1033.25 97.0405 1038.79 91.5 1045.62 91.5H1103.37ZM1107.5 114.702H1078.63C1076.35 114.702 1073.86 112.971 1073.06 110.835L1068.95 99.75H1045.62C1043.35 99.75 1041.5 101.597 1041.5 103.875V145.125C1041.5 147.403 1043.35 149.25 1045.62 149.25H1103.37C1105.65 149.25 1107.5 147.403 1107.5 145.125V114.702Z"
        fill="#212529"
      />

      {/* username container */}
      <rect x="140" y="511" width={usernameWidth + 20} height="68" rx="8" fill="#C7D9EC" />

      {/* username */}
      <text x="150" y="555" fill="#424C56" fontSize="32">
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

function renderPostHeader(title) {
  return (
    <text y="80" fill="#212529" fontSize="56" fontWeight="bold">
      {title.map((s) => (
        <tspan x="140" dy={80}>
          {s}
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
        <tspan x="140" y="123.938">
          Em resposta a
        </tspan>
      </text>
      <text fill="#424C56" fontSize="32" textDecoration="underline">
        <tspan x="350.125" y="123.938">
          {parentTitle}
        </tspan>
      </text>

      {/* title */}
      <path
        d="m152.581 247.943.262-.607-.455-.479c-3.314-3.486-5.388-8.376-5.388-13.693 0-12.463 11.93-22.831 27-22.831s27 10.368 27 22.831c0 13.834-15.418 27.194-37.089 21.265l-.276-.076-.274.082-15.593 4.66 4.813-11.152z"
        stroke="#8EA1B4"
        fill="#F5F5F5"
        strokeWidth="2"
      />
      <text y="175" fill="#212529" fontSize="56" fontWeight="bold">
        {title.map((s, index) => (
          <tspan x={index === 0 ? 225 : 140} dy={80}>
            {s}
          </tspan>
        ))}
      </text>
    </>
  );
}
