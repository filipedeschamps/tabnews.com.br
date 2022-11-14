import fs from 'node:fs';
import { join, resolve } from 'node:path';
import { renderAsync } from '@resvg/resvg-js';
import satori from 'satori';
import content from 'models/content.js';
import removeMarkdown from 'models/remove-markdown';

async function asPng(contentObject) {
  const parentContentObject = await content.findOne({
    where: {
      id: contentObject.parent_id,
    },
  });
  const parsedContent = parseContent(contentObject, parentContentObject);

  const svg = await satori(renderTemplate(parsedContent), {
    width: 1200,
    height: 628,
    debug: true,
    fonts: [
      {
        name: 'Roboto',
        data: fs.readFileSync(join(resolve('.'), 'fonts', 'Roboto-Regular.ttf')),
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Roboto',
        data: fs.readFileSync(join(resolve('.'), 'fonts', 'Roboto-Bold.ttf')),
        weight: 700,
        style: 'normal',
      },
      {
        name: 'NotoEmoji',
        data: fs.readFileSync(join(resolve('.'), 'fonts', 'NotoEmoji-Bold.ttf')),
        weight: 700,
        style: 'normal',
      },
    ],
  });

  const renderBuffer = await renderAsync(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  });

  return renderBuffer.asPng();
}

export function parseContent(content, parentContent) {
  let title = content.title;

  if (!title) {
    title = removeMarkdown(content.body).substring(0, 120).replace(/\s+/g, ' ');
  }

  let parent_title = parentContent?.title.substring(0, 60);

  if (content.parent_id) {
    parent_title = (parent_title ?? parentContent.owner_username).substring(0, 60);
  }

  const date = new Date(content.published_at).toLocaleDateString('pt-BR');

  return {
    title,
    parentTitle: parent_title,
    username: content.owner_username,
    comments: content.children_deep_count,
    date,
  };
}

export function renderTemplate({ title, parentTitle, username, comments, date }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        padding: '80px 50px 50px',
        fontFamily: 'Roboto',
        fontSize: 100,
        backgroundColor: '#F5F5F5',
      }}>
      <div
        style={{
          display: 'flex',
          width: '100%',
        }}>
        <div
          style={{
            display: 'flex',
            paddingRight: '20px',
            flex: 1,
            maxHeight: '400px',
            fontSize: 76,
            fontWeight: 'bold',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
          This is a very long title and it should have 125 characters in total. Its not the maximum accepted value, but
          it is very very long
        </div>

        <div
          style={{
            display: 'flex',
            flexGrow: 0,
            flexShrink: 0,
          }}>
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODMiIGhlaWdodD0iNjciIHZpZXdCb3g9IjAgMCA4MyA2NyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03MC4zNzQ2IDAuNUM3Ny4yMDkzIDAuNSA4Mi43NDk2IDYuMDQwNDkgODIuNzQ5NiAxMi44NzVWNTQuMTI1QzgyLjc0OTYgNjAuOTU5NyA3Ny4yMDkzIDY2LjUgNzAuMzc0NiA2Ni41SDEyLjYyNDhDNS43OTAyMSA2Ni41IDAuMjQ5NzU2IDYwLjk1OTcgMC4yNDk3NTYgNTQuMTI1VjEyLjg3NUMwLjI0OTc1NiA2LjA0MDQ5IDUuNzkwMjEgMC41IDEyLjYyNDggMC41SDcwLjM3NDZaTTc0LjQ5OTYgMjMuNzAyM0g0NS42MjVDNDMuMzQ3MiAyMy43MDIzIDQwLjg1NzMgMjEuOTcwOSA0MC4wNjQ1IDE5LjgzNTJMMzUuOTQ4NiA4Ljc1SDEyLjYyNDhDMTAuMzQ2NiA4Ljc1IDguNDk5NzYgMTAuNTk2OCA4LjQ5OTc2IDEyLjg3NVY1NC4xMjVDOC40OTk3NiA1Ni40MDMyIDEwLjM0NjYgNTguMjUgMTIuNjI0OCA1OC4yNUg3MC4zNzQ2QzcyLjY1MjggNTguMjUgNzQuNDk5NiA1Ni40MDMyIDc0LjQ5OTYgNTQuMTI1VjIzLjcwMjNaIiBmaWxsPSIjMjEyNTI5Ii8+Cjwvc3ZnPgo="
            width={82.5}
            height={66}
          />
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flex: 1,
        }}></div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          width: '100%',
        }}>
        <div
          style={{
            display: 'flex',
            padding: '10px 20px',
            backgroundColor: '#C7D9EC',
            color: '#424C56',
            borderRadius: 5,
            fontSize: 32,
          }}>
          filipedeschamps
        </div>

        <div
          style={{
            display: 'flex',
            flex: 1,
          }}></div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: 32,
          }}>
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMiAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDAuMzMzMzI4QzcuMTYyNjcgMC4zMzMzMjggMCA2LjQzMDY2IDAgMTMuOTUwN0MwIDE3LjEzNzMgMS4yNDI2NyAyMC4wNzIgMy4yMzYgMjIuMTY5M0wwIDI5LjY2NjdMMTAuMDg0IDI2LjY1MzNDMjIuNzQ0IDMwLjExNzMgMzIgMjIuMzE4NyAzMiAxMy45NTA3QzMyIDYuNDMwNjYgMjQuODM3MyAwLjMzMzMyOCAxNiAwLjMzMzMyOFoiIGZpbGw9IiM4RUExQjQiLz4KPC9zdmc+Cg=="
            width={32}
            height={30}
          />
          <div
            style={{
              padding: '10px 20px',
              color: '#424C56',
            }}>
            20
          </div>

          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzEiIHZpZXdCb3g9IjAgMCAzMiAzMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE4LjY2NjcgMTYuMzMzM0gxMy4zMzMzVjExSDE4LjY2NjdWMTYuMzMzM1pNMjYuNjY2NyAxMUgyMS4zMzMzVjE2LjMzMzNIMjYuNjY2N1YxMVpNMTAuNjY2NyAxOUg1LjMzMzMzVjI0LjMzMzNIMTAuNjY2N1YxOVpNMTguNjY2NyAxOUgxMy4zMzMzVjI0LjMzMzNIMTguNjY2N1YxOVpNMTAuNjY2NyAxMUg1LjMzMzMzVjE2LjMzMzNIMTAuNjY2N1YxMVpNMzIgMC4zMzMzMjhWMTguMTgxM0MzMiAyMS4zNjkzIDIzLjEzNiAzMSAxOC45MTg3IDMxSDBWMC4zMzMzMjhIMzJaTTI5LjMzMzMgOC4zMzMzM0gyLjY2NjY3VjI4LjMzMzNIMTcuODE2QzIzLjM1NzMgMjguMzMzMyAyMS4zMzMzIDIwLjMzMzMgMjEuMzMzMyAyMC4zMzMzQzIxLjMzMzMgMjAuMzMzMyAyOS4zMzMzIDIyLjUzMzMgMjkuMzMzMyAxNy4wNTczVjguMzMzMzNaIiBmaWxsPSIjOEVBMUI0Ii8+Cjwvc3ZnPgo="
            width={32}
            height={30}
          />

          <div
            style={{
              padding: '10px 20px',
              color: '#424C56',
            }}>
            13/11/2022
          </div>
        </div>
      </div>
    </div>
  );
}

export default Object.freeze({
  asPng,
});
