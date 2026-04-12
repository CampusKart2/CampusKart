"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useRouter } from "next/navigation";
import type { ZodError } from "zod";
import { genUploader } from "uploadthing/client";
import type { OurFileRouter } from "@/lib/uploadthing";
import {
  createListingBodySchema,
  createListingDetailsSchema,
  createListingPhotosSchema,
  updateListingBodySchema,
  LISTING_STATUSES,
  type ListingStatus,
} from "@/lib/validators/listings";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  ImageIcon,
  Plus,
} from "lucide-react";

const LISTING_CONDITIONS = [
  "New",
  "Like New",
  "Good",
  "Fair",
  "Poor",
] as const;

type ListingCondition = (typeof LISTING_CONDITIONS)[number];

type Category = {
  slug: string;
  name: string;
};

type PhotoStatus = "existing" | "uploading" | "uploaded" | "error";

type PhotoItem = {
  id: string;
  fileName: string;
  previewUrl: string;
  uploadedUrl: string | null;
  status: PhotoStatus;
  errorMessage: string | null;
  isObjectUrl: boolean;
};

const STEP_TITLES = ["Details", "Photos", "Preview"] as const;
const MAX_PHOTOS = 5;

function isValidUrl(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function formatPrice(value: string): string {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) {
    return "-";
  }
  if (amount === 0) {
    return "Free";
  }
  return `$${amount.toFixed(2)}`;
}

/** Stringify a numeric DB price for controlled inputs (whole dollars stay clean). */
function formatInitialPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function normalizePriceInput(value: string): string {
  let normalized = "";
  let sawDecimal = false;

  for (const character of value.trim()) {
    if (character >= "0" && character <= "9") {
      normalized += character;
      continue;
    }

    if (character === "." && !sawDecimal) {
      normalized += character;
      sawDecimal = true;
      continue;
    }

    if (character === "-" && normalized.length === 0) {
      normalized += character;
    }
  }

  return normalized;
}

function roundPriceInput(value: string): string {
  if (value === "" || value === "-" || value === "." || value === "-.") {
    return "";
  }

  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return value;
  }

  return amount.toFixed(2);
}

