"use client";

/**
 * Drop-in replacement for Payload's EditUpload (wired via next.config alias).
 * When the active collection has an entry in `UPLOAD_FRAMES`, the crop rectangle
 * is locked to that aspect ratio so editors see the same frame as the site.
 */

import type { UploadEdits } from "payload";

import { useModal } from "@faceless-ui/modal";
import { Button, PlusIcon, useDocumentInfo, useTranslation } from "@payloadcms/ui";
import React, { useEffect, useRef, useState } from "react";
import ReactCrop, { type PercentCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { frameForCollection, type UploadFrame } from "@/payload/uploadFrames";

import "@payloadcms/ui/dist/elements/EditUpload/index.scss";

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
  initialCrop?: UploadEdits["crop"];
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

/** Largest centred crop of `aspect` that fits inside the image. */
function maxAspectCrop(
  imageWidth: number,
  imageHeight: number,
  aspect: number,
): PercentCrop {
  if (!imageWidth || !imageHeight || !aspect) return defaultCrop;
  const imageAspect = imageWidth / imageHeight;
  if (imageAspect > aspect) {
    const width = (aspect / imageAspect) * 100;
    return { unit: "%", width, height: 100, x: (100 - width) / 2, y: 0 };
  }
  const height = (imageAspect / aspect) * 100;
  return { unit: "%", width: 100, height, x: 0, y: (100 - height) / 2 };
}

function appendCacheTag(url: string, tag?: string): string {
  if (!url || !tag) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${tag}`;
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
  const frame = frameProp ?? frameForCollection(collectionSlug);

  const [crop, setCrop] = useState<PercentCrop>(() => ({
    ...defaultCrop,
    ...(initialCrop as PercentCrop | undefined),
  }));
  const [focalPosition, setFocalPosition] = useState<FocalPosition>(() => ({
    x: 50,
    y: 50,
    ...initialFocalPoint,
  }));
  const [checkBounds, setCheckBounds] = useState(false);
  const [uncroppedPixelHeight, setUncroppedPixelHeight] = useState(0);
  const [uncroppedPixelWidth, setUncroppedPixelWidth] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);

  const focalWrapRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const cropRef = useRef<HTMLDivElement | null>(null);
  const heightInputRef = useRef<HTMLInputElement | null>(null);
  const widthInputRef = useRef<HTMLInputElement | null>(null);

  const onImageLoad = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalHeight, naturalWidth } = event.currentTarget;
    setUncroppedPixelHeight(naturalHeight);
    setUncroppedPixelWidth(naturalWidth);
    setImageLoaded(true);

    if (!frame || !showCrop) return;

    // Fresh uploads (or an old free-form crop) snap to the site frame once we
    // know pixel dimensions so the selection matches the public card.
    const current = initialCrop
      ? {
          width: ((initialCrop.width ?? 100) / 100) * naturalWidth,
          height: ((initialCrop.height ?? 100) / 100) * naturalHeight,
        }
      : null;
    const currentAspect = current ? current.width / (current.height || 1) : null;
    if (!current || Math.abs((currentAspect ?? 0) - frame.aspect) > 0.02) {
      setCrop(maxAspectCrop(naturalWidth, naturalHeight, frame.aspect));
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

    if (frame) {
      // Keep the locked ratio: changing one side derives the other, then
      // re-centres within the image bounds.
      let widthPx =
        dimension === "width" ? intValue : Math.round(intValue * frame.aspect);
      let heightPx =
        dimension === "height" ? intValue : Math.round(intValue / frame.aspect);

      widthPx = Math.min(widthPx, uncroppedPixelWidth);
      heightPx = Math.min(heightPx, uncroppedPixelHeight);
      if (widthPx / heightPx > frame.aspect) {
        widthPx = Math.round(heightPx * frame.aspect);
      } else {
        heightPx = Math.round(widthPx / frame.aspect);
      }

      const width = (widthPx / uncroppedPixelWidth) * 100;
      const height = (heightPx / uncroppedPixelHeight) * 100;
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
      100 *
      (intValue / (dimension === "width" ? uncroppedPixelWidth : uncroppedPixelHeight));
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
    if (intValue >= 0 && intValue <= 100) {
      setFocalPosition((prev) => ({ ...prev, [coordinate]: intValue }));
    }
  };

  const saveEdits = () => {
    onSave?.({
      crop: crop || undefined,
      focalPoint: focalPosition,
      heightInPixels: Number(heightInputRef.current?.value ?? uncroppedPixelHeight),
      widthInPixels: Number(widthInputRef.current?.value ?? uncroppedPixelWidth),
    });
    closeModal(editDrawerSlug);
  };

  const onDragEnd = React.useCallback(({ x, y }: FocalPosition) => {
    setFocalPosition({ x, y });
    setCheckBounds(false);
  }, []);

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
    if (frame && uncroppedPixelWidth && uncroppedPixelHeight) {
      setCrop(maxAspectCrop(uncroppedPixelWidth, uncroppedPixelHeight, frame.aspect));
      return;
    }
    setCrop(defaultCrop);
  };

  const fileSrcToUse = fileSrc ? appendCacheTag(fileSrc, imageCacheTag) : fileSrc;
  const cropWidthPx = ((crop.width / 100) * uncroppedPixelWidth).toFixed(0);
  const cropHeightPx = ((crop.height / 100) * uncroppedPixelHeight).toFixed(0);

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
              aspectRatio: `${uncroppedPixelWidth / uncroppedPixelHeight}`,
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
                {/* Payload's crop drawer uses a plain img; next/image is not used in admin. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={t("upload:setCropArea")}
                  onLoad={onImageLoad}
                  ref={imageRef}
                  src={fileSrcToUse}
                />
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
                    value={focalPosition.x.toFixed(0)}
                  />
                  <NumberInput
                    name="Y %"
                    onChange={(value) =>
                      fineTuneFocalPosition({ coordinate: "y", value })
                    }
                    value={focalPosition.y.toFixed(0)}
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
