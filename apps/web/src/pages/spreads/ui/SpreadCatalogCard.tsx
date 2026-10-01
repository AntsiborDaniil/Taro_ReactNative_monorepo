import { memo } from 'react';
import {
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { PressableWebState } from 'shared/types';
import {
  DS_COLORS,
  DS_FONT_FAMILY,
  DS_MOTION,
  DS_SPACE,
  dsFocusRing,
  dsRadius,
  dsText,
  dsWebTransition,
  dsWebTransitionReduced,
} from 'shared/themes/ds';
import { useKeyboardFocusVisible } from '../lib/useKeyboardFocusVisible';
import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';

type SpreadCatalogCardProps = {
  /** Уже переведённое имя расклада. */
  name: string;
  /** Уже переведённая мета, например «7 карт». */
  cardsLabel: string;
  /** Уже переведённый label чипа-замка (используется только если isLocked). */
  lockedLabel: string;
  imageSource: ImageSourcePropType;
  width: number;
  isLocked?: boolean;
  onPress: () => void;
};

/**
 * Исходники `spreads/flatIllustration` — 1536×768 (2:1). Квадратные версии
 * (`spreadsSmall/flatIllustration`, как в MainSpreadCard на главной) есть только
 * для 8 из 13 раскладов каталога — навязывать тайлу 1:1 обрезает сюжет до
 * абстракции или ломает недостающие. DS §07 разрешает тайл-«окно» без фиксированной
 * пропорции — берём фактическую 2:1, ничего не обрезаем.
 */
const IMAGE_ASPECT = 0.5;

/** Имя тайла — Onest 700 16 (см. бриф §4.3); в DS_TYPE нет отдельной роли под этот кейс,
 *  но гарнитура и цвет всё равно берутся из DS-токенов. */
const TILE_NAME_STYLE = {
  fontFamily: DS_FONT_FAMILY.onest700,
  fontSize: 16,
  lineHeight: 22,
  letterSpacing: 0,
};

/** Тот же контур, что shared/icons LockIcon.svg, но цвет — из DS-токена (в shared/icons fill захардкожен). */
function QuietLockGlyph({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <Path
        d="M30.0001 13.3334H28.3334V10.0001C28.3334 5.40008 24.6001 1.66675 20.0001 1.66675C15.4001 1.66675 11.6667 5.40008 11.6667 10.0001V13.3334H10.0001C8.16675 13.3334 6.66675 14.8334 6.66675 16.6667V33.3334C6.66675 35.1667 8.16675 36.6667 10.0001 36.6667H30.0001C31.8334 36.6667 33.3334 35.1667 33.3334 33.3334V16.6667C33.3334 14.8334 31.8334 13.3334 30.0001 13.3334ZM15.0001 10.0001C15.0001 7.23341 17.2334 5.00008 20.0001 5.00008C22.7667 5.00008 25.0001 7.23341 25.0001 10.0001V13.3334H15.0001V10.0001ZM30.0001 33.3334H10.0001V16.6667H30.0001V33.3334ZM20.0001 28.3334C21.8334 28.3334 23.3334 26.8334 23.3334 25.0001C23.3334 23.1667 21.8334 21.6667 20.0001 21.6667C18.1667 21.6667 16.6667 23.1667 16.6667 25.0001C16.6667 26.8334 18.1667 28.3334 20.0001 28.3334Z"
        fill={color}
      />
    </Svg>
  );
}

function SpreadCatalogCard({
  name,
  cardsLabel,
  lockedLabel,
  imageSource,
  width,
  isLocked = false,
  onPress,
}: SpreadCatalogCardProps) {
  const { focusVisible, onFocus, onBlur } = useKeyboardFocusVisible();
  const reducedMotion = usePrefersReducedMotion();
  const webTransition = reducedMotion ? dsWebTransitionReduced : dsWebTransition;

  const imageHeight = Math.round(width * IMAGE_ASPECT);
  const imageRadius = dsRadius.window(width);
  const a11yLabel = `${name}, ${cardsLabel}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isLocked ? `${a11yLabel}, ${lockedLabel}` : a11yLabel}
      onPress={onPress}
      onFocus={onFocus}
      onBlur={onBlur}
      style={({ hovered, pressed }: PressableWebState) => [
        styles.card,
        { width },
        pressed ? { transform: [{ translateY: DS_MOTION.pressShiftY }] } : null,
        focusVisible ? dsFocusRing : null,
      ]}
    >
      {({ hovered, pressed }: PressableWebState) => (
        <>
          <View
            style={[
              styles.imageFrame,
              {
                width,
                height: imageHeight,
                borderRadius: imageRadius,
                borderColor: hovered ? DS_COLORS.accent400 : DS_COLORS.ground600,
              },
              webTransition,
            ]}
          >
            {/* RN Web: Image + StyleSheet.absoluteFill рендерится в натуральном размере
                картинки, а не растягивается родителем — нужны явные width/height. */}
            <Image
              source={imageSource}
              resizeMode="cover"
              style={{ position: 'absolute', top: 0, left: 0, width, height: imageHeight }}
              accessible={false}
              importantForAccessibility="no"
            />
            {pressed ? (
              <View
                pointerEvents="none"
                style={[StyleSheet.absoluteFill, styles.pressOverlay]}
              />
            ) : null}
            {isLocked ? (
              <View style={styles.lockChip}>
                <QuietLockGlyph size={12} color={DS_COLORS.ink100} />
                <Text style={dsText('micro', DS_COLORS.ink100)} numberOfLines={1}>
                  {lockedLabel}
                </Text>
              </View>
            ) : null}
          </View>
          <View style={styles.textCol}>
            <Text style={[TILE_NAME_STYLE, { color: DS_COLORS.ink50 }]} numberOfLines={2}>
              {name}
            </Text>
            <Text style={dsText('micro', DS_COLORS.ink100)} numberOfLines={1}>
              {cardsLabel}
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

export default memo(SpreadCatalogCard);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'column',
    gap: DS_SPACE.s,
  },
  imageFrame: {
    overflow: 'hidden',
    borderWidth: 1,
    backgroundColor: DS_COLORS.ground700,
    position: 'relative',
  },
  pressOverlay: {
    backgroundColor: DS_COLORS.pressDim,
  },
  lockChip: {
    position: 'absolute',
    left: DS_SPACE.xs,
    bottom: DS_SPACE.xs,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DS_SPACE.xs / 2,
    height: 24,
    borderRadius: dsRadius.capsule(24),
    paddingHorizontal: DS_SPACE.s,
    backgroundColor: DS_COLORS.ground800,
    borderWidth: 1,
    borderColor: DS_COLORS.ground600,
  },
  textCol: {
    gap: DS_SPACE.xs / 2,
  },
});
