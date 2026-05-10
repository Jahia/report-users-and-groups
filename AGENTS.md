# report-users-and-groups

Jahia OSGi module that generates CSV reports of all users across all sites, including their group memberships and selected profile properties. Admin UI at `/jahia/administration/reportUsersAndGroups`.

## Key Facts

- **artifactId**: `report-users-and-groups` | **version**: `2.0.1-SNAPSHOT`
- **Java package**: `org.jahia.community.reportusersandgroups`
- **jahia-depends**: `default,graphql-dxm-provider,serverSettings`
- No Blueprint/Spring XML for services — pure OSGi DS; Spring XML only for the Quartz background job

## Architecture

| Class | Role |
|-------|------|
| `ReportUsersAndGroupsService` | Core logic; `volatile boolean generating` guards concurrent calls; `generate(csvRootPath, properties)` delegates to `ReportUsersAndGroupsCommand.reportUsersAndGroups()` |
| `ReportUsersAndGroupsCommand` | Static `reportUsersAndGroups()` that queries all sites, builds `UserInfo` list, writes the CSV to a temp file then uploads to JCR |
| `ReportUsersAndGroupsBackgroundJob` | Quartz job; delegates to service via `BundleUtils.getOsgiService()` with static fallback |
| `ReportUsersAndGroupsQueryExtension` | GraphQL queries: `isGenerating`, `listFiles`, `userProperties` |
| `ReportUsersAndGroupsMutationExtension` | GraphQL mutations: `generate`, `deleteReport` |
| `ReportUsersAndGroupsGraphQLExtensionsProvider` | Wires the extensions into the DXM GraphQL provider |

CSV files are stored at: `<csvRootPath>/report-users-and-groups/<yyyy>/<MM>/<dd>/<HH>/<mm>/<ss>/report-users-and-groups-YYYYMMDD-HHmm.csv`

`reportUsersAndGroups()` iterates global `/users` then each site's `/sites/<name>/users`, paginating with offset × 100 limit, and writes headers + rows using opencsv `CSVWriter`.

## GraphQL API

| Operation | Name | Notes |
|-----------|------|-------|
| Query | `reportUsersAndGroupsIsGenerating` → Boolean | Reads `volatile boolean` from service |
| Query | `reportUsersAndGroupsFiles(csvRootPath)` → `[ReportFile]` | JCR-SQL2 over `jnt:file` under report folder, sorted by `createdAt` desc |
| Query | `reportUsersAndGroupsUserProperties` → `[String]` | All `jnt:user` property names via `NodeTypeRegistry`; excludes `jcr:`, `nt:`, `rep:` prefixes, `j:password`, and `*` wildcard; sorted alphabetically |
| Mutation | `reportUsersAndGroupsGenerate(csvRootPath, userPropertiesToExport)` → Boolean | Synchronous; returns `true` after CSV is written to JCR |
| Mutation | `reportUsersAndGroupsDeleteReport(path)` → Boolean | Removes the JCR file node and saves the session |

All require `admin` permission.

## Frontend

- **Admin route target**: `administration-server-usersAndRoles:99`
- **CSS prefix**: `rug_`
- **Route key**: `reportUsersAndGroups`
- **State**: `csvRootPath` (string), `selectedProperties` (string[], default `['j:firstName','j:lastName']`), `generateStatus`, `pickerOpen`
- **Polling**: `startPolling(2000)` while `reportUsersAndGroupsIsGenerating === true`

### FolderPicker component

Opens a modal folder browser (`GET_FOLDER_CHILDREN` via `jcr.nodeByPath`). Displays `jnt:folder` and `jnt:virtualsite` nodes. Navigation is floored at `/sites` — `clampPath()` prevents going above it. Breadcrumb segments above `/sites` render as plain grey text (not clickable).

## Build

```bash
mvn clean install        # full build (Java + frontend)
yarn build               # frontend only (development)
yarn build:production    # frontend only (production)
yarn lint                # ESLint
```

## Tests (Cypress Docker)

```bash
cd tests
cp .env.example .env
yarn install
./ci.build.sh && ./ci.startup.sh
```

Test files under `tests/cypress/e2e/`:

| File | Scope |
|------|-------|
| `01-reportUsersAndGroups-Properties.cy.ts` | GraphQL `userProperties` query |
| `02-reportUsersAndGroups-API.cy.ts` | GraphQL generate / list / download / delete |
| `03-reportUsersAndGroupsUI-Layout.cy.ts` | Admin page layout and default state |
| `04-reportUsersAndGroupsUI-FolderPicker.cy.ts` | Folder picker open/close/navigate/select |
| `05-reportUsersAndGroupsUI-PropertySelection.cy.ts` | Select all / Clear all / checkbox toggle |
| `06-reportUsersAndGroupsUI-Shortcut.cy.ts` | Ctrl+Enter shortcut |
| `07-reportUsersAndGroupsUI-GenerationDeletion.cy.ts` | Full generate → download → delete flow |

## Gotchas

- `volatile boolean generating` is reset in `finally` — if the JCR write fails, the flag is still cleared and the mutation returns `false`
- The mutation is **synchronous** — it blocks the GraphQL thread for the full duration of report generation; the UI polls `isGenerating` separately
- `reportUsersAndGroups()` paginates with `offset × 100`; the last page is detected by `nodeIterator.getSize() == 100` (not `hasNext()`) — a page of exactly 100 items triggers one extra empty query
- System groups (`guest`, `privileged`, `site-privileged`, `site-users`, `users`) are filtered out from the groups column
- CSS Modules: match in Cypress with `[class*="rug_..."]`
- `GET_USER_PROPERTIES` uses `fetchPolicy: 'cache-first'` — the property list is static for a server lifetime and does not need re-fetching
