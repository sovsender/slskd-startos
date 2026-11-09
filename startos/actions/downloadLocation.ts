import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { cleanFolder, fileManagers, folderPattern, overlaps } from '../utils'

const { InputSpec, Value, Variants } = sdk

const inputSpec = InputSpec.of({
  location: Value.union({
    name: i18n('Download Location'),
    description: i18n(
      'The file manager and folder where finished downloads are saved. Choose the same file manager Lidarr uses, so Lidarr can import from this folder.',
    ),
    default: 'filebrowser',
    variants: Variants.of({
      filebrowser: {
        name: 'FileBrowser Quantum',
        spec: InputSpec.of({
          folder: Value.text({
            name: i18n('Folder'),
            description: i18n(
              'Folder inside FileBrowser Quantum. Created automatically.',
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
              'Folder inside NextExplorer, starting with one of its locations, such as Files. Created automatically.',
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
    name: i18n('Download Location'),
    description: i18n(
      'Choose where slskd saves finished downloads. Saving restarts slskd.',
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
