package org.jahia.community.reportusersandgroups.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLNonNull;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.api.Constants;
import org.jahia.api.content.JCRTemplate;
import org.jahia.community.reportusersandgroups.ReportUsersAndGroupsService;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;
import org.jahia.modules.graphql.provider.dxm.security.GraphQLRequiresPermission;
import org.jahia.osgi.BundleUtils;
import org.jahia.services.content.JCRContentUtils;
import org.jahia.services.content.JCRNodeWrapper;
import org.jahia.services.content.nodetypes.ExtendedNodeType;
import org.jahia.services.content.nodetypes.ExtendedPropertyDefinition;
import org.jahia.services.content.nodetypes.NodeTypeRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.NodeIterator;
import javax.jcr.RepositoryException;
import javax.jcr.nodetype.NoSuchNodeTypeException;
import javax.jcr.query.Query;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
@GraphQLName("ReportUsersAndGroupsQueries")
@GraphQLDescription("Report users and groups queries")
public class ReportUsersAndGroupsQueryExtension {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReportUsersAndGroupsQueryExtension.class);
    static final String REPORT_FOLDER_NAME = "report-users-and-groups";

    private ReportUsersAndGroupsQueryExtension() {
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroupsUserProperties")
    @GraphQLDescription("Returns all property names defined on the jnt:user node type, sorted alphabetically")
    @GraphQLRequiresPermission("admin")
    public static List<String> userProperties() {
        try {
            final ExtendedNodeType userType = NodeTypeRegistry.getInstance().getNodeType("jnt:user");
            return Arrays.stream(userType.getPropertyDefinitions())
                    .map(ExtendedPropertyDefinition::getName)
                    .filter(name -> !name.startsWith("jcr:") && !name.startsWith("nt:") && !name.startsWith("rep:"))
                    .distinct()
                    .sorted()
                    .collect(Collectors.toList());
        } catch (NoSuchNodeTypeException e) {
            LOGGER.error("jnt:user node type not found", e);
            return Collections.emptyList();
        }
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroupsIsGenerating")
    @GraphQLDescription("Returns true if a report is currently being generated")
    @GraphQLRequiresPermission("admin")
    public static Boolean isGenerating() {
        final ReportUsersAndGroupsService service = BundleUtils.getOsgiService(ReportUsersAndGroupsService.class, null);
        return service != null && service.isGenerating();
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroupsFiles")
    @GraphQLDescription("Lists all generated report CSV files under the given JCR root path, sorted by creation date descending")
    @GraphQLRequiresPermission("admin")
    public static List<GqlReportFile> listFiles(
            @GraphQLName("csvRootPath") @GraphQLNonNull final String csvRootPath) {
        final String folderPath = csvRootPath + "/" + REPORT_FOLDER_NAME;
        try {
            return BundleUtils.getOsgiService(JCRTemplate.class, null)
                    .doExecuteWithSystemSessionAsUser(null, Constants.EDIT_WORKSPACE, null, session -> {
                        final List<GqlReportFile> files = new ArrayList<>();
                        if (!session.nodeExists(folderPath)) {
                            return files;
                        }
                        final String queryStmt = String.format(
                                "SELECT * FROM [jnt:file] AS f" +
                                " WHERE ISDESCENDANTNODE(f, '%s')",
                                JCRContentUtils.sqlEncode(folderPath));
                        final NodeIterator it = session.getWorkspace().getQueryManager()
                                .createQuery(queryStmt, Query.JCR_SQL2)
                                .execute().getNodes();
                        while (it.hasNext()) {
                            final JCRNodeWrapper node = (JCRNodeWrapper) it.nextNode();
                            try {
                                final String createdAt = DateTimeFormatter.ISO_INSTANT.format(
                                        node.getProperty("jcr:created").getDate()
                                                .toInstant().atOffset(ZoneOffset.UTC));
                                files.add(new GqlReportFile(node.getPath(), "/files/default" + node.getPath(), createdAt));
                            } catch (RepositoryException e) {
                                LOGGER.warn("Could not read metadata for {}", node.getPath(), e);
                            }
                        }
                        files.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
                        return files;
                    });
        } catch (RepositoryException e) {
            LOGGER.error("Error listing report files at {}", folderPath, e);
            return new ArrayList<>();
        }
    }

    @GraphQLName("ReportFile")
    @GraphQLDescription("A generated users-and-groups report CSV file")
    public static class GqlReportFile {

        private final String path;
        private final String downloadUrl;
        private final String createdAt;

        public GqlReportFile(String path, String downloadUrl, String createdAt) {
            this.path = path;
            this.downloadUrl = downloadUrl;
            this.createdAt = createdAt;
        }

        @GraphQLField
        @GraphQLName("path")
        @GraphQLDescription("JCR path of the report file")
        public String getPath() {
            return path;
        }

        @GraphQLField
        @GraphQLName("downloadUrl")
        @GraphQLDescription("URL to download the report file")
        public String getDownloadUrl() {
            return downloadUrl;
        }

        @GraphQLField
        @GraphQLName("createdAt")
        @GraphQLDescription("ISO-8601 creation timestamp")
        public String getCreatedAt() {
            return createdAt;
        }
    }
}
