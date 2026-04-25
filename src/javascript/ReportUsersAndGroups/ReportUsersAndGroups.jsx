import React, {useEffect, useState} from 'react';
import {useMutation, useQuery} from '@apollo/client';
import {useTranslation} from 'react-i18next';
import {Button, Loader, Typography} from '@jahia/moonstone';
import styles from './ReportUsersAndGroups.scss';
import {DELETE_REPORT, GENERATE_REPORT, GET_STATUS, GET_USER_PROPERTIES} from './ReportUsersAndGroups.gql';

const DEFAULT_CSV_ROOT_PATH = '/sites/systemsite/files';
const DEFAULT_SELECTED_PROPERTIES = ['j:firstName', 'j:lastName'];
const POLL_INTERVAL_MS = 2000;

const formatDate = isoString => {
    try {
        return new Intl.DateTimeFormat(undefined, {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(isoString));
    } catch {
        return isoString;
    }
};

const fileNameFromPath = path => path.split('/').pop();

export const ReportUsersAndGroupsAdmin = () => {
    const {t} = useTranslation('report-users-and-groups');
    const [csvRootPath, setCsvRootPath] = useState(DEFAULT_CSV_ROOT_PATH);
    const [selectedProperties, setSelectedProperties] = useState(DEFAULT_SELECTED_PROPERTIES);
    const [generateStatus, setGenerateStatus] = useState(null);

    const {data: propsData} = useQuery(GET_USER_PROPERTIES, {fetchPolicy: 'cache-first'});
    const availableProperties = propsData?.reportUsersAndGroupsUserProperties ?? [];

    const {data, refetch, startPolling, stopPolling} = useQuery(GET_STATUS, {
        variables: {csvRootPath},
        fetchPolicy: 'network-only'
    });

    const serverGenerating = data?.reportUsersAndGroupsIsGenerating === true;
    const reportFiles = data?.reportUsersAndGroupsFiles ?? [];

    useEffect(() => {
        if (serverGenerating) {
            startPolling(POLL_INTERVAL_MS);
        } else {
            stopPolling();
        }

        return () => stopPolling();
    }, [serverGenerating, startPolling, stopPolling]);

    const [generate, {loading: mutationGenerating}] = useMutation(GENERATE_REPORT);
    const [deleteReport] = useMutation(DELETE_REPORT);

    const generating = mutationGenerating || serverGenerating;

    const handleGenerate = async () => {
        setGenerateStatus(null);
        try {
            const result = await generate({variables: {csvRootPath, userPropertiesToExport: selectedProperties}});
            if (result.data?.reportUsersAndGroupsGenerate) {
                setGenerateStatus('success');
                refetch({csvRootPath});
            } else {
                setGenerateStatus('error');
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
            setGenerateStatus('error');
        }
    };

    const handleDelete = async path => {
        try {
            await deleteReport({variables: {path}});
            refetch({csvRootPath});
        } catch (err) {
            console.error('Failed to delete report:', err);
        }
    };

    const handlePropertyToggle = name => {
        setSelectedProperties(prev =>
            prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]
        );
    };

    const handleSelectAll = () => setSelectedProperties([...availableProperties]);
    const handleClearAll = () => setSelectedProperties([]);

    const handleKeyDown = e => {
        if (e.key === 'Enter' && e.ctrlKey && csvRootPath.trim()) {
            handleGenerate();
        }
    };

    return (
        <div className={styles.rug_container}>
            <div className={styles.rug_header}>
                <h2>{t('label.title')}</h2>
            </div>

            <div className={styles.rug_description}>
                <Typography>{t('label.description')}</Typography>
            </div>

            <div className={styles.rug_form}>
                <div className={styles.rug_fieldGroup}>
                    <label className={styles.rug_label} htmlFor="rug-csv-root-path">
                        {t('label.csvRootPath')}
                    </label>
                    <input
                        type="text"
                        id="rug-csv-root-path"
                        className={styles.rug_input}
                        value={csvRootPath}
                        onChange={e => {
                            setCsvRootPath(e.target.value);
                            setGenerateStatus(null);
                        }}
                        onKeyDown={handleKeyDown}
                    />
                    <span className={styles.rug_hint}>{t('label.csvRootPathHint')}</span>
                </div>

                <div className={styles.rug_fieldGroup}>
                    <label className={styles.rug_label} id="rug-properties-label">
                        {t('label.properties')}
                    </label>
                    <div className={styles.rug_propertiesControls}>
                        <button type="button" className={styles.rug_controlBtn} onClick={handleSelectAll}>
                            {t('label.selectAll')}
                        </button>
                        <button type="button" className={styles.rug_controlBtn} onClick={handleClearAll}>
                            {t('label.clearAll')}
                        </button>
                    </div>
                    <div
                        id="rug-properties"
                        role="group"
                        aria-labelledby="rug-properties-label"
                        className={styles.rug_propertiesList}
                        onKeyDown={handleKeyDown}
                        tabIndex={-1}
                    >
                        {availableProperties.map(name => (
                            <label key={name} className={styles.rug_propertyItem}>
                                <input
                                    type="checkbox"
                                    checked={selectedProperties.includes(name)}
                                    onChange={() => handlePropertyToggle(name)}
                                />
                                <span>{name}</span>
                            </label>
                        ))}
                    </div>
                    <span className={styles.rug_hint}>{t('label.propertiesHint')}</span>
                </div>
            </div>

            {generateStatus === 'success' && (
                <div className={`${styles.rug_alert} ${styles['rug_alert--success']}`}>
                    {t('label.generateSuccess')}
                </div>
            )}
            {generateStatus === 'error' && (
                <div className={`${styles.rug_alert} ${styles['rug_alert--error']}`}>
                    {t('label.generateError')}
                </div>
            )}

            <div className={styles.rug_actions}>
                {generating ? (
                    <div className={styles.rug_loading}>
                        <Loader size="big"/>
                        <Typography className={styles.rug_loadingText}>
                            {t('label.generating')}
                        </Typography>
                    </div>
                ) : (
                    <Button
                        label={t('label.generate')}
                        variant="primary"
                        isDisabled={!csvRootPath.trim()}
                        onClick={handleGenerate}
                    />
                )}
            </div>

            {reportFiles.length > 0 && (
                <div className={styles.rug_reportsSection}>
                    <h3 className={styles.rug_reportsTitle}>{t('label.reportsTitle')}</h3>
                    <table className={styles.rug_table}>
                        <thead>
                            <tr>
                                <th>{t('label.colDate')}</th>
                                <th>{t('label.colFile')}</th>
                                <th>{t('label.colActions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportFiles.map(file => (
                                <tr key={file.path}>
                                    <td>{formatDate(file.createdAt)}</td>
                                    <td>
                                        <a
                                            href={file.downloadUrl}
                                            download={fileNameFromPath(file.path)}
                                            className={styles.rug_downloadLink}
                                        >
                                            {fileNameFromPath(file.path)}
                                        </a>
                                    </td>
                                    <td>
                                        <button
                                            type="button"
                                            className={styles.rug_deleteBtn}
                                            onClick={() => handleDelete(file.path)}
                                        >
                                            {t('label.delete')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ReportUsersAndGroupsAdmin;
