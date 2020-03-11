import React, { useCallback, useState, useEffect } from 'react';
import Button from 'arui-feather/button';
import Spin from 'arui-feather/spin';
import Heading from 'arui-feather/heading';
import List from 'arui-feather/list';

import 'arui-feather/main.css';

import {
  getLastRunInfo,
  getVersion,
  getChangedComponents,
  fetchIcons,
  openPR,
  LastRun,
  OpenedPR,
} from '../lib/publisher';

import '../styles/app.css';

const App = ({}) => {
  const [published, setPublished] = useState(false);
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [lastRun, setLastRun] = useState<LastRun | null>();
  const [version, setVersion] = useState<VersionMetadata | null>(null);
  const [changed, setChanged] = useState<FullComponentMetadata[] | null>(null);
  const [loadedIcons, setLoadedIcons] = useState({});
  const [openedPR, setOpenedPR] = useState<OpenedPR | null>(null);
  const [error, setError] = useState('');

  const onCancel = useCallback(() => {
    parent.postMessage({ pluginMessage: { type: 'cancel' } }, '*');
  }, []);

  const onPublish = useCallback(() => {
    setPending(true);
    setError('');

    const iconNames = changed.map(c => c.name).join(', ');

    const changes = changed.reduce(
      (changes, component) => {
        if (loadedIcons[component.node_id]) {
          changes[`${component.name}.svg`] = loadedIcons[component.node_id];
        }
        return changes;
      },
      {
        'last_run.json': JSON.stringify({
          lastModified: version.created_at,
        }),
      }
    );

    openPR(
      `add icons: ${iconNames}`,
      `Добавлены новые иконки: ${iconNames}`,
      `feat/add-new-icons-${version.id}`,
      `feat(icons): add icons ${iconNames}`,
      changes
    )
      .then(r => {
        debugger;
        setPublished(true);
        setOpenedPR(r);
      })
      .catch(e => {
        setError(e.message);
      })
      .finally(() => {
        setPending(false);
      });
  }, [changed, loadedIcons, version]);

  const onGetChanged = useCallback(() => {
    setPending(true);

    getChangedComponents(lastRun.lastModified)
      .then(changed => {
        console.log(changed);
        if (changed) setChanged(changed);
        return fetchIcons(changed);
      })
      .then((r: FileImageResponse) =>
        Promise.all(
          Object.entries(r.images).map(([id, url]) =>
            fetch(url)
              .then(r => r.text())
              .then((content: string) =>
                setLoadedIcons(prev => ({ ...prev, [id]: content }))
              )
          )
        ).then(() => {
          setPending(false);
          setReady(true);
        })
      );
  }, [lastRun]);

  useEffect(() => {
    setPending(true);

    Promise.all([
      getLastRunInfo().then(lastRun => setLastRun(lastRun)),
      getVersion().then(version => setVersion(version)),
    ]).then(() => {
      setPending(false);
    });
  }, []);

  const renderActions = () => (
    <div className="actions">
      <Button onClick={onCancel} className="cancel">
        Отмена
      </Button>

      {!ready && (
        <Button
          onClick={onGetChanged}
          disabled={pending}
          icon={<Spin visible={pending} />}
        >
          Подготовить изменения
        </Button>
      )}

      {ready && (
        <div className="actions">
          <Button
            onClick={onPublish}
            disabled={pending}
            icon={<Spin visible={pending} />}
          >
            Залить в гит
          </Button>
        </div>
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
      <h2 className="title">Залить иконки в гит</h2>

      <div className="info">
        <Heading size="xs">Информация</Heading>
        <List
          className="info-list"
          items={[
            {
              value: `Последняя синхронизация: ${
                lastRun ? lastRun.lastModified : '...'
              }`,
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

      {published ? renderPublished() : renderActions()}
    </div>
  );
};

export default App;
