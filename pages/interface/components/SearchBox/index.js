import { useRouter } from 'next/router';
import { useEffect, useRef, useState } from 'react';

import { ActionList, Box, Button, Dialog, FormControl, IconButton, Link, Spinner, TextInput } from '@/TabNewsUI';
import { ArrowUpLeftIcon, SearchIcon, XCircleFillIcon } from '@/TabNewsUI/icons';

const searchEndpoint = '/api/v1/search';

export default function useSearchBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [valueSearch, setValueSearch] = useState('');
  const [valueSearchEnd, setValueSearchEnd] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTrends, setSearchTrends] = useState([]);
  const [timer, setTimer] = useState(null);
  const router = useRouter();

  const buttonRef = useRef();
  const searchBarInputRef = useRef(null);

  useEffect(() => {
    const fetchSearchTrends = async () => {
      setIsSuggestionsLoading(true);

      try {
        const res = await fetch(`${searchEndpoint}/trends`);
        const data = await res.json();
        setSearchTrends(data);
      } catch (error) {
        console.error('Failed to fetch search trends:', error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    if (!searchTrends) {
      fetchSearchTrends();
    }
  }, [searchTrends]);

  useEffect(() => {
    setIsLoading(false);
    setMounted(true);
  }, [mounted, isLoading]);

  useEffect(() => {
    const fetchSearchSuggestions = async () => {
      setIsSuggestionsLoading(true);

      try {
        const res = await fetch(`${searchEndpoint}/suggestions?q=${valueSearchEnd}`);
        const data = await res.json();
        setSearchTrends(data);
      } catch (error) {
        console.error('Failed to fetch search suggestions:', error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    const fetchSearchTrends = async () => {
      setIsSuggestionsLoading(true);

      try {
        const res = await fetch(`${searchEndpoint}/trends`);
        const data = await res.json();
        setSearchTrends(data);
      } catch (error) {
        console.error('Failed to fetch search trends:', error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    if (valueSearchEnd.trim() !== '') {
      fetchSearchSuggestions();
    } else {
      fetchSearchTrends();
    }
  }, [valueSearchEnd]);

  useEffect(() => {
    const fetchSearchTrends = async () => {
      setIsSuggestionsLoading(true);

      try {
        const res = await fetch(`${searchEndpoint}/trends`);
        const data = await res.json();
        setSearchTrends(data);
      } catch (error) {
        console.error('Failed to fetch search trends:', error);
      } finally {
        setIsSuggestionsLoading(false);
      }
    };

    if (isOpen) {
      setValueSearch('');
      fetchSearchTrends();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyPress(event) {
      if (
        event.target.tagName !== 'INPUT' &&
        event.target.tagName !== 'TEXTAREA' &&
        document.activeElement.tagName !== 'INPUT' &&
        document.activeElement.tagName !== 'TEXTAREA'
      ) {
        if (event.key === '/' || event.keyCode === 193) {
          event.preventDefault();
          setIsOpen((prev) => !prev);
        }

        if (isOpen && (event.key === 'Escape' || event.keyCode === 27)) {
          setIsOpen(false);
          setIsLoading(true);
          setMounted(false);
          setValueSearch('');
          setValueSearchEnd('');
          setSearchTrends([]);
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress);

    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [isOpen]);

  const handleChange = (event) => {
    event.preventDefault();

    setValueSearch(event.target.value);

    if (timer) {
      clearTimeout(timer);
    }

    setTimer(
      setTimeout(() => {
        setIsSuggestionsLoading(false);
        setValueSearchEnd(event.target.value);
      }, 500),
    );
  };

  function onClickSearchButton(e) {
    buttonRef.current = e.target;
    setIsOpen(true);
  }

  const handleClick = () => {
    setIsOpen((p) => !p);
    setValueSearch('');
    setValueSearchEnd('');
    setSearchTrends([]);
  };

  const handleSubmit = () => {
    setIsOpen((p) => !p);

    if (`/buscar/pagina/1?q=${valueSearch}` !== router.pathname) {
      router.push(`/buscar/pagina/1?q=${valueSearch}`);
    }

    setValueSearch('');
    setValueSearchEnd('');
    setSearchTrends([]);
  };

  function SearchBoxOverlay() {
    if (!isOpen) return null;

    const handleClose = () => {
      setIsOpen(false);
      setValueSearch('');
      setValueSearchEnd('');
      setIsLoading(true);
      setMounted(false);

      if (searchTrends) {
        setSearchTrends([]);
      }
    };

    const handleClickActionButton = () => {
      setValueSearch('');

      const fetchSearchTrends = async () => {
        setIsSuggestionsLoading(true);

        try {
          const res = await fetch(`${searchEndpoint}/trends`);
          const data = await res.json();
          setSearchTrends(data);
        } catch (error) {
          console.error('Failed to fetch search trends:', error);
        } finally {
          setIsSuggestionsLoading(false);
        }
      };

      fetchSearchTrends();
    };

    return (
      <>
        <Dialog
          returnFocusRef={buttonRef}
          initialFocusRef={searchBarInputRef}
          onDismiss={handleClose}
          id="dialog-search"
          aria-labelledby="Pesquisar"
          anchorSide="inside-center"
          sx={{
            width: '100%',
            maxWidth: ['100%', '85%', '68%'],
            maxHeight: '100%',
            top: -2,
            '& > button[aria-label="Close"]': {
              display: ['block', 'block', 'none'],
              marginTop: [3, , 0, ,],
            },
            border: '1px solid',
            borderColor: 'border.default',
            borderRadius: 'var(--borderRadius-large,0.75rem)',
          }}
          isOpen={isOpen}>
          <Box sx={{ overflowY: 'auto', display: 'flex', width: '100%' }}>
            <Box
              sx={{
                width: '100%',
              }}>
              <Dialog.Header id="header">
                <Box as="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
                  {mounted ? (
                    <FormControl
                      sx={{
                        display: 'flex',
                        alignItems: ['start', , 'center'],
                        width: '100%',
                      }}>
                      <FormControl.Label visuallyHidden>SearchInput</FormControl.Label>
                      <TextInput
                        sx={{
                          maxWidth: ['87%', '92%', '100%'],
                          marginTop: [2, , 0, ,],
                          width: '100%',
                          display: 'flex',
                          alignItems: ['start', , 'center'],
                        }}
                        block
                        ref={searchBarInputRef}
                        className="search-input"
                        type="text"
                        size="large"
                        autoComplete="off"
                        autoCorrect="off"
                        leadingVisual={SearchIcon}
                        defaultValue={valueSearch || ''}
                        trailingAction={
                          valueSearch && (
                            <TextInput.Action
                              onClick={handleClickActionButton}
                              icon={XCircleFillIcon}
                              aria-label="Clear input"
                              sx={{
                                color: 'fg.subtle',
                              }}
                            />
                          )
                        }
                        onChange={handleChange}
                      />
                    </FormControl>
                  ) : null}
                </Box>
              </Dialog.Header>
              <Box sx={{ overflowY: 'auto' }}>
                <SearchBoxMainSuggestions />
              </Box>
            </Box>
          </Box>
        </Dialog>
      </>
    );
  }

  function SearchBoxMainSuggestions({ sx, ...props }) {
    const showNoSuggestionsMessage = !isSuggestionsLoading && (!searchTrends || searchTrends.results?.length === 0);

    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', px: 13, ...sx }} {...props}>
        {isSuggestionsLoading ? (
          <Box sx={{ position: 'relative', display: 'flex', my: 3 }}>
            <Spinner />
          </Box>
        ) : searchTrends && searchTrends.results?.length > 0 ? (
          <Box as="section" sx={{ width: '100%', maxHeight: 'calc(100vh - 64px)', height: 'auto' }}>
            <Box as="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, padding: 0 }}>
              {searchTrends.results.map((x) => (
                <SearchResultItem key={x.id} x={x} />
              ))}
            </Box>
          </Box>
        ) : valueSearchEnd && showNoSuggestionsMessage ? (
          <Box as="section" sx={{ width: '100%', maxHeight: 'calc(100vh - 64px)', height: 'auto', margin: 0 }}>
            <Box as="ul" sx={{ display: 'flex', flexDirection: 'column', gap: 1, margin: 0, padding: 0 }}>
              <Box as="p" sx={{ fontWeight: '500', padding: 0 }}>
                <NoSuggestionsLink />
              </Box>
            </Box>
          </Box>
        ) : null}
        {!valueSearchEnd && showNoSuggestionsMessage && (
          <Box as="p" sx={{ mt: 4, fontWeight: '500' }}>
            Quando eu cheguei era tudo mato...
          </Box>
        )}
      </Box>
    );
  }

  function SearchResultItem({ x }) {
    return (
      <Box
        as="li"
        sx={{
          listStyle: 'none',
          py: 2,
          px: 2,
          ':hover': {
            backgroundColor: 'border.default',
            opacity: 0.8,
          },
          ':hover > a': {
            color: 'fg.default',
          },
          borderRadius: 2,
        }}>
        <Link
          href={`/buscar/pagina/1?q=${x.search_term}`}
          passHref
          onClick={handleClick}
          sx={{
            fontSize: '16px',
            margin: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignContent: 'center',
            alignItems: 'center',
            textDecoration: 'none',
            color: 'fg.default',
            fontWeight: 600,
            ':hover': {
              cursor: 'pointer',
            },
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
            <Box
              as="span"
              sx={{
                color: 'fg.muted',
                opacity: 0.4,
                ':hover': {
                  color: 'fg.default',
                  opacity: 1,
                },
              }}>
              <SearchIcon sx={{ opacity: 0.5 }} size={19} />
            </Box>
            <Box as="span">{x.search_term}</Box>
          </Box>
          {x.search_count >= 20 && (
            <Box
              as="span"
              sx={{
                color: 'fg.muted',
                opacity: 0.4,
                ':hover': {
                  color: 'fg.default',
                  opacity: 1,
                },
              }}>
              <ArrowUpLeftIcon size={24} />
            </Box>
          )}
        </Link>
      </Box>
    );
  }

  function NoSuggestionsLink() {
    return (
      <Link
        href={`/buscar/pagina/1?q=${valueSearchEnd}`}
        passHref
        onClick={handleClick}
        sx={{
          fontSize: '16px',
          margin: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          textDecoration: 'none',
          color: 'fg.default',
          fontWeight: 600,
          ':hover': {
            cursor: 'pointer',
          },
        }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Box
            as="span"
            sx={{
              color: 'fg.muted',
              opacity: 0.4,
              ':hover': {
                color: 'fg.default',
                opacity: 1,
              },
            }}>
            <SearchIcon sx={{ opacity: 0.5 }} size={19} />
          </Box>
          <Box as="span">Nenhuma sugestão, seja o primeiro!</Box>
        </Box>
        <Box
          as="span"
          sx={{
            color: 'fg.muted',
            opacity: 0.4,
            ':hover': {
              color: 'fg.default',
              opacity: 1,
            },
          }}>
          <ArrowUpLeftIcon size={24} />
        </Box>
      </Link>
    );
  }

  function SearchIconButton({ sx, ...props }) {
    return (
      <IconButton
        aria-label="Pesquisar"
        onClick={onClickSearchButton}
        variant="invisible"
        sx={{
          display: ['flex', , 'none'],
          px: '7px',
          color: 'header.logo',
          '&:hover': {
            color: 'header.text',
            backgroundColor: 'transparent',
          },
          '&:focus-visible': {
            outline: '2px solid #FFF',
          },
          ...sx,
        }}
        icon={SearchIcon}
        size="small"
        {...props}
      />
    );
  }

  function SearchBarButton({ sx, ...props }) {
    return (
      <Button
        block
        onClick={onClickSearchButton}
        alignContent="flex-start"
        variant="default"
        sx={{
          display: ['none', , 'flex'],
          width: [, , '200px', '310px'],
          color: '#c9d1d9',
          backgroundColor: 'transparent',
          border: '1px solid rgb(240 246 252 / 10%)',
          px: '13px',
          boxShadow: 'none',
          ':focus-visible:not(:disabled)': {
            outline: 'none',
          },
          ':hover:not([disabled]):not([data-inactive])': { backgroundColor: '#30363d', borderColor: '#8b949e' },
          ...sx,
        }}
        leadingVisual={SearchIcon}
        {...props}>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
          Digite{' '}
          <Box
            sx={{
              border: '1px solid',
              borderColor: 'fg.muted',
              padding: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              borderRadius: '3px',
              fontSize: 11,
              verticalAlign: 'baseline',
              width: 12,
              height: 17,
            }}>
            /
          </Box>{' '}
          para pesquisar
        </Box>
      </Button>
    );
  }

  function SearchBarMenuItem(props) {
    return (
      <ActionList.Item onSelect={onClickSearchButton} {...props}>
        <ActionList.LeadingVisual>
          <SearchIcon />
        </ActionList.LeadingVisual>
        Pesquisar
      </ActionList.Item>
    );
  }

  return {
    onClickSearchButton,
    SearchBarButton,
    SearchBarMenuItem,
    SearchIconButton,
    SearchBoxOverlay,
  };
}
