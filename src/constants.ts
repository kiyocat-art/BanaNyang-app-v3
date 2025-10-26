import { CameraSize, BodyPart, ClothingItem, ActionPose, ObjectItem, PromptFolder, PaletteCategory, BoardImage } from './types';

export const CAMERA_SIZES: CameraSize[] = [
  CameraSize.Full,
];

// FIX: Export COST_PER_IMAGE, IMAGES_PER_PAGE, TOTAL_MONTHLY_CREDIT constants.
export const COST_PER_IMAGE = 25;
export const IMAGES_PER_PAGE = 12;
export const TOTAL_MONTHLY_CREDIT = 417809;

// FIX: Export DEFAULT_PROMPT_FOLDERS constant.
export const DEFAULT_PROMPT_FOLDERS: PromptFolder[] = [
    { id: 'default-1', name: '실사', showInQuickBar: true, presets: [ { id: 'default-1-1', name: '실사 프롬프트 1', prompt: 'Using a high-resolution, state-of-the-art digital camera equipped with three-point lighting, this painting is restored to a three-dimensional, realistic appearance. The background can be dramatically rendered for a more realistic feel.' }, { id: 'default-1-2', name: '실사 프롬프트 2', prompt: 'Using a high-resolution, state-of-the-art digital camera equipped with three-point lighting, this painting is restored to a three-dimensional, realistic appearance. For a more realistic feel, you can dramatically enhance the background. For a more dramatic effect, emphasize the contrast.' } ] },
    { id: 'default-2', name: '애니', showInQuickBar: true, presets: [ { id: 'default-2-1', name: '애니 스타일', prompt: 'Vibrant and dynamic anime style, clean line art, cinematic composition, beautiful cel-shaded colors, reminiscent of a high-quality modern animation film.' } ] },
    { id: 'default-3', name: '업스케일링', showInQuickBar: true, presets: [ { id: 'default-3-1', name: '업스케일링 & 디테일', prompt: 'restore and sharpen this blurry photo and add details' } ] }
];


export const BODY_PARTS: BodyPart[] = [
  BodyPart.Face,
  BodyPart.Hair,
  BodyPart.Body,
  BodyPart.Pelvis,
  BodyPart.LeftShoulder,
  BodyPart.RightShoulder,
  BodyPart.LeftArm,
  BodyPart.RightArm,
  BodyPart.BothArms,
  BodyPart.LeftHand,
  BodyPart.RightHand,
  BodyPart.BothHands,
  BodyPart.LeftLeg,
  BodyPart.RightLeg,
  BodyPart.BothLegs,
  BodyPart.LeftFoot,
  BodyPart.RightFoot,
  BodyPart.BothFeet,
];

export type ClothingCategory = {
  categoryKey: 'tops' | 'bottoms' | 'footwear' | 'gloves' | 'hats' | 'bags' | 'decorations' | 'sets' | 'outerwear';
  items: ClothingItem[];
};

export type ClothingTheme = {
  themeKey: 'scifi' | 'modern' | 'fantasy';
  categories: ClothingCategory[];
};

