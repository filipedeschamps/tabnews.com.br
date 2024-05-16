import { Box, CircleBadge, HeaderLink, NavList, Tooltip } from '@/TabNewsUI';
import { BellFillIcon, BellIcon } from '@/TabNewsUI/icons';

export default function NotificationsUserCount({ amount, type }) {
  const infosHeader = {
    iconSize: 16,
    text: 'Notificações',
  };

  const infosMenu = {
    iconSize: 16,
    text: 'Notificações',
  };

  const { iconSize: iconSizeHeader, text: textHeader } = infosHeader;
  const { iconSize: iconSizeMenu, text: textMenu } = infosMenu;

  const content =
    type == 'header' ? (
      <>
        <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
          <Tooltip aria-label={textHeader} direction="s" noDelay={true} wrap={true}>
            <HeaderLink href="/notificacoes">
              {amount ? (
                <Box
                  sx={{
                    display: 'flex',
                    position: 'relative',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.2rem',
                    '&:hover': {
                      opacity: '0.8',
                    },
                  }}>
                  <BellFillIcon size={iconSizeHeader} />
                  <CircleBadge
                    size={16}
                    sx={{
                      fontSize: 11,
                      backgroundColor: '#f85149',
                      boxShadow: 'none',
                      color: 'white',
                      padding: '0.5rem',
                    }}>
                    {amount >= 10 ? `+9` : amount}
                  </CircleBadge>
                </Box>
              ) : (
                <BellIcon />
              )}{' '}
            </HeaderLink>
          </Tooltip>
        </Box>
      </>
    ) : (
      <Box sx={{ display: 'flex', flexDirection: 'row', width: '100%' }}>
        <NavList.LeadingVisual>
          {amount ? <BellFillIcon size={iconSizeMenu} /> : <BellIcon size={iconSizeMenu} />}
        </NavList.LeadingVisual>
        <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
          {textMenu}
          {amount ? (
            <CircleBadge
              size={16}
              sx={{
                fontSize: 11,
                backgroundColor: '#f85149',
                boxShadow: 'none',
                ml: '0.3rem',
                color: 'white',
                padding: '0.6rem',
              }}>
              {amount >= 10 ? `+9` : amount}
            </CircleBadge>
          ) : null}
        </Box>
      </Box>
    );

  return content;
}
