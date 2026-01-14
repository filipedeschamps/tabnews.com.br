import { useEffect, useState } from 'react';

/**
 * @typedef {ContentObject} - Representa um conteúdo do site, como uma publicação ou comentário
 * @property {string} id - ID único do conteúdo (UUID)
 * @property {string} owner_id - Representa o ID do usuário que postou
 */

/**
 * @typedef {UserObject} - Representa o usuário atual navegando no site
 * @property {string} id - ID único do usuário (UUID)
 */

/**
 * @param {ContentObject} contentObject - O conteúdo a ser consultado
 * @param {UserObject} [user] - O usuário navegando no site se houver
 * @param {number} [debounceDelay] - Valor do debounce antes de realizar o fetch em "ms"
 */

export default function useFavorite(contentObject, user, debounceDelay = 300) {
  const [isFavorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounce, setDebounce] = useState(null);

  useEffect(() => {
    async function checkIfIsAlreadyFavorite() {
      if (isElegible()) {
        try {
          const response = await fetch(`/api/v1/favorites/${contentObject.id}/status`, {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();

            if (data.is_saved) {
              setFavorite(true);
            }
          }
        } catch (error) {
          if (error && error.message) {
            setError(error.message || 'Não foi possível verificar o status de favorito do conteúdo');
          }
        }
      }
    }
    checkIfIsAlreadyFavorite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, contentObject.id]);

  function handleToggleFavorite() {
    if (!isElegible() || loading) {
      return;
    }

    if (debounce !== null) {
      clearTimeout(debounce);
    }

    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        if (user && contentObject.id) {
          const response = await fetch('/api/v1/favorites', {
            method: isFavorite ? 'DELETE' : 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content_id: contentObject.id,
            }),
          });

          if (!response.ok || response.status >= 400) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erro ao salvar conteúdo');
          }

          const responseBody = await response.json();
          setFavorite(responseBody.is_saved);
        }
        setError(null);
      } catch (error) {
        setError(error.message || 'Não foi possível salvar o conteúdo');
      } finally {
        setLoading(false);
      }
      setDebounce(null);
    }, debounceDelay);

    setDebounce(timeoutId);
  }

  function isElegible() {
    return !!user && user.id !== contentObject.owner_id;
  }

  return {
    isFavorite,
    loading,
    error,
    handleToggleFavorite,
    isElegible: isElegible(),
  };
}
