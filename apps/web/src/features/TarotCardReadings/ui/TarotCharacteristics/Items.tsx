import { ReactElement } from 'react';
import {
  TarotCardArcana,
  TarotCardElement,
  TarotCardPlanet,
  TarotCardSuit,
  TarotCardZodiac,
} from 'shared/api';
import {
  ArcanaMajorIcon,
  CupsIcon,
  ElementAirIcon,
  FireIcon,
  LeafIcon,
  PentaclesIcon,
  PlanetJupiterIcon,
  PlanetMarsIcon,
  PlanetMercuryIcon,
  PlanetMoonIcon,
  PlanetNeptuneIcon,
  PlanetPlutoIcon,
  PlanetSaturnIcon,
  PlanetSunIcon,
  PlanetUranusIcon,
  PlanetVenusIcon,
  SwordsIcon,
  WandsIcon,
  WaterIcon,
  ZodiacAquariusIcon,
  ZodiacAriesIcon,
  ZodiacCancerIcon,
  ZodiacCapricornIcon,
  ZodiacGeminiIcon,
  ZodiacLeoIcon,
  ZodiacLibraIcon,
  ZodiacPiscesIcon,
  ZodiacSagittariusIcon,
  ZodiacScorpioIcon,
  ZodiacTaurusIcon,
  ZodiacVirgoIcon,
} from 'shared/icons';
import { COLORS } from 'shared/themes';

export type TCharacteristicsContent = {
  title: string;
  subtitle: string;
  icon: ReactElement;
};

export type TCharacteristicsLibrary = Record<string, TCharacteristicsContent>;

const DEFAULT_ICON_PARAMS = {
  width: 60,
  height: 60,
  fill: COLORS.Content,
};

export const PLANETS: TCharacteristicsLibrary = {
  [TarotCardPlanet.Uranus]: {
    title: 'characteristics:planet.uranus',
    subtitle: 'characteristics:planet',
    icon: (
      <PlanetUranusIcon
        {...DEFAULT_ICON_PARAMS}
        width={48}
        height={48}
        style={{ marginBottom: 7, marginTop: 5 }}
      />
    ),
  },
  [TarotCardPlanet.Mars]: {
    title: 'characteristics:planet.mars',
    subtitle: 'characteristics:planet',
    icon: <PlanetMarsIcon width={60} height={60} />,
  },
  [TarotCardPlanet.Mercury]: {
    title: 'characteristics:planet.mercury',
    subtitle: 'characteristics:planet',
    icon: <PlanetMercuryIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardPlanet.Venus]: {
    title: 'characteristics:planet.venus',
    subtitle: 'characteristics:planet',
    icon: <PlanetVenusIcon width={60} height={60} />,
  },
  [TarotCardPlanet.Jupiter]: {
    title: 'characteristics:planet.jupiter',
    subtitle: 'characteristics:planet',
    icon: (
      <PlanetJupiterIcon stroke={COLORS.Content} {...DEFAULT_ICON_PARAMS} />
    ),
  },
  [TarotCardPlanet.Saturn]: {
    title: 'characteristics:planet.saturn',
    subtitle: 'characteristics:planet',
    icon: <PlanetSaturnIcon stroke={COLORS.Content} {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardPlanet.Neptune]: {
    title: 'characteristics:planet.neptune',
    subtitle: 'characteristics:planet',
    icon: (
      <PlanetNeptuneIcon stroke={COLORS.Content} {...DEFAULT_ICON_PARAMS} />
    ),
  },
  [TarotCardPlanet.Moon]: {
    title: 'characteristics:planet.moon',
    subtitle: 'characteristics:planet',
    icon: <PlanetMoonIcon stroke={COLORS.Content} {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardPlanet.Pluto]: {
    title: 'characteristics:planet.pluto',
    subtitle: 'characteristics:planet',
    icon: <PlanetPlutoIcon stroke={COLORS.Content} {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardPlanet.Sun]: {
    title: 'characteristics:planet.sun',
    subtitle: 'characteristics:planet',
    icon: <PlanetSunIcon stroke={COLORS.Content} {...DEFAULT_ICON_PARAMS} />,
  },
};

export const ARCANAS: TCharacteristicsLibrary = {
  [TarotCardArcana.Major]: {
    title: 'characteristics:suit.major',
    subtitle: 'characteristics:suit',
    icon: <ArcanaMajorIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardSuit.Pentacles]: {
    title: 'characteristics:suit.pentacles',
    subtitle: 'characteristics:suit',
    icon: <PentaclesIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardSuit.Wands]: {
    title: 'characteristics:suit.wands',
    subtitle: 'characteristics:suit',
    icon: <WandsIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardSuit.Swords]: {
    title: 'characteristics:suit.swords',
    subtitle: 'characteristics:suit',
    icon: <SwordsIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardSuit.Cups]: {
    title: 'characteristics:suit.cups',
    subtitle: 'characteristics:suit',
    icon: <CupsIcon {...DEFAULT_ICON_PARAMS} />,
  },
};

export const ELEMENTS: TCharacteristicsLibrary = {
  [TarotCardElement.Air]: {
    title: 'characteristics:element.air',
    subtitle: 'characteristics:element',
    icon: <ElementAirIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardElement.Earth]: {
    title: 'characteristics:element.earth',
    subtitle: 'characteristics:element',
    icon: <LeafIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardElement.Fire]: {
    title: 'characteristics:element.fire',
    subtitle: 'characteristics:element',
    icon: <FireIcon {...DEFAULT_ICON_PARAMS} />,
  },
  [TarotCardElement.Water]: {
    title: 'characteristics:element.water',
    subtitle: 'characteristics:element',
    icon: <WaterIcon {...DEFAULT_ICON_PARAMS} />,
  },
};

export const ZODIACS: TCharacteristicsLibrary = {
  [TarotCardZodiac.Aquarius]: {
    title: 'characteristics:zodiac.aquarius',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacAquariusIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Aries]: {
    title: 'characteristics:zodiac.aries',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacAriesIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Cancer]: {
    title: 'characteristics:zodiac.cancer',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacCancerIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Capricorn]: {
    title: 'characteristics:zodiac.capricorn',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacCapricornIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Gemini]: {
    title: 'characteristics:zodiac.gemini',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacGeminiIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Leo]: {
    title: 'characteristics:zodiac.leo',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacLeoIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Libra]: {
    title: 'characteristics:zodiac.libra',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacLibraIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Pisces]: {
    title: 'characteristics:zodiac.pisces',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacPiscesIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Sagittarius]: {
    title: 'characteristics:zodiac.sagittarius',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacSagittariusIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Scorpio]: {
    title: 'characteristics:zodiac.scorpio',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacScorpioIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Taurus]: {
    title: 'characteristics:zodiac.taurus',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacTaurusIcon width={60} height={60} />,
  },
  [TarotCardZodiac.Virgo]: {
    title: 'characteristics:zodiac.virgo',
    subtitle: 'characteristics:zodiac',
    icon: <ZodiacVirgoIcon width={60} height={60} />,
  },
};
