// FIX: Add FinishReason and ColorPalette to imports for detailed error handling and new features.
import { GoogleGenAI, Modality, Type, Part, FinishReason, GenerateContentResponse } from "@google/genai";
import { SelectedView, CameraSize, BodyPart, ClothingItem, ActionPose, ObjectItem, ColorPalette } from '../types';
import { OBJECT_ITEM_TO_CATEGORY_MAP } from "../constants";

let apiKeyFromStorage: string | null = localStorage.getItem('gemini-api-key');

export function getApiKey(): string | undefined {
    return apiKeyFromStorage || process.env.API_KEY;
}

export function setApiKey(key: string) {
    apiKeyFromStorage = key;
    if (key) {
        localStorage.setItem('gemini-api-key', key);
    } else {
        localStorage.removeItem('gemini-api-key');
    }
}

function getClient(): GoogleGenAI {
    const key = getApiKey();
    if (!key) throw new Error("error.apiKeyInvalid");
    // FIX: Update GoogleGenAI initialization to use named apiKey parameter.
    return new GoogleGenAI({ apiKey: key });
}


export const fileToBase64 = (file: File): Promise<string> => {
  // FIX: Implement fileToBase64 function to convert a File object to a base64 string.
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        // The result includes the mime type prefix, e.g., "data:image/png;base64,..."
        // We only need the base64 part.
        resolve(reader.result.split(',')[1]);
      } else {
        reject(new Error('Failed to read file as a base64 string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

export const translateToEnglish = async (text: string): Promise<string> => {
    try {
        const ai = getClient();
        // FIX: Corrected the `contents` parameter to be a simple string for text-only prompts as per Gemini API guidelines.
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Translate the following text into English. Just return the translated text, nothing else. If the text is already in English, return it unchanged. Text: "${text}"`,
            config: {
                systemInstruction: 'You are an expert translator. You only return the translated English text, without any introductory phrases or explanations.',
            }
        });

        const translatedText = response.text.trim();
        if (!translatedText) {
            throw new Error('error.translationFailed');
        }
        return translatedText;
    } catch (e: any) {
        console.error("Translation failed:", e);
        if (e.message && e.message.includes('API key not valid')) {
            throw new Error('error.apiKeyInvalid');
        }
        if (e.message && (e.message.includes('quota') || e.message.includes('billing'))) {
            throw new Error('error.quotaExceeded');
        }
        throw new Error('error.translationFailed');
    }
};

export const analyzePoseImage = async (
    poseImage: { data: string, mimeType: string },
    signal: AbortSignal
): Promise<string> => {
    const ai = getClient();
    const textPrompt = 'Describe the pose of the character in this image in detail. Focus on the position of the limbs, torso, and head. Be descriptive and precise for regenerating the pose. Output only the description of the pose.';
    // FIX: Correctly structured the `parts` array for a multi-modal prompt.
    const parts: Part[] = [
        { inlineData: { data: poseImage.data, mimeType: poseImage.mimeType } },
        { text: textPrompt }
    ];

    try {
        if (signal.aborted) {
            throw new Error('error.cancelled');
        }
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            // FIX: Correctly pass the parts array within a `contents` object.
            contents: {
                parts: parts
            },
        });
        if (signal.aborted) {
            throw new Error('error.cancelled');
        }
        const description = response.text.trim();
        if (!description) {
            throw new Error('error.poseAnalysisFailed');
        }
        return description;
    } catch (e: any) {
        console.error("Pose analysis failed:", e);
        if (e.message?.includes('aborted')) {
            throw new Error('error.cancelled');
        }
         if (e.message) {
             if (e.message.includes('API key not valid')) {
                throw new Error('error.apiKeyInvalid');
            }
            if (e.message.includes('quota') || e.message.includes('billing')) {
                throw new Error('error.quotaExceeded');
            }
            if (e.message.includes('prompt was blocked')) {
                throw new Error('error.promptBlocked');
            }
        }
        if (e.message.startsWith('error.')) {
            throw e;
        }
        throw new Error('error.poseAnalysisFailed');
    }
};

const handleApiError = (e: any): never => {
    console.error("API call failed:", e);
    if (e.message?.includes('aborted')) throw new Error('error.cancelled');
    if (e.message) {
        if (e.message.includes('API key not valid')) throw new Error('error.apiKeyInvalid');
        if (e.message.includes('quota') || e.message.includes('billing')) throw new Error('error.quotaExceeded');
        if (e.message.includes('prompt was blocked')) throw new Error('error.promptBlocked');
        if (e.message.startsWith('error.')) throw e;
    }
    throw new Error('error.apiGeneric');
};

const processImageEditResponse = (response: GenerateContentResponse, signal: AbortSignal): string => {
    if (signal.aborted) throw new Error('error.cancelled');
    
    const candidate = response.candidates?.[0];
    if (!candidate) throw new Error('error.noResponse');

    if (candidate.finishReason && candidate.finishReason !== FinishReason.STOP) {
        switch (candidate.finishReason) {
            case FinishReason.SAFETY: throw new Error('error.finishSafety');
            default: throw new Error('error.finishUnspecified');
        }
    }
    
    const imagePart = candidate.content.parts.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
    if (!imagePart) {
        const textPart = candidate.content.parts.find((p: any) => p.text);
        if (textPart && textPart.text) {
            console.warn("Model returned text instead of image:", textPart.text);
            throw new Error('error.textResponse');
        }
        throw new Error('error.noImage');
    }

    return `data:${imagePart.inlineData!.mimeType};base64,${imagePart.inlineData!.data}`;
};

export const callImageEditModel = async (image: { data: string, mimeType: string }, textPrompt: string, signal: AbortSignal): Promise<string> => {
    if (signal.aborted) throw new Error('error.cancelled');

    const ai = getClient();
    const parts: Part[] = [
        { inlineData: { data: image.data, mimeType: image.mimeType } },
        { text: textPrompt }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                // FIX: responseModalities must be an array with a single Modality.IMAGE element for image editing.
                responseModalities: [Modality.IMAGE],
            },
        });
        return processImageEditResponse(response, signal);
    } catch (e) {
        handleApiError(e);
    }
};

export const removeImageBackground = (image: { data: string, mimeType: string }, signal: AbortSignal): Promise<string> => {
    const prompt = 'Remove the background from the image. The output should be the main subject with a transparent background.';
    return callImageEditModel(image, prompt, signal);
};

export const keepBackgroundOnly = (image: { data: string, mimeType: string }, signal: AbortSignal): Promise<string> => {
    const prompt = 'Identify the main subject in the foreground of the image. Remove the subject completely and realistically fill in the area behind it with the surrounding background texture and context. The output should be only the background.';
    return callImageEditModel(image, prompt, signal);
};

export const expandImage = (image: { data: string, mimeType: string }, signal: AbortSignal): Promise<string> => {
    const prompt = 'This image has transparent areas around the edges. Expand the existing image to fill these transparent areas completely. Generate new content that seamlessly and realistically continues the scene, style, colors, and lighting of the original image. The output should be a single, complete image with no transparency.';
    return callImageEditModel(image, prompt, signal);
};

const getEnglishBodyPartName = (part: BodyPart): string => {
  switch (part) {
    case BodyPart.Face: return "the entire face";
    case BodyPart.Hair: return "the entire hair";
    case BodyPart.Body: return "the entire torso area, from the neck to the waist";
    case BodyPart.Pelvis: return "the pelvis and hip area";
    case BodyPart.LeftShoulder: return "the left shoulder";
    case BodyPart.RightShoulder: return "the right shoulder";
    case BodyPart.LeftArm: return "the entire left arm, from shoulder to wrist";
    case BodyPart.RightArm: return "the entire right arm, from shoulder to wrist";
    case BodyPart.BothArms: return "both arms, from shoulders to wrists";
    case BodyPart.LeftHand: return "the left hand";
    case BodyPart.RightHand: return "the right hand";
    case BodyPart.BothHands: return "both hands";
    case BodyPart.LeftLeg: return "the entire left leg, from hip to ankle";
    case BodyPart.RightLeg: return "the entire right leg, from hip to ankle";
    case BodyPart.BothLegs: return "both legs, from hips to ankles";
    case BodyPart.LeftFoot: return "the left foot";
    case BodyPart.RightFoot: return "the right foot";
    case BodyPart.BothFeet: return "both feet";
    default: return part;
  }
};


// FIX: Add and export processCharacterImage function for core image generation logic.
export const processCharacterImage = async (
    originalImage: { data: string, mimeType: string } | null,
    cameraView: SelectedView | null,
    selectedBodyParts: BodyPart[],
    // FIX: Changed to Partial as not all body parts will be in the map.
    bodyPartReferenceMap: Partial<Record<BodyPart, number>>,
    selectedClothingItems: ClothingItem[],
    selectedObjectItems: ObjectItem[],
    prompt: string,
    poseDescription: string | null,
    textureImages: ({ data: string, mimeType: string, maskData: string | null } | null)[],
    backgroundImage: { data: string, mimeType: string } | null,
    selectedActionPose: ActionPose | null,
    useAposeForViews: boolean,
    isApplyingFullOutfit: boolean,
    isApplyingTop: boolean,
    isApplyingBottom: boolean,
    backgroundImageAspectRatio: string | null,
    modelName: string,
    signal: AbortSignal,
    lightDirection: { yaw: number; pitch: number; } | null,
    lightIntensity: number | null,
    maskImage: { data: string, mimeType: string } | null,
    // FIX: Add color palette arguments to match the function call in useImageGeneration.ts and fix type errors.
    selectedPalette: ColorPalette | null,
    numPaletteColors: number,
    isAutoColorizeSketch: boolean,
    // FIX: Add numImages parameter to support generating multiple images.
    numImages: number
): Promise<string[]> => {
    const ai = getClient();

    const parts: Part[] = [];
    let textPrompt = '';

    if (!originalImage) {
        // FIX: Add logic to handle generation from a color palette when no original image is present.
        if (selectedPalette) {
            const numColors = numPaletteColors ? `using the first ${numPaletteColors}` : '';
            textPrompt = `Create an image based on the following prompt: "${prompt.trim()}". Strictly adhere to this color palette: ${selectedPalette.name} (${selectedPalette.colors.join(', ')}), ${numColors} colors.`;
        } else {
            textPrompt = prompt.trim();
        }
        if (!textPrompt) {
            throw new Error("error.invalidRequest");
        }
        parts.push({ text: textPrompt });
    } else if (maskImage) {
        // --- MASKING / INPAINTING PATH ---
        parts.push({ inlineData: { data: originalImage.data, mimeType: originalImage.mimeType } });
        parts.push({ inlineData: { data: maskImage.data, mimeType: maskImage.mimeType } });

        const validTextureImages = textureImages.filter(img => img !== null) as { data: string; mimeType: string; maskData: string | null; }[];
        let editTaskInstruction = "";

        if (validTextureImages.length > 0) {
            const referenceImage = validTextureImages[0];
            parts.push({ inlineData: { data: referenceImage.data, mimeType: referenceImage.mimeType } });
            
            const refImageIndex = 3;
            const userRequest = prompt.trim() ? `\n\n**Additional User Request:** While performing this, also incorporate the following user instruction: "${prompt.trim()}".` : '';

            editTaskInstruction = `
**Reference Image:**
- **Image ${refImageIndex}:** The reference for style, texture, and concept.

**Your Task:**
Analyze the 3D form, lighting, and existing details of the character in **Image 1** within the masked area (the WHITE part of **Image 2**). Then, take the style, texture, and concept from **Image ${refImageIndex}** and intelligently **redraw** the masked area on Image 1.

The goal is to apply the *idea* of **Image ${refImageIndex}** onto the structure of **Image 1**. The result should look like the character from **Image 1** is now wearing or has adopted the features from **Image ${refImageIndex}**, fitting seamlessly and naturally with the original character's body shape, pose, and the surrounding lighting. Do not simply copy and paste the pixels from the reference image. The final output must be a complete image with the changes applied.${userRequest}`;
        
        } else if (prompt.trim()) {
            editTaskInstruction = `
**Your Task:**
Fill the masked area (the WHITE part of **Image 2**) on **Image 1** based on the following instruction: "${prompt.trim()}". Analyze the surrounding pixels, lighting, and 3D form to ensure the result is seamless and natural.
`;
        } else {
            editTaskInstruction = `
**Your Task:**
Perform a content-aware fill on the masked area (the WHITE part of **Image 2**) on **Image 1**. Analyze the surrounding pixels, lighting, and 3D form to generate new content that seamlessly and realistically blends into the original image.
`;
        }

        textPrompt = `You are an expert digital artist performing a precise inpainting task.

**Input Images:**
- **Image 1:** The original image to be edited.
- **Image 2:** The mask. The **WHITE** area is the only region you are allowed to edit.

**ABSOLUTE RULES:**
1.  **PRESERVE UNMASKED AREA:** The final output image MUST be pixel-for-pixel identical to **Image 1** in all areas that are **BLACK** in **Image 2**. This is the most important rule. DO NOT CHANGE THE BLACK AREAS AT ALL.
2.  **EDIT MASKED AREA:** Modify **ONLY** the area of **Image 1** that corresponds to the **WHITE** area in **Image 2**.
3.  **SEAMLESS BLENDING:** Ensure the boundary between the edited area and the preserved area is seamless and natural.
4.  **MAINTAIN STRUCTURE:** The edits must respect the underlying form, perspective, and lighting of the original character in Image 1.

${editTaskInstruction}

**FINAL OUTPUT:**
Return only the complete, edited version of Image 1. Do not include any text, explanations, or other content.
`;
        parts.push({ text: textPrompt.trim() });
    } else {
        // --- NON-MASKING / GENERAL EDITING PATH ---
        // 1. Add original image
        parts.push({
            inlineData: {
                data: originalImage.data,
                mimeType: originalImage.mimeType,
            },
        });

        // 2. Add texture (reference) images AND their masks, tracking their indices
        const validTextureImages = textureImages.filter(img => img !== null) as { data: string; mimeType: string; maskData: string | null; }[];
        const textureImageIndexMap: number[] = [];
        validTextureImages.forEach(textureImage => {
            textureImageIndexMap.push(parts.length + 1);
            parts.push({
                inlineData: {
                    data: textureImage.data,
                    mimeType: textureImage.mimeType,
                },
            });
            if (textureImage.maskData) {
                parts.push({
                    inlineData: {
                        data: textureImage.maskData,
                        mimeType: 'image/png', // Assuming masks are PNG
                    },
                });
            }
        });
        
        // 3. Add background image LAST
        if (backgroundImage) {
            parts.push({
                inlineData: {
                    data: backgroundImage.data,
                    mimeType: backgroundImage.mimeType,
                },
            });
        }

        // 4. Construct the text prompt
            // --- Aspect Ratio & Background Control (HIGHEST PRIORITY) ---
        if (backgroundImage) {
            const backgroundIndex = parts.length;
            let refImagesText = 'No other images are provided for reference.';
            if (validTextureImages.length > 0) {
                const refEndIndex = backgroundIndex - 1;
                const refRange = refEndIndex === 2 ? `Image 2 is a reference image` : `Images 2 through ${refEndIndex} are reference images`;
                refImagesText = `${refRange} for the character's style, clothing, and/or texture.`;
            }
            textPrompt += `**ABSOLUTE RULE:** The final image in the input (Image ${backgroundIndex}) is a CANVAS TEMPLATE. Its only purpose is to define the aspect ratio for the final output, which must be ${backgroundImageAspectRatio}. You MUST COMPLETELY IGNORE all visual content within this template image—its colors, style, subject, and composition are irrelevant and must NOT be used or referenced in any way.

**Primary Task:** Take the character from the first image (Image 1) and place them onto a NEW, simple, and neutral background that you generate yourself. It is critical to preserve the character's appearance, pose, and style from Image 1 exactly.

**Reference Images:** ${refImagesText}
\n`;

        } else {
            textPrompt += 'Use Image 1 as the base character. All other images are for reference ONLY. CRITICAL: You MUST ignore the backgrounds of all reference images (from Image 2 onwards) and keep the background from Image 1 (or create a simple, neutral background if Image 1 has none). The output image must have the exact same aspect ratio as Image 1.\n';
        }
        
        // --- Overriding Instructions (Pose, View, Lighting) ---
        if (poseDescription) {
            textPrompt += `Generate an image of the character from the first image in the exact pose described: "${poseDescription}". Do not change the character's appearance, clothing, or style from the first image; only change the pose.\n`;
        }
        
        if (cameraView) {
            const { yaw, pitch, size } = cameraView;
            const roundedPitch = Math.round(pitch);
            let pitchDescription = 'an eye-level shot';

            if (roundedPitch < -75) pitchDescription = "a 90-degree top view";
            else if (roundedPitch < -52) pitchDescription = "a 60-degree top-down view";
            else if (roundedPitch < -37) pitchDescription = "a 45-degree top-down view";
            else if (roundedPitch < -22) pitchDescription = "a 30-degree top-down view";
            else if (roundedPitch < -7) pitchDescription = "a 15-degree top-down view";
            else if (roundedPitch > 75) pitchDescription = "a Worm’s-Eye View";
            else if (roundedPitch > 52) pitchDescription = "an Extreme Low Angle";
            else if (roundedPitch > 37) pitchDescription = "an Oblique Low Angle";
            else if (roundedPitch > 7) pitchDescription = "a Low Angle Shot";
            
            const normalizedYaw = (Math.round(yaw) % 360 + 360) % 360;
            let yawDescription = 'Front View';

            if (normalizedYaw >= 348.75 || normalizedYaw < 11.25) yawDescription = 'Front View';
            else if (normalizedYaw >= 11.25 && normalizedYaw < 33.75) yawDescription = 'Front 1/8 View';
            else if (normalizedYaw >= 33.75 && normalizedYaw < 56.25) yawDescription = 'Front-Quarter View';
            else if (normalizedYaw >= 56.25 && normalizedYaw < 78.75) yawDescription = 'Three-Quarter Front View';
            else if (normalizedYaw >= 78.75 && normalizedYaw < 101.25) yawDescription = 'Side View';
            else if (normalizedYaw >= 101.25 && normalizedYaw < 123.75) yawDescription = 'Three-Quarter Back-Side View';
            else if (normalizedYaw >= 123.75 && normalizedYaw < 146.25) yawDescription = 'Back-Quarter View';
            else if (normalizedYaw >= 146.25 && normalizedYaw < 168.75) yawDescription = 'Back 1/8 View';
            else if (normalizedYaw >= 168.75 && normalizedYaw < 191.25) yawDescription = 'Back View';
            else if (normalizedYaw >= 191.25 && normalizedYaw < 213.75) yawDescription = 'Back 1/8 Opposite';
            else if (normalizedYaw >= 213.75 && normalizedYaw < 236.25) yawDescription = 'Back-Quarter Opposite View';
            else if (normalizedYaw >= 236.25 && normalizedYaw < 258.75) yawDescription = 'Three-Quarter Back Opposite';
            else if (normalizedYaw >= 258.75 && normalizedYaw < 281.25) yawDescription = 'Side Opposite View';
            else if (normalizedYaw >= 281.25 && normalizedYaw < 303.75) yawDescription = 'Three-Quarter Front Opposite';
            else if (normalizedYaw >= 303.75 && normalizedYaw < 326.25) yawDescription = 'Front-Quarter Opposite View';
            else if (normalizedYaw >= 326.25 && normalizedYaw < 348.75) yawDescription = 'Front 1/8 Opposite View';

            const angleDescription = `The camera is set for ${pitchDescription}, capturing a ${yawDescription}.`;

            let viewPrompt = '';
            if (useAposeForViews) {
                viewPrompt = `Render the subject from the first image in a standard A-pose. ${angleDescription}. This is a ${size} shot. Preserve the subject's design, but change the pose to A-pose and the camera angle.`;
            } else {
                viewPrompt = `Render the subject from the first image. ${angleDescription}. CRITICAL: You must preserve the subject's appearance, style, and original pose. The ONLY change is the camera's viewpoint.`;
            }
            textPrompt += viewPrompt + '\n';
        }

        if (lightDirection && lightIntensity !== null) {
            const { yaw, pitch } = lightDirection;
            let lightSource = '';
            
            if (pitch < -30) lightSource += 'top ';
            else if (pitch > 30) lightSource += 'bottom ';

            const normalizedYaw = (Math.round(yaw) % 360 + 360) % 360;
            if (normalizedYaw > 337.5 || normalizedYaw <= 22.5) lightSource += 'front';
            else if (normalizedYaw > 22.5 && normalizedYaw <= 67.5) lightSource += 'front-left';
            else if (normalizedYaw > 67.5 && normalizedYaw <= 112.5) lightSource += 'left';
            else if (normalizedYaw > 112.5 && normalizedYaw <= 157.5) lightSource += 'back-left';
            else if (normalizedYaw > 157.5 && normalizedYaw <= 202.5) lightSource += 'back';
            else if (normalizedYaw > 202.5 && normalizedYaw <= 247.5) lightSource += 'back-right';
            else if (normalizedYaw > 247.5 && normalizedYaw <= 292.5) lightSource += 'right';
            else if (normalizedYaw > 292.5 && normalizedYaw <= 337.5) lightSource += 'front-right';
            lightSource = lightSource.trim();

            let intensityDesc = '';
            if (lightIntensity > 1.5) intensityDesc = 'very strong';
            else if (lightIntensity > 1.1) intensityDesc = 'strong';
            else if (lightIntensity < 0.5) intensityDesc = 'very dim';
            else if (lightIntensity < 0.9) intensityDesc = 'dim';
            else intensityDesc = 'normal';

            textPrompt += `Use a ${intensityDesc} ${lightSource} light.\n`;
        }
        
        // FIX: Add color palette instructions to the prompt.
        if (selectedPalette) {
            const numColors = numPaletteColors ? `the first ${numPaletteColors}` : '';
            
            textPrompt += `
**Color Palette:** Use ONLY ${numColors} colors from the following palette: ${selectedPalette.name} (${selectedPalette.colors.join(', ')}).
`;
            if (isAutoColorizeSketch) {
                textPrompt += 'The first image is a line art sketch. Apply the color palette to this sketch to create a fully colored artwork. Fill the regions intelligently based on the sketch lines.\n';
            }
        }
        
        if (selectedActionPose) {
            textPrompt += `Generate a full-body image of the character in a dynamic "${selectedActionPose}" action pose.\n`;
        }
        
        // --- Task-Specific Instructions ---
        const bodyPartsWithRefs = Object.keys(bodyPartReferenceMap) as BodyPart[];
        const hasBodyPartAssignments = bodyPartsWithRefs.length > 0;

        if (hasBodyPartAssignments) {
            const toOrdinal = (n: number): string => {
                const s = ["th", "st", "nd", "rd"];
                const v = n % 100;
                return n + (s[(v - 20) % 10] || s[v] || s[0]);
            };
    
            textPrompt += `As a professional digital artist, your task is to create a high-quality, artistic image suitable for all ages.
Based on the first input image (the original character), apply the following modifications. You MUST maintain the original image's style and lighting. Preserve the camera angle and pose of the original image, changing only what is explicitly requested.
`;
            
            const partsByRef: Record<number, BodyPart[]> = {};
            bodyPartsWithRefs.forEach(part => {
                const refIndex = bodyPartReferenceMap[part];
                if (refIndex !== undefined) {
                    if (!partsByRef[refIndex]) partsByRef[refIndex] = [];
                    partsByRef[refIndex].push(part);
                }
            });
    
            const sortedRefIndices = Object.keys(partsByRef).map(Number).sort((a, b) => a - b);
    
            for (const refIndex of sortedRefIndices) {
                const imagePositionInPrompt = toOrdinal(textureImageIndexMap[refIndex]);
                const partsForRef = partsByRef[refIndex].map(getEnglishBodyPartName).join(', and ');
                
                textPrompt += `
On the subject's ${partsForRef}, replace the existing clothing/features with the style from the ${imagePositionInPrompt} input image. Analyze the reference style (e.g. clothing design, materials, colors, fit) and adapt it realistically to the subject's body and pose in the first image.
`;
            }
    
            textPrompt += `
It is CRITICAL to preserve the character's identity, body shape, and pose from the first image. Do not copy the character, pose, or background from any reference images; use them for design reference ONLY. Modify only the specified parts and leave the rest of the subject unchanged.
The final generated image must be a SFW (Safe for Work) artistic representation that adheres to safety policies. The final result should be a high-quality, professional-level piece of digital art suitable for a portfolio.
`;
            
            if (prompt.trim()) {
                textPrompt += `\n**Additional instructions:** "${prompt.trim()}"\n`;
            }
        } 
        // SCENARIO: A specific object is requested for concept art.
        else if (selectedObjectItems.length > 0) {
            const item = selectedObjectItems[0];
            textPrompt += `Generate concept art for a ${item}. Use the first image and any other reference images as style and theme references, but create a new object. The background should be simple and neutral.\n`;
            if (prompt.trim()) {
                textPrompt += `Incorporate these details into the design: "${prompt}".\n`;
            }
        } 
        // SCENARIO: No body parts/objects selected, but reference images exist.
        else if (validTextureImages.length > 0) {
            const refEndIndex = 1 + validTextureImages.length;
            const refRange = refEndIndex === 2 ? `reference Image 2` : `reference Images 2 through ${refEndIndex}`;

            if (prompt.trim()) {
                // Assume user wants to modify Image 1 based on a prompt and references.
                textPrompt += `Modify the character in Image 1 based on the following instruction: "${prompt.trim()}". Use ${refRange} as visual references for style, texture, and overall feel. CRITICAL: Preserve the character's identity, pose, and background from Image 1 unless the prompt specifies otherwise.\n`;
            } else {
                // Original free-form creation logic when no prompt is given.
                textPrompt += `Using Image 1 and ${refRange} purely as inspiration for style, color palette, and overall mood, generate a new concept art for a creative item, creature, or monster. CRITICAL: Do not just edit or combine the characters from the input images. Create a completely new subject that is only inspired by their aesthetic. The background should be simple and neutral.\n`;
            }
        } 
        // FALLBACK: Only original image and maybe a text prompt.
        else {
            if (prompt.trim()) {
                textPrompt += `Apply this global instruction to the character from Image 1: "${prompt}".\n`;
            }
        }

        // Add the text prompt at the end
        if (textPrompt) {
            parts.push({ text: textPrompt.trim() });
        }
    }


    if (parts.length === 0) {
         throw new Error("error.invalidRequest");
    }

    try {
        if (signal.aborted) {
            throw new Error('error.cancelled');
        }

        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE],
                // FIX: Pass candidateCount for multi-image generation.
                candidateCount: numImages,
            },
        });
        
        if (signal.aborted) {
            throw new Error('error.cancelled');
        }

        // FIX: Reworked response handling to support multiple candidates for multi-image generation.
        if (!response.candidates || response.candidates.length === 0) {
            throw new Error('error.noResponse');
        }

        const allImageSrcs: string[] = [];
        let firstErrorReason: FinishReason | undefined;

        for (const candidate of response.candidates) {
            if (candidate.finishReason && candidate.finishReason !== FinishReason.STOP) {
                if (!firstErrorReason) {
                    firstErrorReason = candidate.finishReason;
                }
                console.warn(`A candidate finished with reason: ${candidate.finishReason}`);
                continue;
            }
        
            const imagePart = candidate.content.parts.find(p => p.inlineData && p.inlineData.mimeType.startsWith('image/'));
        
            if (imagePart) {
                allImageSrcs.push(`data:${imagePart.inlineData!.mimeType};base64,${imagePart.inlineData!.data}`);
            } else {
                const textPart = candidate.content.parts.find(p => p.text);
                if (textPart && textPart.text) {
                    console.warn("A candidate returned text instead of an image:", textPart.text);
                }
            }
        }

        if (allImageSrcs.length === 0) {
            if(firstErrorReason) {
                switch (firstErrorReason) {
                    case FinishReason.SAFETY:
                        throw new Error('error.finishSafety');
                    default:
                        throw new Error('error.finishUnspecified');
                }
            }
            
            const firstCandidate = response.candidates[0];
            const textPart = firstCandidate?.content.parts.find(p => p.text);
            if (textPart && textPart.text) {
                console.warn("Model returned text instead of image:", textPart.text);
                throw new Error('error.textResponse');
            }
            throw new Error('error.noImage');
        }

        return allImageSrcs;

    } catch (e: any) {
        console.error("Image generation failed:", e);
        if (e.message?.includes('aborted')) {
            throw new Error('error.cancelled');
        }
        if (e.message) {
             if (e.message.includes('API key not valid')) {
                throw new Error('error.apiKeyInvalid');
            }
            if (e.message.includes('quota') || e.message.includes('billing')) {
                throw new Error('error.quotaExceeded');
            }
            if (e.message.includes('prompt was blocked')) {
                throw new Error('error.promptBlocked');
            }
            // re-throw errors we've already converted
            if (e.message.startsWith('error.')) {
                throw e;
            }
        }
        throw new Error('error.apiGeneric');
    }
};