package org.jahia.community.reportusersandgroups;

import org.osgi.service.component.annotations.Component;

import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

@Component(service = ReportUsersAndGroupsService.class, immediate = true)
public class ReportUsersAndGroupsService {

    private final AtomicBoolean generating = new AtomicBoolean(false);

    public boolean isGenerating() {
        return generating.get();
    }

    public boolean generate(String csvRootPath, List<String> userPropertiesToExport) {
        if (!generating.compareAndSet(false, true)) {
            return false;
        }
        try {
            ReportUsersAndGroupsCommand.reportUsersAndGroups(csvRootPath, userPropertiesToExport);
            return true;
        } finally {
            generating.set(false);
        }
    }
}
