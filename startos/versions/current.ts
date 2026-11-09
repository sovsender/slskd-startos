import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.26.2:2',
  releaseNotes: {
    en_US:
      'The Soulseek Network status now says when slskd has stopped trying to reconnect: after a disconnect in its web interface, a refused login, or the same account logging in elsewhere. Connect again from the web interface or restart slskd.',
    es_ES:
      'El estado Red Soulseek ahora indica cuándo slskd ha dejado de intentar reconectarse: tras una desconexión en su interfaz web, un inicio de sesión rechazado o la misma cuenta iniciando sesión en otro lugar. Vuelve a conectarte desde la interfaz web o reinicia slskd.',
    de_DE:
      'Der Status Soulseek-Netzwerk zeigt jetzt an, wenn slskd keine neue Verbindung mehr versucht: nach einer Trennung in der Weboberfläche, einer abgelehnten Anmeldung oder wenn sich dasselbe Konto anderswo anmeldet. Verbinde dich in der Weboberfläche erneut oder starte slskd neu.',
    pl_PL:
      'Stan Sieć Soulseek pokazuje teraz, kiedy slskd przestał próbować ponownie się połączyć: po rozłączeniu w interfejsie webowym, odrzuconym logowaniu lub zalogowaniu tego samego konta gdzie indziej. Połącz się ponownie w interfejsie webowym albo uruchom slskd ponownie.',
    fr_FR:
      "L'état Réseau Soulseek indique désormais quand slskd a cessé d'essayer de se reconnecter : après une déconnexion dans son interface web, une connexion refusée ou le même compte connecté ailleurs. Reconnectez-vous depuis l'interface web ou redémarrez slskd.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
