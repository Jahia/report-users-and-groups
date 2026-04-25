package org.jahia.community.reportusersandgroups;

import org.jahia.osgi.BundleUtils;
import org.jahia.services.scheduler.BackgroundJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;

import java.util.Arrays;
import java.util.List;

public class ReportUsersAndGroupsBackgroundJob extends BackgroundJob {

    @Override
    public void executeJahiaJob(JobExecutionContext jobExecutionContext) throws Exception {
        final JobDataMap jobDataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        final String csvRootPath = jobDataMap.getString("csvRootPath");
        final List<String> userPropertiesToExport = Arrays.asList(
                jobDataMap.getString("userPropertiesToExport").split(","));
        final ReportUsersAndGroupsService svc = BundleUtils.getOsgiService(ReportUsersAndGroupsService.class, null);
        if (svc != null) {
            svc.generate(csvRootPath, userPropertiesToExport);
        } else {
            ReportUsersAndGroupsCommand.reportUsersAndGroups(csvRootPath, userPropertiesToExport);
        }
    }
}
