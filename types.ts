// FIX: Removed incorrect import of CameraAngle from '@google/genai'. The enum is defined locally in this file.
// import { CameraAngle } from "@google/genai";

// FIX: Define and export the CameraAngle enum locally as it was missing.
export enum CameraAngle {
  Front = 'Front',
  FrontLeft = 'FrontLeft',
  FrontRight = 'FrontRight',
  Left = 'Left',
  Right = 'Right',
  Back = 'Back',
  BackLeft = 'BackLeft',
  BackRight = 'BackRight',
}

export enum CameraSize {
  Full = 'Full',
}

export type SelectedView = {
  yaw: number; // Horizontal rotation in degrees
  pitch: number; // Vertical rotation in degrees
  fov: number; // Field of view
  size: CameraSize;
}

export enum BodyPart {
  Face = 'Face',
  Hair = 'Hair',
  Body = 'Body',
  LeftShoulder = 'LeftShoulder',
  RightShoulder = 'RightShoulder',
  LeftArm = 'LeftArm',
  RightArm = 'RightArm',
  BothArms = 'BothArms',
  Pelvis = 'Pelvis',
  LeftLeg = 'LeftLeg',
  RightLeg = 'RightLeg',
  BothLegs = 'BothLegs',
  LeftHand = 'LeftHand',
  RightHand = 'RightHand',
  BothHands = 'BothHands',
  LeftFoot = 'LeftFoot',
  RightFoot = 'RightFoot',
  BothFeet = 'BothFeet',
}

export enum ClothingItem {
  // Modern
  ModernTShirt = 'ModernTShirt',
  ModernShirt = 'ModernShirt',
  ModernHoodie = 'ModernHoodie',
  ModernSuitJacket = 'ModernSuitJacket',
  ModernDressTop = 'ModernDressTop',
  ModernSlimfitJacket = 'ModernSlimfitJacket',
  ModernJumperJacket = 'ModernJumperJacket',
  ModernLongJumper = 'ModernLongJumper',
  ModernBlazer = 'ModernBlazer',
  ModernLongCoat = 'ModernLongCoat',
  ModernHoodedJumper = 'ModernHoodedJumper',
  ModernJeans = 'ModernJeans',
  ModernSlacks = 'ModernSlacks',
  ModernSweatpants = 'ModernSweatpants',
  ModernShorts = 'ModernShorts',
  ModernSkirt = 'ModernSkirt',
  ModernDressBottom = 'ModernDressBottom',
  ModernJoggerPants = 'ModernJoggerPants',
  ModernHipHopPants = 'ModernHipHopPants',
  ModernSkinnyJeans = 'ModernSkinnyJeans',
  ModernSlimfitPants = 'ModernSlimfitPants',
  ModernSneakers = 'ModernSneakers',
  ModernDressShoes = 'ModernDressShoes',
  ModernSandals = 'ModernSandals',
  ModernBoots = 'ModernBoots',
  ModernLeatherGloves = 'ModernLeatherGloves',
  ModernSportsGloves = 'ModernSportsGloves',
  ModernKnitGloves = 'ModernKnitGloves',
  ModernCap = 'ModernCap',
  ModernBeanie = 'ModernBeanie',
  ModernFedora = 'ModernFedora',
  ModernBucketHat = 'ModernBucketHat',
  ModernHelmet = 'ModernHelmet',
  ModernMilitaryCap = 'ModernMilitaryCap',
  ModernBackpack = 'ModernBackpack',
  ModernSlingBag = 'ModernSlingBag',
  ModernShoulderBag = 'ModernShoulderBag',
  ModernToteBag = 'ModernToteBag',
  ModernWatch = 'ModernWatch',
  ModernNecklace = 'ModernNecklace',
  ModernScarf = 'ModernScarf',
  ModernShoulderArmor = 'ModernShoulderArmor',
  ModernGauntlets = 'ModernGauntlets',
  ModernCape = 'ModernCape',
  ModernCasualSet = 'ModernCasualSet',
  ModernSuitSet = 'ModernSuitSet',
  ModernUniformSet = 'ModernUniformSet',
  ModernStreetwearSet = 'ModernStreetwearSet',
  ModernBikerSet = 'ModernBikerSet',
  ModernDetectiveSet = 'ModernDetectiveSet',

