import { useState, type ReactElement } from 'react';
import { useAppDispatch } from '@shared/lib/store';
import {
  Button,
  CardFrame,
  Chip,
  EmptyState,
  Header,
  Input,
  ListRow,
  ModalSheet,
  openModal,
  Radio,
  RadioGroup,
  Skeleton,
  SkeletonRow,
  Slider,
  Switch,
  Text,
  Textarea,
  Tile,
  useToast,
  LightningIcon,
} from '@shared/ui';
import styles from './DevUi.module.css';

/** Витрина UI-кита (только dev): компоненты и их состояния для ревью. */
export default function DevUiPage(): ReactElement {
  const [chipSelected, setChipSelected] = useState(0);
  const [switchOn, setSwitchOn] = useState(true);
  const [radioValue, setRadioValue] = useState('a');
  const [slider, setSlider] = useState(6);
  const [rowSelected, setRowSelected] = useState(0);
  const [localModalOpen, setLocalModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const dispatch = useAppDispatch();
  const toast = useToast();

  return (
    <div className={styles.page}>
      <Text role="display">UI-кит /dev/ui</Text>
      <Text role="body" tone="ink100">
        Витрина shared/ui — только в dev-сборке (import.meta.env.DEV).
      </Text>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Text
        </Text>
        <div className={styles.col}>
          <Text role="display">Display Geologica Black 34</Text>
          <Text role="title">Title Geologica ExtraBold 25</Text>
          <Text role="lead">Lead Onest Bold 19</Text>
          <Text role="body">Body Onest Medium 16</Text>
          <Text role="label">Label Onest Bold 13 caps</Text>
          <Text role="micro">Micro Onest SemiBold 12</Text>
          <div className={styles.row}>
            <Text role="body" tone="ink50">ink50</Text>
            <Text role="body" tone="ink100">ink100</Text>
            <Text role="body" tone="accent">accent</Text>
            <Text role="body" tone="alarm">alarm</Text>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Button
        </Text>
        <div className={styles.row}>
          <Button variant="action">Action</Button>
          <Button variant="action" disabled>
            Disabled
          </Button>
          <Button variant="action" loading aria-label="Загрузка">
            Loading
          </Button>
          <Button variant="action" icon={<LightningIcon width={18} height={18} />}>
            С иконкой
          </Button>
        </div>
        <div className={styles.row}>
          <Button variant="quiet">Quiet neutral</Button>
          <Button variant="quiet" quietTone="accent">
            Quiet accent
          </Button>
          <Button variant="link">Link</Button>
        </div>
        <Button variant="action" fullWidth>
          Full width
        </Button>
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Input / Textarea
        </Text>
        <div className={styles.grid}>
          <Input label="Имя" placeholder="Как вас зовут" value={inputValue} onChange={(e) => setInputValue(e.target.value)} showCount maxLength={40} hint="Подсказка под полем" />
          <Input label="С ошибкой" placeholder="Email" error="Проверьте формат email" />
          <Input label="Отключено" placeholder="—" disabled />
        </div>
        <Textarea label="Вопрос колоде" placeholder="О чём спросить карты?" showCount maxLength={280} />
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Chip
        </Text>
        <div className={styles.row}>
          {['Любовь', 'Карьера', 'Финансы', 'Здоровье'].map((label, index) => (
            <Chip key={label} selected={chipSelected === index} onClick={() => setChipSelected(index)}>
              {label}
            </Chip>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          ListRow
        </Text>
        <div className={styles.col}>
          {['Уведомления', 'Звук', 'Язык'].map((label, index) => (
            <ListRow
              key={label}
              title={label}
              subtitle="Подзаголовок строки"
              leadingIcon={<LightningIcon width={20} height={20} />}
              selected={rowSelected === index}
              onClick={() => setRowSelected(index)}
            />
          ))}
          <ListRow title="Переключатель в строке" trailing={<Switch checked={switchOn} onChange={(e) => setSwitchOn(e.target.checked)} />} />
          <ListRow title="Ссылка на настройки" to="/settings" />
        </div>
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          CardFrame / Tile
        </Text>
        <div className={styles.row}>
          <CardFrame width={160} className={styles.cardFrameDemo}>
            <Tile width={144} className={styles.tileDemo} />
          </CardFrame>
        </div>
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Skeleton / EmptyState
        </Text>
        <SkeletonRow className={styles.skeletonRow}>
          <Skeleton variant="circle" width={40} height={40} />
          <Skeleton width={220} height={16} />
        </SkeletonRow>
        <EmptyState
          title="Пока пусто"
          description="Здесь появятся ваши избранные карты."
          action={<Button variant="quiet">Добавить</Button>}
        />
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Switch / Radio / Slider
        </Text>
        <Switch label="Уведомления" checked={switchOn} onChange={(e) => setSwitchOn(e.target.checked)} />
        <RadioGroup
          name="dev-ui-radio"
          value={radioValue}
          onChange={setRadioValue}
          orientation="horizontal"
          options={[
            { value: 'a', label: 'Вариант A' },
            { value: 'b', label: 'Вариант B' },
            { value: 'c', label: 'Вариант C', disabled: true },
          ]}
        />
        <Radio label="Одиночное радио" checked={radioValue === 'solo'} onChange={() => setRadioValue('solo')} />
        <Slider label="Интенсивность" value={slider} min={0} max={10} step={1} hint="0 — слабо, 10 — сильно" onChange={setSlider} />
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          Header + CreditsBadge
        </Text>
        <Header title="Пример экрана" />
        <Text role="micro" tone="ink100">
          CreditsBadge скрыт для гостя (isAuthenticated=false); появится после входа.
        </Text>
      </section>

      <section className={styles.section}>
        <Text role="title" as="h2" className={styles.sectionTitle}>
          ModalSheet / Toast
        </Text>
        <div className={styles.row}>
          <Button variant="quiet" onClick={() => setLocalModalOpen(true)}>
            Локальная модалка
          </Button>
          <Button variant="quiet" onClick={() => dispatch(openModal({ id: 'buy-credits' }))}>
            Глобальная модалка (redux)
          </Button>
          <Button variant="quiet" onClick={() => toast.info('Информационный тост')}>
            Toast info
          </Button>
          <Button variant="quiet" onClick={() => toast.success('Успешно сохранено')}>
            Toast success
          </Button>
          <Button variant="quiet" onClick={() => toast.error('Что-то пошло не так')}>
            Toast error
          </Button>
        </div>
      </section>

      <ModalSheet open={localModalOpen} onClose={() => setLocalModalOpen(false)} title="Демо-модалка">
        <Text role="body" tone="ink100">
          Esc и клик по скриму закрывают модалку, фокус возвращается на кнопку.
        </Text>
        <div className={styles.row} style={{ marginTop: 16 }}>
          <Button variant="action" onClick={() => setLocalModalOpen(false)}>
            Закрыть
          </Button>
        </div>
      </ModalSheet>
    </div>
  );
}
