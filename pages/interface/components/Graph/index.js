import { useEffect, useRef } from 'react';
import { Network } from 'vis-network';

import { Box, Spinner } from '@/TabNewsUI';

function Graph({ title, data, options: { locale = 'pt-br', groups, ...options } = {}, ...props }) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  useEffect(() => {
    if (networkRef.current || !containerRef.current) return;

    networkRef.current = new Network(
      containerRef.current,
      { edges: [], nodes: [] },
      {
        locale,
        groups: {
          users: { shape: 'icon', icon: { code: '👤' } },
          IPs: { shape: 'icon', icon: { code: '🌐' } },
          ...groups,
        },
        ...options,
      }
    );
  }, [containerRef, locale, options, groups]);

  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.setData(data);
  }, [data]);

  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.on('startStabilizing', () => setTimeout(() => networkRef.current.stopSimulation(), 3000));
    return () => networkRef.current.destroy();
  }, []);

  return (
    <Box>
      <h2>{title}</h2>
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        width="100%"
        height="70vh"
        border="2px solid rgba(102, 102, 102, .5)"
        borderRadius={6}
        overflow="hidden"
        {...props}
        ref={containerRef}>
        <Spinner size="large" />
      </Box>
    </Box>
  );
}

export default Graph;
