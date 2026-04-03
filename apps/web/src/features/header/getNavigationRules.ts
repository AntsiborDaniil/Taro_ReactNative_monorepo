import { SpreadName, SpreadsCategory, TSpread } from 'shared/api';
import { NavigationRoute, TabRoute } from 'shared/types';

type TNavigationRulesResult = {
  tabRoute: TabRoute;
  navigationRoute: NavigationRoute;
  params?: Record<string, any>;
};

type TNavigationRulesParameters = {
  spread?: TSpread | null;
  viewedCardIndex?: number;
  selectedTab?: TabRoute;
  selectedRoute?: NavigationRoute;
};

const MAIN_PAGE_REDIRECT = {
  tabRoute: TabRoute.MainTab,
  navigationRoute: NavigationRoute.Main,
};

const SIMPLE_SPREADS_PAGE_REDIRECT = {
  tabRoute: TabRoute.MainTab,
  navigationRoute: NavigationRoute.Spreads,
  params: { id: SpreadsCategory.Simple },
};

const THEMATIC_SPREADS_PAGE_REDIRECT = {
  tabRoute: TabRoute.MainTab,
  navigationRoute: NavigationRoute.Spreads,
  params: { id: SpreadsCategory.Thematic },
};

const UNIVERSAL_SPREADS_PAGE_REDIRECT = {
  tabRoute: TabRoute.MainTab,
  navigationRoute: NavigationRoute.Spreads,
  params: { id: SpreadsCategory.Universal },
};

const SELF_DEVELOPMENT_SPREADS_PAGE_REDIRECT = {
  tabRoute: TabRoute.MainTab,
  navigationRoute: NavigationRoute.Spreads,
  params: { id: SpreadsCategory.SelfDevelopment },
};

const CHOICE_SPREADS_PAGE_REDIRECT = {
  tabRoute: TabRoute.MainTab,
  navigationRoute: NavigationRoute.Spreads,
  params: { id: SpreadsCategory.Choice },
};

type TSpreadsRedirects = Record<
  string,
  Record<string, Record<string, TNavigationRulesResult>>
>;

const SIMPLE_SPREADS_REDIRECTS: TSpreadsRedirects = {
  [NavigationRoute.SpreadReadings]: {
    [TabRoute.MainTab]: {
      [SpreadName.Simple_DaySuggest]: MAIN_PAGE_REDIRECT,
      [SpreadName.Simple_YesNo]: MAIN_PAGE_REDIRECT,
    },
    [TabRoute.SpreadsTab]: {
      [SpreadName.Simple_DaySuggest]: SIMPLE_SPREADS_PAGE_REDIRECT,
      [SpreadName.Simple_YesNo]: SIMPLE_SPREADS_PAGE_REDIRECT,
    },
  },
};

const COUNTABLE_SPREADS_REDIRECTS: TSpreadsRedirects = {
  [NavigationRoute.SpreadReadings]: {
    [TabRoute.MainTab]: {
      [SpreadName.Simple_DaySuggest]: MAIN_PAGE_REDIRECT,
      [SpreadName.Simple_YesNo]: MAIN_PAGE_REDIRECT,
      [SpreadName.Thematic_CareerFinance]: MAIN_PAGE_REDIRECT,
      [SpreadName.Thematic_Love]: MAIN_PAGE_REDIRECT,
      [SpreadName.Thematic_Relationship]: MAIN_PAGE_REDIRECT,
      [SpreadName.Universal_Horseshoe]: MAIN_PAGE_REDIRECT,
      [SpreadName.Universal_Flame]: MAIN_PAGE_REDIRECT,
      [SpreadName.Universal_CelticCross]: MAIN_PAGE_REDIRECT,
      [SpreadName.Universal_Pyramid]: MAIN_PAGE_REDIRECT,
      [SpreadName.SelfDevelopment_Mirror]: MAIN_PAGE_REDIRECT,
      [SpreadName.SelfDevelopment_ShadowSide]: MAIN_PAGE_REDIRECT,
      [SpreadName.Choice_Crossroad]: MAIN_PAGE_REDIRECT,
      [SpreadName.Choice_TwoPaths]: MAIN_PAGE_REDIRECT,
    },
    [TabRoute.SpreadsTab]: {
      [SpreadName.Thematic_CareerFinance]: THEMATIC_SPREADS_PAGE_REDIRECT,
      [SpreadName.Thematic_Love]: THEMATIC_SPREADS_PAGE_REDIRECT,
      [SpreadName.Thematic_Relationship]: THEMATIC_SPREADS_PAGE_REDIRECT,
      [SpreadName.Universal_Horseshoe]: UNIVERSAL_SPREADS_PAGE_REDIRECT,
      [SpreadName.Universal_Flame]: UNIVERSAL_SPREADS_PAGE_REDIRECT,
      [SpreadName.Universal_CelticCross]: UNIVERSAL_SPREADS_PAGE_REDIRECT,
      [SpreadName.Universal_Pyramid]: UNIVERSAL_SPREADS_PAGE_REDIRECT,
      [SpreadName.SelfDevelopment_Mirror]:
        SELF_DEVELOPMENT_SPREADS_PAGE_REDIRECT,
      [SpreadName.SelfDevelopment_ShadowSide]:
        SELF_DEVELOPMENT_SPREADS_PAGE_REDIRECT,
      [SpreadName.Choice_Crossroad]: CHOICE_SPREADS_PAGE_REDIRECT,
      [SpreadName.Choice_TwoPaths]: CHOICE_SPREADS_PAGE_REDIRECT,
    },
  },
};

export function getNavigationRules({
  spread,
  selectedRoute,
  selectedTab,
  viewedCardIndex,
}: TNavigationRulesParameters): TNavigationRulesResult | undefined {
  if (spread) {
    const simpleRedirect =
      SIMPLE_SPREADS_REDIRECTS[selectedRoute ?? '']?.[selectedTab ?? '']?.[
        spread?.id ?? ''
      ];

    if (simpleRedirect) {
      return simpleRedirect;
    }

    if (
      spread?.cardsOrder?.length &&
      viewedCardIndex === spread.cardsOrder.length - 1
    ) {
      const countableRedirect =
        COUNTABLE_SPREADS_REDIRECTS[selectedRoute ?? '']?.[selectedTab ?? '']?.[
          spread?.id ?? ''
        ];

      if (countableRedirect) {
        return countableRedirect;
      }
    }
  }
}
