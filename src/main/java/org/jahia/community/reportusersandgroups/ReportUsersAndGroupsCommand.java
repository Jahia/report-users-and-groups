package org.jahia.community.reportusersandgroups;

import au.com.bytecode.opencsv.CSVWriter;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.nio.file.FileSystems;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Date;
import java.util.List;
import javax.jcr.RepositoryException;
import javax.jcr.query.Query;
import org.apache.commons.lang3.time.DurationFormatUtils;
import org.apache.jackrabbit.core.fs.FileSystem;
import org.apache.karaf.shell.api.action.Action;
import org.apache.karaf.shell.api.action.Argument;
import org.apache.karaf.shell.api.action.Command;
import org.apache.karaf.shell.api.action.Option;
import org.apache.karaf.shell.api.action.lifecycle.Service;
import org.jahia.api.Constants;
import org.jahia.services.content.JCRContentUtils;
import org.jahia.services.content.JCRNodeIteratorWrapper;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.JCRSessionFactory;
import org.jahia.services.content.JCRSessionWrapper;
import org.jahia.services.content.JCRTemplate;
import org.jahia.services.content.QueryManagerWrapper;
import org.jahia.services.content.decorator.JCRUserNode;
import org.jahia.services.query.QueryWrapper;
import org.jahia.services.sites.JahiaSitesService;
import org.jahia.services.usermanager.JahiaGroupManagerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;