export const CLOTHING_THEMES: ClothingTheme[] = [
  {
    themeKey: 'scifi',
    categories: [
      { categoryKey: 'tops', items: [ClothingItem.SciFiCyberneticJacket, ClothingItem.SciFiHolographicTop, ClothingItem.SciFiLightArmorChest, ClothingItem.SciFiBioSuitTop, ClothingItem.SciFiSpaceSuitTorso] },
      { categoryKey: 'outerwear', items: [ClothingItem.SciFiNeonTrenchcoat] },
      { categoryKey: 'bottoms', items: [ClothingItem.SciFiArmoredPants, ClothingItem.SciFiEnergyLeggings, ClothingItem.SciFiZeroGravityTrousers, ClothingItem.SciFiCyberpunkSkirt, ClothingItem.SciFiBioSuitBottom, ClothingItem.SciFiExoskeletonLegs] },
      { categoryKey: 'footwear', items: [ClothingItem.SciFiMagneticBoots, ClothingItem.SciFiHoverBoots, ClothingItem.SciFiCyberneticGreaves, ClothingItem.SciFiEnergySandals, ClothingItem.SciFiLightweightPlatingBoots] },
      { categoryKey: 'gloves', items: [ClothingItem.SciFiDataGloves, ClothingItem.SciFiPowerGauntlets, ClothingItem.SciFiNanoGloves, ClothingItem.SciFiRoboticHands, ClothingItem.SciFiCyberneticForearms] },
      { categoryKey: 'hats', items: [ClothingItem.SciFiVisorHelmet, ClothingItem.SciFiNeuroLinkHeadset, ClothingItem.SciFiHolographicHood, ClothingItem.SciFiBreathingMask, ClothingItem.SciFiCombatHelmet, ClothingItem.SciFiDataVisor] },
      { categoryKey: 'bags', items: [ClothingItem.SciFiGravityPouch, ClothingItem.SciFiTechBackpack, ClothingItem.SciFiEnergyCellHolster, ClothingItem.SciFiUtilityBelt] },
      { categoryKey: 'decorations', items: [ClothingItem.SciFiShoulderMountedDrone, ClothingItem.SciFiFloatingPauldrons, ClothingItem.SciFiEnergyShieldEmitter, ClothingItem.SciFiPlasmaCables] },
      { categoryKey: 'sets', items: [ClothingItem.SciFiPilotSuitSet, ClothingItem.SciFiCyborgEnforcerSet, ClothingItem.SciFiExplorerSuitSet, ClothingItem.SciFiStealthOpsSet] },
    ]
  },
  {
    themeKey: 'fantasy',
    categories: [
      { categoryKey: 'tops', items: [ClothingItem.FantasyPlateArmorChest, ClothingItem.FantasyLeatherJerkin, ClothingItem.FantasyMageRobesTop, ClothingItem.FantasyChainmailShirt, ClothingItem.FantasyTunic, ClothingItem.FantasyElvenRobe, ClothingItem.FantasyDwarvenArmor] },
      { categoryKey: 'outerwear', items: [ClothingItem.FantasyTravelersCloak, ClothingItem.FantasyRoyalCape, ClothingItem.FantasyFurMantle] },
      { categoryKey: 'bottoms', items: [ClothingItem.FantasyPlateGreaves, ClothingItem.FantasyLeatherPants, ClothingItem.FantasyMageRobesBottom, ClothingItem.FantasyChainmailLeggings, ClothingItem.FantasyTrousers, ClothingItem.FantasyKilt] },
      { categoryKey: 'footwear', items: [ClothingItem.FantasyPlateSabatons, ClothingItem.FantasyLeatherBoots, ClothingItem.FantasyMageSandals, ClothingItem.FantasyElvenBoots] },
      { categoryKey: 'gloves', items: [ClothingItem.FantasyPlateGauntlets, ClothingItem.FantasyLeatherBracers, ClothingItem.FantasyMageGloves] },
      { categoryKey: 'hats', items: [ClothingItem.FantasyChainmailCoif, ClothingItem.FantasyLeatherHood, ClothingItem.FantasyCirclet, ClothingItem.FantasyCrown, ClothingItem.FantasySteelHelmet] },
      { categoryKey: 'bags', items: [ClothingItem.FantasyAdventurerBelt, ClothingItem.FantasyPotionBelt] },
      { categoryKey: 'decorations', items: [ClothingItem.FantasyPlatePauldrons, ClothingItem.FantasyLeatherShoulderPads, ClothingItem.FantasyMagePauldrons] },
      { categoryKey: 'sets', items: [ClothingItem.FantasyKnightSet, ClothingItem.FantasyRogueSet, ClothingItem.FantasyWizardSet, ClothingItem.FantasyRangerSet, ClothingItem.FantasyKingSet] },
    ]
  },
  {
    themeKey: 'modern',
    categories: [
      { categoryKey: 'tops', items: [ClothingItem.ModernTShirt, ClothingItem.ModernShirt, ClothingItem.ModernHoodie, ClothingItem.ModernSuitJacket, ClothingItem.ModernDressTop, ClothingItem.ModernSlimfitJacket] },
      { categoryKey: 'outerwear', items: [ClothingItem.ModernJumperJacket, ClothingItem.ModernLongJumper, ClothingItem.ModernBlazer, ClothingItem.ModernLongCoat, ClothingItem.ModernHoodedJumper, ClothingItem.ModernCape] },
      { categoryKey: 'bottoms', items: [ClothingItem.ModernJeans, ClothingItem.ModernSlacks, ClothingItem.ModernSweatpants, ClothingItem.ModernShorts, ClothingItem.ModernSkirt, ClothingItem.ModernDressBottom, ClothingItem.ModernJoggerPants, ClothingItem.ModernHipHopPants, ClothingItem.ModernSkinnyJeans, ClothingItem.ModernSlimfitPants] },
      { categoryKey: 'footwear', items: [ClothingItem.ModernSneakers, ClothingItem.ModernDressShoes, ClothingItem.ModernSandals, ClothingItem.ModernBoots] },
      { categoryKey: 'gloves', items: [ClothingItem.ModernLeatherGloves, ClothingItem.ModernSportsGloves, ClothingItem.ModernKnitGloves] },
      { categoryKey: 'hats', items: [ClothingItem.ModernCap, ClothingItem.ModernBeanie, ClothingItem.ModernFedora, ClothingItem.ModernBucketHat, ClothingItem.ModernHelmet, ClothingItem.ModernMilitaryCap] },
      { categoryKey: 'bags', items: [ClothingItem.ModernBackpack, ClothingItem.ModernSlingBag, ClothingItem.ModernShoulderBag, ClothingItem.ModernToteBag] },
      { categoryKey: 'decorations', items: [ClothingItem.ModernWatch, ClothingItem.ModernNecklace, ClothingItem.ModernScarf, ClothingItem.ModernShoulderArmor, ClothingItem.ModernGauntlets] },
      { categoryKey: 'sets', items: [ClothingItem.ModernCasualSet, ClothingItem.ModernSuitSet, ClothingItem.ModernUniformSet, ClothingItem.ModernStreetwearSet, ClothingItem.ModernBikerSet, ClothingItem.ModernDetectiveSet] },
    ]
  }
];

