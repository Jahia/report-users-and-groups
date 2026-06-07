package org.jahia.community.reportusersandgroups;

import org.jahia.osgi.BundleUtils;
import org.jahia.services.scheduler.BackgroundJob;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

public class ReportUsersAndGroupsBackgroundJob extends BackgroundJob {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReportUsersAndGroupsBackgroundJob.class);

    @Override
    public void executeJahiaJob(JobExecutionContext jobExecutionContext) throws Exception {
        final JobDataMap jobDataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        final String csvRootPath = jobDataMap.getString("csvRootPath");
        final String userPropertiesValue = jobDataMap.getString("userPropertiesToExport");
        final List<String> userPropertiesToExport;
        if (userPropertiesValue == null || userPropertiesValue.trim().isEmpty()) {
            LOGGER.warn("Job data key 'userPropertiesToExport' is absent or empty; using empty list");
            userPropertiesToExport = Collections.emptyList();
        } else {
            userPropertiesToExport = Arrays.asList(userPropertiesValue.split(","));
        }
        final ReportUsersAndGroupsService svc = BundleUtils.getOsgiService(ReportUsersAndGroupsService.class, null);
        if (svc != null) {
            svc.generate(csvRootPath, userPropertiesToExport);
        } else {
            ReportUsersAndGroupsCommand.reportUsersAndGroups(csvRootPath, userPropertiesToExport);
        }
    }
}
