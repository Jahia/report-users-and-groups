import {registry} from '@jahia/ui-extender';
import register from './ReportUsersAndGroups/register';
import i18next from 'i18next';

export default function () {
    registry.add('callback', 'report-users-and-groups', {
        targets: ['jahiaApp-init:50'],
        callback: async () => {
            await i18next.loadNamespaces('report-users-and-groups', () => {
                console.debug('%c report-users-and-groups: i18n namespace loaded', 'color: #005580');
            });
            register();
            console.debug('%c report-users-and-groups: activation completed', 'color: #005580');
        }
    });
}