export const CLOTHING_ITEM_TO_CATEGORY_MAP: Record<string, string> = {};
CLOTHING_THEMES.forEach(theme => {
    theme.categories.forEach(category => {
        category.items.forEach(item => {
            CLOTHING_ITEM_TO_CATEGORY_MAP[item] = category.categoryKey;
        });
    });
});


export type ObjectCategory = {
  categoryKey: 'weapons' | 'items' | 'defense' | 'creatures';
  items: ObjectItem[];
};

export type ObjectTheme = {
  themeKey: 'scifi' | 'modern' | 'fantasy';
  categories: ObjectCategory[];
};

const ALL_OBJECT_THEMES: ObjectTheme[] = [
  {
    themeKey: 'scifi',
    categories: [
      { categoryKey: 'weapons', items: [
        ObjectItem.SciFiWeaponPlasmaRifle, ObjectItem.SciFiWeaponLaserPistol, ObjectItem.SciFiWeaponEnergySword,
        ObjectItem.SciFiWeaponRailgun, ObjectItem.SciFiWeaponPulseCannon, ObjectItem.SciFiWeaponGaussRifle,
        ObjectItem.SciFiWeaponSonicPistol, ObjectItem.SciFiWeaponLaserKatana, ObjectItem.SciFiWeaponEMPGrenade,
        ObjectItem.SciFiWeaponSmartGrenade, ObjectItem.SciFiWeaponHeavyPlasmaCannon, ObjectItem.SciFiWeaponCryoGun,
        ObjectItem.SciFiWeaponParticleBeamRifle,
      ]},
      { categoryKey: 'items', items: [
        ObjectItem.SciFiItemMedibot, ObjectItem.SciFiItemHolographicProjector, ObjectItem.SciFiItemAntiGravityDevice,
        ObjectItem.SciFiItemPersonalDrone, ObjectItem.SciFiItemDataPad,
      ]},
      { categoryKey: 'defense', items: [
        ObjectItem.SciFiDefenseEnergyShield, ObjectItem.SciFiDefenseLightCompositeArmor, ObjectItem.SciFiDefenseExoFrame,
        ObjectItem.SciFiDefenseStealthCloak,
      ]},
      { categoryKey: 'creatures', items: [ // Changed from robots
        ObjectItem.SciFiRobotAndroid, ObjectItem.SciFiRobotSecurityDrone, ObjectItem.SciFiRobotAssaultMech,
        ObjectItem.SciFiRobotUtilityBot, ObjectItem.SciFiRobotCyberneticAnimal,
      ]},
    ]
  },
  {
    themeKey: 'fantasy',
    categories: [
        { categoryKey: 'weapons', items: [
            ObjectItem.FantasyWeaponLongsword, ObjectItem.FantasyWeaponBroadsword, ObjectItem.FantasyWeaponDagger,
            ObjectItem.FantasyWeaponBattleAxe, ObjectItem.FantasyWeaponWarhammer, ObjectItem.FantasyWeaponMace,
            ObjectItem.FantasyWeaponSpear, ObjectItem.FantasyWeaponLongbow, ObjectItem.FantasyWeaponCrossbow,
            ObjectItem.FantasyWeaponMagicStaff, ObjectItem.FantasyWeaponMagicWand,
        ]},
        { categoryKey: 'items', items: [
            ObjectItem.FantasyItemHealthPotion, ObjectItem.FantasyItemManaPotion, ObjectItem.FantasyItemSpellbook,
            ObjectItem.FantasyItemAncientScroll, ObjectItem.FantasyItemTreasureChest, ObjectItem.FantasyItemTorch,
        ]},
        { categoryKey: 'defense', items: [
            ObjectItem.FantasyDefenseKiteShield, ObjectItem.FantasyDefenseRoundShield, ObjectItem.FantasyDefenseTowerShield,
        ]},
        { categoryKey: 'creatures', items: [
            ObjectItem.FantasyCreatureDragon, ObjectItem.FantasyCreatureGoblin, ObjectItem.FantasyCreatureOrc,
            ObjectItem.FantasyCreatureGriffin, ObjectItem.FantasyCreatureUnicorn,
        ]},
    ]
  },
  {
    themeKey: 'modern',
    categories: [
      { categoryKey: 'weapons', items: [ObjectItem.ModernWeaponPistol, ObjectItem.ModernWeaponRifle, ObjectItem.ModernWeaponShotgun, ObjectItem.ModernWeaponKnife, ObjectItem.ModernWeaponBaseballBat, ObjectItem.ModernWeaponSubmachineGun, ObjectItem.ModernWeaponSniperRifle, ObjectItem.ModernWeaponRevolver, ObjectItem.ModernWeaponCombatKnife, ObjectItem.ModernWeaponKatana, ObjectItem.ModernWeaponSaber, ObjectItem.ModernWeaponLongsword, ObjectItem.ModernWeaponMachete] },
      { categoryKey: 'items', items: [ObjectItem.ModernItemSmartphone, ObjectItem.ModernItemLaptop, ObjectItem.ModernItemHeadphones, ObjectItem.ModernItemEnergyDrink, ObjectItem.ModernItemMedkit, ObjectItem.ModernItemDrone, ObjectItem.ModernItemCoffeeMug, ObjectItem.ModernItemBriefcase, ObjectItem.ModernItemLighter] },
      { categoryKey: 'defense', items: [ObjectItem.ModernDefenseKevlarVest, ObjectItem.ModernDefenseBallisticShield, ObjectItem.ModernDefenseRiotShield, ObjectItem.ModernDefenseTacticalHelmet] },
    ]
  }
];

