import { storeJson } from '../fileModels/store.json'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import { cleanFolder, folderPattern, overlaps } from '../utils'

const { InputSpec, Value } = sdk

const inputSpec = InputSpec.of({
  folder: Value.text({
    name: i18n('Shared Folder'),
    description: i18n(
      'A folder in the same file manager as your downloads, such as Music, or Files/Music in NextExplorer. slskd can only read it. Leave empty to share nothing.',
    ),
    default: null,
    required: false,
    placeholder: 'Music',
    patterns: [folderPattern],
  }),
})

export const sharing = sdk.Action.withInput(
  'sharing',

  async () => ({
    name: i18n('Sharing'),
    description: i18n(
      'Share one folder with other Soulseek users. Many users only send files to people who share. Saving restarts slskd.',
    ),
    warning: null,
    allowedStatuses: 'any',
    group: null,
    visibility: 'enabled',
  }),

  inputSpec,

  async ({ effects }) => ({
    folder: (await storeJson.read((s) => s.shareFolder).const(effects)) ?? null,
  }),

  async ({ effects, input }) => {
    const folder = input.folder ? cleanFolder(input.folder) : null
    const store = await storeJson.read().once()
    const download =
      store?.downloadTarget === 'nextexplorer'
        ? store.nextexplorerFolder
        : store?.filebrowserFolder
    if (folder && download && overlaps(folder, download)) {
      throw new Error(
        i18n(
          'The shared folder cannot be the download folder, or inside it or around it.',
        ),
      )
    }
    await storeJson.merge(effects, { shareFolder: folder })
  },
)
