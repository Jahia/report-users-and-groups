# Report Users and Groups

Jahia module that generates CSV reports listing all users across all sites, together with their group memberships and selected profile properties.

## Table of contents

- [Features](#features)
- [Requirements](#requirements)
- [Administration UI](#administration-ui)
- [Karaf shell command](#karaf-shell-command)
- [Background job](#background-job)
- [CSV format](#csv-format)

---

## Features

- **Administration UI** — React-based admin page under *Server settings → Users and roles*, with:
  - JCR folder picker to choose where reports are stored
  - Checkbox list of all available `jnt:user` properties to include as columns
  - Live generation status indicator and success/error feedback
  - Table of generated reports with download links and per-row delete action
  - Ctrl+Enter keyboard shortcut to trigger generation
- **GraphQL API** — mutations and queries to generate, list, and delete reports programmatically
- **Karaf shell command** — `report-users-and-groups:execute` for command-line use
- **Background job** — Quartz-scheduled job (`Maintenance.ReportUsersAndGroupsJob`) running daily at 01:30 by default

---

## Requirements

- Jahia 8.2.1.0 or later
- Modules: `default`, `graphql-dxm-provider`, `serverSettings`

---

## Administration UI

Navigate to **Administration → Server → Users and Roles → Report Users & Groups**.

| Field | Description |
|---|---|
| **JCR root path** | JCR path where report files are stored. Use the **Browse…** button to navigate the repository tree. Default: `/sites/systemsite/files` |
| **User properties to export** | Checkbox list of all `jnt:user` properties. Select the ones to include as extra columns. `j:firstName` and `j:lastName` are pre-selected. |

Click **Generate report** (or press **Ctrl+Enter**) to start generation. The page polls every 2 seconds while the report is being generated and shows the result in the *Generated reports* table once complete.

Each report row provides:
- The creation date and time
- A direct download link (`report-users-and-groups-YYYYMMDD-HHmm.csv`)
- A **Delete** button to remove the file from the JCR

---

## Karaf shell command

```
report-users-and-groups:execute [options] [userPropertiesToExport]...
```

**Options:**

| Name | Alias | Default | Description |
|---|---|---|---|
| `-p` | `--csvRootPath` | `/sites/systemsite/files` | JCR root path where the CSV file is stored |

**Arguments:**

| Name | Description |
|---|---|
| `userPropertiesToExport` | Space-separated list of `jnt:user` property names to include as columns |

**Example:**

```
report-users-and-groups:execute -p /sites/digitall/files j:firstName j:lastName j:email
```

---

## Background job

The job **`Maintenance.ReportUsersAndGroupsJob`** runs automatically every day at 01:30 AM by default.

Configure it via Jahia system properties (e.g. in `jahia.properties` or environment variables):

| Property | Default | Description |
|---|---|---|
| `jahia.reportsusersandgroups.job.csvRootPath` | `/sites/systemsite/files` | JCR root path where the CSV file is stored |
| `jahia.reportsusersandgroups.job.userPropertiesToExport` | `j:firstName,j:lastName` | Comma-separated list of `jnt:user` property names to export |
| `jahia.reportsusersandgroups.job.cronExpression` | `0 30 1 * * ?` | Quartz cron expression |

---

## CSV format

The generated file is named `report-users-and-groups-YYYYMMDD-HHmm.csv` and stored under:

```
<csvRootPath>/report-users-and-groups/<yyyy>/<MM>/<dd>/<HH>/<mm>/<ss>/
```

**Columns:**

| Column | Description |
|---|---|
| `site` | Site name (`global` for `/users`, site name for `/sites/<name>/users`) |
| `user name` | The JCR node name of the user |
| *(selected properties)* | One column per selected `jnt:user` property (e.g. `j:firstName`, `j:email`) |
| `groups` | Comma-separated list of group memberships (system groups excluded) |
