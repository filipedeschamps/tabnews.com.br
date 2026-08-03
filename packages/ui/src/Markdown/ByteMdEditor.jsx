import { Editor } from 'bytemd';
import { useEffect, useRef } from 'react';

// bytemd throttles the scroll sync between its panes by a second, and destroying the editor neither
// cancels the pending call nor unsubscribes it from the scroll. The trailing call then lands after
// the `bind:this` of Svelte has nulled the preview element it dereferences, and throws. The value
// mirrors the `throttle(…, 1e3)` of bytemd@1.22.0.
const scrollSyncThrottle = 1000;

/**
 * Same as the `Editor` of `@bytemd/react`, except that an editor scrolled moments ago is destroyed
 * late, so that the scroll sync of bytemd still has the preview element it works on.
 */
export function ByteMdEditor({ onChange, ...props }) {
  const editorRef = useRef(null);
  const elementRef = useRef(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    const target = elementRef.current;
    const editor = new Editor({ props, target });
    let lastScroll = -Infinity;

    editor.$on('change', (event) => onChangeRef.current?.(event.detail.value));
    editorRef.current = editor;

    function rememberScroll() {
      lastScroll = Date.now();
    }

    // In the capture phase because scroll events do not bubble, and on the whole editor because
    // both panes schedule the sync.
    target.addEventListener('scroll', rememberScroll, { capture: true, passive: true });

    return () => {
      target.removeEventListener('scroll', rememberScroll, { capture: true });

      const remaining = scrollSyncThrottle - (Date.now() - lastScroll);

      if (remaining > 0) {
        setTimeout(() => editor.$destroy(), remaining);
      } else {
        editor.$destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    editorRef.current?.$set(props);
  }, [props]);

  return <div ref={elementRef} />;
}
