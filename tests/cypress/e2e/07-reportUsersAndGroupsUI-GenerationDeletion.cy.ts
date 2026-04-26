import {DocumentNode} from 'graphql';

describe('Report Users and Groups — UI', () => {
    const adminPath = '/jahia/administration/reportUsersAndGroups';
    const DEFAULT_CSV_ROOT_PATH = '/sites/systemsite/files';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const getStatus: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/query/getStatus.graphql');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const deleteReport: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/mutation/deleteReport.graphql');

    const cleanupAllReports = () => {
        cy.apollo({query: getStatus, variables: {csvRootPath: DEFAULT_CSV_ROOT_PATH}})
            .its('data.reportUsersAndGroupsFiles')
            .then((files: Array<{path: string}>) => {
                files.forEach(f => {
                    cy.apollo({mutation: deleteReport, variables: {path: f.path}});
                });
            });
    };

    before(() => {
        cy.login();
        cleanupAllReports();
    });

    after(() => {
        cleanupAllReports();
    });

    // ─── Admin UI — Generation ────────────────────────────────────────────────────

    describe('Admin UI — Generation', () => {
        it('shows loading indicator while generating and success alert after', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Generate report').click();
            cy.contains('Generating report, please wait…').should('be.visible');
            cy.contains('button', 'Generate report').should('not.exist');
            cy.contains('Report generated successfully.', {timeout: 120000}).should('be.visible');
            cy.contains('button', 'Generate report').should('be.visible');
        });

        it('shows the reports table after generating', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('Generated reports').should('be.visible');
        });

        it('shows a download link with a date-stamped filename', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('a[download]')
                .should('be.visible')
                .and('have.attr', 'download')
                .and('match', /^report-users-and-groups-\d{8}-\d{4}\.csv$/);
        });

        it('shows a delete button for each report row', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Delete').should('be.visible');
        });
    });

    // ─── Admin UI — Delete ────────────────────────────────────────────────────────

    describe('Admin UI — Delete', () => {
        it('removes the row when the delete button is clicked', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('Generated reports').should('be.visible');
            cy.contains('button', 'Delete').first().click();
            cy.contains('Generated reports', {timeout: 10000}).should('not.exist');
        });
    });
});
