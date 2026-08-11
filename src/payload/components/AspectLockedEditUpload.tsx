"use client";

/**
 * Crop drawer used by `FramedCollectionUpload`. Locks the crop rectangle to
 * the framed Library collection's on-site aspect ratio.
 *
 * The image sits centred in a padded "stage" so the selection can extend past
 * the original's edges (filled later by the framed-crop hook). Crop state in
 * the UI is stage-percent; on save it is converted to original-percent for
 * persistence, and the focal point is re-expressed as a percentage of the
 * cropped result — the space Payload's `createImageSizes` applies it in.
 *
 * Import `useModal` from `@payloadcms/ui` so it shares Payload's ModalProvider
 * context (a direct `@faceless-ui/modal` import breaks close/open).
 */

import type { UploadEdits } from "payload";

import {
  Button,
  PlusIcon,
  useDocumentInfo,
  useModal,
  useTranslation,
} from "@payloadcms/ui";
import React, { useEffect, useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import {
  focalPointInCrop,
  maxAspectRect,
  normalizeRect,
  originalRectToStage,
  stageRectToOriginal,
  stageSizeForSource,
  type Rect,
  type Size,
} from "@/payload/cropGeometry";
import {
  frameForCollection,
  getActiveUploadFrame,
  type UploadFrame,
} from "@/payload/uploadFrames";

const baseClass = "edit-upload";

/** Matches Payload's `editDrawerSlug` from `@payloadcms/ui` Upload (not re-exported). */
const editDrawerSlug = "edit-upload";

type FocalPosition = { x: number; y: number };

export type EditUploadProps = {
  fileName: string;
  fileSrc: string;
  /**
   * Explicit frame from `FramedCollectionUpload`. When omitted, falls back to
   * the document's collection slug (used if this component is ever aliased in).
   */
  frame?: UploadFrame;
  imageCacheTag?: string;
  /** Original-percent crop from `uploadEdits` or the persisted `data.crop`. */
  initialCrop?: UploadEdits["crop"];
  /**
   * Focal point as a percentage of the cropped result (Payload / persisted
   * `focalX`/`focalY`). Converted into stage space for the draggable handle.
   */
  initialFocalPoint?: FocalPosition;
  onSave?: (uploadEdits: UploadEdits) => void;
  showCrop?: boolean;
  showFocalPoint?: boolean;
};

const defaultCrop: PercentCrop = {
  height: 100,
  unit: "%",
  width: 100,
  x: 0,
  y: 0,
};

/** Checkerboard so transparent pad regions read as "empty" in the drawer. */
const CHECKERBOARD_STYLE: React.CSSProperties = {
  backgroundColor: "#c8c8c8",
  backgroundImage: [
    "linear-gradient(45deg, #aeaeb2 25%, transparent 25%)",
    "linear-gradient(-45deg, #aeaeb2 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, #aeaeb2 75%)",
    "linear-gradient(-45deg, transparent 75%, #aeaeb2 75%)",
  ].join(", "),
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
  backgroundSize: "16px 16px",
};

function toPercentCrop(rect: Rect): PercentCrop {
  return {
    unit: "%",
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
  };
}

function seedStageCrop(
  initialCrop: UploadEdits["crop"] | undefined,
  maxOutset: number,
): PercentCrop {
  if (!initialCrop) return defaultCrop;
  return toPercentCrop(originalRectToStage(normalizeRect(initialCrop), maxOutset));
}

/** Cropped-result percent → stage percent via the current stage crop. */
function seedStageFocal(
  initialFocal: FocalPosition | undefined,
  stageCrop: PercentCrop,
): FocalPosition {
  const focal = { x: 50, y: 50, ...initialFocal };
  return {
    x: stageCrop.x + (focal.x / 100) * stageCrop.width,
    y: stageCrop.y + (focal.y / 100) * stageCrop.height,
  };
}

function appendCacheTag(url: string, tag?: string): string {
  if (!url || !tag) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${tag}`;
}

/**
 * Transparent SVG with the stage's pixel size. Used as an in-flow sizer so
 * ReactCrop's shrink-to-fit layout gets a real box — an absolutely positioned
 * preview alone collapses the stage to 0×0.
 */
function stageSizerSrc(size: Size): string {
  const width = Math.max(1, Math.round(size.width));
  const height = Math.max(1, Math.round(size.height));
  return `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"></svg>`,
  )}`;
}

type NumberInputProps = {
  name: string;
  onChange: (value: string) => void;
  ref?: React.RefObject<HTMLInputElement | null>;
  value: string;
};

function NumberInput({ name, onChange, ref, value }: NumberInputProps) {
  return (
    <div className={`${baseClass}__input`}>
      {name}
      <input
        name={name}
        onChange={(event) => onChange(event.target.value)}
        ref={ref}
        type="number"
        value={value}
      />
    </div>
  );
}

export const EditUpload: React.FC<EditUploadProps> = ({
  fileName,
  fileSrc,
  frame: frameProp,
  imageCacheTag,
  initialCrop,
  initialFocalPoint,
  onSave,
  showCrop,
  showFocalPoint,
}) => {
  const { closeModal } = useModal();
  const { t } = useTranslation();
  const { collectionSlug } = useDocumentInfo();
  const frame =
    frameProp ?? getActiveUploadFrame() ?? frameForCollection(collectionSlug);
  const maxOutset = frame?.maxOutset ?? 0;

  const [crop, setCrop] = useState<PercentCrop>(() =>
    seedStageCrop(initialCrop, maxOutset),
  );
  const [focalPosition, setFocalPosition] = useState<FocalPosition>(() =>
    seedStageFocal(initialFocalPoint, seedStageCrop(initialCrop, maxOutset)),
  );
  const [checkBounds, setCheckBounds] = useState(false);
  const [uncroppedPixelHeight, setUncroppedPixelHeight] = useState(0);
  const [uncroppedPixelWidth, setUncroppedPixelWidth] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const focalWrapRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropRef = useRef<HTMLDivElement | null>(null);
  const heightInputRef = useRef<HTMLInputElement | null>(null);
  const widthInputRef = useRef<HTMLInputElement | null>(null);

  const stage = stageSizeForSource(
    { width: uncroppedPixelWidth, height: uncroppedPixelHeight },
    maxOutset,
  );
  // Original occupies the centre of the stage; inset/size are stage-percent.
  const imageInsetPercent = (maxOutset / (1 + 2 * maxOutset)) * 100;
  const imageSizePercent = (1 / (1 + 2 * maxOutset)) * 100;

  const stageBackground: React.CSSProperties =
    frame?.padBackground && frame.padBackground !== "transparent"
      ? { backgroundColor: frame.padBackground }
      : CHECKERBOARD_STYLE;

  const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget;
    setUncroppedPixelHeight(naturalHeight);
    setUncroppedPixelWidth(naturalWidth);
    setImageLoaded(true);

    if (!frame || !showCrop) return;

    const stageBox = stageSizeForSource(
      { width: naturalWidth, height: naturalHeight },
      maxOutset,
    );

    // Fresh uploads (or an old free-form crop) snap to the site frame once we
    // know pixel dimensions so the selection matches the public card. Compare
    // in original space — that is what `initialCrop` is stored as.
    const current = initialCrop
      ? {
          width: ((initialCrop.width ?? 100) / 100) * naturalWidth,
          height: ((initialCrop.height ?? 100) / 100) * naturalHeight,
        }
      : null;
    const currentAspect = current ? current.width / (current.height || 1) : null;
    if (!current || Math.abs((currentAspect ?? 0) - frame.aspect) > 0.02) {
      setCrop(toPercentCrop(maxAspectRect(stageBox, frame.aspect)));
    }
  };

  const fineTuneCrop = ({
    dimension,
    value,
  }: {
    dimension: "height" | "width";
    value: string;
  }) => {
    const intValue = Number.parseInt(value, 10);
    if (!Number.isFinite(intValue) || intValue <= 0) return;
    if (!stage.width || !stage.height) return;

    if (frame) {
      // Keep the locked ratio: changing one side derives the other, then
      // re-centres within the stage bounds.
      let widthPx =
        dimension === "width" ? intValue : Math.round(intValue * frame.aspect);
      let heightPx =
        dimension === "height" ? intValue : Math.round(intValue / frame.aspect);

      widthPx = Math.min(widthPx, stage.width);
      heightPx = Math.min(heightPx, stage.height);
      if (widthPx / heightPx > frame.aspect) {
        widthPx = Math.round(heightPx * frame.aspect);
      } else {
        heightPx = Math.round(widthPx / frame.aspect);
      }

      const width = (widthPx / stage.width) * 100;
      const height = (heightPx / stage.height) * 100;
      setCrop({
        unit: "%",
        width,
        height,
        x: Math.max(0, (100 - width) / 2),
        y: Math.max(0, (100 - height) / 2),
      });
      return;
    }

    const percentage =
      100 * (intValue / (dimension === "width" ? stage.width : stage.height));
    if (percentage <= 0 || percentage > 100) return;
    setCrop({ ...crop, [dimension]: percentage });
  };

  const fineTuneFocalPosition = ({
    coordinate,
    value,
  }: {
    coordinate: "x" | "y";
    value: string;
  }) => {
    const intValue = Number.parseInt(value, 10);
    if (intValue < 0 || intValue > 100) return;
    // Inputs show cropped-result percent; the handle lives in stage space.
    const cropped = focalPointInCrop(focalPosition, crop);
    const next = { ...cropped, [coordinate]: intValue };
    setFocalPosition({
      x: crop.x + (next.x / 100) * crop.width,
      y: crop.y + (next.y / 100) * crop.height,
    });
  };

  const fileSrcToUse = fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : fileSrc;
  // Stage-percent × stage pixels == the extract size in original pixels.
  const cropWidthPx = ((crop.width / 100) * stage.width).toFixed(0);
  const cropHeightPx = ((crop.height / 100) * stage.height).toFixed(0);
  const stageAspect =
    stage.width > 0 && stage.height > 0 ? stage.width / stage.height : undefined;

  const saveEdits = () => {
    const stageCropRect: Rect = {
      x: crop.x,
      y: crop.y,
      width: crop.width,
      height: crop.height,
    };
    const originalCrop = stageRectToOriginal(stageCropRect, maxOutset);
    // Focal handle is stage-percent; Payload wants cropped-result percent.
    const croppedFocal = focalPointInCrop(focalPosition, stageCropRect);

    onSave?.({
      crop: { ...originalCrop, unit: "%" },
      focalPoint: croppedFocal,
      heightInPixels: Number(heightInputRef.current?.value ?? cropHeightPx),
      widthInPixels: Number(widthInputRef.current?.value ?? cropWidthPx),
    });
    closeModal(editDrawerSlug);
  };

  const onDragEnd = React.useCallback(
    ({ x, y }: FocalPosition) => {
      setFocalPosition({ x, y });
      setCheckBounds(false);
    },
    [setCheckBounds],
  );

  const centerFocalPoint = () => {
    const wrap = focalWrapRef.current;
    const bounds = showCrop ? cropRef.current : imageRef.current;
    if (!wrap || !bounds) return;
    const containerRect = wrap.getBoundingClientRect();
    const boundsRect = bounds.getBoundingClientRect();
    setFocalPosition({
      x:
        ((boundsRect.left - containerRect.left + boundsRect.width / 2) /
          containerRect.width) *
        100,
      y:
        ((boundsRect.top - containerRect.top + boundsRect.height / 2) /
          containerRect.height) *
        100,
    });
  };

  const resetCrop = () => {
    if (frame && stage.width && stage.height) {
      setCrop(toPercentCrop(maxAspectRect(stage, frame.aspect)));
      return;
    }
    setCrop(defaultCrop);
  };

  return (
    <div className={baseClass}>
      <div className={`${baseClass}__header`}>
        <h2 title={`${t("general:editing")} ${fileName}`}>
          {t("general:editing")} {fileName}
        </h2>
        <div className={`${baseClass}__actions`}>
          <Button
            aria-label={t("general:cancel")}
            buttonStyle="secondary"
            className={`${baseClass}__cancel`}
            onClick={() => closeModal(editDrawerSlug)}
          >
            {t("general:cancel")}
          </Button>
          <Button
            aria-label={t("general:applyChanges")}
            buttonStyle="primary"
            className={`${baseClass}__save`}
            disabled={!imageLoaded}
            onClick={saveEdits}
          >
            {t("general:applyChanges")}
          </Button>
        </div>
      </div>
      <div className={`${baseClass}__toolWrap`}>
        <div className={`${baseClass}__crop`}>
          <div
            className={`${baseClass}__focal-wrapper`}
            ref={focalWrapRef}
            style={{
              aspectRatio: stageAspect ? `${stageAspect}` : undefined,
            }}
          >
            {showCrop ? (
              <ReactCrop
                aspect={frame?.aspect}
                className={`${baseClass}__reactCrop`}
                crop={crop}
                onChange={(_, next) => setCrop(next)}
                onComplete={() => setCheckBounds(true)}
                renderSelectionAddon={() => (
                  <div className={`${baseClass}__crop-window`} ref={cropRef} />
                )}
              >
                <div className={`${baseClass}__stage`} style={stageBackground}>
                  {/*
                    In-flow sizer establishes the stage box for ReactCrop. The
                    preview img is absolute in the centre; without a sizer the
                    stage collapses to 0×0 and the drawer looks empty/black.
                  */}
                  {imageLoaded ? (
                    // eslint-disable-next-line @next/next/no-img-element -- layout sizer, not content
                    <img
                      alt=""
                      aria-hidden
                      className={`${baseClass}__stage-sizer`}
                      height={stage.height}
                      src={stageSizerSrc(stage)}
                      width={stage.width}
                    />
                  ) : null}
                  {/* Payload's crop drawer uses a plain img; next/image is not used in admin. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={t("upload:setCropArea")}
                    className={imageLoaded ? `${baseClass}__stage-image` : undefined}
                    onLoad={onImageLoad}
                    ref={imageRef}
                    src={fileSrcToUse}
                    style={
                      imageLoaded
                        ? {
                            left: `${imageInsetPercent}%`,
                            top: `${imageInsetPercent}%`,
                            width: `${imageSizePercent}%`,
                            height: `${imageSizePercent}%`,
                          }
                        : { display: "block", maxWidth: "100%" }
                    }
                  />
                </div>
              </ReactCrop>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- admin crop preview
              <img
                alt={t("upload:setFocalPoint")}
                onLoad={onImageLoad}
                ref={imageRef}
                src={fileSrcToUse}
              />
            )}
            {showFocalPoint ? (
              <DraggableElement
                boundsRef={showCrop ? cropRef : imageRef}
                checkBounds={showCrop ? checkBounds : false}
                className={`${baseClass}__focalPoint`}
                containerRef={focalWrapRef}
                initialPosition={focalPosition}
                onDragEnd={onDragEnd}
                setCheckBounds={showCrop ? setCheckBounds : false}
              >
                <PlusIcon />
              </DraggableElement>
            ) : null}
          </div>
        </div>
        {showCrop || showFocalPoint ? (
          <div className={`${baseClass}__sidebar`}>
            {showCrop ? (
              <div className={`${baseClass}__groupWrap`}>
                <div>
                  <div className={`${baseClass}__titleWrap`}>
                    <h3>{t("upload:crop")}</h3>
                    <Button
                      buttonStyle="none"
                      className={`${baseClass}__reset`}
                      onClick={resetCrop}
                    >
                      {t("general:reset")}
                    </Button>
                  </div>
                </div>
                <span className={`${baseClass}__description`}>
                  {frame
                    ? `Locked to ${frame.label} — ${frame.usage}. Reference size about ${frame.referenceSize.width}×${frame.referenceSize.height}px.`
                    : t("upload:cropToolDescription")}
                </span>
                <div className={`${baseClass}__inputsWrap`}>
                  <NumberInput
                    name={`${t("upload:width")} (px)`}
                    onChange={(value) => fineTuneCrop({ dimension: "width", value })}
                    ref={widthInputRef}
                    value={cropWidthPx}
                  />
                  <NumberInput
                    name={`${t("upload:height")} (px)`}
                    onChange={(value) => fineTuneCrop({ dimension: "height", value })}
                    ref={heightInputRef}
                    value={cropHeightPx}
                  />
                </div>
              </div>
            ) : null}

            {showFocalPoint ? (
              <div className={`${baseClass}__groupWrap`}>
                <div>
                  <div className={`${baseClass}__titleWrap`}>
                    <h3>{t("upload:focalPoint")}</h3>
                    <Button
                      buttonStyle="none"
                      className={`${baseClass}__reset`}
                      onClick={centerFocalPoint}
                    >
                      {t("general:reset")}
                    </Button>
                  </div>
                </div>
                <span className={`${baseClass}__description`}>
                  {t("upload:focalPointDescription")}
                </span>
                <div className={`${baseClass}__inputsWrap`}>
                  <NumberInput
                    name="X %"
                    onChange={(value) =>
                      fineTuneFocalPosition({ coordinate: "x", value })
                    }
                    value={focalPointInCrop(focalPosition, crop).x.toFixed(0)}
                  />
                  <NumberInput
                    name="Y %"
                    onChange={(value) =>
                      fineTuneFocalPosition({ coordinate: "y", value })
                    }
                    value={focalPointInCrop(focalPosition, crop).y.toFixed(0)}
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
};

type DraggableProps = {
  boundsRef: React.RefObject<HTMLElement | null>;
  checkBounds: boolean;
  children: React.ReactNode;
  className: string;
  containerRef: React.RefObject<HTMLElement | null>;
  initialPosition?: FocalPosition;
  onDragEnd: (position: FocalPosition) => void;
  setCheckBounds: ((value: boolean) => void) | false;
};

function DraggableElement({
  boundsRef,
  checkBounds,
  children,
  className,
  containerRef,
  initialPosition = { x: 50, y: 50 },
  onDragEnd,
  setCheckBounds,
}: DraggableProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLButtonElement | null>(null);

  const getCoordinates = React.useCallback(
    (mouseXArg?: number, mouseYArg?: number, recenter?: boolean) => {
      const container = containerRef.current;
      const bounds = boundsRef.current;
      if (!container || !bounds) return { x: 50, y: 50 };

      const containerRect = container.getBoundingClientRect();
      const boundsRect = bounds.getBoundingClientRect();
      const mouseX = mouseXArg ?? boundsRect.left;
      const mouseY = mouseYArg ?? boundsRect.top;

      const xOutOfBounds = mouseX < boundsRect.left || mouseX > boundsRect.right;
      const yOutOfBounds = mouseY < boundsRect.top || mouseY > boundsRect.bottom;

      let x = ((mouseX - containerRect.left) / containerRect.width) * 100;
      let y = ((mouseY - containerRect.top) / containerRect.height) * 100;
      const xCenter =
        ((boundsRect.left - containerRect.left + boundsRect.width / 2) /
          containerRect.width) *
        100;
      const yCenter =
        ((boundsRect.top - containerRect.top + boundsRect.height / 2) /
          containerRect.height) *
        100;

      if (xOutOfBounds || yOutOfBounds) {
        setIsDragging(false);
        if (mouseX < boundsRect.left) {
          x = ((boundsRect.left - containerRect.left) / containerRect.width) * 100;
        } else if (mouseX > boundsRect.right) {
          x =
            ((containerRect.width - (containerRect.right - boundsRect.right)) /
              containerRect.width) *
            100;
        }
        if (mouseY < boundsRect.top) {
          y = ((boundsRect.top - containerRect.top) / containerRect.height) * 100;
        } else if (mouseY > boundsRect.bottom) {
          y =
            ((containerRect.height - (containerRect.bottom - boundsRect.bottom)) /
              containerRect.height) *
            100;
        }
        if (recenter) {
          x = xOutOfBounds ? xCenter : x;
          y = yOutOfBounds ? yCenter : y;
        }
      }

      return { x, y };
    },
    [boundsRef, containerRef],
  );

  useEffect(() => {
    if (isDragging || !dragRef.current || !checkBounds || !setCheckBounds) return;
    const { height, left, top, width } = dragRef.current.getBoundingClientRect();
    const next = getCoordinates(left + width / 2, top + height / 2, true);
    onDragEnd(next);
    setPosition(next);
    setCheckBounds(false);
  }, [getCoordinates, isDragging, checkBounds, setCheckBounds, onDragEnd]);

  // Prefer the latest prop while idle so parent resets don't need an effect.
  const displayPosition = isDragging
    ? position
    : { x: initialPosition.x, y: initialPosition.y };

  return (
    <div
      className={[
        `${baseClass}__draggable-container`,
        isDragging && `${baseClass}__draggable-container--dragging`,
      ]
        .filter(Boolean)
        .join(" ")}
      onMouseMove={(event) => {
        if (!isDragging) return;
        setPosition(getCoordinates(event.clientX, event.clientY));
      }}
    >
      <button
        className={[`${baseClass}__draggable`, className].filter(Boolean).join(" ")}
        onMouseDown={(event) => {
          event.preventDefault();
          setPosition({ x: initialPosition.x, y: initialPosition.y });
          setIsDragging(true);
        }}
        onMouseUp={() => {
          setIsDragging(false);
          onDragEnd(position);
        }}
        ref={dragRef}
        style={{ left: `${displayPosition.x}%`, top: `${displayPosition.y}%` }}
        type="button"
      >
        {children}
      </button>
      <div />
    </div>
  );
}
