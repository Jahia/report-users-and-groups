package org.jahia.community.reportusersandgroups.graphql;

import graphql.annotations.annotationTypes.GraphQLDescription;
import graphql.annotations.annotationTypes.GraphQLField;
import graphql.annotations.annotationTypes.GraphQLName;
import graphql.annotations.annotationTypes.GraphQLTypeExtension;
import org.jahia.modules.graphql.provider.dxm.DXGraphQLProvider;

@GraphQLTypeExtension(DXGraphQLProvider.Mutation.class)
@GraphQLDescription("Report Users and Groups mutations")
public class ReportUsersAndGroupsMutationExtension {

    private ReportUsersAndGroupsMutationExtension() {
    }

    @GraphQLField
    @GraphQLName("reportUsersAndGroups")
    @GraphQLDescription("Report Users and Groups mutation namespace")
    public static ReportUsersAndGroupsMutation reportUsersAndGroups() {
        return new ReportUsersAndGroupsMutation();
    }
}
