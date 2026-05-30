import ContentLoader from 'react-content-loader';

import { useTheme } from '@/TabNewsUI';

/**
 * @param {import('react-content-loader').IContentLoaderProps} props
 */
export default function SkeletonLoader(props) {
  const { colorScheme, theme } = useTheme();

  const foregroundColor = colorScheme === 'dark' ? theme.colors.neutral.emphasis : theme.colors.canvas.subtle;

  return (
    <ContentLoader
      backgroundColor={theme.colors.switchTrack.activeBg}
      foregroundColor={foregroundColor}
      title="Carregando..."
      speed={1}
      {...props}
    />
  );
}
