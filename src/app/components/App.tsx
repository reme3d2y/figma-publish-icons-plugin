import React, { useCallback, useState, useEffect } from 'react';
import Button from 'arui-feather/button';
import Spin from 'arui-feather/spin';
import Heading from 'arui-feather/heading';
import List from 'arui-feather/list';
import {
  getLastRunInfo,
  getVersion,
  getChangedComponents,
  loadSvgs,
  createPR,
  openPR,
  LastRun,
  OpenedPR,
} from '../../lib/publisher';
import { prepareSvg, prepareName } from '../../lib/icons';

import 'arui-feather/main.css';
import '../styles/app.css';

const App = ({}) => {
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [lastRun, setLastRun] = useState<LastRun | null>();
  const [version, setVersion] = useState<VersionMetadata | null>(null);
  const [changed, setChanged] = useState<FullComponentMetadata[] | null>(null);
  const [loadedIcons, setLoadedIcons] = useState<{ [key: string]: string }>({});
  const [openedPR, setOpenedPR] = useState<OpenedPR | null>(null);
  const [error, setError] = useState('');

  const onCancel = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  }, []);

  const onPublish = useCallback(async () => {
    setPending(true);
    setError('');

    try {
      const openedPR = await openPR(createPR(changed, loadedIcons, version));
      setOpenedPR(openedPR);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }, [changed, loadedIcons, version]);

  const onPrepare = useCallback(async () => {
    setPending(true);
    setError('');

    try {
      await loadSvgs(changed, (id, svgContent) => {
        setLoadedIcons(prev => ({ ...prev, [id]: prepareSvg(svgContent) }));
      });

      setReady(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  }, [changed]);

  useEffect(() => {
    setPending(true);

    Promise.all([getLastRunInfo(), getVersion()])
      .then(async ([lastRun, version]) => {
        setLastRun(lastRun);
        setVersion(version);

        const changed = await getChangedComponents(lastRun.lastModified);
        const validIcons = changed.reduce((acc, component) => {
          const newName = prepareName(component);
          if (newName) {
            acc.push({...component, name: newName});
          }
          return acc;
        }, []);
        setChanged(validIcons);
      })
      .catch(e => {
        setError(e);
      })
      .finally(() => {
        setPending(false);
      });
  }, []);

  const renderActions = () => (
    <div className="actions">
      <Button onClick={onCancel} className="cancel">
        Отмена
      </Button>

      {!ready && (
        <Button onClick={onPrepare} disabled={pending} icon={<Spin visible={pending} />}>
          Подготовить изменения
        </Button>
      )}

      {ready && (
        <Button onClick={onPublish} disabled={pending} icon={<Spin visible={pending} />}>
          Залить в гит
        </Button>
      )}
    </div>
  );

  const renderPublished = () => (
    <div className="actions">
      <Button onClick={onCancel} className="done">
        Ok
      </Button>
    </div>
  );

  return (
    <div className="plugin">
      <div className="content">
        <h2 className="title">Залить иконки в гит</h2>

        <div className="info">
          <Heading size="xs">Информация</Heading>
          <List
            className="info-list"
            items={[
              {
                value: `Последняя синхронизация: ${lastRun ? lastRun.lastModified : '...'}`,
                key: '1',
              },
              {
                value: `Текущая версия: ${version ? version.id : '...'}`,
                key: '2',
              },
            ]}
          />
          <Heading size="xs">Изменения</Heading>
          {changed && (
            <List
              type="ordered"
              className="changes"
              items={changed.map(component => ({
                key: component.name,
                value: `${component.name}
                ${loadedIcons[component.node_id] ? ' +' : ''}`,
              }))}
            />
          )}

          {openedPR && (
            <a href={openedPR.data.html_url} target="_blank">
              {openedPR.data.html_url}
            </a>
          )}

          {error && <span className="error">{error}</span>}
        </div>
      </div>

      {openedPR ? renderPublished() : renderActions()}
    </div>
  );
};

export default App;
