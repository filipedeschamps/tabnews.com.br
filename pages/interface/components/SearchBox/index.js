import { useEffect, useRef, useState } from 'react';

import { Box, Button, Heading, IconButton, Overlay, Spinner } from '@/TabNewsUI';
import { SearchIcon, XCircleFillIcon } from '@/TabNewsUI/icons';

const searchURL = process.env.NEXT_PUBLIC_SEARCH_URL + process.env.NEXT_PUBLIC_SEARCH_ID;

export default function SearchBox({ ...props }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const buttonRef = useRef(null);
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

  return (
    <>
      <IconButton
        aria-label="Pesquisar"
        onClick={() => setIsOpen(true)}
        variant="invisible"
        sx={{
          display: ['flex', 'none'],
          px: '7px',
          color: 'fg.onEmphasis',
          '&:hover': {
            color: 'header.text',
            backgroundColor: 'transparent',
          },
          '&:focus-visible': {
            outline: '2px solid #FFF',
          },
        }}
        icon={SearchIcon}
        size="small"
        {...props}
      />
      <Button
        ref={buttonRef}
        onClick={() => setIsOpen(true)}
        alignContent="flex-start"
        sx={{
          display: ['none', 'flex'],
          width: [, '75px', '200px', '300px'],
          px: [, '4px', '13px'],
          color: 'checks.inputPlaceholderText',
          backgroundColor: 'headerSearch.bg',
          borderColor: 'headerSearch.border',
          cursor: 'text',
          '&:focus-visible': {
            outline: '2px solid #FFF !important',
          },
        }}
        leadingIcon={SearchIcon}>
        Pesquisar
      </Button>

      {isOpen && (
        <Overlay
          returnFocusRef={buttonRef}
          ignoreClickRefs={[buttonRef, suggestionsRef]}
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
      )}
    </>
  );
}

function GoogleBox({ onInputRender = () => {}, onSuggestionsRender = () => {} } = {}) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = searchURL;
    document.head.append(script);

    const waitInputBox = waitForElm('.gsc-input-box');
    const waitSuggestionBox = waitForElm('.gssb_c');

    (async () => {
      const inputBox = await waitInputBox.start();
      const input = inputBox.querySelector('input');
      onInputRender(input);

      const suggestionBox = await waitSuggestionBox.start();
      onSuggestionsRender(suggestionBox);
    })();

    return () => {
      waitInputBox.cancel();
      waitSuggestionBox.cancel();
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