  // Sci-Fi
  SciFiCyberneticJacket = 'SciFiCyberneticJacket',
  SciFiHolographicTop = 'SciFiHolographicTop',
  SciFiLightArmorChest = 'SciFiLightArmorChest',
  SciFiBioSuitTop = 'SciFiBioSuitTop',
  SciFiSpaceSuitTorso = 'SciFiSpaceSuitTorso',
  SciFiNeonTrenchcoat = 'SciFiNeonTrenchcoat',
  SciFiArmoredPants = 'SciFiArmoredPants',
  SciFiEnergyLeggings = 'SciFiEnergyLeggings',
  SciFiZeroGravityTrousers = 'SciFiZeroGravityTrousers',
  SciFiCyberpunkSkirt = 'SciFiCyberpunkSkirt',
  SciFiBioSuitBottom = 'SciFiBioSuitBottom',
  SciFiExoskeletonLegs = 'SciFiExoskeletonLegs',
  SciFiMagneticBoots = 'SciFiMagneticBoots',
  SciFiHoverBoots = 'SciFiHoverBoots',
  SciFiCyberneticGreaves = 'SciFiCyberneticGreaves',
  SciFiEnergySandals = 'SciFiEnergySandals',
  SciFiLightweightPlatingBoots = 'SciFiLightweightPlatingBoots',
  SciFiDataGloves = 'SciFiDataGloves',
  SciFiPowerGauntlets = 'SciFiPowerGauntlets',
  SciFiNanoGloves = 'SciFiNanoGloves',
  SciFiRoboticHands = 'SciFiRoboticHands',
  SciFiCyberneticForearms = 'SciFiCyberneticForearms',
  SciFiVisorHelmet = 'SciFiVisorHelmet',
  SciFiNeuroLinkHeadset = 'SciFiNeuroLinkHeadset',
  SciFiHolographicHood = 'SciFiHolographicHood',
  SciFiBreathingMask = 'SciFiBreathingMask',
  SciFiCombatHelmet = 'SciFiCombatHelmet',
  SciFiDataVisor = 'SciFiDataVisor',
  SciFiGravityPouch = 'SciFiGravityPouch',
  SciFiTechBackpack = 'SciFiTechBackpack',
  SciFiEnergyCellHolster = 'SciFiEnergyCellHolster',
  SciFiUtilityBelt = 'SciFiUtilityBelt',
  SciFiShoulderMountedDrone = 'SciFiShoulderMountedDrone',
  SciFiFloatingPauldrons = 'SciFiFloatingPauldrons',
  SciFiEnergyShieldEmitter = 'SciFiEnergyShieldEmitter',
  SciFiPlasmaCables = 'SciFiPlasmaCables',
  SciFiPilotSuitSet = 'SciFiPilotSuitSet',
  SciFiCyborgEnforcerSet = 'SciFiCyborgEnforcerSet',
  SciFiExplorerSuitSet = 'SciFiExplorerSuitSet',
  SciFiStealthOpsSet = 'SciFiStealthOpsSet',

