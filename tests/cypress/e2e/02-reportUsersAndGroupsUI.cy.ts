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

    // ─── Admin UI — Layout ────────────────────────────────────────────────────────

    describe('Admin UI — Layout', () => {
        it('shows the page title', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('h2', 'Report Users & Groups').should('be.visible');
        });

        it('shows the JCR root path input', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-csv-root-path').should('be.visible').and('have.value', DEFAULT_CSV_ROOT_PATH);
        });

        it('shows the properties checkbox list', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-properties').should('be.visible');
        });

        it('properties list contains known jnt:user properties', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-properties').within(() => {
                cy.contains('span', 'j:firstName').should('be.visible');
                cy.contains('span', 'j:lastName').should('be.visible');
                cy.contains('span', 'j:email').should('be.visible');
            });
        });

        it('j:firstName and j:lastName are pre-checked by default', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-properties').within(() => {
                cy.contains('label', 'j:firstName').find('input[type=checkbox]').should('be.checked');
                cy.contains('label', 'j:lastName').find('input[type=checkbox]').should('be.checked');
            });
        });

        it('shows the Select all and Clear all buttons', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Select all').should('be.visible');
            cy.contains('button', 'Clear all').should('be.visible');
        });

        it('shows the Generate report button', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Generate report').should('be.visible');
        });

        it('Generate button is disabled when root path is empty', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-csv-root-path').clear();
            cy.contains('button', 'Generate report').should('be.disabled');
        });

        it('does not show the reports table when no reports exist', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('Generated reports').should('not.exist');
        });
    });

    // ─── Admin UI — Property Selection ───────────────────────────────────────────

    describe('Admin UI — Property Selection', () => {
        it('Select all checks all checkboxes', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Select all').click();
            cy.get('#rug-properties input[type=checkbox]').each($cb => {
                cy.wrap($cb).should('be.checked');
            });
        });

        it('Clear all unchecks all checkboxes', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Clear all').click();
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
