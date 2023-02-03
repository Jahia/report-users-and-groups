
# Report users and groups
Community module allowing the creation of a report of all users and their groups
* [How to use it](#how-to-use)
    * [report-users-and-groups:execute](#report-users-and-groups-execute)
    * [Background job](#background-job)

## <a name="how-to-use"></a>How to use?

### Basic usage
### Commands
#### <a name="report-users-and-groups-execute"></a>report-users-and-groups:execute
Reports the list of users with the specified properties and theirs groups. 
A CSV file is being generated in the JCR with the path **/sites/systemsite/files/report-users-and-groups**.

**Options:**

Name | alias | Mandatory | Value | Description
 --- | --- | :---: | :---: | ---
 -p | --csvRootPath | | /sites/systemsite/files | Root path where to store the CSV files


**Example:**

    report-users-and-groups:execute -p /sites/digitall/files j:firstName j:lastName j:email

### <a name="background-job"></a>Background job
The job is named **Maintenance.ReportUsersAndGroupsJob**and is executed by defaut every day at 1:30 AM by default.

**Properties:**
Name | Value | Description
 --- | --- | ---
jahia.reportsusersandgroups.job.csvRootPath | /sites/systemsite/files | Root path where to store the CSV files
jahia.reportsusersandgroups.job.userPropertiesToExport | j:firstName,j:lastName | Properties to export, separated by a comma
jahia.reportsusersandgroups.job.cronExpression | 0 30 1 * * ? | Crontab expression for the job


