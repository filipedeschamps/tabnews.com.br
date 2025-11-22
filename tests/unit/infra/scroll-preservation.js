export function saveScrollPosition() {
 
  if (typeof sessionStorage !== 'undefined') {
    const scrollY = window?.pageYOffset || 0;
    const currentUrl = window?.location?.href || '';
    
    sessionStorage.setItem('scrollPosition', scrollY.toString());
    sessionStorage.setItem('scrollUrl', currentUrl);
  }
}