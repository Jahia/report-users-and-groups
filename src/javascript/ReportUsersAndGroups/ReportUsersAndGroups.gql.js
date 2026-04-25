import {gql} from '@apollo/client';

export const GET_USER_PROPERTIES = gql`
    query GetUserProperties {
        reportUsersAndGroupsUserProperties
    }
`;

export const GET_STATUS = gql`
    query ReportUsersAndGroupsStatus($csvRootPath: String!) {
        reportUsersAndGroupsIsGenerating
        reportUsersAndGroupsFiles(csvRootPath: $csvRootPath) {
            path
            downloadUrl
            createdAt
        }
    }
`;

export const GENERATE_REPORT = gql`
    mutation GenerateReport($csvRootPath: String!, $userPropertiesToExport: [String]) {
        reportUsersAndGroupsGenerate(csvRootPath: $csvRootPath, userPropertiesToExport: $userPropertiesToExport)
    }
`;

export const DELETE_REPORT = gql`
    mutation DeleteReport($path: String!) {
        reportUsersAndGroupsDeleteReport(path: $path)
    }
`;
