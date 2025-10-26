import { BodyPart, CameraAngle, ClothingItem, ActionPose, ObjectItem } from "./types";

export type Language = 'ko';

// FIX: Expanded TranslationKey type to include all keys used throughout the application.
export type TranslationKey =
  | 'appTitle'
  | 'appDescription'
  | 'error.title'
  | 'error.pasteImage'
  | 'uploader.clickToUpload'
  | 'uploader.orDragAndDrop'
  | 'removeImage'
  | 'tooltip.previousImage'
  | 'tooltip.nextImage'
  | 'tooltip.downloadImage'
  | 'tooltip.downloadMp4'
  | 'tooltip.downloadGif'
  | 'tooltip.downloadAgain'
  | 'close'
  | 'viewer.zoomHint'
  | 'deselectAll'
  | 'deselect'
  | 'error.apiKeyMissing'
  | 'error.apiKeyInvalid'
  | 'error.noOriginalImage'
  | 'error.noOptionsSelected'
  | 'error.modificationRequiresReference'
  | 'error.cancelled'
  | 'error.permissionDenied'
  | 'error.fsApiNotSupported'
  | 'error.directorySelectFailed'
  | 'error.saveFailed'
  | 'error.translationFailed'
  | 'error.poseAnalysisFailed'
  | 'error.modelNameMissing'
  | 'error.quotaExceeded'
  | 'error.loadWorkspaceFailed'
  | 'error.saveWorkspaceFailed'
  | 'applyFullOutfit'
  | 'applyTop'
  | 'applyBottom'
  | 'clearSelection'
  | 'resetAll'
  | 'tooltip.resetAll'
  | 'section.original.title'
  | 'tooltip.section.original'
  | 'section.original.image'
  | 'tooltip.uploadOriginal'
  | 'section.original.referenceImage.title'
  | 'tooltip.uploadReference'
  | 'section.original.referenceImage.image'
  | 'section.generationOptions.fov.title'
  | 'section.cameraView.title'
  | 'tooltip.section.cameraView'
  | 'section.generationOptions.cameraView.title'
  | 'tooltip.aPose'
  | 'aPose'
  | 'tooltip.uploadBackground'
  | 'section.backgroundImage.title'
  | 'section.backgroundImage.image'
  | 'section.conceptDesign.title'
  | 'tooltip.section.conceptDesign'
  | 'section.bodyPartSelection.title'
  | 'tooltip.bodyPartConcept'
  | 'tooltip.uploadReferenceFirst'
  | 'tooltip.applyFullOutfit'
  | 'tooltip.applyTop'
  | 'tooltip.applyBottom'
  | 'tooltip.poseControl'
  | 'section.poseControl.title'
  | 'tooltip.deselectPose'
  | 'section.poseControl.image'
  | 'tooltip.poseOptionsDisabled'
  | 'section.actionPose.title'
  | 'tooltip.section.clothing'
  | 'section.generationOptions.modification.clothing.title'
  | 'tooltip.clearClothing'
  | 'tooltip.clothingTheme'
  | 'theme.scifi'
  | 'theme.modern'
  // FIX: Changed 'theme.techwear' to 'theme.fantasy' to match application data and fix type error.
  | 'theme.fantasy'
  | 'tooltip.clothingCategory'
  | `clothingCategory.${'tops' | 'bottoms' | 'footwear' | 'gloves' | 'hats' | 'bags' | 'decorations' | 'sets' | 'outerwear'}`
  | 'tooltip.objectTheme'
  | 'tooltip.objectCategory'
  // FIX: Changed 'robots' to 'creatures' in object categories to align with application data.
  | `objectCategory.${'weapons' | 'items' | 'defense' | 'creatures'}`
  | 'subTab.clothingConcept'
  | 'subTab.itemConcept'
  | 'tooltip.subTabClothing'
  | 'tooltip.subTabItem'
  | 'poseAnalysis.analyzing'
  | 'queue.title'
  | 'queue.cancelAll'
  | 'queue.processing'
  | 'queue.cancel'
  | 'queue.addToQueue'
  | 'generateButton'
  | 'taskSummary.imagePose'
  | 'taskSummary.imageConcept'
  | 'taskSummary.imageViews'
  | 'taskSummary.imageEdit'
  | 'header.manageUsagePlan'
  | 'tooltip.header.manageUsagePlan'
  | 'tooltip.monthlyCreditProgressBar'
  | 'tooltip.creditAdjustment'
  | 'creditAdjustment.usedAmount'
  | 'creditAdjustment.updateButton'
  | 'section.history.title'
  | 'tooltip.unsetSaveDirectory'
  | 'tooltip.setSaveDirectory'
  | 'tooltip.selectAllOnPage'
  | 'tooltip.downloadSelected'
  | 'tooltip.removeSelected'
  | 'history.empty'
  | 'pagination.previous'
  | 'pagination.page'
  | 'pagination.next'
  | 'tooltip.zoomImage'
  | 'tooltip.resetFov'
  | 'tooltip.fovSlider'
  | 'section.lighting.title'
  | 'tooltip.lightingDirection'
  | 'section.lighting.intensity'
  | 'tooltip.lightingIntensity'
  | 'tooltip.resetLightIntensity'
  | 'tooltip.viewportControl'
  | 'tooltip.clearConceptSelection'
  | 'tooltip.deselectAllBodyParts'
  | 'rightPanelTab.concept'
  | 'rightPanelTab.camera'
  | 'rightPanelTab.pose'
  | `viewport.${'front' | 'back' | 'right' | 'left' | 'top' | 'bottom'}`
  | `lightingDirection.${'FrontLeft' | 'Front' | 'FrontRight' | 'Left' | 'Right' | 'BackLeft' | 'Back' | 'BackRight'}`
  | `cameraAngle.${keyof typeof CameraAngle}`
  | `bodyPart.${keyof typeof BodyPart}`
  | `clothing.${keyof typeof ClothingItem}`
  | `actionPose.${keyof typeof ActionPose}`
  | `object.${keyof typeof ObjectItem}`
  | `tooltip.bodyPart.${keyof typeof BodyPart}`
  | 'tooltip.edit'
  | 'editModal.title'
  | 'editModal.cancel'
  | 'editModal.apply'
  | 'editModal.generate'
  | 'editModal.promptPlaceholder'
  | 'editModal.lasso'
  | 'editModal.lassoTooltip'
  | 'editModal.clearLasso'
  | 'editModal.keepBackgroundOnly'
  | 'editModal.keepBackgroundOnlyTooltip'
  | 'editModal.keepBackgroundOnlyComplete'
  | 'tooltip.actionPoseGeneral'
  | 'tooltip.actionPoseAttack'
  | 'tooltip.actionPoseStandingModel'
  | 'tooltip.selectActionPose'
  | 'downloadComplete'
  | 'downloadCompleteMultiple'
  | 'delete.success'
  | 'contextMenu.alignSelection'
  | 'contextMenu.uploadImage'
  | 'contextMenu.saveWorkspace'
  | 'contextMenu.loadWorkspace'
  | 'workspace.saved'
  | 'workspace.loaded'
  | 'drawing.brush'
  | 'drawing.rectangle'
  | 'tooltip.drawing.rectangle'
  | 'drawing.draw'
  | 'drawing.erase'
  | 'drawing.clear'
  | 'drawing.undo'
  | 'drawing.redo'
  | 'drawing.brushSize'
  | 'drawing.decreaseBrush'
  | 'drawing.increaseBrush'
  | 'drawing.resetBrush'
  | 'quotaModal.title'
  | 'quotaModal.body'
  | 'quotaModal.stop'
  | 'quotaModal.continue'
  | 'usagePlanModal.title'
  | 'usagePlanModal.body'
  | 'usagePlanModal.freeTier'
  | 'usagePlanModal.paidTier'
  | 'usagePlanModal.google'
  | 'usagePlanModal.placeholder'
  | 'usagePlanModal.apiKeyExplanation'
  | 'usagePlanModal.save'
  | 'error.unknown'
  | 'error.invalidRequest'
  | 'error.noResponse'
  | 'error.finishSafety'
  | 'error.finishUnspecified'
  | 'error.textResponse'
  | 'error.noImage'
  | 'error.apiGeneric'
  // FIX: Added missing translation keys to prevent type errors.
  | 'error.promptBlocked'
  | 'tooltip.generate'
  | 'tooltip.lassoEdit'
  | 'section.prompt.placeholder'
  // FIX: Add missing navigator translation keys to resolve TypeScript errors.
  | 'navigator.zoomOut'
  | 'navigator.zoomTo100'
  | 'navigator.zoomIn'
  | 'navigator.zoomToFit'
  | 'navigator.hide'
  | 'navigator.show'
  | 'contextMenu.groupSelection'
  | 'contextMenu.ungroupSelection'
  | 'contextMenu.renameGroup'
  | 'group.defaultName'
  // FIX: Add key for 'tooltip.goToGroup' to resolve type error
  | 'tooltip.goToGroup'
  // FIX: Add translation keys for background removal feature
  | 'removeBackground.button'
  | 'removeBackground.tooltip'
  | 'removeBackground.loading'
  | 'removeBackground.complete'
  | 'copy.success'
  | 'generation.complete'
  // FIX: Add 'contextMenu.saveWorkspaceAs' and other missing keys.
  | 'contextMenu.saveWorkspaceAs'
  | 'contextMenu.copySelection'
  | 'contextMenu.paste'
  | 'error.copyFailed'
  // Presets
  | 'presets.manage'
  | 'presets.modalTitle'
  | 'presets.newFolder'
  | 'presets.saveCurrentPrompt'
  | 'presets.folderNamePlaceholder'
  | 'presets.presetNamePlaceholder'
  | 'presets.deleteFolderConfirm'
  | 'presets.usePreset'
  | 'presets.delete'
  | 'presets.save'
  | 'presets.cancel'
  | 'presets.noFolders'
  | 'presets.noPresets'
  | 'presets.folder'
  | 'presets.untitled'
  | 'presets.deleteConfirm'
  | 'presets.rename'
  | 'presets.promptSaved'
  | 'tooltip.translatePrompt'
  | 'translation.inProgress'
  | 'translation.success'
  | 'translation.error'
  | 'presets.saveModalTitle'
  | 'presets.presetNameLabel'
  | 'presets.folderSelectLabel'
  | 'presets.noPromptToSave'
  | 'presets.manageButton'
  | 'presets.saveNewPreset'
  | 'presets.selectFolder'
  | 'presets.addNewPresetTitle'
  | 'presets.promptContentPlaceholder'
  | 'presets.addPresetButton'
  | 'presets.toggleQuickBar'
  | 'tooltip.editTotalCredit'
  // FIX: Add missing translation keys for AppSettingsModal and Header.
  | 'appSettingsModal.save'
  | 'tooltip.header.manageAppSettings'
  | 'appSettingsModal.title'
  | 'appSettingsModal.apiTitle'
  | 'appSettingsModal.apiBody'
  | 'appSettingsModal.googleApiKey'
  | 'appSettingsModal.apiKeyPlaceholder'
  | 'appSettingsModal.apiKeyExplanation'
  | 'appSettingsModal.creditTitle'
  | 'appSettingsModal.maxCreditLabel'
  | 'appSettingsModal.presetTitle'
  | 'appSettingsModal.managePresetsButton';


