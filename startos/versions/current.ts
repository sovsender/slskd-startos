import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.26.2:3',
  releaseNotes: {
    en_US:
      "Lidarr can now download through slskd directly: the Lidarr action has a new Lidarr plugin method that creates an API key for the Tubifarry plugin and shows the address and key to enter in Lidarr. Changing Soularr's search settings no longer restarts slskd or interrupts downloads. Download Location is now Download Folder and Sharing is now Shared Folder, with clearer descriptions of which folder does what.",
    es_ES:
      'Lidarr ahora puede descargar directamente a través de slskd: la acción Lidarr tiene un nuevo método, Plugin de Lidarr, que crea una clave de API para el plugin Tubifarry y muestra la dirección y la clave que debes introducir en Lidarr. Cambiar los ajustes de búsqueda de Soularr ya no reinicia slskd ni interrumpe las descargas. Ubicación de descarga ahora es Carpeta de descargas y Compartir ahora es Carpeta compartida, con descripciones más claras de para qué sirve cada carpeta.',
    de_DE:
      'Lidarr kann jetzt direkt über slskd herunterladen: Die Aktion Lidarr hat die neue Methode Lidarr-Plugin, die einen API-Schlüssel für das Tubifarry-Plugin anlegt und die Adresse und den Schlüssel anzeigt, die du in Lidarr einträgst. Änderungen an den Sucheinstellungen von Soularr starten slskd nicht mehr neu und unterbrechen keine Downloads. Download-Ort heißt jetzt Download-Ordner und Freigabe heißt jetzt Freigegebener Ordner, mit klareren Beschreibungen, welcher Ordner wofür da ist.',
    pl_PL:
      'Lidarr może teraz pobierać bezpośrednio przez slskd: akcja Lidarr ma nową metodę Wtyczka Lidarr, która tworzy klucz API dla wtyczki Tubifarry i pokazuje adres oraz klucz do wpisania w Lidarr. Zmiana ustawień wyszukiwania Soularr nie uruchamia już slskd ponownie i nie przerywa pobierania. Lokalizacja pobierania to teraz Folder pobierania, a Udostępnianie to teraz Folder udostępniony, z jaśniejszymi opisami, do czego służy każdy folder.',
    fr_FR:
      "Lidarr peut désormais télécharger directement via slskd : l'action Lidarr propose une nouvelle méthode, Plugin Lidarr, qui crée une clé API pour le plugin Tubifarry et affiche l'adresse et la clé à saisir dans Lidarr. Modifier les réglages de recherche de Soularr ne redémarre plus slskd et n'interrompt plus les téléchargements. Emplacement de téléchargement devient Dossier de téléchargement et Partage devient Dossier partagé, avec des descriptions plus claires du rôle de chaque dossier.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
