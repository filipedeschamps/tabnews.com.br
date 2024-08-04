/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable @next/next/no-img-element */
import { renderAsync } from '@resvg/resvg-js';
import fs from 'node:fs';
import { join, resolve } from 'node:path';
import satori from 'satori';

import content from 'models/content.js';
import removeMarkdown from 'models/remove-markdown';

async function asPng(contentObject) {
  let parentContentObject;
  if (contentObject.parent_id) {
    parentContentObject = await content.findOne({
      where: {
        id: contentObject.parent_id,
      },
    });
  }

  const parsedContent = parseContent(contentObject, parentContentObject);

  const svg = await satori(renderTemplate(parsedContent), {
    width: 1200,
    height: 630,
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

  const renderBuffer = await renderAsync(svg);

  return renderBuffer.asPng();
}

export function parseContent(content, parentContent) {
  let title = content.title;

  if (!title) {
    title = removeMarkdown(content.body, { maxLength: 120 });
  }

  let parent_title = parentContent?.title?.substring(0, 60);

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
        width: '100%',
        height: '100%',
        padding: '80px 60px 60px',
        fontFamily: 'Roboto',
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
            flex: 1,
            flexDirection: 'column',
          }}>
          {!!parentTitle && (
            <div
              style={{
                display: 'flex',
                paddingBottom: 32,
                gap: 12,
                color: '#424C56',
              }}>
              <div
                style={{
                  display: 'block',
                  fontSize: 32,
                }}>
                Em resposta a
              </div>
              <div
                style={{
                  display: 'block',
                  flex: 1,
                  fontSize: 32,
                  lineClamp: 1,
                  textDecoration: 'underline',
                }}>
                {parentTitle}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'block',
              fontSize: 74,
              lineHeight: 1.25,
              fontWeight: 'bold',
              lineClamp: 3,
              color: '#212529',
            }}>
            {title}
          </div>
        </div>

        <img
          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODMiIGhlaWdodD0iNjciIHZpZXdCb3g9IjAgMCA4MyA2NyIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGQ9Ik03MC4zNzQ2IDAuNUM3Ny4yMDkzIDAuNSA4Mi43NDk2IDYuMDQwNDkgODIuNzQ5NiAxMi44NzVWNTQuMTI1QzgyLjc0OTYgNjAuOTU5NyA3Ny4yMDkzIDY2LjUgNzAuMzc0NiA2Ni41SDEyLjYyNDhDNS43OTAyMSA2Ni41IDAuMjQ5NzU2IDYwLjk1OTcgMC4yNDk3NTYgNTQuMTI1VjEyLjg3NUMwLjI0OTc1NiA2LjA0MDQ5IDUuNzkwMjEgMC41IDEyLjYyNDggMC41SDcwLjM3NDZaTTc0LjQ5OTYgMjMuNzAyM0g0NS42MjVDNDMuMzQ3MiAyMy43MDIzIDQwLjg1NzMgMjEuOTcwOSA0MC4wNjQ1IDE5LjgzNTJMMzUuOTQ4NiA4Ljc1SDEyLjYyNDhDMTAuMzQ2NiA4Ljc1IDguNDk5NzYgMTAuNTk2OCA4LjQ5OTc2IDEyLjg3NVY1NC4xMjVDOC40OTk3NiA1Ni40MDMyIDEwLjM0NjYgNTguMjUgMTIuNjI0OCA1OC4yNUg3MC4zNzQ2QzcyLjY1MjggNTguMjUgNzQuNDk5NiA1Ni40MDMyIDc0LjQ5OTYgNTQuMTI1VjIzLjcwMjNaIiBmaWxsPSIjMjEyNTI5Ii8+Cjwvc3ZnPgo="
          width={82.5}
          height={66}
          style={{ marginLeft: 40 }}
        />
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
            padding: 20,
            backgroundColor: '#C7D9EC',
            color: '#424C56',
            borderRadius: 6,
            fontSize: 32,
          }}>
          {username}
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
            gap: 20,
            color: '#424C56',
          }}>
          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMiAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE2IDAuMzMzMzI4QzcuMTYyNjcgMC4zMzMzMjggMCA2LjQzMDY2IDAgMTMuOTUwN0MwIDE3LjEzNzMgMS4yNDI2NyAyMC4wNzIgMy4yMzYgMjIuMTY5M0wwIDI5LjY2NjdMMTAuMDg0IDI2LjY1MzNDMjIuNzQ0IDMwLjExNzMgMzIgMjIuMzE4NyAzMiAxMy45NTA3QzMyIDYuNDMwNjYgMjQuODM3MyAwLjMzMzMyOCAxNiAwLjMzMzMyOFoiIGZpbGw9IiM4RUExQjQiLz4KPC9zdmc+Cg=="
            width={32}
            height={30}
          />
          <div>{comments}</div>

          <div></div>

          <img
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzEiIHZpZXdCb3g9IjAgMCAzMiAzMSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE4LjY2NjcgMTYuMzMzM0gxMy4zMzMzVjExSDE4LjY2NjdWMTYuMzMzM1pNMjYuNjY2NyAxMUgyMS4zMzMzVjE2LjMzMzNIMjYuNjY2N1YxMVpNMTAuNjY2NyAxOUg1LjMzMzMzVjI0LjMzMzNIMTAuNjY2N1YxOVpNMTguNjY2NyAxOUgxMy4zMzMzVjI0LjMzMzNIMTguNjY2N1YxOVpNMTAuNjY2NyAxMUg1LjMzMzMzVjE2LjMzMzNIMTAuNjY2N1YxMVpNMzIgMC4zMzMzMjhWMTguMTgxM0MzMiAyMS4zNjkzIDIzLjEzNiAzMSAxOC45MTg3IDMxSDBWMC4zMzMzMjhIMzJaTTI5LjMzMzMgOC4zMzMzM0gyLjY2NjY3VjI4LjMzMzNIMTcuODE2QzIzLjM1NzMgMjguMzMzMyAyMS4zMzMzIDIwLjMzMzMgMjEuMzMzMyAyMC4zMzMzQzIxLjMzMzMgMjAuMzMzMyAyOS4zMzMzIDIyLjUzMzMgMjkuMzMzMyAxNy4wNTczVjguMzMzMzNaIiBmaWxsPSIjOEVBMUI0Ii8+Cjwvc3ZnPgo="
            width={32}
            height={30}
          />

          <div>{date}</div>
        </div>
      </div>
    </div>
  );
}

export default Object.freeze({
  asPng,
});
