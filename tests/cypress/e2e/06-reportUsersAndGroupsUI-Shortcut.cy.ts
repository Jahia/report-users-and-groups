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

    // ─── Admin UI — Ctrl+Enter shortcut ──────────────────────────────────────────

    describe('Admin UI — Ctrl+Enter shortcut', () => {
        it('submits the form via Ctrl+Enter on the root path field', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-csv-root-path').type('{ctrl+enter}');
            cy.contains('Report generated successfully.', {timeout: 120000}).should('be.visible');
        });

        it('submits the form via Ctrl+Enter on the properties list', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-properties').trigger('keydown', {key: 'Enter', ctrlKey: true});
            cy.contains('Report generated successfully.', {timeout: 120000}).should('be.visible');
        });

        it('Ctrl+Enter does nothing when root path is empty', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-csv-root-path').clear();
            cy.get('#rug-csv-root-path').type('{ctrl+enter}');
            cy.get('[class*="rug_alert--success"]').should('not.exist');
        });
    });
});
