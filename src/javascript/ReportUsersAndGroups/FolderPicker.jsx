import React, {useState} from 'react';
import PropTypes from 'prop-types';
import {useQuery} from '@apollo/client';
import {useTranslation} from 'react-i18next';
import {Button} from '@jahia/moonstone';
import {GET_FOLDER_CHILDREN} from './ReportUsersAndGroups.gql';
import styles from './FolderPicker.scss';

const ROOT_FLOOR = '/sites';

const pathParts = path => path.split('/').filter(Boolean);
const pathUpTo = (parts, i) => '/' + parts.slice(0, i + 1).join('/');

// Clamp navigation so it never goes above /sites
const clampPath = path => {
    if (!path || path === '/' || path === '/sites') {
        return ROOT_FLOOR;
    }

    return path.startsWith(ROOT_FLOOR + '/') ? path : ROOT_FLOOR;
};

export const FolderPicker = ({initialPath, onSelect, onClose}) => {
    const {t} = useTranslation('report-users-and-groups');
    const [currentPath, setCurrentPath] = useState(clampPath(initialPath || ROOT_FLOOR));

    const navigate = path => setCurrentPath(clampPath(path));

    const {data, loading, error} = useQuery(GET_FOLDER_CHILDREN, {
        variables: {path: currentPath},
        fetchPolicy: 'network-only'
    });

    const node = data?.jcr?.nodeByPath;
    const children = node?.children?.nodes ?? [];
    const parts = pathParts(currentPath);

    // Index of the "sites" segment in the breadcrumb (0-based among parts)
    const sitesIndex = parts.indexOf('sites');

    return (
        <div className={styles.fp_overlay} role="dialog" aria-modal="true" aria-label={t('label.pickerTitle')}>
            <div className={styles.fp_modal}>
                <div className={styles.fp_header}>
                    <span className={styles.fp_title}>{t('label.pickerTitle')}</span>
                    <button type="button" className={styles.fp_closeBtn} aria-label="Close" onClick={onClose}>✕</button>
                </div>

                <div className={styles.fp_breadcrumb}>
                    {parts.map((part, i) => {
                        const isSitesSegment = i === sitesIndex;
                        const isActive = i === parts.length - 1;
                        // Segments above "sites" are rendered as plain text (not clickable)
                        const isAboveFloor = i < sitesIndex;

                        return (
                            <React.Fragment key={pathUpTo(parts, i)}>
                                {i > 0 && <span className={styles.fp_crumbSep}>/</span>}
                                {isAboveFloor ? (
                                    <span className={styles.fp_crumbLocked}>{part}</span>
                                ) : (
                                    <button
                                        type="button"
                                        className={`${styles.fp_crumb} ${isActive || isSitesSegment && isActive ? styles['fp_crumb--active'] : ''}`}
                                        onClick={() => navigate(pathUpTo(parts, i))}
                                        disabled={isActive}
                                    >
                                        {part}
                                    </button>
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                <div className={styles.fp_list}>
                    {loading && <div className={styles.fp_status}>{t('label.loading')}</div>}
                    {error && <div className={styles.fp_status}>{t('label.pickerError')}</div>}
                    {!loading && !error && node === null && (
                        <div className={styles.fp_status}>{t('label.pickerNotFound')}</div>
                    )}
                    {!loading && children.length === 0 && node !== null && !error && (
                        <div className={styles.fp_status}>{t('label.pickerEmpty')}</div>
                    )}
                    {children.map(child => (
                        <button
                            key={child.path}
                            type="button"
                            className={styles.fp_folderBtn}
                            onClick={() => navigate(child.path)}
                        >
                            <span className={styles.fp_folderIcon}>📁</span>
                            <span>{child.name}</span>
                        </button>
                    ))}
                </div>

                <div className={styles.fp_footer}>
                    <code className={styles.fp_selected}>{currentPath}</code>
                    <div className={styles.fp_actions}>
                        <Button label={t('label.pickerSelect')} variant="primary" onClick={() => onSelect(currentPath)}/>
                        <Button label={t('label.pickerCancel')} variant="ghost" onClick={onClose}/>
                    </div>
                </div>
            </div>
        </div>
    );
};

FolderPicker.propTypes = {
    initialPath: PropTypes.string,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired
};
