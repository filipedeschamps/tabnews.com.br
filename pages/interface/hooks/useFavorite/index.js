import { useEffect, useState } from 'react';

/**
 * @typedef {ContentObject} - Representa um conteúdo do site, como uma publicação ou comentário
 * @property {string} owner_id - Representa o ID do usuário que postou
 * @property {string} slug - Uma string única gerada a partir do título
 */

/**
 * @typedef {UserObject} - Representa o usuário atual navegando no site
 */

/**
 * @param {ContentObject} contentObject - O conteúdo a ser consultado
 * @param {UserObject} [user] - O usuário navegando no site se houver
 * @param {number} [debounce] - Valor do debounce antes de realizar o fetch em "ms"
 */

export default function useFavorite(contentObject, user, debounceDelay = 300) {
  const [isFavorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [debounce, setDebounce] = useState(null);

  useEffect(() => {
    async function checkIfIsAlreadyFavorite() {
      if (isElegible()) {
        const response = await fetch(
          `/api/v1/favorites?owner_id=${contentObject.owner_id}&slug=${contentObject.slug}`,
          {
            method: 'GET',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
          },
        );

        const data = await response.json();

        if (data.is_saved) {
          setFavorite(true);
        }
      }
    }
    checkIfIsAlreadyFavorite();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, contentObject]);

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

        const response = await fetch('/api/v1/favorites', {
          method: isFavorite ? 'DELETE' : 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            owner_id: contentObject.owner_id,
            slug: contentObject.slug,
          }),
        });

        if (!response.ok || response.status >= 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Erro ao salvar conteúdo');
        }

        const responseBody = await response.json();
        setFavorite(responseBody.is_saved);
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
