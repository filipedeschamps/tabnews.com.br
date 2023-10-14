import { Fragment, useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

import { Box, Link, Spinner, Text, useTheme } from '@/TabNewsUI';

const border = '2px solid rgba(102, 102, 102, .5)'; // To be consistent with Charts style

function Graph({ title, data, simulationTimeout = 3000, options = {}, ...props }) {
  const containerRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [isSelected, setIsSelected] = useState(false);
  const [status, setStatus] = useState();

  const { theme } = useTheme();
  const fontColor = theme.colors.fg.default;

  useEffect(() => {
    if (network || !containerRef.current) return;

    setNetwork(
      new Network(
        containerRef.current,
        {},
        {
          locale: 'pt',
          groups: {
            users: { shape: 'icon', icon: { code: '👤' } },
            nuked: { shape: 'icon', icon: { code: '❌' } },
            IPs: { shape: 'icon', icon: { code: '🌐' } },
          },
          interaction: { hover: true },
        }
      )
    );
  }, [network]);

  useEffect(() => {
    if (checkIfIsNewData(network, data)) {
      setStyles(data);
      network.setData(data);
    }
  }, [data, network]);

  useEffect(() => {
    network?.setOptions({ nodes: { font: { color: fontColor } } });
  }, [fontColor, network]);

  useEffect(() => {
    network?.setOptions(options);
  }, [options, network]);

  useEffect(() => {
    if (!network) return;

    const stopSimulation = () => setTimeout(() => network.stopSimulation(), simulationTimeout);

    const hovered = (event) => {
      if (!isSelected) setStatus(getStatusProps(event, network));
    };

    const selectEdge = (event) => {
      setIsSelected(true);
      setStatus(getStatusProps(event, network));
    };

    const deselectEdge = () => {
      setIsSelected(false);
      setStatus(null);
    };

    network.on('startStabilizing', stopSimulation);
    network.on('hoverEdge', hovered);
    network.on('hoverNode', hovered);
    network.on('selectEdge', selectEdge);
    network.on('deselectEdge', deselectEdge);

    return () => {
      network.off('startStabilizing', stopSimulation);
      network.off('hoverEdge', hovered);
      network.off('hoverNode', hovered);
      network.off('selectEdge', selectEdge);
      network.off('deselectEdge', deselectEdge);
    };
  }, [isSelected, network, simulationTimeout]);

  return (
    <Box>
      <h2>{title}</h2>
      <Box border={border} borderRadius={6} overflow="hidden">
        <Box
          ref={containerRef}
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
          height="70vh"
          borderBottom={border}
          {...props}>
          <Spinner size="large" />
        </Box>
        <StatusBar status={status} />
        <Legend />
      </Box>
    </Box>
  );
}

export default Graph;

function checkIfIsNewData(network, newData) {
  if (!network) return false;

  const oldData = network.body.data;

  if (oldData.nodes.length !== newData.nodes.length) return true;
  if (oldData.edges.length !== newData.edges.length) return true;
  if (
    Array.from(oldData.nodes._data.values()).some((node, i) => {
      if (node.username !== newData.nodes[i].username) return true;
      if (node.group !== newData.nodes[i].group) return true;
    })
  )
    return true;

  return false;
}

function setStyles(data) {
  data.edges.forEach((edge) => {
    edge.color = edge.type === 'network' ? 'cyan' : edge.type === 'credit' ? 'green' : 'red';
    if (edge.type !== 'network') edge.arrows = 'to';
  });
  data.nodes.forEach((node) => {
    if (node.group === 'nuked' && node.username) node.label = node.username;
  });
}

function getStatusProps(event, network) {
  const edges =
    event.edges?.map((edgeId) => network.body.edges[edgeId]) ||
    (event.edge && [network.body.edges[event.edge]]) ||
    (event.node && network.body.nodes[event.node]?.edges) ||
    [];

  const votesMap = new Set();
  const sharedIpsMap = new Map();
  let positives = 0;
  let negatives = 0;

  edges.forEach(({ from, to, options }) => {
    const isSharedIpNode = to.options.group === 'IPs';

    if (isSharedIpNode) {
      const ip = options.to;

      if (!sharedIpsMap.has(ip)) {
        sharedIpsMap.set(ip, new Set());

        to.edges.forEach(({ from }) => {
          const username = from.options.username;
          username && sharedIpsMap.get(ip).add(username);
        });
      }
    } else {
      const fromUsername = from.options.username;
      fromUsername && votesMap.add(fromUsername);

      const toUsername = to.options.username;
      toUsername && votesMap.add(toUsername);

      const value = options.value;
      const isPositive = options.color.color === 'green';

      if (isPositive) {
        positives += value;
      } else {
        negatives += value;
      }
    }
  });

  return { votes: [...votesMap], positives, negatives, shared: [...sharedIpsMap.values()] };
}

function StatusBar({ status }) {
  return (
    <Box display="flex" minHeight={30} justifyContent="center" borderBottom={border} flexWrap="wrap">
      <DefaultStatusMessage status={status} />
      <JoinSharedNetworks {...status} />
      <JoinLinksWithCommaOrAnd paths={status?.votes} />
      <JoinInteractions {...status} />
    </Box>
  );
}

function DefaultStatusMessage({ status }) {
  if (status) return null;

  return <Text>Selecione um nó ou aresta</Text>;
}

function JoinSharedNetworks({ positives, negatives, shared }) {
  if (!shared) return null;

  return shared.map((sharedFrom, i) => {
    return (
      <Fragment key={i}>
        <JoinLinksWithCommaOrAnd paths={[...sharedFrom]} />
        {sharedFrom.size === 0 && <Text>Rede compartilhada</Text>}
        {sharedFrom.size === 1 && <Text>&nbsp;compartilha sua rede&nbsp;</Text>}
        {sharedFrom.size > 1 && <Text>&nbsp;compartilham a mesma rede&nbsp;</Text>}
        {i + 2 < shared.length && <Text>,&nbsp;</Text>}
        {i + 2 === shared.length && <Text>&nbsp;e&nbsp;</Text>}
        {i + 1 === shared.length && !!(positives || negatives) && <Text>&nbsp;|&nbsp;</Text>}
      </Fragment>
    );
  });
}

function JoinLinksWithCommaOrAnd({ paths }) {
  if (!paths?.length) return null;

  return paths.map((path, i) => [
    <Link key={path + i} href={`/${path}`}>
      {path}
    </Link>,
    i + 2 < paths.length && <Text key={i}>,&nbsp;</Text>,
    i + 2 == paths.length && <Text key={i}>&nbsp;e&nbsp;</Text>,
  ]);
}

function JoinInteractions({ votes, positives, negatives }) {
  if (!positives && !negatives) return null;

  let content = '';

  if (votes?.length) content += '➔';
  if (positives) content += ` +${positives} TabCoin${positives > 1 ? 's' : ''}`;
  if (positives && negatives) content += ' e';
  if (negatives) content += ` -${negatives} TabCoin${negatives > 1 ? 's' : ''}`;

  if (!content) return null;

  return <Text>&nbsp;{content}</Text>;
}

function Legend() {
  return (
    <Box display="flex" minHeight={30} justifyContent="space-around" alignItems="center" flexWrap="wrap">
      <Box>👤 Usuários Ativos</Box>
      <Box>❌ Usuários Banidos</Box>
      <Box>🌐 Redes Compartilhadas</Box>
    </Box>
  );
}
