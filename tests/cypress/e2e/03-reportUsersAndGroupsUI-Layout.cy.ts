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

        it('properties list does not expose j:password or wildcard entries', () => {
            cy.login();
            cy.visit(adminPath);
            cy.get('#rug-properties span').then($spans => {
                const labels = [...$spans].map(s => s.textContent?.trim());
                expect(labels).not.to.include('j:password');
                expect(labels).not.to.include('*');
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

        it('shows the Browse button next to the root path input', () => {
            cy.login();
            cy.visit(adminPath);
            cy.contains('button', 'Browse…').should('be.visible');
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
});
