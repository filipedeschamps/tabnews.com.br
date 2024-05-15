// Define breakpoints for media queries
const breakpoints = {
  small: 576, // small devices (phones)
  medium: 768, // medium devices (tablets)
  large: 992, // large devices (desktops)
  xlarge: 1200, // extra large devices (large desktops)
};

// Media query templates
const mediaQueries = {
  small: () => `@media screen and (max-width: ${breakpoints.small}px)`,
  medium: () => `@media screen and (min-width: ${breakpoints.small + 1}px) and (max-width: ${breakpoints.medium}px)`,
  large: () => `@media screen and (min-width: ${breakpoints.medium + 1}px) and (max-width: ${breakpoints.large}px)`,
  xlarge: () => `@media screen and (min-width: ${breakpoints.large + 1}px)`,
  mediumAndUp: () => `@media screen and (min-width: ${breakpoints.small + 1}px)`,
  largeAndUp: () => `@media screen and (min-width: ${breakpoints.medium + 1}px)`,
  smallAndDown: () => `@media screen and (max-width: ${breakpoints.small}px)`,
  mediumAndDown: () => `@media screen and (max-width: ${breakpoints.medium}px)`,
  largeAndDown: () => `@media screen and (max-width: ${breakpoints.large}px)`,
};

export default mediaQueries;