const translations: Record<Language, Record<string, string>> = {
  ko: {
    appTitle: 'BanaNyang',
    appDescription: 'AI 기반 캐릭터 컨셉 아트 생성기',
    'error.title': '오류',
    'error.pasteImage': '이미지를 붙여넣는 데 실패했습니다.',
    'uploader.clickToUpload': '클릭하여 업로드',
    'uploader.orDragAndDrop': '또는 드래그 앤 드롭',
    removeImage: '이미지 제거',
    'tooltip.previousImage': '이전 이미지',
    'tooltip.nextImage': '다음 이미지',
    'tooltip.downloadImage': '이미지 다운로드',
    'tooltip.downloadMp4': 'MP4 다운로드',
    'tooltip.downloadGif': 'GIF 다운로드',
    'tooltip.downloadAgain': '다시 다운로드',
    close: '닫기',
    'viewer.zoomHint': '클릭: 확대 | Alt+클릭: 축소 | 스페이스바+드래그: 이동',
    deselectAll: '전체 선택 해제',
    deselect: '선택 해제',
    'error.apiKeyMissing': 'API 키가 필요합니다. 사용량 플랜을 설정해주세요.',
    'error.apiKeyInvalid': 'API 키가 유효하지 않습니다. 확인 후 다시 시도해주세요.',
    'error.noOriginalImage': '생성을 시작하려면 원본 이미지를 지정하거나 프롬프트를 입력해야 합니다.',
    'error.noOptionsSelected': '생성할 내용이 없습니다. 옵션을 선택해주세요.',
    'error.modificationRequiresReference': '수정을 위해서는 참조 이미지가 필요합니다.',
    'error.cancelled': '작업이 취소되었습니다.',
    'error.permissionDenied': '파일 시스템 접근 권한이 거부되었습니다.',
    'error.fsApiNotSupported': '브라우저가 파일 시스템 API를 지원하지 않습니다.',
    'error.directorySelectFailed': '저장 폴더를 선택하는 데 실패했습니다.',
    'error.saveFailed': '파일 저장에 실패했습니다.',
    'error.translationFailed': '프롬프트 번역에 실패했습니다.',
    'error.poseAnalysisFailed': '포즈 분석에 실패했습니다.',
    'error.modelNameMissing': '모델 이름이 설정되지 않았습니다.',
    'error.quotaExceeded': '월간 무료 크레딧을 모두 사용했습니다.',
    'error.loadWorkspaceFailed': '워크스페이스를 불러오는 데 실패했습니다. 파일이 손상되었을 수 있습니다.',
    'error.saveWorkspaceFailed': '워크스페이스를 저장하는 데 실패했습니다.',
    'error.unknown': '알 수 없는 오류가 발생했습니다.',
    'error.invalidRequest': '잘못된 요청입니다. 입력값을 확인해주세요.',
    'error.noResponse': '모델로부터 응답을 받지 못했습니다.',
    'error.finishSafety': '안전 설정에 의해 콘텐츠 생성이 중단되었습니다.',
    'error.finishUnspecified': '알 수 없는 이유로 콘텐츠 생성이 중단되었습니다.',
    'error.textResponse': '모델이 이미지가 아닌 텍스트를 반환했습니다.',
    'error.noImage': '생성된 이미지가 없습니다.',
    'error.apiGeneric': 'API 호출 중 오류가 발생했습니다.',
    'error.promptBlocked': '프롬프트가 안전 정책에 의해 차단되었습니다.',
    applyFullOutfit: '전체 의상 적용',
    applyTop: '상의 적용',
    applyBottom: '하의 적용',
    clearSelection: '선택 초기화',
    resetAll: 'UI 위치 초기화',
    'tooltip.resetAll': '모든 패널의 위치와 크기를 초기화합니다.',
    'section.original.title': '입력 이미지',
    'tooltip.section.original': '캐릭터의 원본 및 참조 이미지를 업로드합니다.',
    'section.original.image': '원본 이미지',
    'tooltip.uploadOriginal': '캐릭터의 기본이 되는 원본 이미지를 업로드하세요.',
    'section.original.referenceImage.title': '참조 이미지',
    'tooltip.uploadReference': '스타일, 의상, 색상 등을 참조할 이미지를 업로드하세요.',
    'section.original.referenceImage.image': '참조 이미지',
    'section.generationOptions.fov.title': '시야각(FOV)',
    'section.cameraView.title': '카메라 뷰',
    'tooltip.section.cameraView': '카메라 각도와 시야각을 조절합니다.',
    'section.generationOptions.cameraView.title': '카메라 뷰',
    'tooltip.aPose': '체크하면 모든 뷰 생성 시 캐릭터를 A-포즈로 고정합니다.',
    aPose: 'A-포즈로 고정',
    'tooltip.uploadBackground': '캐릭터를 합성할 배경 이미지를 업로드하세요.',
    'section.backgroundImage.title': '배경 이미지',
    'section.backgroundImage.image': '배경 이미지',
    'section.conceptDesign.title': '컨셉 디자인',
    'tooltip.section.conceptDesign': '의상, 아이템, 신체 부위 등 컨셉을 디자인합니다.',
    'section.bodyPartSelection.title': '수정 부위 선택',
    'tooltip.bodyPartConcept': '참조 이미지의 스타일을 적용할 신체 부위를 선택하세요.',
    'tooltip.uploadReferenceFirst': '먼저 참조 이미지를 업로드해야 합니다.',
    'tooltip.applyFullOutfit': '참조 이미지의 전체 의상을 적용합니다.',
    'tooltip.applyTop': '참조 이미지의 상의만 적용합니다.',
    'tooltip.applyBottom': '참조 이미지의 하의만 적용합니다.',
    'tooltip.poseControl': '포즈를 직접 그리거나, 이미지를 참조하거나, 프리셋을 선택하여 제어합니다.',
    'section.poseControl.title': '포즈 제어',
    'tooltip.deselectPose': '선택한 포즈를 해제합니다.',
    'section.poseControl.image': '포즈 참조 이미지',
    'tooltip.poseOptionsDisabled': '다른 생성 옵션이 활성화되어 있어 포즈 옵션이 비활성화되었습니다.',
    'section.actionPose.title': '액션 포즈',
    'tooltip.section.clothing': '의상 컨셉을 선택합니다.',
    'section.generationOptions.modification.clothing.title': '의상',
    'tooltip.clearClothing': '선택한 모든 의상을 해제합니다.',
    'tooltip.clothingTheme': '의상 테마를 선택하세요.',
    'theme.scifi': 'Sci-Fi',
    'theme.modern': '모던',
    // FIX: Changed 'theme.techwear' to 'theme.fantasy' and updated translation.
    'theme.fantasy': '판타지',
    'tooltip.clothingCategory': '의상 카테고리',
    'clothingCategory.tops': '상의',
    'clothingCategory.outerwear': '아우터',
    'clothingCategory.bottoms': '하의',
    'clothingCategory.footwear': '신발',
    'clothingCategory.gloves': '장갑',
    'clothingCategory.hats': '모자',
    'clothingCategory.bags': '가방',
    'clothingCategory.decorations': '장식',
    'clothingCategory.sets': '세트',
    'tooltip.objectTheme': '아이템 테마를 선택하세요.',
    'tooltip.objectCategory': '아이템 카테고리',
    'objectCategory.weapons': '무기',
    'objectCategory.items': '아이템',
    'objectCategory.defense': '방어구',
    // FIX: Changed 'objectCategory.robots' to 'objectCategory.creatures' and updated translation.
    'objectCategory.creatures': '크리쳐',
    'subTab.clothingConcept': '의상 컨셉',
    'subTab.itemConcept': '아이템 컨셉',
    'tooltip.subTabClothing': '의상 컨셉 디자인 탭으로 전환',
    'tooltip.subTabItem': '아이템 컨셉 디자인 탭으로 전환',
    'poseAnalysis.analyzing': '포즈 분석 중...',
    'queue.title': '생성 대기열',
    'queue.cancelAll': '전체 취소',
    'queue.processing': '처리 중... ({count} 남음)',
    'queue.cancel': '취소',
    'queue.addToQueue': '대기열에 추가',
    generateButton: '실행',
    'taskSummary.imagePose': '이미지 포즈 생성',
    'taskSummary.imageConcept': '{item} 컨셉 아트 생성',
    'taskSummary.imageViews': '{count}개 뷰 생성',
    'taskSummary.imageEdit': '이미지 수정',
    'header.manageUsagePlan': 'API 키 및 사용량 플랜 관리',
    'tooltip.header.manageUsagePlan': 'API 키를 설정하고 사용량 플랜을 관리합니다.',
    'tooltip.monthlyCreditProgressBar': '남은 크레딧 양입니다.',
    'tooltip.creditAdjustment': '사용한 크레딧 양을 수동으로 조절할 수 있습니다.',
    'creditAdjustment.usedAmount': '사용한 크레딧',
    'creditAdjustment.updateButton': '수정',
    'section.history.title': '생성 기록',
    'tooltip.unsetSaveDirectory': '자동 저장 폴더 설정을 해제합니다.',
    'tooltip.setSaveDirectory': '생성된 이미지를 자동으로 저장할 폴더를 선택합니다.',
    'tooltip.selectAllOnPage': '현재 페이지의 모든 이미지 선택/해제',
    'tooltip.downloadSelected': '선택한 {count}개 항목 다운로드',
    'tooltip.removeSelected': '선택한 {count}개 항목 삭제',
    'history.empty': '생성된 이미지가 없습니다.',
    'pagination.previous': '이전',
    'pagination.page': '{current} / {total}',
    'pagination.next': '다음',
    'tooltip.zoomImage': '이미지 확대',
    'tooltip.resetFov': '시야각(FOV) 초기화',
    'tooltip.fovSlider': '카메라의 시야각을 조절합니다.',
    'section.lighting.title': '조명',
    'tooltip.lightingDirection': '광원의 방향을 조절합니다.',
    'section.lighting.intensity': '강도',
    'tooltip.lightingIntensity': '조명의 세기를 조절합니다.',
    'tooltip.resetLightIntensity': '조명 강도 초기화',
    'tooltip.viewportControl': '드래그하여 시점을 조절하세요.',
    'tooltip.clearConceptSelection': '선택한 컨셉을 모두 해제합니다.',
    'tooltip.deselectAllBodyParts': '선택한 모든 신체 부위를 해제합니다.',
    'rightPanelTab.concept': '컨셉',
    'rightPanelTab.camera': '카메라/조명',
    'rightPanelTab.pose': '포즈',
    'viewport.front': '정면', 'viewport.back': '후면', 'viewport.right': '우측', 'viewport.left': '좌측', 'viewport.top': '상단', 'viewport.bottom': '하단',
    'lightingDirection.FrontLeft': '전면 좌측', 'lightingDirection.Front': '정면', 'lightingDirection.FrontRight': '전면 우측', 'lightingDirection.Left': '좌측', 'lightingDirection.Right': '우측', 'lightingDirection.BackLeft': '후면 좌측', 'lightingDirection.Back': '후면', 'lightingDirection.BackRight': '후면 우측',
    'cameraAngle.Front': '정면', 'cameraAngle.FrontLeft': '전면 좌측', 'cameraAngle.FrontRight': '전면 우측', 'cameraAngle.Left': '좌측', 'cameraAngle.Right': '우측', 'cameraAngle.Back': '후면', 'cameraAngle.BackLeft': '후면 좌측', 'cameraAngle.BackRight': '후면 우측',
    'tooltip.edit': '이미지 편집',
    'editModal.title': '이미지 편집',
    'editModal.cancel': '취소',
    'editModal.apply': '적용',
    'editModal.generate': '생성',
    'editModal.promptPlaceholder': '수정할 내용을 입력하세요...',
    'editModal.lasso': '마스킹',
    'editModal.lassoTooltip': '마스킹 도구',
    'editModal.clearLasso': '마스크 지우기',
    'editModal.keepBackgroundOnly': '배경만 남기기',
    'editModal.keepBackgroundOnlyTooltip': 'AI를 사용하여 이미지의 주 피사체를 제거하고 배경만 남깁니다.',
    'editModal.keepBackgroundOnlyComplete': '배경 추출 완료!',
    'tooltip.actionPoseGeneral': '일반적인 액션 포즈',
    'tooltip.actionPoseAttack': '공격적인 액션 포즈',
    'tooltip.actionPoseStandingModel': '모델처럼 서 있는 포즈',
    'tooltip.selectActionPose': '액션 포즈 선택',
    downloadComplete: '다운로드가 완료되었습니다.',
    downloadCompleteMultiple: '{count}개의 파일 다운로드가 완료되었습니다.',
    'delete.success': '{count}개의 항목을 삭제했습니다.',
    'contextMenu.alignSelection': '정렬',
    'contextMenu.uploadImage': '이미지 업로드',
    'contextMenu.saveWorkspace': '워크스페이스 저장',
    'contextMenu.loadWorkspace': '워크스페이스 불러오기',
    'contextMenu.groupSelection': '그룹',
    'contextMenu.ungroupSelection': '그룹 해제',
    'contextMenu.renameGroup': '이름 변경',
    'group.defaultName': '새 그룹',
    'tooltip.goToGroup': '그룹으로 이동',
    'workspace.saved': '워크스페이스가 저장되었습니다.',
    'workspace.loaded': '워크스페이스를 불러왔습니다.',
    'drawing.brush': '브러시',
    'drawing.rectangle': '사각형',
    'tooltip.drawing.rectangle': '사각형 선택 도구',
    'drawing.draw': '그리기',
    'drawing.erase': '지우기',
    'drawing.clear': '전체 삭제',
    'drawing.undo': '실행 취소 (Ctrl+Z)',
    'drawing.redo': '다시 실행 (Ctrl+Shift+Z)',
    'drawing.brushSize': '브러시 크기',
    'drawing.decreaseBrush': '브러시 크기 줄이기 (X)',
    'drawing.increaseBrush': '브러시 크기 늘리기 (C)',
    'drawing.resetBrush': '브러시 크기 초기화',
    'quotaModal.title': '무료 크레딧 소진',
    'quotaModal.body': '월간 무료 크레딧을 모두 사용했습니다.\\n계속 진행하면 개인 API 키 사용량으로 요금이 청구될 수 있습니다.',
    'quotaModal.stop': '중단',
    'quotaModal.continue': '계속 진행',
    'usagePlanModal.title': 'API 키 설정',
    'usagePlanModal.body': 'BanaNyang은 Google Gemini API를 사용합니다. 원활한 이용을 위해 API 키를 입력해주세요. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline">여기</a>에서 API 키를 발급받을 수 있습니다.',
    'usagePlanModal.freeTier': '무료 티어 (월간 무료 크레딧 사용)',
    'usagePlanModal.paidTier': '유료 티어 (개인 API 키 사용)',
    'usagePlanModal.google': 'Google Gemini API 키',
    'usagePlanModal.placeholder': '여기에 API 키를 붙여넣으세요',
    'usagePlanModal.apiKeyExplanation': 'API 키는 브라우저에만 저장되며 외부로 전송되지 않습니다.',
    'usagePlanModal.save': '저장',
    // FIX: Removed duplicate error message keys.
    'tooltip.generate': '생성하기',
    'tooltip.lassoEdit': '마스킹 편집',
    'section.prompt.placeholder': 'Prompt...',
    'navigator.zoomOut': '축소',
    'navigator.zoomTo100': '100%로 확대',
    'navigator.zoomIn': '확대',
    'navigator.zoomToFit': '화면에 맞추기',
    'navigator.hide': '네비게이터 숨기기',
    'navigator.show': '네비게이터 표시',
    'removeBackground.button': '배경 제거',
    'removeBackground.tooltip': 'AI를 사용하여 이미지의 배경을 제거합니다.',
    'removeBackground.loading': '배경 제거 중...',
    'removeBackground.complete': '배경 제거 완료!',
    'copy.success': '클립보드에 복사되었습니다!',
    'generation.complete': '{count}개의 이미지 생성이 완료되었습니다!',
    'contextMenu.saveWorkspaceAs': '다른 이름으로 저장',
    'contextMenu.copySelection': '복사',
    'contextMenu.paste': '붙여넣기',
    'error.copyFailed': '클립보드 복사 실패',
    // Presets
    'presets.manage': '프리셋 관리',
    'presets.modalTitle': '프롬프트 프리셋 관리',
    'presets.newFolder': '새 폴더',
    'presets.saveCurrentPrompt': '현재 프롬프트 저장',
    'presets.folderNamePlaceholder': '폴더 이름...',
    'presets.presetNamePlaceholder': '프리셋 이름...',
    'presets.deleteFolderConfirm': '이 폴더와 포함된 모든 프리셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
    'presets.usePreset': '사용하기',
    'presets.delete': '삭제',
    'presets.save': '저장',
    'presets.cancel': '취소',
    'presets.noFolders': '생성된 폴더가 없습니다. "새 폴더"를 클릭하여 시작하세요.',
    'presets.noPresets': '이 폴더에 저장된 프리셋이 없습니다.',
    'presets.folder': '폴더',
    'presets.untitled': '제목 없음',
    'presets.deleteConfirm': '정말로 삭제하시겠습니까?',
    'presets.rename': '이름 변경',
    'presets.promptSaved': '프롬프트가 저장되었습니다!',
    'tooltip.translatePrompt': '어떤 언어를 입력하든 영어로 번역해줍니다',
    'translation.inProgress': '번역 중...',
    'translation.success': '번역이 완료되었습니다.',
    'translation.error': '번역에 실패했습니다.',
    'presets.saveModalTitle': '프롬프트 프리셋 저장',
    'presets.presetNameLabel': '프리셋 이름',
    'presets.folderSelectLabel': '저장할 폴더',
    'presets.noPromptToSave': '저장할 프롬프트가 없습니다.',
    'presets.manageButton': '관리...',
    'presets.saveNewPreset': '현재 프롬프트 저장',
    'presets.selectFolder': '폴더 선택',
    'presets.addNewPresetTitle': '새 프리셋 추가',
    'presets.promptContentPlaceholder': '프롬프트 내용...',
    'presets.addPresetButton': '프리셋 추가',
    'presets.toggleQuickBar': '퀵바에 고정/해제',
    'tooltip.editTotalCredit': '최대 크레딧 수정',
    // FIX: Add missing translations for AppSettingsModal and Header.
    'tooltip.header.manageAppSettings': '앱 설정 관리',
    'appSettingsModal.title': '앱 설정',
    'appSettingsModal.apiTitle': 'API 키 설정',
    'appSettingsModal.apiBody': 'BanaNyang은 Google Gemini API를 사용합니다. 원활한 이용을 위해 API 키를 입력해주세요. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" class="text-sky-400 hover:underline">여기</a>에서 API 키를 발급받을 수 있습니다.',
    'appSettingsModal.googleApiKey': 'Google Gemini API 키',
    'appSettingsModal.apiKeyPlaceholder': '여기에 API 키를 붙여넣으세요',
    'appSettingsModal.save': '저장',
    'appSettingsModal.apiKeyExplanation': 'API 키는 브라우저에만 저장되며 외부로 전송되지 않습니다.',
    'appSettingsModal.creditTitle': '크레딧 설정',
    'appSettingsModal.maxCreditLabel': '월간 최대 크레딧',
    'appSettingsModal.presetTitle': '프롬프트 프리셋 설정',
    'appSettingsModal.managePresetsButton': '프리셋 관리',
    // ClothingItem Translations
    'clothing.ModernTShirt': '모던 티셔츠',
    'clothing.ModernShirt': '모던 셔츠',
    'clothing.ModernHoodie': '모던 후드티',
    'clothing.ModernSuitJacket': '모던 정장 재킷',
    'clothing.ModernDressTop': '모던 드레스 상의',
    'clothing.ModernSlimfitJacket': '모던 슬림핏 재킷',
    'clothing.ModernJumperJacket': '모던 점퍼 재킷',
    'clothing.ModernLongJumper': '모던 롱 점퍼',
    'clothing.ModernBlazer': '모던 블레이저',
    'clothing.ModernLongCoat': '모던 롱 코트',
    'clothing.ModernHoodedJumper': '모던 후드 점퍼',
    'clothing.ModernJeans': '모던 청바지',
    'clothing.ModernSlacks': '모던 슬랙스',
    'clothing.ModernSweatpants': '모던 스웨트팬츠',
    'clothing.ModernShorts': '모던 반바지',
    'clothing.ModernSkirt': '모던 스커트',
    'clothing.ModernDressBottom': '모던 드레스 하의',
    'clothing.ModernJoggerPants': '모던 조거 팬츠',
    'clothing.ModernHipHopPants': '모던 힙합 바지',
    'clothing.ModernSkinnyJeans': '모던 스키니진',
    'clothing.ModernSlimfitPants': '모던 슬림핏 팬츠',
    'clothing.ModernSneakers': '모던 스니커즈',
    'clothing.ModernDressShoes': '모던 드레스 슈즈',
    'clothing.ModernSandals': '모던 샌들',
    'clothing.ModernBoots': '모던 부츠',
    'clothing.ModernLeatherGloves': '모던 가죽 장갑',
    'clothing.ModernSportsGloves': '모던 스포츠 장갑',
    'clothing.ModernKnitGloves': '모던 니트 장갑',
    'clothing.ModernCap': '모던 캡',
    'clothing.ModernBeanie': '모던 비니',
    'clothing.ModernFedora': '모던 페도라',
    'clothing.ModernBucketHat': '모던 버킷햇',
    'clothing.ModernHelmet': '모던 헬멧',
    'clothing.ModernMilitaryCap': '모던 군모',
    'clothing.ModernBackpack': '모던 백팩',
    'clothing.ModernSlingBag': '모던 슬링백',
    'clothing.ModernShoulderBag': '모던 숄더백',
    'clothing.ModernToteBag': '모던 토트백',
    'clothing.ModernWatch': '모던 손목시계',
    'clothing.ModernNecklace': '모던 목걸이',
    'clothing.ModernScarf': '모던 스카프',
    'clothing.ModernShoulderArmor': '모던 어깨 갑옷',
    'clothing.ModernGauntlets': '모던 건틀릿',
    'clothing.ModernCape': '모던 망토',
    'clothing.ModernCasualSet': '모던 캐주얼 세트',
    'clothing.ModernSuitSet': '모던 정장 세트',
    'clothing.ModernUniformSet': '모던 유니폼 세트',
    'clothing.ModernStreetwearSet': '모던 스트리트웨어 세트',
    'clothing.ModernBikerSet': '모던 바이커 세트',
    'clothing.ModernDetectiveSet': '모던 탐정 세트',
    'clothing.SciFiCyberneticJacket': '사이버네틱 재킷',
    'clothing.SciFiHolographicTop': '홀로그램 상의',
    'clothing.SciFiLightArmorChest': '경갑 상체',
    'clothing.SciFiBioSuitTop': '바이오슈트 상의',
    'clothing.SciFiSpaceSuitTorso': '우주복 몸통',
    'clothing.SciFiNeonTrenchcoat': '네온 트렌치코트',
    'clothing.SciFiArmoredPants': '장갑 바지',
    'clothing.SciFiEnergyLeggings': '에너지 레깅스',
    'clothing.SciFiZeroGravityTrousers': '무중력 바지',
    'clothing.SciFiCyberpunkSkirt': '사이버펑크 스커트',
    'clothing.SciFiBioSuitBottom': '바이오슈트 하의',
    'clothing.SciFiExoskeletonLegs': '외골격 다리',
    'clothing.SciFiMagneticBoots': '자기 부츠',
    'clothing.SciFiHoverBoots': '호버 부츠',
    'clothing.SciFiCyberneticGreaves': '사이버네틱 각반',
    'clothing.SciFiEnergySandals': '에너지 샌들',
    'clothing.SciFiLightweightPlatingBoots': '경량 플레이트 부츠',
    'clothing.SciFiDataGloves': '데이터 글러브',
    'clothing.SciFiPowerGauntlets': '파워 건틀릿',
    'clothing.SciFiNanoGloves': '나노 글러브',
    'clothing.SciFiRoboticHands': '로봇 손',
    'clothing.SciFiCyberneticForearms': '사이버네틱 팔뚝',
    'clothing.SciFiVisorHelmet': '바이저 헬멧',
    'clothing.SciFiNeuroLinkHeadset': '뉴로링크 헤드셋',
    'clothing.SciFiHolographicHood': '홀로그램 후드',
    'clothing.SciFiBreathingMask': '호흡 마스크',
    'clothing.SciFiCombatHelmet': '전투 헬멧',
    'clothing.SciFiDataVisor': '데이터 바이저',
    'clothing.SciFiGravityPouch': '중력 파우치',
    'clothing.SciFiTechBackpack': '테크 백팩',
    'clothing.SciFiEnergyCellHolster': '에너지 셀 홀스터',
    'clothing.SciFiUtilityBelt': '유틸리티 벨트',
    'clothing.SciFiShoulderMountedDrone': '어깨 장착 드론',
    'clothing.SciFiFloatingPauldrons': '부유 견갑',
    'clothing.SciFiEnergyShieldEmitter': '에너지 쉴드 방출기',
    'clothing.SciFiPlasmaCables': '플라즈마 케이블',
    'clothing.SciFiPilotSuitSet': '파일럿 슈트 세트',
    'clothing.SciFiCyborgEnforcerSet': '사이보그 집행자 세트',
    'clothing.SciFiExplorerSuitSet': '탐험가 슈트 세트',
    'clothing.SciFiStealthOpsSet': '스텔스 작전 세트',
    'clothing.FantasyChainmailCoif': '사슬 코이프',
    'clothing.FantasyLeatherHood': '가죽 후드',
    'clothing.FantasyCirclet': '서클릿',
    'clothing.FantasyCrown': '왕관',
    'clothing.FantasySteelHelmet': '강철 헬멧',
    'clothing.FantasyPlateArmorChest': '판금 갑옷 상체',
    'clothing.FantasyLeatherJerkin': '가죽 저킨',
    'clothing.FantasyMageRobesTop': '마법사 로브 상의',
    'clothing.FantasyChainmailShirt': '사슬 셔츠',
    'clothing.FantasyTunic': '튜닉',
    'clothing.FantasyElvenRobe': '엘프 로브',
    'clothing.FantasyDwarvenArmor': '드워프 갑옷',
    'clothing.FantasyPlatePauldrons': '판금 견갑',
    'clothing.FantasyLeatherShoulderPads': '가죽 어깨 보호대',
    'clothing.FantasyMagePauldrons': '마법사 견갑',
    'clothing.FantasyFurMantle': '모피 망토',
    'clothing.FantasyPlateGauntlets': '판금 건틀릿',
    'clothing.FantasyLeatherBracers': '가죽 팔 보호대',
    'clothing.FantasyMageGloves': '마법사 장갑',
    'clothing.FantasyPlateGreaves': '판금 각반',
    'clothing.FantasyLeatherPants': '가죽 바지',
    'clothing.FantasyMageRobesBottom': '마법사 로브 하의',
    'clothing.FantasyChainmailLeggings': '사슬 레깅스',
    'clothing.FantasyTrousers': '바지',
    'clothing.FantasyKilt': '킬트',
    'clothing.FantasyPlateSabatons': '판금 발 보호대',
    'clothing.FantasyLeatherBoots': '가죽 부츠',
    'clothing.FantasyMageSandals': '마법사 샌들',
    'clothing.FantasyElvenBoots': '엘프 부츠',
    'clothing.FantasyTravelersCloak': '여행자 망토',
    'clothing.FantasyRoyalCape': '왕실 망토',
    'clothing.FantasyAdventurerBelt': '모험가 벨트',
    'clothing.FantasyPotionBelt': '포션 벨트',
    'clothing.FantasyKnightSet': '기사 세트',
    'clothing.FantasyRogueSet': '도적 세트',
    'clothing.FantasyWizardSet': '마법사 세트',
    'clothing.FantasyRangerSet': '레인저 세트',
    'clothing.FantasyKingSet': '왕 세트',
    // ObjectItem Translations
    'object.ModernWeaponPistol': '모던 권총',
    'object.ModernWeaponRifle': '모던 소총',
    'object.ModernWeaponShotgun': '모던 샷건',
    'object.ModernWeaponKnife': '모던 나이프',
    'object.ModernWeaponBaseballBat': '모던 야구방망이',
    'object.ModernWeaponSubmachineGun': '모던 기관단총',
    'object.ModernWeaponSniperRifle': '모던 저격소총',
    'object.ModernWeaponRevolver': '모던 리볼버',
    'object.ModernWeaponCombatKnife': '모던 전투 단검',
    'object.ModernWeaponKatana': '모던 카타나',
    'object.ModernWeaponSaber': '모던 세이버',
    'object.ModernWeaponLongsword': '모던 롱소드',
    'object.ModernWeaponMachete': '모던 마체테',
    'object.ModernItemSmartphone': '모던 스마트폰',
    'object.ModernItemLaptop': '모던 노트북',
    'object.ModernItemHeadphones': '모던 헤드폰',
    'object.ModernItemEnergyDrink': '모던 에너지 드링크',
    'object.ModernItemMedkit': '모던 구급상자',
    'object.ModernItemDrone': '모던 드론',
    'object.ModernItemCoffeeMug': '모던 커피 머그',
    'object.ModernItemBriefcase': '모던 서류가방',
    'object.ModernItemLighter': '모던 라이터',
    'object.ModernDefenseKevlarVest': '모던 케블라 조끼',
    'object.ModernDefenseBallisticShield': '모던 방탄 방패',
    'object.ModernDefenseRiotShield': '모던 진압 방패',
    'object.ModernDefenseTacticalHelmet': '모던 전술 헬멧',
    'object.SciFiWeaponPlasmaRifle': '플라즈마 소총',
    'object.SciFiWeaponLaserPistol': '레이저 권총',
    'object.SciFiWeaponEnergySword': '에너지 소드',
    'object.SciFiWeaponRailgun': '레일건',
    'object.SciFiWeaponPulseCannon': '펄스 캐논',
    'object.SciFiWeaponGaussRifle': '가우스 소총',
    'object.SciFiWeaponSonicPistol': '소닉 권총',
    'object.SciFiWeaponLaserKatana': '레이저 카타나',
    'object.SciFiWeaponEMPGrenade': 'EMP 수류탄',
    'object.SciFiWeaponSmartGrenade': '스마트 수류탄',
    'object.SciFiWeaponHeavyPlasmaCannon': '헤비 플라즈마 캐논',
    'object.SciFiWeaponCryoGun': '크라이오 건',
    'object.SciFiWeaponParticleBeamRifle': '입자빔 소총',
    'object.SciFiItemMedibot': '메디봇',
    'object.SciFiItemHolographicProjector': '홀로그램 프로젝터',
    'object.SciFiItemAntiGravityDevice': '반중력 장치',
    'object.SciFiItemPersonalDrone': '개인 드론',
    'object.SciFiItemDataPad': '데이터 패드',
    'object.SciFiDefenseEnergyShield': '에너지 쉴드',
    'object.SciFiDefenseLightCompositeArmor': '경량 복합 갑옷',
    'object.SciFiDefenseExoFrame': '엑소 프레임',
    'object.SciFiDefenseStealthCloak': '스텔스 망토',
    'object.SciFiRobotAndroid': '안드로이드',
    'object.SciFiRobotSecurityDrone': '보안 드론',
    'object.SciFiRobotAssaultMech': '강습 메카',
    'object.SciFiRobotUtilityBot': '유틸리티 봇',
    'object.SciFiRobotCyberneticAnimal': '사이버네틱 동물',
    'object.FantasyWeaponLongsword': '롱소드',
    'object.FantasyWeaponBroadsword': '브로드소드',
    'object.FantasyWeaponDagger': '단검',
    'object.FantasyWeaponBattleAxe': '배틀 액스',
    'object.FantasyWeaponWarhammer': '워해머',
    'object.FantasyWeaponMace': '메이스',
    'object.FantasyWeaponSpear': '창',
    'object.FantasyWeaponLongbow': '장궁',
    'object.FantasyWeaponCrossbow': '석궁',
    'object.FantasyWeaponMagicStaff': '마법 지팡이',
    'object.FantasyWeaponMagicWand': '마법 완드',
    'object.FantasyDefenseKiteShield': '카이트 쉴드',
    'object.FantasyDefenseRoundShield': '라운드 쉴드',
    'object.FantasyDefenseTowerShield': '타워 쉴드',
    'object.FantasyItemHealthPotion': '체력 포션',
    'object.FantasyItemManaPotion': '마나 포션',
    'object.FantasyItemSpellbook': '마법서',
    'object.FantasyItemAncientScroll': '고대 스크롤',
    'object.FantasyItemTreasureChest': '보물 상자',
    'object.FantasyItemTorch': '횃불',
    'object.FantasyCreatureDragon': '드래곤',
    'object.FantasyCreatureGoblin': '고블린',
    'object.FantasyCreatureOrc': '오크',
    'object.FantasyCreatureGriffin': '그리핀',
    'object.FantasyCreatureUnicorn': '유니콘',
  }
};

