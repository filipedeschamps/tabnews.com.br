import { PageLayout, Header } from '@primer/react';

export default function Footer() {
  const renderCurrentYear = () => {
    const currentYear = new Date().getFullYear();

    return `©${currentYear} by Filipe Deschamps`;
  };

  return (
    <PageLayout.Footer
      sx={{
        position: 'absolute',
        bottom: 0,
      }}>
      <Header
        sx={{
          padding: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
        <span>TabNews</span>
        <span>{renderCurrentYear()}</span>
      </Header>
    </PageLayout.Footer>
  );
}
