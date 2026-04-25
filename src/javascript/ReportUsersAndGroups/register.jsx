import {registry} from '@jahia/ui-extender';
import {ReportUsersAndGroupsAdmin} from './ReportUsersAndGroups';
import React from 'react';

export default () => {
    console.debug('%c report-users-and-groups: activation in progress', 'color: #005580');
    registry.add('adminRoute', 'reportUsersAndGroups', {
        targets: ['administration-server-usersAndRoles:99'],
        requiredPermission: 'admin',
        label: 'report-users-and-groups:label.menu_entry',
        isSelectable: true,
        render: () => React.createElement(ReportUsersAndGroupsAdmin)
    });
};
