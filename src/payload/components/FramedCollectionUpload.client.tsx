"use client";

/**
 * Replaces Payload's default collection Upload for framed Libraries so the
 * crop drawer uses `AspectLockedEditUpload` with an explicit aspect ratio.
 *
 * Important: import `useModal` from `@payloadcms/ui` (not `@faceless-ui/modal`).
 * Payload's ModalProvider is the copy bundled into the UI package; a direct
 * `@faceless-ui/modal` import gets a different React context, so `openModal`
 * is undefined ("p is not a function") on Edit Image.
 */

import type { FormState, SanitizedCollectionConfig, UploadEdits } from "payload";

import {
  Button,
  Drawer,
  Dropzone,
  EditDepthProvider,
  FieldError,
  fieldBaseClass,
  FileDetails,
  PreviewSizes,
  Thumbnail,
  useConfig,
  useDocumentInfo,
  useField,
  useForm,
  useFormProcessing,
  useModal,
  useTranslation,
  useUploadEdits,
} from "@payloadcms/ui";
import {
  UploadControlsProvider,
  useUploadControls,
} from "@payloadcms/ui/providers/UploadControls";
import { formatAdminURL, isImage } from "payload/shared";
import React, { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { EditUpload } from "@/payload/components/AspectLockedEditUpload";
import { frameForCollection, type FramedCollectionSlug } from "@/payload/uploadFrames";

const baseClass = "file-field";
const editDrawerSlug = "edit-upload";
const sizePreviewSlug = "preview-sizes";

const validate = (value: File | null | undefined) => {
  if (!value && value !== undefined) return "A file is required.";
  if (value && (!value.name || value.name === "")) return "A file name is required.";
  return true;
};

type UploadActionsArgs = {
  customActions?: React.ReactNode[];
  enableAdjustments: boolean;
  enablePreviewSizes: boolean;
  mimeType: string;
};

function UploadActions({
  customActions,
  enableAdjustments,
  enablePreviewSizes,
  mimeType,
}: UploadActionsArgs) {
  const { t } = useTranslation();
  const { openModal } = useModal();
  const fileTypeIsAdjustable =
    isImage(mimeType) && mimeType !== "image/svg+xml" && mimeType !== "image/jxl";

  if (!fileTypeIsAdjustable && (!customActions || customActions.length === 0)) {
    return null;
  }

  return (
    <div className={`${baseClass}__upload-actions`}>
      {fileTypeIsAdjustable ? (
        <Fragment>
          {enablePreviewSizes ? (
            <Button
              buttonStyle="pill"
              className={`${baseClass}__previewSizes`}
              margin={false}
              onClick={() => openModal(sizePreviewSlug)}
              size="small"
            >
              {t("upload:previewSizes")}
            </Button>
          ) : null}
          {enableAdjustments ? (
            <Button
              buttonStyle="pill"
              className={`${baseClass}__edit`}
              margin={false}
              onClick={() => openModal(editDrawerSlug)}
              size="small"
            >
              {t("upload:editImage")}
            </Button>
          ) : null}
        </Fragment>
      ) : null}
      {customActions?.map((action, index) => (
        <Fragment key={index}>{action}</Fragment>
      ))}
    </div>
  );
}

type InnerProps = {
  collectionSlug: string;
  customActions?: React.ReactNode[];
  frameSlug: FramedCollectionSlug;
  initialState?: FormState;
  onChange?: (file?: File) => void;
  resetUploadEdits?: () => void;
  updateUploadEdits?: (args: UploadEdits) => void;
  uploadConfig: NonNullable<SanitizedCollectionConfig["upload"]>;
  UploadControls?: React.ReactNode;
  uploadEdits?: UploadEdits;
};

function FramedUploadInner({
  collectionSlug,
  customActions,
  frameSlug,
  initialState,
  onChange,
  resetUploadEdits,
  updateUploadEdits,
  uploadConfig,
  UploadControls,
  uploadEdits,
}: InnerProps) {
  const frame = frameForCollection(frameSlug);
  const {
    setUploadControlFile,
    setUploadControlFileName,
    setUploadControlFileUrl,
    uploadControlFile,
    uploadControlFileName,
    uploadControlFileUrl,
  } = useUploadControls();
  const {
    config: {
      routes: { api },
    },
  } = useConfig();
  const { t } = useTranslation();
  const { setModified } = useForm();
  const { id, data, docPermissions, setUploadStatus } = useDocumentInfo();
  const isFormSubmitting = useFormProcessing();
  const { errorMessage, setValue, showError, value } = useField<File>({
    path: "file",
    validate,
  });

  const [fileSrc, setFileSrc] = useState<string | null>(null);
  const [removedFile, setRemovedFile] = useState(false);
  const [filename, setFilename] = useState(value?.name || "");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [fileUrl, setFileUrl] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const useServerSideFetch =
    typeof uploadConfig?.pasteURL === "object" &&
    (uploadConfig.pasteURL.allowList?.length ?? 0) > 0;

  const clearUploadControls = useCallback(() => {
    setUploadControlFileUrl("");
    // Payload's runtime accepts null here; the published hook types are narrower.
    setUploadControlFileName(null as unknown as string);
    setUploadControlFile(null as unknown as File);
  }, [setUploadControlFile, setUploadControlFileName, setUploadControlFileUrl]);

  const handleFileChange = useCallback(
    ({ file, isNewFile = true }: { file: File | null; isNewFile?: boolean }) => {
      if (isNewFile && file instanceof File) {
        setFileSrc(URL.createObjectURL(file));
      }
      setValue(file);
      setShowUrlInput(false);
      clearUploadControls();
      onChange?.(file ?? undefined);
    },
    [clearUploadControls, onChange, setValue],
  );

  const handleFileNameChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const updatedFileName = event.target.value;
      if (!value) return;
      handleFileChange({
        file: new File([value], updatedFileName, {
          type: value.type,
          lastModified: value.lastModified,
        }),
        isNewFile: false,
      });
      setFilename(updatedFileName);
    },
    [handleFileChange, value],
  );

  const handleFileSelection = useCallback(
    (files: FileList) => {
      handleFileChange({ file: files?.[0] ?? null });
    },
    [handleFileChange],
  );

  const handleFileRemoval = useCallback(() => {
    setRemovedFile(true);
    handleFileChange({ file: null });
    setFileSrc("");
    setFileUrl("");
    resetUploadEdits?.();
    setShowUrlInput(false);
    clearUploadControls();
  }, [clearUploadControls, handleFileChange, resetUploadEdits]);

  const onEditsSave = useCallback(
    (args: UploadEdits) => {
      setModified(true);
      updateUploadEdits?.(args);
    },
    [setModified, updateUploadEdits],
  );

  const handleUrlSubmit = useCallback(async () => {
    if (!fileUrl || uploadConfig?.pasteURL === false) return;
    setUploadStatus?.("uploading");
    try {
      const clientResponse = await fetch(fileUrl);
      if (!clientResponse.ok) {
        throw new Error(`Fetch failed with status: ${clientResponse.status}`);
      }
      const blob = await clientResponse.blob();
      const fileName =
        uploadControlFileName || decodeURIComponent(fileUrl.split("/").pop() || "");
      handleFileChange({ file: new File([blob], fileName, { type: blob.type }) });
      setUploadStatus?.("idle");
      return;
    } catch {
      if (!useServerSideFetch) {
        toast.error("Failed to fetch the file.");
        setUploadStatus?.("failed");
        return;
      }
    }

    try {
      const pasteURL =
        `/${collectionSlug}/paste-url${id ? `/${id}?` : "?"}src=${encodeURIComponent(fileUrl)}` as `/${string}`;
      const serverResponse = await fetch(
        formatAdminURL({ apiRoute: api, path: pasteURL }),
      );
      if (!serverResponse.ok) {
        throw new Error(`Fetch failed with status: ${serverResponse.status}`);
      }
      const blob = await serverResponse.blob();
      const fileName = decodeURIComponent(fileUrl.split("/").pop() || "");
      handleFileChange({ file: new File([blob], fileName, { type: blob.type }) });
      setUploadStatus?.("idle");
    } catch {
      toast.error("The provided URL is not allowed.");
      setUploadStatus?.("failed");
    }
  }, [
    api,
    collectionSlug,
    fileUrl,
    handleFileChange,
    id,
    setUploadStatus,
    uploadConfig,
    uploadControlFileName,
    useServerSideFetch,
  ]);

  /* Payload's Upload syncs form/control state through these effects; keep the
     same wiring so paste-URL / bulk controls keep working. */
  /* eslint-disable react-hooks/set-state-in-effect -- mirrors @payloadcms/ui Upload */
  useEffect(() => {
    if (initialState?.file?.value instanceof File) {
      setFileSrc(URL.createObjectURL(initialState.file.value));
      setRemovedFile(false);
    }
  }, [initialState]);

  useEffect(() => {
    if (isFormSubmitting) setRemovedFile(false);
  }, [isFormSubmitting]);

  useEffect(() => {
    if (!uploadControlFileUrl) return;
    setFileUrl(uploadControlFileUrl);
    void handleUrlSubmit();
  }, [uploadControlFileUrl, handleUrlSubmit]);

  useEffect(() => {
    if (uploadControlFile) handleFileChange({ file: uploadControlFile });
  }, [uploadControlFile, handleFileChange]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const canRemoveUpload = docPermissions?.update;
  const hasImageSizes = (uploadConfig?.imageSizes?.length ?? 0) > 0;
  const hasResizeOptions = Boolean(uploadConfig?.resizeOptions);
  const focalPointEnabled = uploadConfig?.focalPoint === true;
  const { crop: showCrop = true, focalPoint = true } = uploadConfig ?? {};
  const showFocalPoint =
    Boolean(focalPoint) && (hasImageSizes || hasResizeOptions || focalPointEnabled);
  const acceptMimeTypes = uploadConfig.mimeTypes?.join(", ");
  const imageCacheTag = uploadConfig?.cacheTags && data?.updatedAt;

  // Crop drawer edits the pristine original when a sidecar exists; fall back to
  // the stored (already-cropped) file for legacy docs until the first re-save
  // adopts it, and to the local object URL for not-yet-saved uploads.
  const sourceKey =
    data?.source && typeof data.source === "object" && "key" in data.source
      ? (data.source as { key?: string | null }).key
      : undefined;
  const persistedCrop =
    data?.crop && typeof data.crop === "object" ? data.crop : undefined;
  const editFileSrc = (() => {
    if (value && fileSrc) return fileSrc;
    if (id && sourceKey) {
      return formatAdminURL({
        apiRoute: api,
        path: `/original/${collectionSlug}/${id}` as `/${string}`,
      });
    }
    return data?.url || fileSrc || "";
  })();

  return (
    <div className={[fieldBaseClass, baseClass].filter(Boolean).join(" ")}>
      <FieldError message={errorMessage} showError={showError} />
      {data?.filename && !removedFile ? (
        <FileDetails
          collectionSlug={collectionSlug}
          customUploadActions={customActions}
          doc={data}
          enableAdjustments={showCrop || showFocalPoint}
          handleRemove={canRemoveUpload ? handleFileRemoval : undefined}
          hasImageSizes={hasImageSizes}
          hideRemoveFile={uploadConfig.hideRemoveFile}
          imageCacheTag={imageCacheTag}
          uploadConfig={uploadConfig}
        />
      ) : null}
      {((!uploadConfig.hideFileInputOnCreate && !data?.filename) || removedFile) && (
        <div className={`${baseClass}__upload`}>
          {!value && !showUrlInput ? (
            <Dropzone onChange={handleFileSelection}>
              <div className={`${baseClass}__dropzoneContent`}>
                <div className={`${baseClass}__dropzoneButtons`}>
                  <Button
                    buttonStyle="pill"
                    onClick={() => inputRef.current?.click()}
                    size="small"
                  >
                    {t("upload:selectFile")}
                  </Button>
                  <input
                    accept={acceptMimeTypes}
                    aria-hidden="true"
                    className={`${baseClass}__hidden-input`}
                    hidden
                    onChange={(event) => {
                      if (event.target.files?.length) {
                        handleFileSelection(event.target.files);
                      }
                    }}
                    ref={inputRef}
                    type="file"
                  />
                  {uploadConfig?.pasteURL !== false ? (
                    <Fragment>
                      <span className={`${baseClass}__orText`}>{t("general:or")}</span>
                      <Button
                        buttonStyle="pill"
                        onClick={() => {
                          setShowUrlInput(true);
                          clearUploadControls();
                        }}
                        size="small"
                      >
                        {t("upload:pasteURL")}
                      </Button>
                    </Fragment>
                  ) : null}
                  {UploadControls ?? null}
                </div>
                <p className={`${baseClass}__dragAndDropText`}>
                  {t("general:or")} {t("upload:dragAndDrop")}
                </p>
              </div>
            </Dropzone>
          ) : null}
          {showUrlInput ? (
            <Fragment>
              <div className={`${baseClass}__remote-file-wrap`}>
                <input
                  className={`${baseClass}__remote-file`}
                  onChange={(event) => setFileUrl(event.target.value)}
                  ref={urlInputRef}
                  title={fileUrl}
                  type="text"
                  value={fileUrl}
                />
                <div className={`${baseClass}__add-file-wrap`}>
                  <button
                    className={`${baseClass}__add-file`}
                    onClick={() => void handleUrlSubmit()}
                    type="button"
                  >
                    {t("upload:addFile")}
                  </button>
                </div>
              </div>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="with-border"
                onClick={() => {
                  setShowUrlInput(false);
                  clearUploadControls();
                }}
                round
                tooltip={t("general:cancel")}
              />
            </Fragment>
          ) : null}
          {value && fileSrc ? (
            <Fragment>
              <div className={`${baseClass}__thumbnail-wrap`}>
                <Thumbnail
                  collectionSlug={collectionSlug}
                  fileSrc={isImage(value.type) ? fileSrc : undefined}
                />
              </div>
              <div className={`${baseClass}__file-adjustments`}>
                <input
                  className={`${baseClass}__filename`}
                  onChange={handleFileNameChange}
                  title={filename || value.name}
                  type="text"
                  value={filename || value.name}
                />
                <UploadActions
                  customActions={customActions}
                  enableAdjustments={showCrop || showFocalPoint}
                  enablePreviewSizes={Boolean(
                    hasImageSizes && data?.filename && !removedFile,
                  )}
                  mimeType={value.type}
                />
              </div>
              <Button
                buttonStyle="icon-label"
                className={`${baseClass}__remove`}
                icon="x"
                iconStyle="with-border"
                onClick={handleFileRemoval}
                round
                tooltip={t("general:cancel")}
              />
            </Fragment>
          ) : null}
        </div>
      )}
      {value || data?.filename ? (
        <EditDepthProvider>
          <Drawer Header={null} slug={editDrawerSlug}>
            <EditUpload
              fileName={value?.name || data?.filename}
              fileSrc={editFileSrc}
              frame={frame}
              imageCacheTag={imageCacheTag}
              initialCrop={uploadEdits?.crop ?? persistedCrop ?? undefined}
              initialFocalPoint={{
                x: uploadEdits?.focalPoint?.x || data?.focalX || 50,
                y: uploadEdits?.focalPoint?.y || data?.focalY || 50,
              }}
              onSave={onEditsSave}
              showCrop={showCrop}
              showFocalPoint={showFocalPoint}
            />
          </Drawer>
        </EditDepthProvider>
      ) : null}
      {data && hasImageSizes ? (
        <Drawer
          className={`${baseClass}__previewDrawer`}
          hoverTitle
          slug={sizePreviewSlug}
          title={t("upload:sizesFor", { label: data.filename })}
        >
          <PreviewSizes
            doc={data}
            imageCacheTag={imageCacheTag}
            uploadConfig={uploadConfig}
          />
        </Drawer>
      ) : null}
    </div>
  );
}

export function FramedCollectionUploadClient() {
  const { collectionSlug, docConfig, initialState } = useDocumentInfo();
  const { resetUploadEdits, updateUploadEdits, uploadEdits } = useUploadEdits();
  const uploadConfig =
    docConfig && "upload" in docConfig ? docConfig.upload : undefined;
  const frameSlug = collectionSlug as FramedCollectionSlug | undefined;

  if (
    !collectionSlug ||
    !uploadConfig ||
    !frameSlug ||
    !frameForCollection(frameSlug)
  ) {
    return null;
  }

  return (
    <UploadControlsProvider>
      <FramedUploadInner
        collectionSlug={collectionSlug}
        frameSlug={frameSlug}
        initialState={initialState}
        resetUploadEdits={resetUploadEdits}
        updateUploadEdits={updateUploadEdits}
        uploadConfig={uploadConfig}
        uploadEdits={uploadEdits}
      />
    </UploadControlsProvider>
  );
}