function createPhotoId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `photo-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createExistingPhotoItem(url: string, index: number): PhotoItem {
  return {
    id: `existing-${index}-${url}`,
    fileName: `Listing photo ${index + 1}`,
    previewUrl: url,
    uploadedUrl: url,
    status: "existing",
    errorMessage: null,
    isObjectUrl: false,
  };
}

function getUploadErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  return "Unable to upload photos. Please try again.";
}

export type CreateListingWizardProps = {
  mode?: "create" | "edit";
  listingId?: string;
  initialData?: {
    title: string;
    description: string;
    price: number;
    condition: ListingCondition;
    category: string;
    photoUrls: string[];
    status: ListingStatus;
  };
};

export default function CreateListingWizard({
  mode = "create",
  listingId,
  initialData,
}: CreateListingWizardProps) {
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(() => initialData?.title ?? "");
  const [description, setDescription] = useState(
    () => initialData?.description ?? ""
  );
  const [price, setPrice] = useState(() =>
    initialData != null ? formatInitialPrice(initialData.price) : ""
  );
  const [isFree, setIsFree] = useState(() => initialData?.price === 0);
  const [condition, setCondition] = useState<ListingCondition>(
    () => initialData?.condition ?? "Good"
  );
  const [category, setCategory] = useState(() => initialData?.category ?? "");
  const [status, setStatus] = useState<ListingStatus>(
    () => initialData?.status ?? "active"
  );
  const [photos, setPhotos] = useState<PhotoItem[]>(() =>
    (initialData?.photoUrls ?? []).map(createExistingPhotoItem)
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadingFileName, setUploadingFileName] = useState("");
  const [uploadingFileCount, setUploadingFileCount] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isDragActive, setIsDragActive] = useState(false);

  const router = useRouter();
  const uploader = genUploader<OurFileRouter>();
  const photoCleanupRef = useRef<PhotoItem[]>(photos);

  useEffect(() => {
    photoCleanupRef.current = photos;
  }, [photos]);

  useEffect(() => {
    return () => {
      for (const photo of photoCleanupRef.current) {
        if (photo.isObjectUrl) {
          URL.revokeObjectURL(photo.previewUrl);
        }
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/categories")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to load categories.");
        }
        return res.json();
      })
      .then((data) => {
        if (!active) {
          return;
        }
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      })
      .catch(() => {
        // Keep the form usable if categories cannot be loaded.
      })
      .finally(() => {
        if (active) {
          setIsLoadingCategories(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  // Default category for *new* listings only — edits keep the slug from the server.
  useEffect(() => {
    if (mode === "edit") return;
    if (!category && categories.length > 0) {
      setCategory(categories[0].slug);
    }
  }, [categories, category, mode]);

  const zodErrorToFieldErrors = (error: ZodError): Record<string, string> => {
    const errors: Record<string, string> = {};

    for (const issue of error.issues) {
      const key = issue.path[0];

      if (key === "photoUrls") {
        errors.photoUrls = issue.message;
        continue;
      }

      if (typeof key === "string") {
        errors[key] = issue.message;
      } else {
        errors.form = issue.message;
      }
    }

    return errors;
  };

  const clearPhotoErrors = () => {
    setUploadError("");
    setFieldErrors((current) => {
      if (!current.photoUrls) {
        return current;
      }

      const next = { ...current };
      delete next.photoUrls;
      return next;
    });
  };

  const uploadedPhotoUrls = photos.flatMap((photo) =>
    photo.uploadedUrl && photo.uploadedUrl.trim().length > 0
      ? [photo.uploadedUrl.trim()]
      : []
  );
  const hasUploadingPhotos = photos.some((photo) => photo.status === "uploading");
  const hasErroredPhotos = photos.some((photo) => photo.status === "error");

  const validateDetails = () => {
    const parsed = createListingDetailsSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      price: isFree ? 0 : price,
      isFree,
      condition,
      category,
    });

    return parsed.success ? {} : zodErrorToFieldErrors(parsed.error);
  };

  const validatePhotos = () => {
    if (hasUploadingPhotos) {
      return { photoUrls: "Please wait for your photos to finish uploading." };
    }

    if (hasErroredPhotos) {
      return { photoUrls: "Remove failed uploads before continuing." };
    }

    const parsed = createListingPhotosSchema.safeParse({
      photoUrls: uploadedPhotoUrls,
    });

    return parsed.success ? {} : zodErrorToFieldErrors(parsed.error);
  };

  const handleNext = () => {
    setFieldErrors({});
    if (step === 0) {
      const errors = validateDetails();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setStep(1);
      return;
    }

    if (step === 1) {
      const errors = validatePhotos();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setStep(2);
      return;
    }
  };

  const handleBack = () => {
    setFieldErrors({});
    setSubmitError("");
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const removePhoto = (photoId: string) => {
    clearPhotoErrors();
    setPhotos((current) => {
      const target = current.find((photo) => photo.id === photoId);
      if (target?.isObjectUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((photo) => photo.id !== photoId);
    });
  };

  const handlePhotoUpload = async (files: FileList | File[]) => {
    const selectedFiles = Array.isArray(files) ? files : Array.from(files);
    const remainingSlots = MAX_PHOTOS - photos.length;

    clearPhotoErrors();
    setUploadProgress(0);
    setUploadingFileName("");
    setUploadingFileCount(0);

    if (selectedFiles.length === 0) {
      return;
    }

    const invalidFile = selectedFiles.find(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFile) {
      setUploadError("Only image files can be uploaded.");
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setUploadError(`You can upload up to ${remainingSlots} more photo(s).`);
      return;
    }

    const queuedPhotos = selectedFiles.map<PhotoItem>((file) => ({
      id: createPhotoId(),
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      uploadedUrl: null,
      status: "uploading",
      errorMessage: null,
      isObjectUrl: true,
    }));

    setPhotos((current) => [...current, ...queuedPhotos]);
    setIsUploading(true);
    setUploadingFileCount(selectedFiles.length);

    try {
      const uploadedFiles = await uploader.uploadFiles("photo", {
        files: selectedFiles,
        onUploadProgress: ({ file, totalProgress }) => {
          setUploadingFileName(file.name);
          setUploadProgress(totalProgress);
        },
      });

      setPhotos((current) =>
        current.map((photo) => {
          const queuedIndex = queuedPhotos.findIndex(
            (queuedPhoto) => queuedPhoto.id === photo.id
          );

          if (queuedIndex === -1) {
            return photo;
          }

          const uploadedFile = uploadedFiles[queuedIndex];
          if (!uploadedFile) {
            return {
              ...photo,
              status: "error",
              errorMessage: "This photo could not be uploaded.",
            };
          }

          return {
            ...photo,
            uploadedUrl: uploadedFile.url,
            status: "uploaded",
            errorMessage: null,
          };
        })
      );

      setUploadProgress(100);
    } catch (error) {
      const message = getUploadErrorMessage(error);
      console.error("[CreateListingWizard] upload error:", error);
      setUploadError(message);
      setPhotos((current) =>
        current.map((photo) =>
          queuedPhotos.some((queuedPhoto) => queuedPhoto.id === photo.id)
            ? {
                ...photo,
                status: "error",
                errorMessage: message,
              }
            : photo
        )
      );
    } finally {
      setIsUploading(false);
      setUploadingFileName("");
      setUploadingFileCount(0);
    }
  };

  const handlePhotoInputChange = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    await handlePhotoUpload(files);
    event.target.value = "";
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextPrice = normalizePriceInput(event.target.value);
    setPrice(nextPrice);

    setFieldErrors((current) => {
      if (!current.price) {
        return current;
      }

      const next = { ...current };
      delete next.price;
      return next;
    });
  };

  const handlePriceBlur = () => {
    setPrice((current) => roundPriceInput(current));
  };

  const handleFreeToggleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextIsFree = event.target.checked;
    setIsFree(nextIsFree);

    if (nextIsFree) {
      setPrice("");
    }

    setFieldErrors((current) => {
      const next = { ...current };
      delete next.price;
      return next;
    });
  };

  const handlePhotoDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  };

  const handlePhotoDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const nextTarget = event.relatedTarget;
    if (nextTarget instanceof Node && event.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsDragActive(false);
  };

  const handlePhotoDrop = async (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragActive(false);

    const droppedFiles = Array.from(event.dataTransfer.files);
    if (droppedFiles.length === 0) {
      return;
    }

    await handlePhotoUpload(droppedFiles);
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setSubmitError("");
    setSuccessMessage("");

    const photoUrlsClean = uploadedPhotoUrls;

    const applyValidationErrors = (errors: Record<string, string>) => {
      setFieldErrors(errors);
      setStep(
        errors.title ||
          errors.description ||
          errors.price ||
          errors.category ||
          errors.condition ||
          errors.status
          ? 0
          : 1
      );
    };

    // ── Edit: PATCH with the same shape the API accepts (all fields sent together).
    if (mode === "edit") {
      if (!listingId) {
        setSubmitError("Missing listing id.");
        return;
      }

      const patchPayload = {
        title: title.trim(),
        description: description.trim(),
        price: isFree ? 0 : price,
        isFree,
        condition,
        category,
        status,
        photoUrls: photoUrlsClean,
      };

      const parsedPatch = updateListingBodySchema.safeParse(patchPayload);
      if (!parsedPatch.success) {
        applyValidationErrors(zodErrorToFieldErrors(parsedPatch.error));
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fetch(
          `/api/listings/${encodeURIComponent(listingId)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsedPatch.data),
          }
        );

        const body = (await response.json()) as { error?: string };
        if (!response.ok) {
          setSubmitError(
            body?.error ?? "Unable to save your listing. Please try again."
          );
          return;
        }

        router.push(`/listings/${listingId}`);
      } catch (error) {
        console.error("[CreateListingWizard] PATCH error:", error);
        setSubmitError("Unable to connect to the server. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // ── Create: POST
    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: isFree ? 0 : price,
      isFree,
      condition,
      category,
      photoUrls: photoUrlsClean,
    };

    const parsed = createListingBodySchema.safeParse(payload);

    if (!parsed.success) {
      applyValidationErrors(zodErrorToFieldErrors(parsed.error));
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsed.data),
      });

      const body = await response.json();
      if (!response.ok) {
        setSubmitError(
          body?.error || "Unable to create your listing. Please try again."
        );
        return;
      }

      // Redirect the user to the new listing details page after successful creation.
      if (body?.listingId) {
        router.push(`/listings/${body.listingId}`);
        return;
      }

      setSuccessMessage("Your listing has been created successfully.");
      setStep(2);
    } catch (error) {
      console.error("[CreateListingWizard] submit error:", error);
      setSubmitError("Unable to connect to the server. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewPhotoUrls = photos
    .filter((photo) => photo.status !== "error")
    .map((photo) => photo.previewUrl)
    .filter(isValidUrl);

  const continueDisabled =
    isSubmitting || (step === 1 && (hasUploadingPhotos || hasErroredPhotos));

  return (
    <div className="bg-card border border-border rounded-card shadow-card p-6 md:p-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <div>
          <p className="text-sm font-semibold text-primary">
            {mode === "edit" ? "Edit listing" : "Create a listing"}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-text-primary sm:text-3xl">
            {mode === "edit"
              ? "Update your listing in three easy steps."
              : "Post your item in three easy steps."}
          </h1>
        </div>
        <div className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-text-secondary">
          Step {step + 1} of 3
        </div>
      </div>

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {STEP_TITLES.map((titleText, index) => (
          <div
            key={titleText}
            className={`rounded-card border p-3 text-center text-sm font-semibold transition ${
              index === step
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-surface text-text-secondary"
            }`}
          >
            {titleText}
          </div>
        ))}
      </div>

      {successMessage ? (
        <div className="mb-8 rounded-card border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-600" />
            <div>
              <p className="font-semibold">Listing created</p>
              <p className="text-sm text-emerald-700">
                Your item is now visible to other students.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="mb-8 rounded-card border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      ) : null}

      {step === 0 && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-primary">
                Listing title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="e.g. Introduction to Psychology textbook"
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.title}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text-primary">Price</span>
              <label className="mt-2 flex items-center justify-between rounded-card border border-border bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    Mark item as free
                  </p>
                  <p className="text-xs text-text-secondary">
                    Free listings hide the price field and publish as $0.00.
                  </p>
                </div>
                <span
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition ${
                    isFree ? "bg-primary" : "bg-border"
                  }`}
                >
                  <input
                    checked={isFree}
                    onChange={handleFreeToggleChange}
                    type="checkbox"
                    className="peer sr-only"
                    aria-label="Mark listing as free"
                  />
                  <span
                    className={`absolute left-1 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                      isFree ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </span>
              </label>
              {!isFree ? (
                <div
                  className={`mt-3 flex items-center gap-2 rounded-input border bg-surface px-3 py-2 ${
                    fieldErrors.price
                      ? "border-rose-300 focus-within:ring-rose-200"
                      : "border-border focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"
                  }`}
                >
                  <span className="text-sm text-text-secondary">$</span>
                  <input
                    value={price}
                    onChange={handlePriceChange}
                    onBlur={handlePriceBlur}
                    className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-invalid={Boolean(fieldErrors.price)}
                  />
                </div>
              ) : (
                <div className="mt-3 rounded-input border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                  This listing will be shown as Free.
                </div>
              )}
              {fieldErrors.price ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.price}</p>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">
              Description
            </span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-[140px] w-full rounded-input border border-border bg-surface px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Describe the condition, included features, and any accessories."
              aria-invalid={Boolean(fieldErrors.description)}
            />
            {fieldErrors.description ? (
              <p className="mt-2 text-sm text-rose-600">
                {fieldErrors.description}
              </p>
            ) : null}
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-primary">
                Condition
              </span>
              <select
                value={condition}
                onChange={(event) =>
                  setCondition(event.target.value as ListingCondition)
                }
                className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-invalid={Boolean(fieldErrors.condition)}
              >
                {LISTING_CONDITIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.condition ? (
                <p className="mt-2 text-sm text-rose-600">
                  {fieldErrors.condition}
                </p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text-primary">
                Category
              </span>
              <div className="relative mt-2">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  disabled={isLoadingCategories}
                  aria-invalid={Boolean(fieldErrors.category)}
                >
                  {isLoadingCategories ? (
                    <option>Loading categories...</option>
                  ) : categories.length > 0 ? (
                    categories.map((categoryItem) => (
                      <option key={categoryItem.slug} value={categoryItem.slug}>
                        {categoryItem.name}
                      </option>
                    ))
                  ) : (
                    <option value="">No categories available</option>
                  )}
                </select>
              </div>
              {fieldErrors.category ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.category}</p>
              ) : null}
            </label>
          </div>

          {mode === "edit" ? (
            <label className="block max-w-md">
              <span className="text-sm font-medium text-text-primary">
                Listing status
              </span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as ListingStatus)
                }
                className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-invalid={Boolean(fieldErrors.status)}
              >
                {LISTING_STATUSES.map((option) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              {fieldErrors.status ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.status}</p>
              ) : null}
            </label>
          ) : null}
        </div>
      )}

      {step === 1 && (
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Camera size={18} />
              </div>
              <div>
                <p className="font-semibold text-text-primary">Add photos</p>
                <p className="text-sm text-text-secondary">
                  Drag images in or browse from your device. You can add up to{" "}
                  {MAX_PHOTOS} photos, 5 MB each.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-text-primary">
                  Photo uploads
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {photos.length} of {MAX_PHOTOS} slots used.{" "}
                  {uploadedPhotoUrls.length} ready to publish.
                </p>
              </div>
              <label
                htmlFor="photo-upload"
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface"
              >
                <Plus size={16} />
                Select images
              </label>
            </div>

            <label
              htmlFor="photo-upload"
              onDragOver={handlePhotoDragOver}
              onDragLeave={handlePhotoDragLeave}
              onDrop={handlePhotoDrop}
              className={`mt-4 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-8 text-center transition ${
                isDragActive
                  ? "border-primary bg-primary-light"
                  : "border-border bg-surface hover:border-primary/60 hover:bg-primary/5"
              } ${photos.length >= MAX_PHOTOS || isUploading ? "cursor-not-allowed opacity-70" : ""}`}
            >
              <div className="rounded-full bg-white p-3 text-primary shadow-card">
                <ImageIcon size={22} />
              </div>
              <p className="mt-4 text-base font-semibold text-text-primary">
                Drag and drop listing photos
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-text-secondary">
                Drop your images here for instant thumbnails, or click to choose
                files. PNG, JPG, and WEBP all work well.
              </p>
              <span className="mt-4 inline-flex rounded-full border border-border bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Up to {MAX_PHOTOS} photos
              </span>
            </label>

            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoInputChange}
              disabled={photos.length >= MAX_PHOTOS || isUploading}
              className="sr-only"
            />

            {uploadError ? (
              <p className="mt-3 text-sm text-rose-600">{uploadError}</p>
            ) : null}

            {isUploading ? (
              <div className="mt-4 rounded-card border border-border bg-surface p-3">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <p className="font-medium text-text-primary">
                    Uploading {uploadingFileCount} image
                    {uploadingFileCount === 1 ? "" : "s"}...
                  </p>
                  <span className="text-text-secondary">{uploadProgress}%</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-border/70">
                  <div
                    className="h-full rounded-full bg-primary transition-[width] duration-200 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-text-secondary">
                  {uploadingFileName
                    ? `Current file: ${uploadingFileName}`
                    : "Preparing upload..."}
                </p>
              </div>
            ) : null}

            {fieldErrors.photoUrls ? (
              <p className="mt-3 text-sm text-rose-600">{fieldErrors.photoUrls}</p>
            ) : null}

            {photos.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {photos.map((photo, index) => (
                  <div
                    key={photo.id}
                    className="overflow-hidden rounded-card border border-border bg-surface"
                  >
                    <div className="relative">
                      <img
                        src={photo.previewUrl}
                        alt={`Listing photo preview ${index + 1}`}
                        className="h-32 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(photo.id)}
                        className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white transition hover:bg-black"
                        aria-label={`Remove ${photo.fileName}`}
                      >
                        Delete
                      </button>
                    </div>
                    <div className="space-y-2 p-3">
                      <p
                        className="truncate text-xs font-medium text-text-primary"
                        title={photo.fileName}
                      >
                        {photo.fileName}
                      </p>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                          photo.status === "error"
                            ? "bg-rose-100 text-rose-700"
                            : photo.status === "uploading"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {photo.status === "existing" || photo.status === "uploaded"
                          ? "Ready"
                          : photo.status === "uploading"
                            ? "Uploading"
                            : "Upload failed"}
                      </span>
                      {photo.errorMessage ? (
                        <p className="text-xs leading-5 text-rose-600">
                          {photo.errorMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-secondary">
                No photos uploaded yet.
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-6">
          <div className="rounded-card border border-border bg-surface p-5">
            <div className="flex items-center gap-3 text-sm text-text-secondary">
              <ImageIcon size={18} />
              <p>Review your listing before publishing.</p>
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <div className="grid flex-1 grid-cols-2 gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Title
                  </h2>
                  <p className="mt-2 text-base font-semibold text-text-primary">
                    {title || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Price
                  </h2>
                  <p className="mt-2 text-base font-semibold text-text-primary">
                    {formatPrice(isFree ? "0" : price)}
                  </p>
                </div>
              </div>

              <div className="grid flex-1 grid-cols-2 gap-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Condition
                  </h2>
                  <p className="mt-2 text-base text-text-primary">{condition}</p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                    Category
                  </h2>
                  <p className="mt-2 text-base text-text-primary">
                    {category || "—"}
                  </p>
                </div>
              </div>
            </div>

            {mode === "edit" ? (
              <div className="mt-4">
                <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                  Status
                </h2>
                <p className="mt-2 text-base text-text-primary">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Description
              </h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-6 text-text-secondary">
                {description || "—"}
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                Photos
              </h2>
              {previewPhotoUrls.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {previewPhotoUrls.map((url, index) => (
                    <div
                      key={index}
                      className="h-32 overflow-hidden rounded-card border border-border bg-surface"
                    >
                      <img
                        src={url}
                        alt={`Listing photo ${index + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-text-secondary">
                  No valid photo URLs detected.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-card border border-border bg-surface p-4 text-sm text-text-secondary">
            {mode === "edit"
              ? "Your changes are saved when you click Save changes."
              : "Your listing will be published immediately after you click Publish."}
          </div>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={handleBack}
          disabled={step === 0 || isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary transition hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={continueDisabled}
              className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === "edit" ? "Save changes" : "Publish listing"}
              <ArrowRight size={16} />
            </button>
          )}

          {successMessage ? (
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-button border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
            >
              Browse listings
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
