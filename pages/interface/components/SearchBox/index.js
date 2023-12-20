import { useEffect, useRef, useState } from 'react';

import { Box, Button, Heading, IconButton, Overlay, Spinner } from '@/TabNewsUI';
import { SearchIcon, XCircleFillIcon } from '@/TabNewsUI/icons';

const searchURL = process.env.NEXT_PUBLIC_SEARCH_URL + process.env.NEXT_PUBLIC_SEARCH_ID;

export default function useSearchBox() {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef();

  function onClickSearchButton(e) {
    buttonRef.current = e.target;
    setIsOpen(true);
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
        onClick={onClickSearchButton}
        alignContent="flex-start"
        sx={{
          display: ['none', , 'flex'],
          width: [, , '200px', '300px'],
          px: '13px',
          color: 'checks.inputPlaceholderText',
          backgroundColor: 'headerSearch.bg',
          borderColor: 'headerSearch.border',
          cursor: 'text',
          '&:focus-visible': {
            outline: '2px solid #FFF !important',
          },
          ...sx,
        }}
        leadingVisual={SearchIcon}
        {...props}>
        Pesquisar
      </Button>
    );
  }

  function SearchBarMenuItem({ sx, ...props }) {
    return (
      <Button
        onClick={onClickSearchButton}
        alignContent="flex-start"
        sx={{
          width: '100%',
          color: 'checks.inputPlaceholderText',
          borderColor: 'headerSearch.border',
          cursor: 'text',
          '&:focus-visible': {
            outline: '2px solid #FFF !important',
          },
          ...sx,
        }}
        leadingVisual={SearchIcon}
        {...props}>
        Pesquisar
      </Button>
    );
  }

  function SearchBoxOverlay() {
    const [isLoading, setIsLoading] = useState(true);
    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);

    const onInputRender = (input) => {
      setIsLoading(false);
      input.focus();
      inputRef.current = input;
    };

    const onSuggestionsRender = (suggestionsBox) => {
      suggestionsRef.current = suggestionsBox;
    };

    const handleClose = () => {
      setIsOpen(false);
      setTimeout(() => inputRef.current.offsetParent === null && clearGoogleBox(), 800);
    };

    if (!isOpen) return null;

    return (
      <Overlay
        returnFocusRef={buttonRef}
        ignoreClickRefs={[suggestionsRef, buttonRef]}
        onEscape={handleClose}
        onClickOutside={handleClose}
        aria-labelledby="Pesquisar com o Google"
        top={32}
        left={'50vw'}
        anchorSide="inside-center"
        sx={{
          display: 'flex',
          position: 'relative',
          flexDirection: 'column',
          width: '90vw',
          maxWidth: '900px',
          maxHeight: ['95vh', '90vh'],
          mx: '1px',
          overflow: 'hidden',
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: 'border.default',
          backgroundColor: '#FFF',
          transform: 'translateX(-50%)',
        }}>
        <Box sx={isLoading ? { height: '138px' } : { overflowY: 'auto', minHeight: '138px' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: '13px', pb: '0' }}>
            <Heading sx={{ flex: 1, textAlign: 'center', fontSize: 3, color: '#444444' }}>
              Pesquisar com o Google
            </Heading>
            <IconButton icon={XCircleFillIcon} variant="invisible" onClick={handleClose} />
          </Box>

          <GoogleBox onInputRender={onInputRender} onSuggestionsRender={onSuggestionsRender} />

          <Box sx={{ display: 'flex', justifyContent: 'center', height: '26px', pt: '20px' }}>
            {isLoading && <Spinner size="medium" />}
          </Box>
        </Box>

        <style jsx global>{`
          .gsc-input-box {
            border-radius: 6px !important;
          }
          .gsc-search-button-v2 {
            border-radius: 6px !important;
            cursor: pointer;
            padding: 8px !important;
            background-color: #21262d !important;
          }
          .gsc-input {
            color-scheme: light;
          }
          .gssb_c {
            color: #444444;
            left: max(calc(5vw + 16px), calc(50vw - 434px)) !important;
          }
        `}</style>
      </Overlay>
    );
  }

  return {
    onClickSearchButton,
    SearchBarButton,
    SearchBarMenuItem,
    SearchBoxOverlay,
    SearchIconButton,
  };
}

function GoogleBox({ onInputRender = () => {}, onSuggestionsRender = () => {} } = {}) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = searchURL;
    document.head.append(script);

    const waitInputBox = waitForElm('.gsc-input-box');
    const waitSuggestionBox = waitForElm('.gssb_c');
    const waitAboveResultsBox = waitForElm('.gsc-above-wrapper-area');

    (async () => {
      const inputBox = await waitInputBox.start();
      const input = inputBox.querySelector('input');
      onInputRender(input);

      const suggestionBox = await waitSuggestionBox.start();
      onSuggestionsRender(suggestionBox);
    })();

    (async () => {
      const aboveResultsBox = await waitAboveResultsBox.start();
      aboveResultsBox.style.display = 'block';
    })();

    return () => {
      waitInputBox.cancel();
      waitSuggestionBox.cancel();
      waitAboveResultsBox.cancel();
    };
  }, [onInputRender, onSuggestionsRender]);

  return <div className="gcse-search" data-linktarget="_self"></div>;
}

function clearGoogleBox() {
  Array.from(document.getElementsByTagName('script')).forEach((elm) => {
    if (elm.src?.includes('google.com/')) {
      elm.remove();
    }
  });

  Array.from(document.getElementsByTagName('link')).forEach((elm) => {
    if (elm.href?.includes('google.com/')) {
      elm.remove();
    }
  });

  Array.from(document.getElementsByTagName('style')).forEach((elm) => {
    if (
      elm.href?.includes('google.com/') ||
      elm.textContent?.includes('.gsc-refinementsGradient') ||
      elm.textContent?.includes('.gsc-completion-container')
    ) {
      elm.remove();
    }
  });

  document.querySelectorAll('.gssb_c').forEach((elm) => elm.remove());

  let elm = document.getElementById('private_ratings');

  while (elm) {
    elm.parentElement?.remove();
    elm = document.getElementById('private_ratings');
  }
}

function waitForElm(selector) {
  let observer;

  const start = () => {
    return new Promise((resolve) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      observer = new MutationObserver(() => {
        if (document.querySelector(selector)) {
          resolve(document.querySelector(selector));
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    });
  };

  const cancel = () => {
    if (observer) {
      observer.disconnect();
    }
  };

  return {
    cancel,
    start,
  };
}
