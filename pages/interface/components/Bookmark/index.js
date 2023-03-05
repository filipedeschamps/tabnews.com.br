import { useState, useEffect } from 'react';
import { Box, IconButton } from '@primer/react';
import { BookmarkIcon, BookmarkSlashIcon, XIcon } from '@primer/octicons-react';
import { useRouter } from 'next/router';

import { useUser, BookmarkPlaylist } from 'pages/interface/index.js';
import useBookmarks from 'pages/interface/hooks/useBookmarks';

export default function BookmarkButton({ content }) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useUser();
  const { bookmarks, isLoading: bookmarksLoading, fetchBookmarks } = useBookmarks();

  const [contentObject, setContentObject] = useState(content);
  const [isSaved, setIsSaved] = useState(false);

  const [disabled, setIsDisabled] = useState(true);

  useEffect(() => {
    setContentObject(content);
  }, [content]);

  useEffect(() => {
    if (!user && !isLoading) {
      setIsDisabled(false);
      setIsSaved(false);
    }

    if (!isLoading && user && !bookmarks) {
      fetchBookmarks();
    }
  }, [bookmarks, isLoading, fetchBookmarks, user]);

  useEffect(() => {
    if (!bookmarksLoading && bookmarks) {
      if (bookmarks != undefined && bookmarks.bookmarks.length != 0) {
        const result = bookmarks.bookmarks.filter((bookmark) => (bookmark = contentObject.id));
        if (result.length != 0) {
          setIsSaved(true);
        }
      }
      setIsDisabled(false);
    }
  }, [bookmarks, bookmarksLoading, contentObject]);

  async function saveContent() {
    setIsDisabled(true);

    if (!user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
      return;
    }

    try {
      const response = await fetch(`/api/v1/bookmarks/${contentObject.owner_username}`, {
        method: 'PATCH',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: [contentObject.id],
        }),
      });

      const responseBody = await response.json();

      if (response.status === 200) {
        fetchUser();
        setIsDisabled(false);
        setIsSaved(true);
        return;
      }

      alert(`${responseBody.message} ${responseBody.action}`);
      setIsDisabled(false);
    } catch (error) {
      setIsDisabled(false);
    }
  }

  async function deleteContent() {
    setIsDisabled(true);

    if (!user && !isLoading) {
      router.push(`/login?redirect=${router.asPath}`);
      return;
    }

    try {
      const response = await fetch(`/api/v1/bookmarks/${contentObject.owner_username}`, {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_id: [contentObject.id],
        }),
      });

      const responseBody = await response.json();

      if (response.status === 200) {
        fetchUser();
        setIsDisabled(false);
        setIsSaved(false);
        return;
      }

      alert(`${responseBody.message} ${responseBody.action}`);
      setIsDisabled(false);
    } catch (error) {
      setIsDisabled(false);
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '0px',
        mb: '9px',
      }}>
      <Box>
        {isSaved ? (
          <IconButton
            variant="invisible"
            aria-label="Remover o conteúdo"
            icon={BookmarkSlashIcon}
            size="small"
            sx={{ color: 'fg.subtle', lineHeight: '18px' }}
            onClick={() => {
              deleteContent();
            }}
            disabled={disabled}
          />
        ) : (
          <IconButton
            variant="invisible"
            aria-label="Salvar o conteúdo"
            icon={BookmarkIcon}
            size="small"
            sx={{ color: 'fg.subtle', lineHeight: '18px' }}
            onClick={() => {
              saveContent();
            }}
            disabled={disabled}
          />
        )}
      </Box>
    </Box>
  );
}
