package org.jahia.community.reportusersandgroups.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Query.class)
@GraphQLDescription("Report Users and Groups queries")
public class ReportUsersAndGroupsQueryExtension {

    private ReportUsersAndGroupsQueryExtension() {
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroups")
    @GraphQLDescription("Report Users and Groups query namespace")
    public static ReportUsersAndGroupsQuery reportUsersAndGroups() {
        return new ReportUsersAndGroupsQuery();
    }
}
