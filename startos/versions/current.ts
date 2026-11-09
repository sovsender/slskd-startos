import { IMPOSSIBLE, VersionInfo } from '@start9labs/start-sdk'

export const current = VersionInfo.of({
  version: '0.26.2:1',
  releaseNotes: {
    en_US:
      'Lidarr Automation has new settings: Download Only Music Files, Filename Match, Include Artist in Searches, Albums to Search For (missing albums, albums below the quality cutoff, or both), and Albums per Check. The new Transfer Limits action sets upload and download slots and speed limits.',
    es_ES:
      'Automatización de Lidarr tiene nuevos ajustes: Descargar solo archivos de música, Coincidencia de nombres de archivo, Incluir el artista en las búsquedas, Álbumes que buscar (los que faltan, los que están bajo el umbral de calidad o ambos) y Álbumes por comprobación. La nueva acción Límites de transferencia fija las ranuras y los límites de velocidad de subida y de descarga.',
    de_DE:
      'Die Lidarr-Automatisierung hat neue Einstellungen: Nur Musikdateien herunterladen, Dateinamen-Übereinstimmung, Künstler in Suchen einbeziehen, Zu suchende Alben (fehlende, unter dem Qualitäts-Cutoff oder beides) und Alben pro Durchlauf. Die neue Aktion Übertragungslimits legt Upload- und Download-Slots sowie Geschwindigkeitslimits fest.',
    pl_PL:
      'Automatyzacja Lidarr ma nowe ustawienia: Pobieraj tylko pliki muzyczne, Dopasowanie nazw plików, Uwzględniaj wykonawcę w wyszukiwaniu, Albumy do wyszukania (brakujące, poniżej progu jakości lub oba rodzaje) i Albumy na sprawdzenie. Nowa akcja Limity transferu ustawia liczbę slotów oraz limity prędkości wysyłania i pobierania.',
    fr_FR:
      "L'automatisation Lidarr a de nouveaux réglages : Télécharger uniquement les fichiers musicaux, Correspondance des noms de fichiers, Inclure l'artiste dans les recherches, Albums à rechercher (manquants, sous le seuil de qualité, ou les deux) et Albums par vérification. La nouvelle action Limites de transfert règle les emplacements et les limites de vitesse d'envoi et de téléchargement.",
  },
  migrations: {
    up: async ({ effects }) => {},
    down: IMPOSSIBLE,
  },
})
