package org.jahia.community.reportusersandgroups;

import org.osgi.service.component.annotations.Component;

import java.util.List;

@Component(service = ReportUsersAndGroupsService.class, immediate = true)
public class ReportUsersAndGroupsService {

    private volatile boolean generating = false;

    public boolean isGenerating() {
        return generating;
    }

    public boolean generate(String csvRootPath, List<String> userPropertiesToExport) {
        if (generating) {
            return false;
        }
        generating = true;
        try {
            ReportUsersAndGroupsCommand.reportUsersAndGroups(csvRootPath, userPropertiesToExport);
            return true;
        } finally {
            generating = false;
        }
    }
}
