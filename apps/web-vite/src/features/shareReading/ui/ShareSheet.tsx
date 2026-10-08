import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { MetrikaGoal, reachMetrikaGoal } from '@shared/lib/metrika';
import { DECK_STYLE_FLAT } from '@shared/lib/getImage';
import { haptic } from '@shared/lib/haptics';
import { buildSharedReadingUrl, buildWebReadingUrl } from '@shared/lib/sharedReadingLink';
import { useAppSelector } from '@shared/lib/store';
import { isTelegramMiniApp, openExternalPaymentUrl as openExternalUrl } from '@shared/lib/web/telegramWebApp';
import { DownloadIcon, ListRow, ShareIcon, Switch, useToast } from '@shared/ui';
import type { ModalComponentProps } from '@shared/ui/ModalSheet';
import { downloadStoryForSpread } from '../lib/storyImage';
import { shareLinkViaChannels } from '../lib/shareLink';
import { getShareProvider } from '../model/shareProvider';
import styles from './ShareSheet.module.css';

/**
 * Лист «Поделиться»: картинка для сторис и ссылка другу.
 * Тумблер «Показать мой вопрос» (по умолчанию выкл.) попадает в payload.shareQuestion
 * расклада — публичный GET /spreads/shared/:id отдаёт вопрос только при true.
 */
export function ShareSheet({ onClose }: ModalComponentProps): ReactElement {
  const { t } = useTranslation();
  const toast = useToast();
  const spread = useAppSelector((state) => state.spread.selectedSpread);
  const deckStyle = useAppSelector((state) => state.settings.settings.appearance?.deckStyle) ?? DECK_STYLE_FLAT;
  const [showQuestion, setShowQuestion] = useState(false);
  const [busy, setBusy] = useState<'story' | 'friend' | null>(null);

  const hasQuestion = Boolean(spread?.question?.trim());
  const inMiniApp = isTelegramMiniApp();
  const shareQuestion = hasQuestion && showQuestion;

  /** uid облачной записи (дожимает сохранение) — без него ссылку не построить. */
  const resolveUid = async (): Promise<string | null> => {
    const provider = getShareProvider();
    const uid = provider ? await provider.ensureUid(shareQuestion) : null;
    if (!uid) {
      toast.error(provider?.isAuthenticated === false ? t('core:ai.copy.shareNeedAuth') : t('core:ai.copy.shareFailed'));
      return null;
    }
    return uid;
  };

  const run = async (kind: 'story' | 'friend', action: () => Promise<void>) => {
    if (busy || !spread) return;
    haptic.impact('light');
    setBusy(kind);
    reachMetrikaGoal(MetrikaGoal.shareClick, { spreadId: spread.id, kind });
    try {
      await action();
    } finally {
      setBusy(null);
    }
  };

  const handleStory = () =>
    run('story', async () => {
      if (!spread) return;
      const uid = await resolveUid();
      if (!uid) return;
      const webUrl = buildWebReadingUrl(uid);
      // WebView Telegram не скачивает blob — открываем страницу расклада во внешнем
      // браузере, там кнопка «Скачать картинку» (/r/<id>?story=1).
      if (isTelegramMiniApp()) {
        openExternalUrl(`${webUrl}?story=1`);
        reachMetrikaGoal(MetrikaGoal.shareSuccess, { spreadId: spread.id, channel: 'story_browser' });
        onClose();
        return;
      }
      try {
        await downloadStoryForSpread({
          spread,
          t,
          deckStyle,
          question: shareQuestion ? spread.question : null,
        });
        toast.success(t('spread:share.storySaved'));
        reachMetrikaGoal(MetrikaGoal.shareSuccess, { spreadId: spread.id, channel: 'story' });
        haptic.success();
        onClose();
      } catch {
        haptic.notify('warning');
        toast.error(t('spread:share.storyFailed'));
      }
    });

  const handleFriend = () =>
    run('friend', async () => {
      if (!spread) return;
      const uid = await resolveUid();
      if (!uid) return;
      const channel = await shareLinkViaChannels(buildSharedReadingUrl(uid), t(spread.name));
      if (channel === 'failed') {
        toast.error(t('core:ai.copy.fail'));
        return;
      }
      if (channel === 'clipboard') toast.success(t('core:ai.copy.shareSuccess'));
      reachMetrikaGoal(MetrikaGoal.shareSuccess, { spreadId: spread.id, channel });
      onClose();
    });

  return (
    <div className={styles.root}>
      {hasQuestion ? (
        <Switch
          label={t('spread:share.showQuestion')}
          checked={showQuestion}
          onChange={(event) => setShowQuestion(event.target.checked)}
          disabled={busy !== null}
        />
      ) : null}
      <div className={styles.list}>
        <ListRow
          leadingIcon={<DownloadIcon width={22} height={22} />}
          title={t('spread:share.story')}
          subtitle={t(inMiniApp ? 'spread:share.storyHintMiniApp' : 'spread:share.storyHint')}
          onClick={handleStory}
          disabled={busy !== null}
        />
        <ListRow
          leadingIcon={<ShareIcon width={22} height={22} />}
          title={t('spread:share.friend')}
          subtitle={t('spread:share.friendHint')}
          onClick={handleFriend}
          disabled={busy !== null}
        />
      </div>
    </div>
  );
}
