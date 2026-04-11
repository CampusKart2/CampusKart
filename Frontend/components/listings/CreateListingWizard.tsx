"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent } from "react";
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
    return "$0.00";
  }
  return `$${amount.toFixed(2)}`;
}

/** Stringify a numeric DB price for controlled inputs (whole dollars stay clean). */
function formatInitialPrice(value: number): string {
  if (!Number.isFinite(value) || value < 0) {
    return "";
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
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
  const [condition, setCondition] = useState<ListingCondition>(
    () => initialData?.condition ?? "Good"
  );
  const [category, setCategory] = useState(() => initialData?.category ?? "");
  const [status, setStatus] = useState<ListingStatus>(
    () => initialData?.status ?? "active"
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    () => initialData?.photoUrls ?? []
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const router = useRouter();
  const uploader = genUploader<OurFileRouter>();

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

  const validateDetails = () => {
    const parsed = createListingDetailsSchema.safeParse({
      title: title.trim(),
      description: description.trim(),
      price,
      condition,
      category,
    });

    return parsed.success ? {} : zodErrorToFieldErrors(parsed.error);
  };

  const validatePhotos = () => {
    const parsed = createListingPhotosSchema.safeParse({
      photoUrls: photoUrls.map((value) => value.trim()).filter(Boolean),
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

  const handlePhotoUpload = async (files: FileList | File[]) => {
    const selectedFiles = Array.isArray(files) ? files : Array.from(files);
    const remainingSlots = MAX_PHOTOS - photoUrls.length;

    setUploadError("");

    if (selectedFiles.length === 0) {
      return;
    }

    if (selectedFiles.length > remainingSlots) {
      setUploadError(`You can upload up to ${remainingSlots} more photo(s).`);
      return;
    }

    setIsUploading(true);

    try {
      const uploadedFiles = await uploader.uploadFiles("photo", {
        files: selectedFiles,
      });

      setPhotoUrls((current) => [
        ...current,
        ...uploadedFiles.map((file) => file.url),
      ]);
    } catch (error) {
      console.error("[CreateListingWizard] upload error:", error);
      setUploadError("Unable to upload photos. Please try again.");
    } finally {
      setIsUploading(false);
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

  const removePhoto = (index: number) => {
    setPhotoUrls((current) => current.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    setFieldErrors({});
    setSubmitError("");
    setSuccessMessage("");

    const photoUrlsClean = photoUrls.map((value) => value.trim()).filter(Boolean);

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
        price,
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
      price,
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
        setSubmitError(body?.error || "Unable to create your listing. Please try again.");
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

  const previewPhotoUrls = photoUrls.map((value) => value.trim()).filter(Boolean);
  const showPreviewImages = previewPhotoUrls.filter(isValidUrl);

  return (
    <div className="bg-card border border-border rounded-card shadow-card p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6 mb-8">
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

      <div className="grid gap-3 mb-8 sm:grid-cols-3">
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
        <div className="rounded-card border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle size={20} className="text-emerald-600" />
            <div>
              <p className="font-semibold">Listing created</p>
              <p className="text-sm text-emerald-700">Your item is now visible to other students.</p>
            </div>
          </div>
        </div>
      ) : null}

      {submitError ? (
        <div className="rounded-card border border-rose-200 bg-rose-50 p-4 text-rose-900 mb-8">
          <p className="text-sm font-medium">{submitError}</p>
        </div>
      ) : null}

      {step === 0 && (
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-primary">Listing title</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                placeholder="e.g. Introduction to Psychology textbook"
                aria-invalid={Boolean(fieldErrors.title)}
              />
              {fieldErrors.title ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.title}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text-primary">Price</span>
              <div className="mt-2 flex items-center gap-2 rounded-input border border-border bg-surface px-3 py-2">
                <span className="text-sm text-text-secondary">$</span>
                <input
                  value={price}
                  onChange={(event) => setPrice(event.target.value)}
                  className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  aria-invalid={Boolean(fieldErrors.price)}
                />
              </div>
              {fieldErrors.price ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.price}</p>
              ) : null}
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-text-primary">Description</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="mt-2 min-h-[140px] w-full rounded-input border border-border bg-surface px-3 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              placeholder="Describe the condition, included features, and any accessories."
              aria-invalid={Boolean(fieldErrors.description)}
            />
            {fieldErrors.description ? (
              <p className="mt-2 text-sm text-rose-600">{fieldErrors.description}</p>
            ) : null}
          </label>

          <div className="grid gap-6 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-text-primary">Condition</span>
              <select
                value={condition}
                onChange={(event) => setCondition(event.target.value as ListingCondition)}
                className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                aria-invalid={Boolean(fieldErrors.condition)}
              >
                {LISTING_CONDITIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {fieldErrors.condition ? (
                <p className="mt-2 text-sm text-rose-600">{fieldErrors.condition}</p>
              ) : null}
            </label>

            <label className="block">
              <span className="text-sm font-medium text-text-primary">Category</span>
              <div className="relative mt-2">
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                className="mt-2 w-full rounded-input border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
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
                  Upload up to {MAX_PHOTOS} images so buyers can preview your item.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-border bg-white p-4">
            <label className="block">
              <span className="text-sm font-medium text-text-primary">Upload photos</span>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  htmlFor="photo-upload"
                  className="inline-flex items-center justify-center rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface transition cursor-pointer"
                >
                  <Plus size={16} /> Select images
                </label>
                <span className="text-sm text-text-secondary">
                  {photoUrls.length} of {MAX_PHOTOS} images uploaded.
                </span>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoInputChange}
                disabled={photoUrls.length >= MAX_PHOTOS || isUploading}
                className="sr-only"
              />
            </label>

            {uploadError ? (
              <p className="mt-3 text-sm text-rose-600">{uploadError}</p>
            ) : null}
            {fieldErrors.photoUrls ? (
              <p className="mt-3 text-sm text-rose-600">{fieldErrors.photoUrls}</p>
            ) : null}
            {photoUrls.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {photoUrls.map((url, index) => (
                  <div key={index} className="group relative overflow-hidden rounded-card border border-border bg-surface">
                    <img
                      src={url}
                      alt={`Uploaded listing ${index + 1}`}
                      className="h-32 w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-text-secondary">No photos uploaded yet.</p>
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
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                    Title
                  </h2>
                  <p className="mt-2 text-base font-semibold text-text-primary">
                    {title || "—"}
                  </p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                    Price
                  </h2>
                  <p className="mt-2 text-base font-semibold text-text-primary">
                    {formatPrice(price)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 flex-1">
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                    Condition
                  </h2>
                  <p className="mt-2 text-base text-text-primary">{condition}</p>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                    Category
                  </h2>
                  <p className="mt-2 text-base text-text-primary">{category || "—"}</p>
                </div>
              </div>
            </div>

            {mode === "edit" ? (
              <div className="mt-4">
                <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                  Status
                </h2>
                <p className="mt-2 text-base text-text-primary">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </p>
              </div>
            ) : null}

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                Description
              </h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary whitespace-pre-line">
                {description || "—"}
              </p>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-[0.12em]">
                Photos
              </h2>
              {showPreviewImages.length > 0 ? (
                <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {showPreviewImages.map((url, index) => (
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
                <p className="mt-3 text-sm text-text-secondary">No valid photo URLs detected.</p>
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
          className="inline-flex items-center justify-center gap-2 rounded-button border border-border bg-card px-4 py-2 text-sm font-semibold text-text-primary hover:bg-surface transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {step < 2 ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-button bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {mode === "edit" ? "Save changes" : "Publish listing"}
              <ArrowRight size={16} />
            </button>
          )}

          {successMessage ? (
            <Link
              href="/listings"
              className="inline-flex items-center justify-center rounded-button border border-primary bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5 transition"
            >
              Browse listings
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