// FIX: Refactored to use Object.values for safer iteration over enum values, preventing 'never' type errors.
const generateEnumTranslations = (prefix: string, enumObject: object, target: Record<string, string>) => {
  for (const value of Object.values(enumObject)) {
    // We only want to process string values from the enum, which is safe for both string and numeric enums.
    if (typeof value === 'string') {
        const spacedValue = value.replace(/([A-Z])/g, ' $1').replace(/([0-9]+)/g, ' $1').trim();
        // FIX: Replaced template literal with string concatenation to avoid TS error with template literal types.
        target[prefix + '.' + value] = spacedValue;
    }
  }
};

generateEnumTranslations('bodyPart', BodyPart, translations.ko);
generateEnumTranslations('actionPose', ActionPose, translations.ko);
generateEnumTranslations('tooltip.bodyPart', BodyPart, translations.ko);

export const t = (key: TranslationKey, language: Language, options?: Record<string, string | number>): string => {
  let text = translations[language][key] || key;
  if (options) {
    Object.keys(options).forEach(optionKey => {
      text = text.replace(`{${optionKey}}`, String(options[optionKey]));
    });
  }
  return text;
};

// FIX: Changed `value` from `any` to `string` for better type safety.
export const getEnumText = (type: 'bodyPart' | 'cameraAngle' | 'clothing' | 'actionPose' | 'object', value: string, language: Language): string => {
  return t(`${type}.${value}` as TranslationKey, language);
};

// FIX: Changed `value` from `any` to `string` for better type safety.
export const getTooltipText = (type: 'bodyPart' | 'cameraAngle' | 'clothing' | 'actionPose' | 'object', value: string, language: Language): string => {
  return t(`tooltip.${type}.${value}` as TranslationKey, language);
};