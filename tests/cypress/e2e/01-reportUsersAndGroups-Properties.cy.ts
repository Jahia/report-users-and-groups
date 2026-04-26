import {DocumentNode} from 'graphql';

describe('Report Users and Groups', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const getUserProperties: DocumentNode = require('graphql-tag/loader!../fixtures/graphql/query/getUserProperties.graphql');

    before(() => {
        cy.login();
    });

    // ─── GraphQL API — User Properties ───────────────────────────────────────────

    describe('GraphQL API — User Properties', () => {
        it('returns a non-empty array of property names', () => {
            cy.apollo({query: getUserProperties})
                .its('data.reportUsersAndGroupsUserProperties')
                .should('be.an', 'array')
                .and('have.length.greaterThan', 0);
        });

        it('contains well-known jnt:user properties', () => {
            cy.apollo({query: getUserProperties})
                .its('data.reportUsersAndGroupsUserProperties')
                .then((props: string[]) => {
                    expect(props).to.include('j:firstName');
                    expect(props).to.include('j:lastName');
                    expect(props).to.include('j:email');
                });
        });

        it('does not contain internal jcr:/nt:/rep: properties', () => {
            cy.apollo({query: getUserProperties})
                .its('data.reportUsersAndGroupsUserProperties')
                .then((props: string[]) => {
                    props.forEach(p => {
                        expect(p).not.to.match(/^(jcr:|nt:|rep:)/);
                    });
                });
        });

        it('does not expose j:password', () => {
            cy.apollo({query: getUserProperties})
                .its('data.reportUsersAndGroupsUserProperties')
                .then((props: string[]) => {
                    expect(props).not.to.include('j:password');
                });
        });

        it('does not expose wildcard property definitions', () => {
            cy.apollo({query: getUserProperties})
                .its('data.reportUsersAndGroupsUserProperties')
                .then((props: string[]) => {
                    expect(props).not.to.include('*');
                });
        });

        it('returns properties in alphabetical order', () => {
            cy.apollo({query: getUserProperties})
                .its('data.reportUsersAndGroupsUserProperties')
                .then((props: string[]) => {
                    const sorted = [...props].sort();
                    expect(props).to.deep.equal(sorted);
                });
        });
    });
});
