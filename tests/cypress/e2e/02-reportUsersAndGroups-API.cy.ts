import {DocumentNode} from 'graphql';

describe('Report Users and Groups', () => {
    const DEFAULT_CSV_ROOT_PATH = '/sites/systemsite/files';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const getStatus: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/query/getStatus.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const generateReport: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/generateReport.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deleteReport: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/deleteReport.graphql');

    before(() => {
        cy.login();
    });

    // ─── GraphQL API ─────────────────────────────────────────────────────────────

    describe('GraphQL API', () => {
        it('isGenerating returns false when idle', () => {
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsIsGenerating')
                .should('eq', false);
        });

        it('reportUsersAndGroupsFiles returns an array', () => {
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles')
                .should('be.an', 'array');
        });

        it('generates a report and returns true', () => {
            cy.apollo({
                mutation: generateReport,
                variables: {
                    csvRootPath: DEFAULT_CSV_ROOT_PATH,
                    userPropertiesToExport: ['j:firstName', 'j:lastName']
                }
            })
                .its('data.reportUsersAndGroupsGenerate')
                .should('eq', true);
        });

        it('generated report file appears in the file list', () => {
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles')
                .should('have.length.greaterThan', 0);
        });

        it('report file has expected fields', () => {
            cy.login();
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles.0')
                .should(file => {
                    expect(file).to.have.property('path');
                    expect(file.path).to.match(/\/report-users-and-groups-\d{8}-\d{4}\.csv$/);
                    expect(file).to.have.property('downloadUrl');
                    expect(file.downloadUrl).to.include('/files/default');
                    expect(file).to.have.property('createdAt');
                    expect(file.createdAt).to.match(/^\d{4}-\d{2}-\d{2}T/);
                });
        });

        it('report file is accessible via its download URL', () => {
            cy.login();
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles.0.downloadUrl')
                .then(url => {
                    cy.request(url).its('status').should('eq', 200);
                });
        });

        it('downloaded CSV contains the expected headers', () => {
            cy.login();
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles.0.downloadUrl')
                .then(url => {
                    cy.request(url)
                        .its('body')
                        .should('include', 'site')
                        .and('include', 'user name');
                });
        });

        it('deletes the report and removes it from the file list', () => {
            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles.0.path')
                .then(path => {
                    cy.apollo({mutation: deleteReport, variables: {path}})
                        .its('data.reportUsersAndGroupsDeleteReport')
                        .should('eq', true);
                });
        });

        it('can generate multiple reports sequentially', () => {
            cy.apollo({
                mutation: generateReport,
                variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH, userPropertiesToExport: ['j:firstName']}
            })
                .its('data.reportUsersAndGroupsGenerate')
                .should('eq', true);

            cy.apollo({
                mutation: generateReport,
                variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH, userPropertiesToExport: ['j:firstName']}
            })
                .its('data.reportUsersAndGroupsGenerate')
                .should('eq', true);

            cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
                .its('data.reportUsersAndGroupsFiles')
                .should('have.length.greaterThan', 1);
        });
    });
});