export const OBJECT_THEMES: ObjectTheme[] = ALL_OBJECT_THEMES;

export const OBJECT_ITEM_TO_CATEGORY_MAP: Record<string, string> = {};
ALL_OBJECT_THEMES.forEach(theme => {
    theme.categories.forEach(category => {
        category.items.forEach(item => {
            OBJECT_ITEM_TO_CATEGORY_MAP[item] = category.categoryKey;
        });
    });
});

export const ACTION_POSES: ActionPose[] = [
  ActionPose.General,
  ActionPose.Attack,
  ActionPose.StandingModel,
];

export const APPLY_FULL_OUTFIT_BODY_PARTS: BodyPart[] = [
    BodyPart.Body, BodyPart.Pelvis, 
    BodyPart.LeftShoulder, BodyPart.RightShoulder, 
    BodyPart.LeftArm, BodyPart.RightArm,
    BodyPart.LeftHand, BodyPart.RightHand,
    BodyPart.LeftLeg, BodyPart.RightLeg,
    BodyPart.LeftFoot, BodyPart.RightFoot,
];

export const APPLY_TOP_BODY_PARTS: BodyPart[] = [
    BodyPart.Body, 
    BodyPart.LeftShoulder, BodyPart.RightShoulder, 
    BodyPart.LeftArm, BodyPart.RightArm,
    BodyPart.LeftHand, BodyPart.RightHand,
];

