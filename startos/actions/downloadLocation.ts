import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { cleanFolder, fileManagers, folderPattern, overlaps } from '../utils'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  location: Value.union({
    name: i18n('File Manager'),
    description: i18n(
      'The file manager that holds the download folder. If you use Lidarr, choose the one Lidarr uses. Otherwise Lidarr cannot see the downloads.',
    ),
    default: 'filebrowser',
    variants: Variants.of({
      filebrowser: {
        name: 'FileBrowser Quantum',
        spec: InputSpec.of({
          folder: Value.text({
            name: i18n('Folder'),
            description: i18n(
              'A folder just for downloads, such as slskd. Do not use your music library folder. Created automatically.',
            ),
            default: fileManagers.filebrowser.defaultFolder,
            required: true,
            placeholder: fileManagers.filebrowser.defaultFolder,
            patterns: [folderPattern],
          }),
        }),
      },
      nextexplorer: {
        name: 'NextExplorer',
        spec: InputSpec.of({
          folder: Value.text({
            name: i18n('Folder'),
            description: i18n(
              'A folder just for downloads, starting with one of the NextExplorer locations, such as Files/slskd. Do not use your music library folder. Created automatically.',
            ),
            default: fileManagers.nextexplorer.defaultFolder,
            required: true,
            placeholder: fileManagers.nextexplorer.defaultFolder,
            patterns: [folderPattern],
          }),
        }),
      },
    }),
  }),
})

export const downloadLocation = sdk.Action.withInput(
  'download-location',

  async () => ({
    name: i18n('Download Folder'),
    description: i18n(
      'The inbox where slskd saves finished downloads. Lidarr collects albums from here and moves them into your music library. Saving restarts slskd.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => {
    const store = await storeJson.read().const(effects)
    const filebrowser = {
      folder:
        store?.filebrowserFolder ?? fileManagers.filebrowser.defaultFolder,
    }
    const nextexplorer = {
      folder:
        store?.nextexplorerFolder ?? fileManagers.nextexplorer.defaultFolder,
    }
    return {
      location:
        store?.downloadTarget === 'nextexplorer'
          ? {
              selection: 'nextexplorer' as const,
              value: nextexplorer,
              other: { filebrowser },
            }
          : {
              selection: 'filebrowser' as const,
              value: filebrowser,
              other: { nextexplorer },
            },
    }
  },

  async ({ effects, input }) => {
    const { selection, value } = input.location
    const folder = cleanFolder(value.folder)
    const share = await storeJson.read((s) => s.shareFolder).once()
    if (share && overlaps(folder, share)) {
      throw new Error(
        i18n(
          'The download folder cannot be the shared folder, or inside it or around it.',
        ),
      )
    }
    await storeJson.merge(effects, {
      downloadTarget: selection,
      ...(selection === 'filebrowser'
        ? { filebrowserFolder: folder }
        : { nextexplorerFolder: folder }),
    })
  },
)
