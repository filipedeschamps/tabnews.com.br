export class Content {
  static isValidSourceURL(source_url) {
    if (!source_url) {
      return true; // URLs opcionais são consideradas válidas
    }

    try {
      const url = new URL(source_url);
      const protocol = url.protocol;

      if (!['http:', 'https:'].includes(protocol)) {
        return false; // Protocolo inválido
      }

      if (url.hostname.length === 0) {
        return false; // Hostname inválido
      }

      return true; // URL parece válida
    } catch (error) {
      return false; // URL inválida
    }
  }
}
