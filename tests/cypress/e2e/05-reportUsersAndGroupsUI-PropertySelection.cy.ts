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

    // ─── Admin UI — Property Selection ───────────────────────────────────────────

    describe('Admin UI — Property Selection', () => {
        it('Select all checks all checkboxes', () => {
            cy.login();
            cy.visit(adminPath);
            cy.wait(5000);
            cy.get('#rug-select-all').click();
            cy.get('#rug-properties input[type=checkbox]').each($cb => {
                            cy.wrap($cb).should('be.checked');
                        });
        });

        it('Clear all unchecks all checkboxes', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-clear-all').click();
            cy.get('#rug-properties input[type=checkbox]').each($cb => {
                cy.wrap($cb).should('not.be.checked');
            });
        });

        it('individual checkbox can be toggled', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-properties').within(() => {
                cy.contains('label', 'j:email').find('input[type=checkbox]').as('emailCb');
            });
            cy.get('@emailCb').check();
            cy.get('@emailCb').should('be.checked');
            cy.get('@emailCb').uncheck();
            cy.get('@emailCb').should('not.be.checked');
        });
    });

});