  // Medieval Fantasy
  FantasyChainmailCoif = 'FantasyChainmailCoif',
  FantasyLeatherHood = 'FantasyLeatherHood',
  FantasyCirclet = 'FantasyCirclet',
  FantasyCrown = 'FantasyCrown',
  FantasySteelHelmet = 'FantasySteelHelmet',
  FantasyPlateArmorChest = 'FantasyPlateArmorChest',
  FantasyLeatherJerkin = 'FantasyLeatherJerkin',
  FantasyMageRobesTop = 'FantasyMageRobesTop',
  FantasyChainmailShirt = 'FantasyChainmailShirt',
  FantasyTunic = 'FantasyTunic',
  FantasyElvenRobe = 'FantasyElvenRobe',
  FantasyDwarvenArmor = 'FantasyDwarvenArmor',
  FantasyPlatePauldrons = 'FantasyPlatePauldrons',
  FantasyLeatherShoulderPads = 'FantasyLeatherShoulderPads',
  FantasyMagePauldrons = 'FantasyMagePauldrons',
  FantasyFurMantle = 'FantasyFurMantle',
  FantasyPlateGauntlets = 'FantasyPlateGauntlets',
  FantasyLeatherBracers = 'FantasyLeatherBracers',
  FantasyMageGloves = 'FantasyMageGloves',
  FantasyPlateGreaves = 'FantasyPlateGreaves',
  FantasyLeatherPants = 'FantasyLeatherPants',
  FantasyMageRobesBottom = 'FantasyMageRobesBottom',
  FantasyChainmailLeggings = 'FantasyChainmailLeggings',
  FantasyTrousers = 'FantasyTrousers',
  FantasyKilt = 'FantasyKilt',
  FantasyPlateSabatons = 'FantasyPlateSabatons',
  FantasyLeatherBoots = 'FantasyLeatherBoots',
  FantasyMageSandals = 'FantasyMageSandals',
  FantasyElvenBoots = 'FantasyElvenBoots',
  FantasyTravelersCloak = 'FantasyTravelersCloak',
  FantasyRoyalCape = 'FantasyRoyalCape',
  FantasyAdventurerBelt = 'FantasyAdventurerBelt',
  FantasyPotionBelt = 'FantasyPotionBelt',
  FantasyKnightSet = 'FantasyKnightSet',
  FantasyRogueSet = 'FantasyRogueSet',
  FantasyWizardSet = 'FantasyWizardSet',
  FantasyRangerSet = 'FantasyRangerSet',
  FantasyKingSet = 'FantasyKingSet',
}

export enum ObjectItem {
  // Modern Weapons
  ModernWeaponPistol = 'ModernWeaponPistol',
  ModernWeaponRifle = 'ModernWeaponRifle',
  ModernWeaponShotgun = 'ModernWeaponShotgun',
  ModernWeaponKnife = 'ModernWeaponKnife',
  ModernWeaponBaseballBat = 'ModernWeaponBaseballBat',
  ModernWeaponSubmachineGun = 'ModernWeaponSubmachineGun',
  ModernWeaponSniperRifle = 'ModernWeaponSniperRifle',
  ModernWeaponRevolver = 'ModernWeaponRevolver',
  ModernWeaponCombatKnife = 'ModernWeaponCombatKnife',
  ModernWeaponKatana = 'ModernWeaponKatana',
  ModernWeaponSaber = 'ModernWeaponSaber',
  ModernWeaponLongsword = 'ModernWeaponLongsword',
  ModernWeaponMachete = 'ModernWeaponMachete',
  // Modern Items
  ModernItemSmartphone = 'ModernItemSmartphone',
  ModernItemLaptop = 'ModernItemLaptop',
  ModernItemHeadphones = 'ModernItemHeadphones',
  ModernItemEnergyDrink = 'ModernItemEnergyDrink',
  ModernItemMedkit = 'ModernItemMedkit',
  ModernItemDrone = 'ModernItemDrone',
  ModernItemCoffeeMug = 'ModernItemCoffeeMug',
  ModernItemBriefcase = 'ModernItemBriefcase',
  ModernItemLighter = 'ModernItemLighter',
  // Modern Defense
  ModernDefenseKevlarVest = 'ModernDefenseKevlarVest',
  ModernDefenseBallisticShield = 'ModernDefenseBallisticShield',
  ModernDefenseRiotShield = 'ModernDefenseRiotShield',
  ModernDefenseTacticalHelmet = 'ModernDefenseTacticalHelmet',