export const APPLY_BOTTOM_BODY_PARTS: BodyPart[] = [
    BodyPart.Pelvis,
    BodyPart.LeftLeg, BodyPart.RightLeg,
    BodyPart.LeftFoot, BodyPart.RightFoot,
];


export const BANANANG_MEDIA_MIME_TYPE = 'application/x-bananang-media-id';

const ALL_BODY_PARTS_FOR_SET = [BodyPart.Body, BodyPart.Pelvis, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftHand, BodyPart.RightHand, BodyPart.LeftLeg, BodyPart.RightLeg, BodyPart.LeftFoot, BodyPart.RightFoot];
const ALL_BODY_PARTS_FOR_COAT = [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg];


export const CLOTHING_TO_BODY_PARTS_MAP: Record<ClothingItem, BodyPart[]> = {
  // Modern
  [ClothingItem.ModernTShirt]: [BodyPart.Body],
  [ClothingItem.ModernShirt]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm],
  [ClothingItem.ModernHoodie]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.ModernSuitJacket]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernDressTop]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernSlimfitJacket]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernJumperJacket]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernLongJumper]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernBlazer]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernLongCoat]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernHoodedJumper]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.ModernJeans]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernSlacks]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernSweatpants]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernShorts]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernSkirt]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernDressBottom]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernJoggerPants]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernHipHopPants]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernSkinnyJeans]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernSlimfitPants]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.ModernSneakers]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.ModernDressShoes]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.ModernSandals]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.ModernBoots]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.ModernLeatherGloves]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.ModernSportsGloves]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.ModernKnitGloves]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.ModernCap]: [BodyPart.Hair],
  [ClothingItem.ModernBeanie]: [BodyPart.Hair],
  [ClothingItem.ModernFedora]: [BodyPart.Hair],
  [ClothingItem.ModernBucketHat]: [BodyPart.Hair],
  [ClothingItem.ModernHelmet]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.ModernMilitaryCap]: [BodyPart.Hair],
  [ClothingItem.ModernBackpack]: [],
  [ClothingItem.ModernSlingBag]: [],
  [ClothingItem.ModernShoulderBag]: [],
  [ClothingItem.ModernToteBag]: [],
  [ClothingItem.ModernWatch]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.ModernNecklace]: [BodyPart.Body],
  [ClothingItem.ModernScarf]: [BodyPart.Body],
  [ClothingItem.ModernShoulderArmor]: [BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernGauntlets]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.ModernCape]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.ModernCasualSet]: ALL_BODY_PARTS_FOR_SET,
  [ClothingItem.ModernSuitSet]: ALL_BODY_PARTS_FOR_SET,
  [ClothingItem.ModernUniformSet]: ALL_BODY_PARTS_FOR_SET,
  [ClothingItem.ModernStreetwearSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Hair],
  [ClothingItem.ModernBikerSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.ModernDetectiveSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Hair],

  // Sci-Fi
  [ClothingItem.SciFiCyberneticJacket]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.SciFiHolographicTop]: [BodyPart.Body],
  [ClothingItem.SciFiLightArmorChest]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.SciFiBioSuitTop]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.SciFiSpaceSuitTorso]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiNeonTrenchcoat]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiArmoredPants]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiEnergyLeggings]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiZeroGravityTrousers]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiCyberpunkSkirt]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiBioSuitBottom]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiExoskeletonLegs]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg, BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.SciFiMagneticBoots]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.SciFiHoverBoots]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.SciFiCyberneticGreaves]: [BodyPart.LeftFoot, BodyPart.RightFoot, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.SciFiEnergySandals]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.SciFiLightweightPlatingBoots]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.SciFiDataGloves]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.SciFiPowerGauntlets]: [BodyPart.LeftHand, BodyPart.RightHand, BodyPart.LeftArm, BodyPart.RightArm],
  [ClothingItem.SciFiNanoGloves]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.SciFiRoboticHands]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.SciFiCyberneticForearms]: [BodyPart.LeftHand, BodyPart.RightHand, BodyPart.LeftArm, BodyPart.RightArm],
  [ClothingItem.SciFiVisorHelmet]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiNeuroLinkHeadset]: [BodyPart.Hair],
  [ClothingItem.SciFiHolographicHood]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiBreathingMask]: [BodyPart.Face],
  [ClothingItem.SciFiCombatHelmet]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiDataVisor]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiGravityPouch]: [BodyPart.Pelvis],
  [ClothingItem.SciFiTechBackpack]: [],
  [ClothingItem.SciFiEnergyCellHolster]: [BodyPart.Pelvis],
  [ClothingItem.SciFiUtilityBelt]: [BodyPart.Pelvis],
  [ClothingItem.SciFiShoulderMountedDrone]: [],
  [ClothingItem.SciFiFloatingPauldrons]: [BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.SciFiEnergyShieldEmitter]: [BodyPart.Body],
  [ClothingItem.SciFiPlasmaCables]: [BodyPart.Body, BodyPart.Pelvis],
  [ClothingItem.SciFiPilotSuitSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiCyborgEnforcerSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiExplorerSuitSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.SciFiStealthOpsSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],

  // Medieval Fantasy
  [ClothingItem.FantasyChainmailCoif]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.FantasyLeatherHood]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.FantasyCirclet]: [BodyPart.Hair],
  [ClothingItem.FantasyCrown]: [BodyPart.Hair],
  [ClothingItem.FantasySteelHelmet]: [BodyPart.Face, BodyPart.Hair],
  [ClothingItem.FantasyPlateArmorChest]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyLeatherJerkin]: [BodyPart.Body],
  [ClothingItem.FantasyMageRobesTop]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm],
  [ClothingItem.FantasyChainmailShirt]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm],
  [ClothingItem.FantasyTunic]: [BodyPart.Body, BodyPart.Pelvis],
  [ClothingItem.FantasyElvenRobe]: [BodyPart.Body, BodyPart.LeftArm, BodyPart.RightArm, BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.FantasyDwarvenArmor]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder, BodyPart.Pelvis],
  [ClothingItem.FantasyPlatePauldrons]: [BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyLeatherShoulderPads]: [BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyMagePauldrons]: [BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyFurMantle]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyPlateGauntlets]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.FantasyLeatherBracers]: [BodyPart.LeftArm, BodyPart.RightArm],
  [ClothingItem.FantasyMageGloves]: [BodyPart.LeftHand, BodyPart.RightHand],
  [ClothingItem.FantasyPlateGreaves]: [BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.FantasyLeatherPants]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.FantasyMageRobesBottom]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.FantasyChainmailLeggings]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.FantasyTrousers]: [BodyPart.Pelvis, BodyPart.LeftLeg, BodyPart.RightLeg],
  [ClothingItem.FantasyKilt]: [BodyPart.Pelvis],
  [ClothingItem.FantasyPlateSabatons]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.FantasyLeatherBoots]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.FantasyMageSandals]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.FantasyElvenBoots]: [BodyPart.LeftFoot, BodyPart.RightFoot],
  [ClothingItem.FantasyTravelersCloak]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyRoyalCape]: [BodyPart.Body, BodyPart.LeftShoulder, BodyPart.RightShoulder],
  [ClothingItem.FantasyAdventurerBelt]: [BodyPart.Pelvis],
  [ClothingItem.FantasyPotionBelt]: [BodyPart.Pelvis],
  [ClothingItem.FantasyKnightSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.FantasyRogueSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Face, BodyPart.Hair],
  [ClothingItem.FantasyWizardSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Hair],
  [ClothingItem.FantasyRangerSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Hair],
  [ClothingItem.FantasyKingSet]: [...ALL_BODY_PARTS_FOR_SET, BodyPart.Hair],
};

