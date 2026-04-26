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

    // ─── Admin UI — Folder Picker ─────────────────────────────────────────────────

    describe('Admin UI — Folder Picker', () => {
        it('opens the picker modal when Browse is clicked', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').click();
            cy.contains('Select a folder').should('be.visible');
        });

        it('closes the picker modal when Cancel is clicked', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').click();
            cy.contains('button', 'Cancel').click();
            cy.contains('Select a folder').should('not.exist');
        });

        it('closes the picker modal when the close button is clicked', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').click();
            cy.get('[aria-label="Close"]').click();
            cy.contains('Select a folder').should('not.exist');
        });

        it('picker starts at the current csvRootPath value', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').click();
            cy.get('code').should('contain.text', DEFAULT_CSV_ROOT_PATH);
        });

        it('breadcrumb does not allow navigating above /sites', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').click();
            // The "/" root crumb should not be present as a clickable button
            cy.get('[aria-label="Select a folder"], [role="dialog"]').within(() => {
                cy.contains('button', '/').should('not.exist');
            });
        });

        it('displays jnt:virtualsite nodes (site names) when browsing /sites', () => {
            cy.login();
            cy.visit(adminPath);
            // Navigate to /sites by clearing path and browsing
            cy.get('#rug-csv-root-path').clear().type('/sites');
            cy.contains('button', 'Browse…').click();
            cy.get('[role="dialog"]').within(() => {
                // systemsite is a jnt:virtualsite and should appear in the list
                cy.contains('button', 'systemsite').should('be.visible');
            });
        });

        it('selecting a folder updates the root path input', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-csv-root-path').clear().type('/sites');
            cy.contains('button', 'Browse…').click();
            cy.get('[role="dialog"]').within(() => {
                cy.contains('button', 'systemsite').click();
            });
            cy.contains('button', 'Select this folder').click();
            cy.get('#rug-csv-root-path').should('have.value', '/sites/systemsite');
        });

        it('breadcrumb navigation moves up to a parent folder', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').click();
            cy.get('[role="dialog"]').within(() => {
                // Current path is /sites/systemsite/files; click "systemsite" in breadcrumb
                cy.contains('button', 'systemsite').click();
                cy.get('code').should('contain.text', '/sites/systemsite');
            });
        });
    });

});
