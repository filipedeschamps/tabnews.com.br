import { Fragment, useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

import {
  AnchoredOverlay,
  Box,
  Button,
  Checkbox,
  FormControl,
  IconButton,
  Link,
  Spinner,
  Text,
  useTheme,
} from '@/TabNewsUI';
import { FaPause, FaPlay } from '@/TabNewsUI/icons';
import useUser from 'pages/interface/hooks/useUser';

const border = '2px solid rgba(102, 102, 102, .5)'; // To be consistent with Charts style

function Graph({ title, data, simulationTimeout = 200 }) {
  const containerRef = useRef(null);
  const [network, setNetwork] = useState(null);
  const [isSelected, setIsSelected] = useState(false);
  const [status, setStatus] = useState();
  const [config, setConfig] = useState({
    maxVotes: 300,
    userVotesMin: 1,
    edgeVotesMin: 1,
    nuked: true,
    network: true,
    physics: true,
  });

  const { theme } = useTheme();
  const fontColor = theme.colors.fg.default;

  useEffect(() => {
    if (network || !containerRef.current) return;

    setNetwork(
      new Network(
        containerRef.current,
        {},
        {
          layout: {
            improvedLayout: false,
          },
          physics: {
            maxVelocity: 40,
            minVelocity: 1,
            barnesHut: {
              theta: 0.5,
              gravitationalConstant: -7500,
              centralGravity: 0.3,
              springLength: 5,
              springConstant: 0.03,
              damping: 0.09,
              avoidOverlap: 0,
            },
            stabilization: {
              iterations: 50,
              fit: true,
            },
          },
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
    setStyles(data);
  }, [data]);

  useEffect(() => {
    updateData(network, data, config);
  }, [network, data, config]);

  useEffect(() => {
    network?.setOptions({ nodes: { font: { color: fontColor } } });
  }, [fontColor, network]);

  useEffect(() => {
    if (!network) return;

    const dragEnd = () =>
      setTimeout(
        () =>
          network.setOptions({
            physics: { enabled: config.physics },
          }),
        simulationTimeout
      );

    const dragStart = () => {
      network.setOptions({
        physics: { enabled: true },
      });
    };

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

    network.on('dragStart', dragStart);
    network.on('dragEnd', dragEnd);
    network.on('hoverEdge', hovered);
    network.on('hoverNode', hovered);
    network.on('selectEdge', selectEdge);
    network.on('deselectEdge', deselectEdge);

    return () => {
      network.off('dragStart', dragStart);
      network.off('dragEnd', dragEnd);
      network.off('hoverEdge', hovered);
      network.off('hoverNode', hovered);
      network.off('selectEdge', selectEdge);
      network.off('deselectEdge', deselectEdge);
    };
  }, [config, isSelected, network, simulationTimeout]);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <h2>{title}</h2>
        <Menu config={config} setConfig={setConfig} />
      </Box>
      <Box border={border} borderRadius={6} overflow="hidden">
        <Box
          ref={containerRef}
          display="flex"
          justifyContent="center"
          alignItems="center"
          width="100%"
          height="70vh"
          borderBottom={border}>
          <Spinner size="large" />
        </Box>
        <StatusBar status={status} />
        <Legend />
      </Box>
    </Box>
  );
}

export default Graph;

function updateData(network, data, config) {
  if (!network) return;

  const linkedNodes = new Set();
  const removeNodeIds = new Set();
  const addNodes = [];
  const updateNodes = [];
  const updateNodeIds = [];

  let totalVotes = 0;

  const filteredEdges = data.edges.filter((edge) => {
    if (
      (edge.type === 'network' && config.network) ||
      (edge.value >= config.edgeVotesMin && totalVotes < config.maxVotes)
    ) {
      totalVotes += edge.value || 0;
      linkedNodes.add(edge.from);
      linkedNodes.add(edge.to);
      return true;
    }

    return false;
  });

  data.nodes.forEach((node) => {
    if (
      !linkedNodes.has(node.id) ||
      (node.group === 'users' && node.votes < config.userVotesMin) ||
      (node.group === 'nuked' && !config.nuked) ||
      (node.group === 'IPs' && !config.network)
    ) {
      if (network.body.nodes[node.id]) {
        removeNodeIds.add(node.id);
      }
    } else {
      if (!network.body.nodes[node.id]) {
        addNodes.push(node.id);
      }
      updateNodes.push(node);
      updateNodeIds.push(node.id);
    }
  });

  if (!network.body.data.edges.length && !network.body.data.nodes.length) {
    network.setData({ nodes: updateNodes, edges: filteredEdges });
    return;
  }

  network.body.data.nodes.forEach((node) => {
    if (!linkedNodes.has(node.id)) {
      removeNodeIds.add(node.id);
    }
  });

  network.nodesHandler.remove([...removeNodeIds]);
  network.nodesHandler.add(addNodes, true);
  network.nodesHandler.update(updateNodeIds, updateNodes);

  if (
    filteredEdges.length !== network.body.data.edges.length ||
    filteredEdges.some((edge) => !network.body.edges[edge.id])
  ) {
    network.edgesHandler.setData(filteredEdges);
  }

  network.setOptions({
    physics: {
      enabled: config.physics,
    },
  });
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

function Menu({ config, setConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  return (
    <Box sx={{ display: 'flex', gap: 2 }}>
      {user?.features?.includes('update:content:others') && (
        <AnchoredOverlay
          renderAnchor={(anchorProps) => <Button {...anchorProps}>Filtros</Button>}
          align="end"
          onOpen={() => setIsOpen(true)}
          onClose={() => setIsOpen(false)}
          open={isOpen}>
          <form
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 'max-content',
              maxWidth: '90vw',
              padding: 12,
              gap: 8,
            }}>
            <FormControl layout="horizontal" sx={{ alignItems: 'center', gap: 2 }}>
              <FormControl.Label htmlFor="Edges">Votos computados</FormControl.Label>
              <input
                type="number"
                style={{ width: '50px' }}
                id="Edges"
                value={config.maxVotes}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxVotes: e.target.value > 1 ? (e.target.value > 1000 ? 1000 : e.target.value) : 1,
                  })
                }
              />
            </FormControl>

            <FormControl layout="horizontal" sx={{ alignItems: 'center', gap: 2 }}>
              <FormControl.Label htmlFor="UserVotes">Votos por usuário (mín.)</FormControl.Label>
              <input
                type="number"
                style={{ width: '50px' }}
                id="UserVotes"
                value={config.userVotesMin}
                onChange={(e) => setConfig({ ...config, userVotesMin: e.target.value > 1 ? e.target.value : 1 })}
              />
            </FormControl>

            <FormControl layout="horizontal" sx={{ alignItems: 'center', gap: 2 }}>
              <FormControl.Label htmlFor="EdgeVotes">Votos por aresta (mín.)</FormControl.Label>
              <input
                type="number"
                style={{ width: '50px' }}
                id="EdgeVotes"
                value={config.edgeVotesMin}
                onChange={(e) => setConfig({ ...config, edgeVotesMin: e.target.value > 1 ? e.target.value : 1 })}
              />
            </FormControl>

            <FormControl sx={{ alignItems: 'center', gap: 2, pl: '34px' }}>
              <Checkbox checked={config.nuked} onClick={(e) => setConfig({ ...config, nuked: e.target.checked })} />
              <FormControl.Label>Usuários Banidos ❌</FormControl.Label>
            </FormControl>

            <FormControl sx={{ alignItems: 'center', gap: 2, pl: '34px' }}>
              <Checkbox checked={config.network} onClick={(e) => setConfig({ ...config, network: e.target.checked })} />
              <FormControl.Label>Redes Compartilhadas 🌐</FormControl.Label>
            </FormControl>
          </form>
        </AnchoredOverlay>
      )}
      <IconButton
        onClick={() => setConfig({ ...config, physics: !config.physics })}
        icon={config.physics ? FaPause : FaPlay}
      />
    </Box>
  );
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