export const ROLE_COLORS: Record<Exclude<BoardImage['role'], 'none' | 'reference'>, string> = {
  original: '#22c55e', // green-500
  background: '#a855f7', // purple-500
  pose: '#f59e0b', // amber-500
};

export const COLOR_PALETTES: PaletteCategory[] = [
    {
        category: 'mood',
        subCategories: [
            {
                name: 'Warm',
                translationKey: 'colorPalette.subCategory.warm',
                palettes: [
                    { name: 'Sunset Glow', colors: ['#FFC371', '#FF5F6D', '#CB356B', '#BD3F32'] },
                    { name: 'Autumn Fire', colors: ['#E29587', '#D65DB1', '#845EC2', '#FF6F91'] },
                    { name: 'Cozy Evening', colors: ['#D6A35D', '#BF6D3B', '#8C3D2B', '#5A2A27'] },
                ],
            },
            {
                name: 'Cool',
                translationKey: 'colorPalette.subCategory.cool',
                palettes: [
                    { name: 'Ocean Breeze', colors: ['#A0E7E5', '#B4F8C8', '#FBE7C6', '#87CEEB'] },
                    { name: 'Misty Forest', colors: ['#C7D3BF', '#73A580', '#4A7856', '#3B3C36'] },
                    { name: 'Winter Night', colors: ['#2C3E50', '#3498DB', '#ECF0F1', '#95A5A6'] },
                ],
            },
            {
                name: 'Vibrant',
                translationKey: 'colorPalette.subCategory.vibrant',
                palettes: [
                    { name: 'Neon City', colors: ['#F90093', '#00F0B5', '#009FFD', '#FFFF00'] },
                    { name: 'Tropical Punch', colors: ['#FF4E50', '#F9D423', '#FC913A', '#FF7F50'] },
                    { name: 'Electric Dreams', colors: ['#8E2DE2', '#4A00E0', '#FF0084', '#00F2FE'] },
                ],
            },
            {
                name: 'Pastel',
                translationKey: 'colorPalette.subCategory.pastel',
                palettes: [
                    { name: 'Candy Floss', colors: ['#A7E6FF', '#E4C1F9', '#FFD1DC', '#FFF3E1'] },
                    { name: 'Mint Sorbet', colors: ['#D4F0C4', '#A1E2B5', '#86D2C1', '#C8F7C5'] },
                    { name: 'Dreamy Peach', colors: ['#FFDFD3', '#FFB6B9', '#FAE3D9', '#FFDAB9'] },
                ],
            },
            {
                name: 'Dark',
                translationKey: 'colorPalette.subCategory.dark',
                palettes: [
                    { name: 'Royal Velvet', colors: ['#4B0082', '#800080', '#DA70D6', '#483D8B'] },
                    { name: 'Deep Space', colors: ['#0F2027', '#203A43', '#2C5364', '#5F6769'] },
                    { name: 'Midnight Oil', colors: ['#1E2749', '#374B74', '#556F9E', '#000000'] },
                ],
            },
            {
                name: 'Monochrome',
                translationKey: 'colorPalette.subCategory.monochrome',
                palettes: [
                    { name: 'Grayscale', colors: ['#FFFFFF', '#B0B0B0', '#5E5E5E', '#000000'] },
                    { name: 'Sepia', colors: ['#FBF0D9', '#D9B89C', '#704214', '#4A2B0E'] },
                    { name: 'Blue Tones', colors: ['#A1C4FD', '#6D9EEB', '#2A62B0', '#003366'] },
                ],
            },
        ],
    },
    {
        category: 'weather',
        subCategories: [
            {
                name: 'Sunny',
                translationKey: 'colorPalette.subCategory.sunny',
                palettes: [
                    { name: 'Golden Hour', colors: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347'] },
                    { name: 'Summer Sky', colors: ['#87CEEB', '#FFFFFF', '#F0E68C', '#ADD8E6'] },
                ],
            },
            {
                name: 'Cloudy',
                translationKey: 'colorPalette.subCategory.cloudy',
                palettes: [
                    { name: 'Overcast', colors: ['#DCDCDC', '#C0C0C0', '#A9A9A9', '#808080'] },
                    { name: 'Stormy Gray', colors: ['#4F5B66', '#343F4B', '#222831', '#778899'] },
                ],
            },
            {
                name: 'Rainy',
                translationKey: 'colorPalette.subCategory.rainy',
                palettes: [
                    { name: 'After the Rain', colors: ['#A2B5CD', '#6495ED', '#4682B4', '#5F9EA0'] },
                    { name: 'Petrichor', colors: ['#6B8E23', '#556B2F', '#8FBC8F', '#2E4638'] },
                ],
            },
            {
                name: 'Snowy',
                translationKey: 'colorPalette.subCategory.snowy',
                palettes: [
                    { name: 'Fresh Snow', colors: ['#FFFFFF', '#F0F8FF', '#E6E6FA', '#F5F5F5'] },
                    { name: 'Icy Blue', colors: ['#B0E0E6', '#ADD8E6', '#87CEFA', '#F0FFFF'] },
                ],
            },
        ],
    },
    {
        category: 'concept',
        subCategories: [
            {
                name: 'Nature',
                translationKey: 'colorPalette.subCategory.nature',
                palettes: [
                    { name: 'Forest Floor', colors: ['#556B2F', '#8B4513', '#228B22', '#006400'] },
                    { name: 'Desert Sands', colors: ['#F4A460', '#D2B48C', '#CD853F', '#8B4513'] },
                ],
            },
            {
                name: 'Urban',
                translationKey: 'colorPalette.subCategory.urban',
                palettes: [
                    { name: 'City at Night', colors: ['#191970', '#FFD700', '#C0C0C0', '#4A4A4A'] },
                    { name: 'Concrete Jungle', colors: ['#696969', '#808080', '#A9A9A9', '#BEBEBE'] },
                ],
            },
            {
                name: 'Fantasy',
                translationKey: 'colorPalette.subCategory.fantasy',
                palettes: [
                    { name: 'Enchanted Forest', colors: ['#2E8B57', '#9370DB', '#DAA520', '#483D8B'] },
                    { name: 'Dragon\'s Hoard', colors: ['#FFD700', '#B22222', '#8B0000', '#451818'] },
                ],
            },
            {
                name: 'Sci-Fi',
                translationKey: 'colorPalette.subCategory.sciFi',
                palettes: [
                    { name: 'Cyberpunk', colors: ['#00FFFF', '#FF00FF', '#FFFF00', '#0000FF'] },
                    { name: 'Starship Hull', colors: ['#C0C0C0', '#4682B4', '#1E90FF', '#1C2833'] },
                ],
            },
        ],
    },
];