@Command(scope = "report-users-and-groups", name = "execute", description = "Create CSV files with all users and their groups for all websites")
@Service
public class ReportUsersAndGroupsCommand implements Action {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReportUsersAndGroupsCommand.class);
    private static final String HUMAN_READABLE_FORMAT = "d' days 'H' hours 'm' minutes 's' seconds'";
    private static final String FILE_NAME = "report-users-and-groups";
    private static final String FILE_EXT = ".csv";
    private static final java.nio.file.Path TMP_PATH = FileSystems.getDefault().getPath(System.getProperty("java.io.tmpdir"));
    private static final long LIMIT = 100L;
    private static final List<String> SYSTEM_GROUPS = Arrays.asList(
            "guest",
            "guest",
            "privileged",
            "site-privileged",
            "site-users",
            "users");

    @Option(name = "-p", aliases = "--csvRootPath", description = "Root path where to store the CSV files")
    private String rootCsvPath = "/sites/systemsite/files";

    @Argument(index = 0, name = "userPropertiesToExport", description = "User properties to export", required = false, multiValued = true)
    List<String> userPropertiesToExport = new ArrayList<>();

    @Override
    public Object execute() throws RepositoryException {
        ReportUsersAndGroupsCommand.reportUsersAndGroups(rootCsvPath, userPropertiesToExport);
        return null;
    }

    public static void reportUsersAndGroups(String csvRootPath, List<String> userPropertiesToExport) {
        try {
            final long start = System.currentTimeMillis();
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info("Starting retrieving the list of users and their groups");

            }
            final List<UserInfo> usersInfos = new ArrayList<>();
            usersInfos.addAll(JCRTemplate.getInstance().doExecuteWithSystemSession((JCRSessionWrapper session) -> computeUsersAndGroups(session, "global", "/users", userPropertiesToExport)));
            for (String siteName : JahiaSitesService.getInstance().getSitesNames()) {
                usersInfos.addAll(JCRTemplate.getInstance().doExecuteWithSystemSession((JCRSessionWrapper session) -> computeUsersAndGroups(session, siteName, String.format("/sites/%s/users", siteName), userPropertiesToExport)));
            }
            writeCsvData(csvRootPath, usersInfos, userPropertiesToExport);
            final long end = System.currentTimeMillis();
            if (LOGGER.isInfoEnabled()) {
                LOGGER.info(String.format("Finished retrieving the list of users and their groups in %s", DurationFormatUtils.formatDuration(end - start, HUMAN_READABLE_FORMAT, true)));
            }
        } catch (RepositoryException ex) {
            LOGGER.error("Impossible to retrieve users list", ex);
        }
    }

    private static void writeCsvData(String rootPath, List<UserInfo> usersInfos, List<String> userPropertiesToExport) {
        Path csvPath = null;
        try {
            csvPath = Files.createTempFile(TMP_PATH, FILE_NAME, FILE_EXT);
            final SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy/MM/dd/HH/mm/ss");
            final String storageFolder = dateFormat.format(new Date());
            final File csvFile = csvPath.toFile();
            try (final FileOutputStream fileOutputStream = new FileOutputStream(csvFile); final OutputStreamWriter outputStreamWriter = new OutputStreamWriter(fileOutputStream, StandardCharsets.UTF_8); final CSVWriter csvWriter = new CSVWriter(outputStreamWriter); final InputStream csvInputStream = new FileInputStream(csvFile);) {
                final List<String> headers = new ArrayList<>();
                headers.add("site");
                headers.add("user name");
                headers.addAll(userPropertiesToExport);
                headers.add("groups");
                csvWriter.writeNext(headers.toArray(new String[headers.size()]));
                for (UserInfo userInfo : usersInfos) {
                    final List<String> userValues = new ArrayList<>();
                    userValues.add(userInfo.getSite());
                    userValues.add(userInfo.getName());
                    for (String userProperty : userPropertiesToExport) {
                        if (userInfo.containsPropertyKey(userProperty)) {
                            userValues.add(userInfo.getProperty(userProperty));
                        } else {
                            userValues.add("");
                        }
                    }
                    userValues.add(userInfo.getGroups().toString());
                    csvWriter.writeNext(userValues.toArray(new String[userValues.size()]));
                }
                csvWriter.flush();
                final JCRNodeWrapper jcrNode = mkdirs(rootPath + "/report-users-and-groups/" + storageFolder);
                jcrNode.uploadFile(FILE_NAME + FILE_EXT, csvInputStream, MediaType.TEXT_PLAIN_VALUE);
                jcrNode.saveSession();
            }
        } catch (IOException | RepositoryException ex) {
            LOGGER.error("Impossible to create CSF file", ex);
        } finally {
            try {
                Files.deleteIfExists(csvPath);
            } catch (IOException ex) {
                LOGGER.error("Impossible to delete temporary file", ex);
            }
        }
    }

    private static List<UserInfo> computeUsersAndGroups(JCRSessionWrapper session, String site, String jcrPath, List<String> userPropertiesToExport) throws RepositoryException {
        final List<UserInfo> users = new ArrayList<>();
        boolean hasNextResults = true;
        long offsetMultiplicator = 0L;
        while (hasNextResults) {
            session.refresh(false);
            final QueryManagerWrapper manager = session.getWorkspace().getQueryManager();
            final String queryStmt = String.format("SELECT * FROM [%s] AS users WHERE ISDESCENDANTNODE(users, '%s')", "jnt:user", JCRContentUtils.sqlEncode(jcrPath));
            final QueryWrapper query = manager.createQuery(queryStmt, Query.JCR_SQL2);
            query.setOffset(offsetMultiplicator * LIMIT);
            query.setLimit(LIMIT);
            final JCRNodeIteratorWrapper nodeIterator = query.execute().getNodes();
            while (nodeIterator.hasNext()) {
                final JCRUserNode userNode = (JCRUserNode) nodeIterator.next();
                LOGGER.info(userNode.getPath());
                final UserInfo userInfo = new UserInfo(site, userNode.getName());

                for (String userProperty : userPropertiesToExport) {
                    if (userNode.hasProperty(userProperty)) {
                        userInfo.addProperty(userProperty, userNode.getPropertyAsString(userProperty));
                    }
                }

                for (String groupPath : JahiaGroupManagerService.getInstance().getMembershipByPath(userNode.getPath())) {
                    final String[] parts = groupPath.split("\\/");
                    final String group = parts[parts.length - 1];
                    if (!SYSTEM_GROUPS.contains(group)) {
                        userInfo.addGroup(group);
                    }
                }
                users.add(userInfo);
            }
            hasNextResults = nodeIterator.getSize() == LIMIT;
            offsetMultiplicator++;
        }
        session.refresh(false);
        return users;
    }

    private static JCRNodeWrapper mkdirs(String path) throws RepositoryException {
        final JCRSessionWrapper session = JCRSessionFactory.getInstance().getCurrentSystemSession(Constants.EDIT_WORKSPACE, null, null);
        JCRNodeWrapper folderNode = session.getRootNode();
        for (String folder : path.split(FileSystem.SEPARATOR)) {
            if (!folder.isEmpty()) {
                if (folderNode.hasNode(folder)) {
                    folderNode = folderNode.getNode(folder);
                } else {
                    folderNode = folderNode.addNode(folder, "jnt:folder");
                }
            }
        }
        return folderNode;
    }
}
