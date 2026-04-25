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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.jcr.RepositoryException;
import java.util.Arrays;
import java.util.List;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
@GraphQLName("ReportUsersAndGroupsMutations")
@GraphQLDescription("Report users and groups mutations")
public class ReportUsersAndGroupsMutationExtension {

    private static final Logger LOGGER = LoggerFactory.getLogger(ReportUsersAndGroupsMutationExtension.class);

    private ReportUsersAndGroupsMutationExtension() {
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroupsGenerate")
    @GraphQLDescription("Generates a CSV report of all users and their groups and stores it in JCR")
    @GraphQLRequiresPermission("admin")
    public static Boolean generate(
            @GraphQLName("csvRootPath") @GraphQLNonNull final String csvRootPath,
            @GraphQLName("userPropertiesToExport") final List<String> userPropertiesToExport) {
        final ReportUsersAndGroupsService service = BundleUtils.getOsgiService(ReportUsersAndGroupsService.class, null);
        if (service == null) {
            LOGGER.error("ReportUsersAndGroupsService is not available");
            return Boolean.FALSE;
        }
        final List<String> props = (userPropertiesToExport != null) ? userPropertiesToExport
                : Arrays.asList("j:firstName", "j:lastName");
        return service.generate(csvRootPath, props);
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroupsDeleteReport")
    @GraphQLDescription("Deletes a single report file from JCR by its JCR path")
    @GraphQLRequiresPermission("admin")
    public static Boolean deleteReport(
            @GraphQLName("path") @GraphQLNonNull final String path) {
        try {
            BundleUtils.getOsgiService(JCRTemplate.class, null)
                    .doExecuteWithSystemSessionAsUser(null, Constants.EDIT_WORKSPACE, null, session -> {
                        try {
                            if (session.nodeExists(path)) {
                                session.getNode(path).remove();
                                session.save();
                            }
                        } catch (RepositoryException e) {
                            LOGGER.error("Error deleting report file at {}", path, e);
                        }
                        return null;
                    });
            return Boolean.TRUE;
        } catch (RepositoryException e) {
            LOGGER.error("Error deleting report file at {}", path, e);
            return Boolean.FALSE;
        }
    }
}