  // Sci-Fi Weapons
  SciFiWeaponPlasmaRifle = 'SciFiWeaponPlasmaRifle',
  SciFiWeaponLaserPistol = 'SciFiWeaponLaserPistol',
  SciFiWeaponEnergySword = 'SciFiWeaponEnergySword',
  SciFiWeaponRailgun = 'SciFiWeaponRailgun',
  SciFiWeaponPulseCannon = 'SciFiWeaponPulseCannon',
  SciFiWeaponGaussRifle = 'SciFiWeaponGaussRifle',
  SciFiWeaponSonicPistol = 'SciFiWeaponSonicPistol',
  SciFiWeaponLaserKatana = 'SciFiWeaponLaserKatana',
  SciFiWeaponEMPGrenade = 'SciFiWeaponEMPGrenade',
  SciFiWeaponSmartGrenade = 'SciFiWeaponSmartGrenade',
  SciFiWeaponHeavyPlasmaCannon = 'SciFiWeaponHeavyPlasmaCannon',
  SciFiWeaponCryoGun = 'SciFiWeaponCryoGun',
  SciFiWeaponParticleBeamRifle = 'SciFiWeaponParticleBeamRifle',
  // Sci-Fi Items
  SciFiItemMedibot = 'SciFiItemMedibot',
  SciFiItemHolographicProjector = 'SciFiItemHolographicProjector',
  SciFiItemAntiGravityDevice = 'SciFiItemAntiGravityDevice',
  SciFiItemPersonalDrone = 'SciFiItemPersonalDrone',
  SciFiItemDataPad = 'SciFiItemDataPad',
  // Sci-Fi Defense
  SciFiDefenseEnergyShield = 'SciFiDefenseEnergyShield',
  SciFiDefenseLightCompositeArmor = 'SciFiDefenseLightCompositeArmor',
  SciFiDefenseExoFrame = 'SciFiDefenseExoFrame',
  SciFiDefenseStealthCloak = 'SciFiDefenseStealthCloak',
  // Sci-Fi Robots
  SciFiRobotAndroid = 'SciFiRobotAndroid',
  SciFiRobotSecurityDrone = 'SciFiRobotSecurityDrone',
  SciFiRobotAssaultMech = 'SciFiRobotAssaultMech',
  SciFiRobotUtilityBot = 'SciFiRobotUtilityBot',
  SciFiRobotCyberneticAnimal = 'SciFiRobotCyberneticAnimal',
  
  // Medieval Fantasy Weapons
  FantasyWeaponLongsword = 'FantasyWeaponLongsword',
  FantasyWeaponBroadsword = 'FantasyWeaponBroadsword',
  FantasyWeaponDagger = 'FantasyWeaponDagger',
  FantasyWeaponBattleAxe = 'FantasyWeaponBattleAxe',
  FantasyWeaponWarhammer = 'FantasyWeaponWarhammer',
  FantasyWeaponMace = 'FantasyWeaponMace',
  FantasyWeaponSpear = 'FantasyWeaponSpear',
  FantasyWeaponLongbow = 'FantasyWeaponLongbow',
  FantasyWeaponCrossbow = 'FantasyWeaponCrossbow',
  FantasyWeaponMagicStaff = 'FantasyWeaponMagicStaff',
  FantasyWeaponMagicWand = 'FantasyWeaponMagicWand',
  // Medieval Fantasy Defense
  FantasyDefenseKiteShield = 'FantasyDefenseKiteShield',
  FantasyDefenseRoundShield = 'FantasyDefenseRoundShield',
  FantasyDefenseTowerShield = 'FantasyDefenseTowerShield',
  // Medieval Fantasy Items
  FantasyItemHealthPotion = 'FantasyItemHealthPotion',
  FantasyItemManaPotion = 'FantasyItemManaPotion',
  FantasyItemSpellbook = 'FantasyItemSpellbook',
  FantasyItemAncientScroll = 'FantasyItemAncientScroll',
  FantasyItemTreasureChest = 'FantasyItemTreasureChest',
  FantasyItemTorch = 'FantasyItemTorch',
  // Medieval Fantasy Creatures
  FantasyCreatureDragon = 'FantasyCreatureDragon',
  FantasyCreatureGoblin = 'FantasyCreatureGoblin',
  FantasyCreatureOrc = 'FantasyCreatureOrc',
  FantasyCreatureGriffin = 'FantasyCreatureGriffin',
  FantasyCreatureUnicorn = 'FantasyCreatureUnicorn',
}

