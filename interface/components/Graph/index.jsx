import { Fragment, useEffect, useRef, useState } from 'react';
import { Network } from 'vis-network';

import { AnchoredOverlay, Button, Checkbox, FormControl, IconButton, Link, Spinner, useTheme } from '@/TabNewsUI';
import { FaPause, FaPlay } from '@/TabNewsUI/icons';
import useUser from 'interface/hooks/useUser';

import classes from './index.module.css';

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
        },
      ),
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
        simulationTimeout,
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
    <div>
      <div className={classes.Header}>
        <h2>{title}</h2>
        <Menu config={config} setConfig={setConfig} />
      </div>
      <div className={classes.Frame}>
        <div ref={containerRef} className={classes.GraphContainer}>
          <Spinner size="large" />
        </div>
        <StatusBar status={status} />
        <Legend />
      </div>
    </div>
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

  const userSelected =
    (event.nodes && network.body.nodes[event.nodes[0]]?.options.username) ||
    (event.node && network.body.nodes[event.node]?.options.username) ||
    (event.edge && network.body.edges[event.edge].from.options.username);

  const positiveVoteUsersMap = new Set();
  const negativeVoteUsersMap = new Set();
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
          if (username && username !== userSelected) {
            sharedIpsMap.get(ip).add(username);
          }
        });
      }
    } else {
      const fromUsername = from.options.username !== userSelected && from.options.username;
      const toUsername = to.options.username !== userSelected && to.options.username;
      const value = options.value;
      const isPositive = options.color.color === 'green';

      if (isPositive) {
        positives += value;
        if (fromUsername) positiveVoteUsersMap.add(fromUsername);
        if (toUsername) positiveVoteUsersMap.add(toUsername);
      } else {
        negatives += value;
        if (fromUsername) negativeVoteUsersMap.add(fromUsername);
        if (toUsername) negativeVoteUsersMap.add(toUsername);
      }
    }
  });

  return {
    userSelected,
    positiveVoteUsers: [...positiveVoteUsersMap],
    positives,
    negativeVoteUsers: [...negativeVoteUsersMap],
    negatives,
    shared: [...sharedIpsMap.values()],
  };
}

function StatusBar({ status }) {
  return (
    <div className={classes.StatusBar}>
      <DefaultStatusMessage status={status} />
      <UserSelected userSelected={status?.userSelected} />
      <JoinSharedNetworks {...status} />
      <JoinInteractions {...status} />
    </div>
  );
}

function DefaultStatusMessage({ status }) {
  if (status) return null;

  return <span>Selecione um nó ou aresta</span>;
}

function UserSelected({ userSelected }) {
  if (!userSelected) return null;

  return <Link href={`/${userSelected}`}>{userSelected}&nbsp;</Link>;
}

function JoinSharedNetworks({ userSelected, positives, negatives, shared }) {
  if (!shared) return null;

  return shared.map((sharedFrom, i) => {
    return (
      <Fragment key={i}>
        {userSelected ? <span>compartilha sua rede</span> : <span>Rede compartilhada</span>}
        {sharedFrom.size === 1 && <span>&nbsp;com&nbsp;</span>}
        {sharedFrom.size > 1 && <span>&nbsp;entre&nbsp;</span>}
        <JoinLinksWithCommaOrAnd paths={[...sharedFrom]} />
        {i + 2 < shared.length && <span>,&nbsp;</span>}
        {i + 2 === shared.length && <span>&nbsp;e&nbsp;</span>}
        {i + 1 === shared.length && !!(positives || negatives) && <span>&nbsp;|&nbsp;</span>}
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
    i + 2 < paths.length && <span key={i}>,&nbsp;</span>,
    i + 2 == paths.length && <span key={i}>&nbsp;e&nbsp;</span>,
  ]);
}

function JoinInteractions({ positives, positiveVoteUsers, negatives, negativeVoteUsers }) {
  if (!positives && !negatives) return null;

  return (
    <>
      {positives > 0 && (
        <span>{`➔ +${positives} TabCoin${positives > 1 ? 's' : ''}${
          positiveVoteUsers.length > 0 ? ' com\xA0' : ''
        }`}</span>
      )}
      <JoinLinksWithCommaOrAnd paths={positiveVoteUsers} />
      {negatives > 0 && (
        <span>{`${positives > 0 ? ' ' : ''}➔ -${negatives} TabCoin${negatives > 1 ? 's' : ''}${
          negativeVoteUsers.length > 0 ? ' com\xA0' : ''
        }`}</span>
      )}
      <JoinLinksWithCommaOrAnd paths={negativeVoteUsers} />
    </>
  );
}

function Menu({ config, setConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();

  return (
    <div className={classes.Menu}>
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
            <FormControl layout="horizontal" className={classes.FormControl}>
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

            <FormControl layout="horizontal" className={classes.FormControl}>
              <FormControl.Label htmlFor="UserVotes">Votos por usuário (mín.)</FormControl.Label>
              <input
                type="number"
                style={{ width: '50px' }}
                id="UserVotes"
                value={config.userVotesMin}
                onChange={(e) => setConfig({ ...config, userVotesMin: e.target.value > 1 ? e.target.value : 1 })}
              />
            </FormControl>

            <FormControl layout="horizontal" className={classes.FormControl}>
              <FormControl.Label htmlFor="EdgeVotes">Votos por aresta (mín.)</FormControl.Label>
              <input
                type="number"
                style={{ width: '50px' }}
                id="EdgeVotes"
                value={config.edgeVotesMin}
                onChange={(e) => setConfig({ ...config, edgeVotesMin: e.target.value > 1 ? e.target.value : 1 })}
              />
            </FormControl>

            <FormControl className={classes.FormControlCheckbox}>
              <Checkbox checked={config.nuked} onClick={(e) => setConfig({ ...config, nuked: e.target.checked })} />
              <FormControl.Label>Usuários Banidos ❌</FormControl.Label>
            </FormControl>

            <FormControl className={classes.FormControlCheckbox}>
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
    </div>
  );
}

function Legend() {
  return (
    <div className={classes.Legend}>
      <div>👤 Usuários Ativos</div>
      <div>❌ Usuários Banidos</div>
      <div>🌐 Redes Compartilhadas</div>
    </div>
  );
}
