'use client';

// react-loading
import { default as ReactLoading } from 'react-loading';

/**
 * `react-loading` paints its spokes with an inline `fill`/`color` attribute, so
 * the tone has to be handed over as a value rather than as a utility class.
 * `#6B5F52` is the `ink-muted` token verbatim (5.61:1 on paper) — the same
 * secondary tone every other quiet element on a paper ground uses. It replaces
 * `#9d9cc9`, a cool lilac that belonged to the deleted `*Purple` palette.
 */
const INK_MUTED = '#6B5F52';

const Loading = () => {
  return (
    <div className="flex items-center justify-center">
      <ReactLoading type="spokes" width={100} color={INK_MUTED} className="bg-no-repeat" />
    </div>
  );
};

export default Loading;