export interface GenerationParams {
  customPrompt: string;
  bodyPartReferenceMap: Partial<Record<BodyPart, number>>;
  selectedClothingItems: ClothingItem[];
  selectedObjectItems: ObjectItem[];
  selectedActionPose: ActionPose | null;
}

export interface GeneratedMedia {
  id: string;
  type: 'image' | 'video';
  src: string;
  // Fields below are image-specific
  view: SelectedView | null;
  generationParams?: GenerationParams;
}

// FIX: Add GenerationBatch interface to resolve import errors in App.tsx and useImageGeneration.ts.
export interface GenerationBatch {
  id: string;
  timestamp: Date;
  media: GeneratedMedia[];
}

export enum ActionPose {
  General = 'General',
  Attack = 'Attack',
  StandingModel = 'StandingModel',
}

export type ColorPalette = {
  name: string;
  colors: string[];
};

// FIX: Add PaletteSubCategory and PaletteCategory types to resolve import error in constants.ts.
export type PaletteSubCategory = {
  name: string;
  translationKey: string;
  palettes: ColorPalette[];
};

export type PaletteCategory = {
  category: 'mood' | 'weather' | 'concept';
  subCategories: PaletteSubCategory[];
};

export interface GenerationTask {
    id: string;
    taskType: 'image';
    originalImage: File | null;
    customPrompt: string;
    textureImages: { file: File, maskFile: File | null }[];
    backgroundImage: File | null;
    backgroundImageAspectRatio: string | null;
    poseControlImage: File | null;
    cameraView: SelectedView | null;
    bodyPartReferenceMap: Partial<Record<BodyPart, number>>;
    selectedClothingItems: ClothingItem[];
    selectedObjectItems: ObjectItem[];
    selectedActionPose: ActionPose | null;
    useAposeForViews: boolean;
    isApplyingFullOutfit: boolean;
    isApplyingTop: boolean;
    isApplyingBottom: boolean;
    lightDirection: { yaw: number; pitch: number; } | null;
    lightIntensity: number | null;
    maskImage: File | null;
    selectedPalette: ColorPalette | null;
    numPaletteColors: number;
    isAutoColorizeSketch: boolean;
}

export interface MonthlyCredit {
    current: number;
    total: number;
    month: string;
}

export interface BoardGroup {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  imageIds: string[];
  zIndex: number;
}

export interface BoardImage {
  id: string;
  src: string;
  file: File;
  x: number;
  y: number;
  width: number;
  height: number;
  role: 'none' | 'original' | 'background' | 'reference' | 'pose';
  refIndex?: number;
  zIndex: number;
  groupId?: string;
  maskFile?: File;
  maskSrc?: string;
  // FIX: Add missing 'generationParams' property to align with src/types.ts
  generationParams?: GenerationParams;
}

export type UsagePlan = 'free' | 'paid';
// FIX: Add camera model name for image editing tasks
// FIX: Removed deprecated 'gemini-2.5-flash-image-preview' model name to align with current guidelines.
export type ModelName = 'gemini-2.5-flash-image';

export interface PromptItem {
  id: string;
  name: string;
  prompt: string;
}

export interface PromptFolder {
  id: string;
  name: string;
  presets: PromptItem[];
  // FIX: Add optional showInQuickBar property to fix type errors
  showInQuickBar?: boolean;
}