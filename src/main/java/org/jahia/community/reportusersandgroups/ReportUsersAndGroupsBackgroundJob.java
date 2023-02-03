package org.jahia.community.reportusersandgroups;

import java.util.Arrays;
import org.jahia.services.scheduler.BackgroundJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;

public class ReportUsersAndGroupsBackgroundJob extends BackgroundJob {

    @Override
    public void executeJahiaJob(JobExecutionContext jobExecutionContext) throws Exception {
        final JobDataMap jobDataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        final String csvRootPath = jobDataMap.getString("csvRootPath");
        final String userPropertiesToExport = jobDataMap.getString("userPropertiesToExport");
        ReportUsersAndGroupsCommand.reportUsersAndGroups(csvRootPath,Arrays.asList(userPropertiesToExport.split(",")));
    }
}
