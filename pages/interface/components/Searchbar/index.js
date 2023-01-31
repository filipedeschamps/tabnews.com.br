import React, { useContext } from 'react';
import { Box, TextInput } from '@primer/react';
import { SearchContext } from 'pages/interface/contexts/searchContex/index.js';

export function Searchbar() {
  const { search, setSearch } = useContext(SearchContext);
  return (
    <Box sx={{ flex: 1 }}>
      {/* <TextInput loaderPosition="trailing" leadingVisual={SearchIcon} trailingVisual={SearchIcon} loading={loading} /> */}
      <TextInput
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        loaderPosition="trailing"
        sx={{ backgroundColor: '#282a36', color: '#fff', width: '100%' }}
        leadingVisual="🔍"
      />
    </Box>
  );
}

export default Searchbar;
