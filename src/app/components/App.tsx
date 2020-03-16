import React, { useCallback, useState, useEffect } from 'react';
import Button from 'arui-feather/button';
import Spin from 'arui-feather/spin';
import Heading from 'arui-feather/heading';
import SlideDown from 'arui-feather/slide-down';
import Link from 'arui-feather/link';
import List from 'arui-feather/list';
import OkIcon from 'arui-feather/icon/ui/ok';
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
import { validate, prepareSvg, prepareName } from '../../lib/icons';
import { formatLastSyncDate } from '../../lib/funcs';

import 'arui-feather/main.css';
import '../styles/app.css';

const App = ({}) => {
  const [pending, setPending] = useState(false);
  const [ready, setReady] = useState(false);
  const [validExpanded, setValidExpanded] = useState(false);
  const [invalidExpanded, setInvalidExpanded] = useState(false);
  const [lastRun, setLastRun] = useState<LastRun | null>();
  const [version, setVersion] = useState<VersionMetadata | null>(null);
  const [changed, setChanged] = useState<FullComponentMetadata[] | null>(null);
  const [invalid, setInvalid] = useState<FullComponentMetadata[] | null>(null);
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
      setValidExpanded(false);
      setInvalidExpanded(false);
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

  const onFocus = useCallback((component: FullComponentMetadata) => {
    parent.postMessage(
      { pluginMessage: { type: 'focus', nodeId: component.node_id, pageId: component.containing_frame.pageId } },
      '*'
    );
  }, []);

  const onValidExpand = useCallback(() => {
    if (!validExpanded) setInvalidExpanded(false);
    setValidExpanded(!validExpanded);
  }, [validExpanded]);

  const onInvalidExpand = useCallback(() => {
    if (!invalidExpanded) setValidExpanded(false);
    setInvalidExpanded(!invalidExpanded);
  }, [invalidExpanded]);

  useEffect(() => {
    setPending(true);

    Promise.all([getLastRunInfo(), getVersion()])
      .then(async ([lastRun, version]) => {
        setLastRun(lastRun);
        setVersion(version);

        const changed = await getChangedComponents(lastRun.lastModified);
        const validIcons = [];
        const invalidIcons = [];

        changed.forEach(component => {
          validate(component) ? validIcons.push(component) : invalidIcons.push(component);
        });

        setInvalid(invalidIcons);
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

      {changed && changed.length === 0 && <Button disabled={true}>Изменений нет</Button>}

      {(!changed || (!ready && changed.length > 0)) && (
        <Button onClick={onPrepare} disabled={pending} icon={<Spin visible={pending} />}>
          Подготовить изменения
          {changed && changed.length && pending && (
            <span>
              {' '}
              {Object.keys(loadedIcons).length} / {changed.length}
            </span>
          )}
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
                value: `Последняя синхронизация: ${lastRun ? formatLastSyncDate(lastRun.lastModified) : '...'}`,
                key: '1',
              },
              {
                value: `Текущая версия: ${version ? version.id : '...'}`,
                key: '2',
              },
            ]}
          />
          <Heading size="xs">Изменения</Heading>

          {invalid && (
            <div className="changes">
              <Link
                onClick={onInvalidExpand}
                text={invalidExpanded ? 'Скрыть' : `Ошибок: ${invalid.length}`}
                size="s"
                pseudo={true}
              />
              <SlideDown isExpanded={invalidExpanded}>
                <List
                  items={invalid.map(component => ({
                    key: component.name,
                    value: (
                      <Link
                        onClick={onFocus.bind(this, component)}
                        text={`${component.containing_frame.pageName}/${component.name}`}
                        size="s"
                        pseudo={true}
                      />
                    ),
                  }))}
                />
              </SlideDown>
            </div>
          )}

          {changed && (
            <div className="changes">
              <Link
                onClick={onValidExpand}
                text={validExpanded ? 'Скрыть' : `Изменений: ${changed.length}`}
                size="s"
                pseudo={true}
              />
              <SlideDown isExpanded={validExpanded}>
                <List
                  items={changed.map(component => ({
                    key: component.name,
                    value: (
                      <>
                        {loadedIcons[component.node_id] && <OkIcon colored={true} size="s" />}
                        <Link
                          onClick={onFocus.bind(this, component)}
                          text={prepareName(component)}
                          size="s"
                          pseudo={true}
                        />
                      </>
                    ),
                  }))}
                />
              </SlideDown>
            </div>
          )}

          {openedPR && (
            <a href={openedPR.data.html_url} target="_blank" className="pr-link">
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
